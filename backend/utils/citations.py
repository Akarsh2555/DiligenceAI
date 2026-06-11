"""
Citation formatter — extracts and structures source references
from LLM outputs and retrieved chunks.
"""

import re
from typing import Optional
from langchain_core.documents import Document


def clean_source_name(name: str) -> str:
    """Turn a stored filename into a human-readable source label.

    Uploaded files are persisted with a hash/UUID prefix
    (e.g. "182eb5c6e1754b229d6a3de765b1ad92_A187209.pdf"). Strip that prefix so
    citations read like the original document name ("A187209.pdf").
    """
    if not name:
        return "Unknown"
    # Strip a leading hex hash (>=16 hex chars, optional UUID dashes) + underscore.
    cleaned = re.sub(r'^[0-9a-fA-F]{8,}(?:-[0-9a-fA-F]+)*_', '', name)
    return cleaned or name


def format_citation(
    source_file: str,
    page_number: Optional[int] = None,
    section: Optional[str] = None,
    doc_type: str = "unknown",
) -> str:
    """Format a citation reference string."""
    parts = [f"Source: {source_file}"]
    if page_number is not None:
        parts.append(f"p.{page_number}")
    if section:
        parts.append(f"Section {section}")
    return "[" + ", ".join(parts) + "]"


def extract_citations_from_chunks(chunks: list[Document]) -> list[dict]:
    """
    Build structured citations from retrieved chunks.
    Returns list of citation dicts with text excerpt, source info, and relevance.
    """
    citations = []
    seen = set()

    for chunk in chunks:
        meta = chunk.metadata
        key = f"{meta.get('source_file', '')}:{meta.get('page_number', '')}:{chunk.page_content[:50]}"

        if key in seen:
            continue
        seen.add(key)

        citations.append({
            "text": chunk.page_content[:300],  # Truncate for display
            "source": clean_source_name(meta.get("source_file", "Unknown")),
            "page": meta.get("page_number"),
            "doc_type": meta.get("doc_type", "unknown"),
            "section_header": meta.get("section_header"),
            "chunk_index": meta.get("chunk_index"),
            "relevance_score": meta.get("relevance_score"),
        })

    return citations


def format_chunks_for_prompt(chunks: list[Document]) -> str:
    """
    Format retrieved chunks into a structured context string
    suitable for injection into LLM prompts.
    """
    if not chunks:
        return "No relevant document excerpts found."

    parts = []
    for i, chunk in enumerate(chunks, 1):
        meta = chunk.metadata
        source = clean_source_name(meta.get("source_file", "Unknown"))
        page = meta.get("page_number", "?")
        doc_type = meta.get("doc_type", "unknown")

        header = f"--- Excerpt {i} [{source}, p.{page}, type: {doc_type}] ---"
        parts.append(f"{header}\n{chunk.page_content}")

    return "\n\n".join(parts)


def parse_citations_from_text(text: str) -> list[dict]:
    """
    Parse [Source: filename, p.X] style citations from LLM output text.
    Returns structured citation references.
    """
    pattern = r'\[Source:\s*([^,\]]+)(?:,\s*p\.(\d+))?(?:,\s*(?:Section\s+)?([^\]]+))?\]'
    matches = re.findall(pattern, text)

    citations = []
    for match in matches:
        citation = {
            "source": match[0].strip(),
            "page": int(match[1]) if match[1] else None,
            "section": match[2].strip() if match[2] else None,
        }
        citations.append(citation)

    return citations
