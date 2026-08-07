# Master Development Prompt — AI-Powered Enterprise Contract Intelligence & Approval Platform

## 1. Purpose

Master engineering prompt for building the Contract Intelligence & Approval Platform end-to-end, handed to a dev team or an AI coding agent (e.g., Claude Code) as the single source of truth.

**Hard constraint: build exactly what is specified.** No added or removed agents, stages, or capabilities. Where the SRS doesn't dictate an implementation choice, the choice below is final — build it as specified, not as an option.

## 2. System Summary

An AI-assisted (not autonomous) contract review platform. Eleven coordinating components — a Supervisor Agent, a Workflow Orchestrator, and nine specialist agents — process an uploaded contract through eight sequential/parallel stages, converging on a human-reviewed, role-based approval decision. All components read/write a single shared **Contract Case** object rather than messaging each other directly.

Non-negotiable invariants:
- The Orchestrator never does legal reasoning — only schedules, parallelizes, tracks dependencies, logs.
- The Supervisor never executes analysis itself — it interprets requests, sets scope, reconciles other agents' outputs.
- No contract is auto-approved. Every case ends in Stage 8 human review.
- Every recommendation carries a confidence score and traceable evidence (Explainability Agent output is mandatory).

## 3. Technology Stack (Committed)

| Layer | Choice |
|---|---|
| Frontend | React.js + Tailwind CSS + Material UI |
| Workflow visualization | React Flow |
| Charts (Risk Heatmap & Dashboard) | Chart.js / Recharts |
| Backend API | Python, FastAPI |
| Agentic Framework | LangGraph (multi-agent workflow/state graph) + LangChain |
| LLM Provider | Groq API |
| Vector Store / RAG | FAISS or ChromaDB, with Sentence Transformers for embeddings |
| Primary Database | MongoDB / PostgreSQL / SQLite (pick one; relational schema in §6 assumes SQL, adapt to collections if MongoDB) |
| Object Storage | Local disk (dev) or AWS S3 (prod) |
| Auth | JWT authentication + Role-Based Access Control (RBAC) |
| Background jobs / real-time | Async FastAPI tasks + Redis (pub/sub) for live agent-status push (WebSocket) |
| OCR | Tesseract (self-hosted) for scanned docs; native parsing (pdfplumber / python-docx) for digital PDF/DOCX |
| Containerization | Docker |
| Deployment | AWS / Azure / Render |

## 4. High-Level Architecture

```
User → React Dashboard (REST + WebSocket)
     → FastAPI Gateway
     → Supervisor Agent (validate role → interpret request → set scope → select agents)
     → Workflow Orchestrator (LangGraph DAG over async workers)
     → Contract Case Store (DB: versioned JSON/document + relational tables)
         ↑ read/write by every agent
     → Specialist Agents (9, stateless workers) — Legal Knowledge Agent (RAG) consulted on demand
     → Report Generation Agent → Enterprise Report → Dashboard
     → Role-Based Human Review (Approve / Request Changes / Reject) → Final Decision
```

Each specialist agent is a stateless worker: receives `contractCaseId` + task payload, reads only the Contract Case fields it needs, calls the LLM (and RAG when required) via LangChain/LangGraph, writes findings back under its own namespaced key, reports completion to the Orchestrator. Agents never call each other directly.

## 5. The Contract Case Object (Shared Knowledge Object)

One JSON document per review. Store as a `contract_cases` record with a JSON `payload` field plus indexed columns for query performance (SQL) or as a document with equivalent fields (MongoDB). Each agent writes only to its own top-level namespace.

```json
{
  "caseId": "uuid",
  "status": "in_progress | awaiting_review | approved | changes_requested | rejected",
  "createdBy": "userId",
  "createdAt": "timestamp",
  "reviewScope": { "requestedBy": "Supervisor Agent output" },
  "document": { "originalFileRef": "", "structuredContract": { "sections": [], "clauses": [] }, "sourceFormat": "pdf | docx | scanned" },
  "clauseClassification": { "clauses": [], "entities": [], "obligations": [], "timeline": [] },
  "risk": { "findings": [], "riskScore": 0.0 },
  "compliance": { "findings": [], "frameworksChecked": [] },
  "comparison": { "added": [], "deleted": [], "modified": [], "skipped": false },
  "legalEvidence": [ { "requestedByAgent": "", "sourceType": "", "content": "", "citation": "" } ],
  "recommendations": { "clauseRewrites": [], "redlines": [] },
  "negotiationStrategy": { "points": [] },
  "consensus": { "finalRecommendation": "", "conflicts": [], "resolutions": [] },
  "explainability": { "justifications": [] },
  "report": { "sections": {}, "generatedAt": "" },
  "review": { "assignedRoles": [], "decisions": [], "comments": [] },
  "auditLog": [ { "actor": "", "action": "", "timestamp": "" } ]
}
```

Concurrency: agents write via optimistic locking (`version` field, incremented per write) since Stage 3 and Stage 4 agents run in parallel against the same case.

## 6. Core Data Model

- `users` (id, name, email, password_hash/oidc_subject, created_at)
- `roles` — seeded: Legal, Finance, Procurement, Technical, Executive Approver, Admin
- `user_roles` (user_id, role_id)
- `contracts` (id, case_id, original_filename, storage_ref, uploaded_by, uploaded_at, source_format)
- `contract_cases` (id, contract_id, status, version, payload, created_at, updated_at)
- `agent_runs` (id, case_id, agent_name, status, started_at, completed_at, confidence_score, error)
- `review_decisions` (id, case_id, reviewer_id, role, decision [approve/request_changes/reject], comment, created_at)
- `audit_log` (id, case_id, actor_id, action, metadata, created_at)
- `legal_knowledge_documents` (id, source_type [policy/regulation/precedent/template/historical_contract], content, metadata) — embeddings live in FAISS/ChromaDB, keyed to this record's id, not stored as a DB column.

## 7. Workflow Orchestrator — Execution Semantics

Implement as a LangGraph state graph with this fixed stage graph:

```
Stage1: OCR & Document Parsing
Stage2: Clause Classification                                — depends on Stage1
Stage3: Risk Assessment, Compliance Verification, Cross-Document Comparison  — parallel, depend on Stage2
Stage4: Recommendation, Negotiation Strategy                  — parallel, depend on Stage3 (all three)
Stage5: Supervisor Consensus                                  — depends on Stage4 (both)
Stage6: Explainability                                        — depends on Stage5
Stage7: Report Generation                                     — depends on Stage6
Stage8: Human Review                                          — depends on Stage7, blocks until reviewer decision
```

- Define the graph as a static config, not inferred at runtime — keeps dependency management auditable.
- Each node runs as an async task; the Orchestrator advances a node only once all declared dependencies report `completed`.
- Cross-Document Comparison is conditionally skipped when no prior version/template exists; mark it `skipped` (not `failed`) in `agent_runs` so Stage4 resolution proceeds.
- Legal Knowledge Agent is **not** a graph node — it's a synchronous internal service (`POST /internal/legal-knowledge/query`) called by Risk, Compliance, and Recommendation agents mid-execution. Log every call to `auditLog`.
- Retry policy: each node retries up to 3× with exponential backoff on transient failure (LLM timeout, network); on final failure the node is marked `failed`, the Orchestrator halts only that branch, and the Supervisor is notified to flag the case for human review rather than silently completing with partial data.
- Every stage transition writes an `audit_log` row: `{actor: "Workflow Orchestrator", action: "stage_started|stage_completed", metadata: {stage, agents}}`.

## 8. Agent Specifications

Common interface for all nine specialists + Supervisor:

```
AgentInput { caseId: str; contractCaseSnapshot: ContractCase }
AgentOutput { namespace: str; data: object; confidence?: float; evidenceRefs?: list[str] }
```

Each agent = a Groq LLM call (via LangChain) with a fixed system prompt plus the relevant Contract Case slice as context, using structured/tool-calling output to guarantee the response matches its namespace schema in §5.

**8.1 Supervisor Agent** — Validates requesting user's role via RBAC before starting a case; parses the request into `reviewScope`; selects which Stage 3/4 agents apply (e.g., skip Comparison if no prior document); after Stage 4, performs consensus reasoning across Risk, Compliance, Comparison, legal evidence, Recommendation, Negotiation outputs, detects contradictions, produces `consensus.finalRecommendation`; always routes to Stage 8 but records *why* (critical risk, low confidence, agent disagreement, regulatory uncertainty, high financial exposure). Implemented as a direct service call (not a queued worker) — invoked on case creation and again after Stage 4.

**8.2 Workflow Orchestrator** — Not an LLM agent; pure orchestration per §7. Listed only for completeness of the agent registry (`agent_runs.agent_name = 'orchestrator'` rows are stage-level bookkeeping).

**8.3 OCR & Document Parsing Agent** — Detects format → digital PDF/DOCX parsed natively; scanned docs routed through Tesseract first. An LLM call then structures raw text into `document.structuredContract` (headings, numbered clauses, tables, signature blocks, annexures). Confidence = OCR engine score (scanned) or 1.0 (digital-native).

**8.4 Clause Classification Agent** — Single LLM call (multi-part structured output) over `document.structuredContract` doing: clause extraction/segmentation/type classification (indemnity, termination, IP, confidentiality, payment, etc.), NER (orgs, individuals, amounts, dates), obligation extraction, timeline/deadline extraction. Populates `clauseClassification` fully.

**8.5 Risk Assessment Agent** — Detects unlimited liability, vendor lock-in, missing confidentiality, ambiguous wording, IP conflicts, excessive penalties, missing governing law (floor, not exhaustive — model may surface more, each with severity). May query Legal Knowledge Agent for precedent. Output per finding: `{clause_ref, riskType, severity(low/med/high/critical), confidence, financialImpact, businessImpact}` plus aggregate `riskScore`.

**8.6 Compliance Verification Agent** — Queries Legal Knowledge Agent against the applicable framework corpus (GDPR, ISO, banking regs, procurement policy, insurance regs, org playbook — selected per contract type/jurisdiction). Emits only pass/fail/uncertain per named clause with citation — no commercial-risk judgments (that's Risk Assessment's job).

**8.7 Cross-Document Comparison Agent** — Runs only if a prior version/template was supplied at upload (else Orchestrator marks it `skipped`). Semantic diff: added/deleted clauses, modified obligations where meaning changed even if surface wording is similar.

**8.8 Shared Legal Knowledge Agent (RAG)** — Internal synchronous service, not a pipeline stage. Embeds the querying agent's question with Sentence Transformers, does similarity search over `legal_knowledge_documents` via FAISS/ChromaDB (filtered by requested `source_type`, top-k=5), then an LLM call synthesizes an evidence-backed answer with citations. Corpus seeding (MVP): internal policy docs, curated regulation excerpts (GDPR articles, relevant ISO clauses), approved clause templates, anonymized historical contracts — ingested via admin-only `/internal/legal-knowledge/ingest` (chunk → embed → store).

**8.9 Recommendation Agent** — Input: `risk`, `compliance`, `comparison`, relevant `legalEvidence`. Output: `recommendations.clauseRewrites` (proposed replacement text) and `recommendations.redlines` (structured insert/delete spans for the redlining view), each grounded in a legal-evidence citation where applicable.

**8.10 Negotiation Strategy Agent** — Runs in parallel with 8.9, same inputs. Output: `negotiationStrategy.points` — liability cap suggestions, payment term revisions, IP ownership balancing, warranty improvements, dispute-resolution alternatives, each tagged with rationale and priority.

**8.11 Explainability Agent** — Input: `consensus.finalRecommendation` plus every upstream namespace. Output: `explainability.justifications` — one entry per major decision, citing clause references, legal rationale, regulations/policies consulted, retrieved evidence, confidence score. Runs only after Stage 5 so it explains the *final* decision only.

**8.12 Report Generation Agent** — Input: entire Contract Case. Output: `report.sections` with exactly these sections: Executive Summary, Contract Summary, Contract Overview, Key Obligations, Timeline, Clause Classification, Risk Assessment, Compliance Report, Contract Comparison, Recommended Clause Improvements, Negotiation Strategy, Supporting Legal References, Explainability, Final Enterprise Recommendation. Also emits a PDF/HTML render job for download.

## 9. REST API Surface (FastAPI Routers)

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/login` | Issue JWT with role claims |
| POST | `/contracts` | Upload contract (+ optional comparison doc); creates `contract_cases` row, triggers Supervisor |
| GET | `/contracts/{case_id}` | Fetch full Contract Case (role-filtered) |
| GET | `/contracts/{case_id}/status` | Poll current stage/agent statuses (WebSocket fallback) |
| GET | `/contracts` | List cases, filterable by status/role/date |
| GET | `/contracts/{case_id}/report` | Fetch/download generated Enterprise Report |
| POST | `/contracts/{case_id}/review` | Submit reviewer decision (approve/request_changes/reject) + comment |
| GET | `/contracts/{case_id}/audit` | Fetch audit trail |
| POST | `/internal/legal-knowledge/ingest` | Admin-only corpus ingestion |
| POST | `/internal/legal-knowledge/query` | Internal-only, called by agents |
| WS | `/ws/contracts/{case_id}` | Live agent execution status events |

RBAC middleware enforces per-route role checks (e.g., only Executive Approver/Legal can `/review` high-financial-exposure cases; Finance sees Finance-relevant report sections only) via a policy table (`role`, `resource`, `action`) — not hardcoded per-route checks — so future roles/resources are additive.

## 10. Frontend — Simplified Dashboard

Keep the UI to three top-level views instead of a deep tab set, so the same information is available with less navigation:

- **`/login`**
- **`/dashboard`** — case list, filters, executive summary tiles.
- **`/contracts/{caseId}`** — single-page workspace with a left-hand section switcher (not deep tabs) covering: Contract Viewer, Clause Explorer, Risk Heatmap (Recharts/Chart.js), Compliance, Comparison (shown only if not skipped), Recommendations (accept/reject per suggestion), Negotiation Strategy, Explainability, Live Agent Status (React Flow graph, color-coded by state, driven by WebSocket), and Review & Approval (role-scoped Approve / Request Changes / Reject + comment + escalation).
- **`/contracts/{caseId}/audit`** — audit trail table.
- **`/admin/knowledge-base`** — ingestion UI for the Legal Knowledge Agent corpus (admin only).

State management: keep all server-derived state (Contract Case, report, audit log) in one data-fetching layer with cache invalidation on WebSocket events; keep local-only UI state (active section, filters) separate. Do not duplicate server state into local state.

## 11. Non-Functional Requirements → Implementation

| NFR | Implementation |
|---|---|
| Performance — parallel execution | LangGraph dispatches all nodes in a stage concurrently as separate async tasks |
| Scalability | Stateless API/worker processes behind a load balancer; horizontal worker scaling; DB connection pooling |
| Security | S3 (or encrypted local disk) for documents; encryption for PII fields; RBAC policy table (§9); JWT auth on all mutating routes; every state-changing action writes `audit_log` |
| Reliability | Retry/backoff (§7); optimistic-locking versioning prevents partial-write corruption |
| Maintainability | Each agent is an isolated module with its own folder, prompt file, output schema validator; no cross-agent imports |
| Availability | Multi-instance API/worker deployment behind a health-checked load balancer; automated DB backups |
| Explainability | Explainability Agent is a mandatory graph node (§7); Report Generation refuses to finalize a report missing an `explainability` section |
| Usability | Dashboard sections (§10) map 1:1 to the SRS feature list; nothing in §8 lacks a UI surface |

## 12. Security & Compliance

- Transport: TLS everywhere; no plaintext internal traffic in production.
- At rest: encrypted object storage for documents; DB-level encryption for PII; source `legal_knowledge_documents.content` encrypted at rest.
- RBAC roles seeded per §6; permission checks are server-side only (frontend role gating is UX convenience, never the security boundary).
- Audit log is append-only (no UPDATE/DELETE grants for the application DB role); every agent run, review decision, and login event is recorded.
- Secrets (Groq API key, DB credentials, JWT signing key) via environment variables through the deployment platform's secret manager — never committed to source.

## 13. Delivery Phases

- **Phase 1 — Foundation (Wk 1–2):** Auth/RBAC, Contract Case schema + migrations, file upload/storage, OCR/Parsing agent (Stage 1), dashboard shell with case list + upload flow.
- **Phase 2 — Core Analysis Pipeline (Wk 3–4):** Clause Classification (Stage 2), Risk/Compliance/Comparison agents (Stage 3) with the LangGraph executor wired end-to-end, Legal Knowledge Agent + FAISS/ChromaDB ingestion, WebSocket live status.
- **Phase 3 — Recommendations & Consensus (Wk 5):** Recommendation + Negotiation Strategy (Stage 4), Supervisor consensus logic (Stage 5), Explainability Agent (Stage 6).
- **Phase 4 — Reporting & Human Review (Wk 6):** Report Generation Agent (Stage 7), full dashboard section set (§10), Role-Based Human Review (Stage 8), audit trail UI.
- **Phase 5 — Hardening (Wk 7):** Retry/failure-path testing, RBAC edge cases, load test of parallel-agent throughput, security review against §12, demo data set + walkthrough script.

## 14. Explicit Out-of-Scope (Do Not Build)

Knowledge Graph integration, organizational learning/memory, regulatory change monitoring, contract lifecycle management beyond a single review cycle, multi-jurisdiction compliance beyond seeded frameworks, voice-enabled review. Do not scaffold placeholders for these — they are future work, not MVP stubs.

## 15. Definition of Done

All 8 stages execute against a real uploaded contract end-to-end, producing a complete Enterprise Report. Every one of the 11 agent/orchestrator components in §8 exists as an independently testable module with its own `agent_runs` record. The dashboard exposes every feature listed in the SRS with no missing section. RBAC blocks a non-authorized role from approving a case in a manual test. A forced agent failure demonstrates retry-then-flag-for-review without corrupting the Contract Case. The audit trail reconstructs the full lifecycle of a sample case from upload to final decision.
