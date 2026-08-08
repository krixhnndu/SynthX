import logging
import uuid
from datetime import datetime, timezone

from arq import create_pool
from arq.connections import RedisSettings
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.ocr_parsing.extractors import detect_format
from app.api.deps import CurrentUser, current_user, filter_case_for_roles, require
from app.config import settings
from app.core import rbac
from app.core.audit import record as audit_record
from app.core.versioning import record_version
from app.db.models import AgentRun, Contract, ContractCase
from app.db.session import get_db
from app.schemas.contract_case import ContractCasePayload
from app.storage.base import get_storage

log = logging.getLogger(__name__)

router = APIRouter(prefix="/contracts", tags=["contracts"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_contract(
    file: UploadFile = File(...),
    comparison_file: UploadFile | str | None = File(None),
    notes: str | None = Form(None),
    user: CurrentUser = Depends(require(rbac.RESOURCE_CASE, "create")),
    db: Session = Depends(get_db),
):
    case_id = str(uuid.uuid4())
    storage = get_storage()

    log.info(
        "workflow trace case=%s event=upload_received filename=%s user=%s",
        case_id, file.filename, user.email,
    )
    data = await file.read()
    source_format = detect_format(data, file.filename)
    file_ref = storage.put(f"contracts/{case_id}/{file.filename}", data, file.content_type)
    log.info(
        "workflow trace case=%s event=document_stored source_format=%s comparison=%s",
        case_id, source_format, isinstance(comparison_file, UploadFile),
    )

    comparison_ref = None
    if isinstance(comparison_file, UploadFile):
        comparison_bytes = await comparison_file.read()
        comparison_ref = storage.put(
            f"contracts/{case_id}/prior/{comparison_file.filename}",
            comparison_bytes, comparison_file.content_type,
        )

    payload = ContractCasePayload(
        caseId=case_id, createdBy=user.id, createdAt=datetime.now(timezone.utc)
    ).model_dump(mode="json")
    payload["document"]["originalFileRef"] = file_ref
    payload["document"]["comparisonFileRef"] = comparison_ref
    payload["_taskPayload"] = {
        "ocr_parsing": {"filename": file.filename},
        "cross_document_comparison": {
            "comparisonFilename": comparison_file.filename if isinstance(comparison_file, UploadFile) else None
        },
    }
    if notes:
        payload["reviewScope"]["notes"] = notes

    case = ContractCase(id=case_id, status="in_progress", version=1,
                        payload=payload, created_by=user.id)
    db.add(case)
    db.flush()

    contract = Contract(
        case_id=case_id, original_filename=file.filename, storage_ref=file_ref,
        uploaded_by=user.id, source_format=source_format, comparison_storage_ref=comparison_ref,
    )
    db.add(contract)
    case.contract_id = contract.id
    db.commit()
    log.info("workflow trace case=%s event=case_committed version=1", case_id)

    record_version(db, case_id, 1, payload, source=f"upload:{user.email}")

    audit_record(db, actor=user.email, actor_id=user.id, action="contract_uploaded",
                 case_id=case_id, meta={"filename": file.filename,
                                        "hasComparison": comparison_ref is not None})
    log.info("workflow trace case=%s event=audit_recorded action=contract_uploaded", case_id)

    # Enqueue the pipeline onto Redis. The case and its v1 snapshot are already
    # committed above, so a down Redis must not turn a successful upload into a
    # 500. Log and continue: the case sits in the DB and the pipeline can be run
    # once Redis is up (or the whole stack runs in Docker, where Redis is a service).
    try:
        pool = await create_pool(RedisSettings.from_dsn(settings.redis_url))
        await pool.enqueue_job("run_scope", case_id, user.roles, comparison_ref is not None)
        log.info(
            "workflow trace case=%s event=scope_enqueued roles=%s has_comparison=%s",
            case_id, user.roles, comparison_ref is not None,
        )
    except Exception as exc:
        log.warning("pipeline enqueue skipped for case %s (Redis unreachable?): %s",
                    case_id, exc)

    return {"caseId": case_id, "status": "in_progress"}


@router.get("")
def list_cases(
    status_filter: str | None = None,
    user: CurrentUser = Depends(require(rbac.RESOURCE_CASE, "read")),
    db: Session = Depends(get_db),
):
    query = select(ContractCase).order_by(ContractCase.created_at.desc())
    if status_filter:
        query = query.where(ContractCase.status == status_filter)
    cases = db.execute(query.limit(200)).scalars().all()
    return [
        {
            "caseId": c.id, "status": c.status, "currentStage": c.current_stage,
            "riskScore": c.risk_score, "createdAt": c.created_at,
        }
        for c in cases
    ]


@router.get("/{case_id}")
def get_case(
    case_id: str,
    user: CurrentUser = Depends(require(rbac.RESOURCE_CASE, "read")),
    db: Session = Depends(get_db),
):
    case = db.get(ContractCase, case_id)
    if case is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "case not found")
    return filter_case_for_roles(case.payload or {}, user.roles)


@router.get("/{case_id}/status")
def get_status(
    case_id: str,
    user: CurrentUser = Depends(require(rbac.RESOURCE_CASE, "read")),
    db: Session = Depends(get_db),
):
    case = db.get(ContractCase, case_id)
    if case is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "case not found")
    runs = db.execute(select(AgentRun).where(AgentRun.case_id == case_id)).scalars().all()
    return {
        "caseId": case_id, "status": case.status, "currentStage": case.current_stage,
        "agents": [
            {"agent": r.agent_name, "stage": r.stage, "status": r.status,
             "attempt": r.attempt, "confidence": r.confidence_score, "error": r.error}
            for r in runs
        ],
    }


@router.get("/{case_id}/report")
def get_report(
    case_id: str,
    download: bool = False,
    user: CurrentUser = Depends(require(rbac.RESOURCE_REPORT, "read")),
    db: Session = Depends(get_db),
):
    case = db.get(ContractCase, case_id)
    if case is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "case not found")
    report = (case.payload or {}).get("report") or {}
    if not report.get("sections"):
        raise HTTPException(status.HTTP_409_CONFLICT, "report not generated yet")

    if download:
        if not report.get("renderRef"):
            raise HTTPException(status.HTTP_409_CONFLICT,
                                "PDF render not available for this case")
        pdf = get_storage().get(report["renderRef"])
        return Response(
            pdf, media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="report-{case_id}.pdf"'},
        )
    return {"sections": rbac.visible_report_sections(user.roles, report["sections"]),
            "generatedAt": report.get("generatedAt")}
