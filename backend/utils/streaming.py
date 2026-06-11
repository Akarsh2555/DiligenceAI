"""
SSE Streaming helpers — utilities for Server-Sent Events responses.
Provides structured event emission for long-running analysis pipelines.
"""

import json
import asyncio
from typing import AsyncGenerator, Any


async def sse_event(
    event: str,
    data: Any,
) -> str:
    """Format a single SSE event string."""
    payload = json.dumps(data) if isinstance(data, (dict, list)) else str(data)
    return f"event: {event}\ndata: {payload}\n\n"


async def emit_node_start(node_name: str, message: str) -> str:
    """Emit a node_start SSE event."""
    return await sse_event("message", {
        "event": "node_start",
        "node": node_name,
        "message": message,
    })


async def emit_node_complete(node_name: str, preview: str = "") -> str:
    """Emit a node_complete SSE event."""
    return await sse_event("message", {
        "event": "node_complete",
        "node": node_name,
        "preview": preview[:200],  # Truncate preview
    })


async def emit_token(text: str) -> str:
    """Emit a streaming token SSE event."""
    return await sse_event("message", {
        "event": "token",
        "text": text,
    })


async def emit_citations(citations: list[dict]) -> str:
    """Emit citations as an SSE event."""
    return await sse_event("message", {
        "event": "citations",
        "data": citations,
    })


async def emit_complete(report: dict) -> str:
    """Emit the final completion SSE event with the full report."""
    return await sse_event("message", {
        "event": "complete",
        "report": report,
    })


async def emit_error(error_message: str) -> str:
    """Emit an error SSE event."""
    return await sse_event("message", {
        "event": "error",
        "message": error_message,
    })


async def emit_progress(
    file: str,
    status: str,
    progress: int,
) -> str:
    """Emit a file ingestion progress SSE event."""
    return await sse_event("message", {
        "event": "ingestion_progress",
        "file": file,
        "status": status,
        "progress": min(progress, 100),
    })
