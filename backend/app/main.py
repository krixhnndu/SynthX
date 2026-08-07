import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import (
    approvals, audit, auth, collab, contracts, internal, review, users, versions, ws,
)
from app.config import settings

logging.basicConfig(level=logging.INFO)

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(contracts.router)
app.include_router(review.router)
app.include_router(audit.router)
app.include_router(internal.router)
app.include_router(collab.router)
app.include_router(versions.router)
app.include_router(approvals.router)
app.include_router(users.router)
app.include_router(ws.router)


@app.get("/health")
def health():
    return {"status": "ok", "environment": settings.environment}
