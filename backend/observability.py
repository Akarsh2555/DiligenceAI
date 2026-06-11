"""
DiligenceAI — Observability / LangSmith tracing setup.

This module guarantees LangSmith tracing is configured *regardless* of:
  - the current working directory (load_dotenv may not find .env),
  - the installed langsmith/langchain version (the canonical env-var names
    changed from `LANGCHAIN_*` to `LANGSMITH_*` in newer releases).

`configure_tracing()` MUST be called before any `langchain_*` module is
imported, because LangChain reads these environment variables once, when its
tracing callback is first initialised.
"""

import os

from backend.config import get_settings


def configure_tracing() -> bool:
    """
    Push LangSmith settings into os.environ under BOTH the legacy
    (`LANGCHAIN_*`) and modern (`LANGSMITH_*`) variable names so tracing works
    on any version of the SDK. Returns True if tracing was enabled.
    """
    settings = get_settings()

    # Tracing is only meaningful if we actually have an API key.
    enabled = bool(settings.langchain_tracing_v2 and settings.langchain_api_key)

    flag = "true" if enabled else "false"
    endpoint = settings.langchain_endpoint
    api_key = settings.langchain_api_key
    project = settings.langchain_project

    # Legacy names (langchain-core / langsmith < ~0.2)
    os.environ["LANGCHAIN_TRACING_V2"] = flag
    os.environ["LANGCHAIN_ENDPOINT"] = endpoint
    os.environ["LANGCHAIN_PROJECT"] = project
    if api_key:
        os.environ["LANGCHAIN_API_KEY"] = api_key

    # Modern names (langsmith >= ~0.2 / langchain v1)
    os.environ["LANGSMITH_TRACING"] = flag
    os.environ["LANGSMITH_ENDPOINT"] = endpoint
    os.environ["LANGSMITH_PROJECT"] = project
    if api_key:
        os.environ["LANGSMITH_API_KEY"] = api_key

    return enabled


def flush_tracing() -> None:
    """
    Force-flush any buffered runs to LangSmith. Useful on graceful shutdown so
    dev runs (uvicorn --reload, Ctrl+C) don't lose their final traces, which
    are otherwise uploaded asynchronously by a background thread.
    """
    try:
        from langsmith import Client

        client = Client()
        # `flush` exists on modern clients; older ones flush on GC/atexit.
        if hasattr(client, "flush"):
            client.flush()
    except Exception:
        # Never let observability teardown break shutdown.
        pass
