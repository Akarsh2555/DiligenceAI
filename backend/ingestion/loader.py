"""
DocumentLoader — Routes files to the appropriate LangChain loader by extension.
Extracts rich metadata per page including auto-detected document type.
"""

import re
from pathlib import Path
from typing import Optional

from langchain_core.documents import Document
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    UnstructuredExcelLoader,
    TextLoader,
)

# Keywords used for fast heuristic document-type detection
DOC_TYPE_PATTERNS: dict[str, list[str]] = {
    "10-K": [
        "annual report", "form 10-k", "10-k", "fiscal year ended",
        "item 1. business", "item 1a. risk factors",
    ],
    "10-Q": [
        "quarterly report", "form 10-q", "10-q", "quarter ended",
    ],
    "S-1": [
        "form s-1", "registration statement", "s-1", "prospectus",
    ],
    "earnings_call": [
        "earnings call", "conference call", "q&a session",
        "operator", "good morning", "good afternoon",
    ],
    "legal_contract": [
        "this agreement", "whereas", "hereby agrees", "governing law",
        "indemnification", "termination", "pursuant to section",
        "the parties agree", "effective date",
    ],
    "market_report": [
        "market analysis", "industry report", "market size",
        "tam", "competitive landscape", "market share",
    ],
    "investor_deck": [
        "investor presentation", "investment highlights",
        "financial overview", "value proposition", "total addressable market",
    ],
}

# File extensions we support
SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".xls", ".txt", ".md"}


def detect_doc_type(text: str) -> str:
    """
    Fast heuristic: check first 500 characters for document-type keywords.
    Returns the best-matching type or 'unknown'.
    """
    sample = text[:500].lower()
    scores: dict[str, int] = {}

    for doc_type, keywords in DOC_TYPE_PATTERNS.items():
        score = sum(1 for kw in keywords if kw in sample)
        if score > 0:
            scores[doc_type] = score

    if not scores:
        # Fallback: check for financial indicators in full first 2000 chars
        extended = text[:2000].lower()
        financial_signals = ["ebitda", "revenue", "net income", "cash flow", "balance sheet"]
        if any(sig in extended for sig in financial_signals):
            return "financial_statement"
        return "unknown"

    return max(scores, key=scores.get)


class DocumentLoaderRouter:
    """
    Routes file loading by extension and enriches metadata.
    Returns List[Document] with source_file, page_number, doc_type metadata.
    """

    @staticmethod
    def _get_loader(file_path: Path):
        """Select the right LangChain loader based on file extension."""
        ext = file_path.suffix.lower()

        if ext == ".pdf":
            return PyPDFLoader(str(file_path))
        elif ext == ".docx":
            return Docx2txtLoader(str(file_path))
        elif ext in (".xlsx", ".xls"):
            return UnstructuredExcelLoader(str(file_path), mode="elements")
        elif ext in (".txt", ".md"):
            return TextLoader(str(file_path), encoding="utf-8")
        else:
            raise ValueError(f"Unsupported file type: {ext}")

    @staticmethod
    def validate_file(file_path: Path, max_size_bytes: int) -> Optional[str]:
        """Validate file before loading. Returns error message or None."""
        if not file_path.exists():
            return f"File not found: {file_path.name}"

        if file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            return f"Unsupported file type: {file_path.suffix}"

        if file_path.stat().st_size > max_size_bytes:
            size_mb = file_path.stat().st_size / (1024 * 1024)
            max_mb = max_size_bytes / (1024 * 1024)
            return f"File too large: {size_mb:.1f}MB (max {max_mb:.0f}MB)"

        return None

    @classmethod
    async def load(cls, file_path: Path, session_id: str) -> list[Document]:
        """
        Load a file and return enriched LangChain Documents.
        Each document has metadata: source_file, page_number, doc_type, session_id.
        """
        import asyncio

        path = Path(file_path)
        loader = cls._get_loader(path)

        # Load documents (may be blocking for some loaders)
        raw_docs = await asyncio.to_thread(loader.load)

        if not raw_docs:
            return []

        # Detect document type from combined text
        combined_text = " ".join(doc.page_content for doc in raw_docs[:3])
        doc_type = detect_doc_type(combined_text)

        # Enrich metadata on every page/chunk
        enriched = []
        for idx, doc in enumerate(raw_docs):
            doc.metadata.update({
                "source_file": path.name,
                "file_path": str(path),
                "page_number": doc.metadata.get("page", idx + 1),
                "doc_type": doc_type,
                "session_id": session_id,
                "total_pages": len(raw_docs),
            })
            enriched.append(doc)

        return enriched
