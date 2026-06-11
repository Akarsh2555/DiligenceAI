"""
LangGraph shared state definition.
All nodes read from and write to this TypedDict.
"""

from typing import TypedDict, Optional, Annotated
from langchain_core.documents import Document


class DiligenceState(TypedDict):
    """Shared state flowing through the LangGraph pipeline."""

    # Session context
    session_id: str
    user_id: str
    documents_metadata: list[dict]           # All ingested doc metadata

    # Execution mode
    analysis_mode: str                        # "full" | "risk_only" | "legal_only" | "qa"
    query: Optional[str]                      # For Q&A mode only

    # Retrieval outputs
    retrieved_chunks: list[Document]          # Raw retrieval results
    web_search_results: Optional[str]         # Results from external search

    # Analysis outputs
    risk_assessment: Optional[str]            # Output of risk node
    growth_opportunities: Optional[str]       # Output of growth node
    executive_summary: Optional[str]          # Output of summary node
    legal_analysis: Optional[str]             # Output of legal node
    qa_answer: Optional[str]                  # Output of Q&A node

    import operator
    # Citations & tracking
    citations: list[dict]                     # [{text, source, page, doc_type}]
    errors: Annotated[list[str], operator.add]                         # Error messages from any node
    steps_completed: Annotated[list[str], operator.add]                # For frontend progress tracking

    # Final output
    final_report: Optional[dict]              # Assembled report object
