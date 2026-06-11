"""
DiligenceAI — FastAPI entry point.
Registers all routers and configures CORS, startup events.
"""

import os
from dotenv import load_dotenv
load_dotenv()

# Configure LangSmith tracing BEFORE importing any langchain module, since
# LangChain reads its tracing env vars once at first import. This sets both the
# legacy LANGCHAIN_* and modern LANGSMITH_* names so tracing works regardless of
# the installed SDK version or the process working directory.
from backend.observability import configure_tracing, flush_tracing
_tracing_enabled = configure_tracing()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.auth import router as auth_router
from backend.api.sessions import router as sessions_router
from backend.api.upload import router as upload_router
from backend.api.analyze import router as analyze_router
from backend.api.ask import router as ask_router
from backend.api.documents import router as documents_router

app = FastAPI(
    title="DiligenceAI",
    description="RAG-powered financial & legal due diligence platform",
    version="1.0.0",
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]

prod_origin = os.environ.get("FRONTEND_URL")
if prod_origin:
    ALLOWED_ORIGINS.append(prod_origin)

# CORS — allow frontend dev server and production UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(upload_router)
app.include_router(analyze_router)
app.include_router(ask_router)
app.include_router(documents_router)


@app.on_event("startup")
async def startup():
    """Ensure data directories exist on startup."""
    from backend.config import get_settings
    settings = get_settings()
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    settings.chroma_path.mkdir(parents=True, exist_ok=True)
    print(
        f"[observability] LangSmith tracing "
        f"{'ENABLED → project ' + settings.langchain_project if _tracing_enabled else 'DISABLED'}"
    )


@app.on_event("shutdown")
async def shutdown():
    """Flush any buffered LangSmith runs so dev restarts don't drop traces."""
    flush_tracing()


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "DiligenceAI"}
