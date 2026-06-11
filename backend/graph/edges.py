"""
LangGraph conditional edge logic.
Determines routing between nodes based on analysis_mode and document types.
"""

from backend.graph.state import DiligenceState


def route_after_retrieve(state: DiligenceState) -> list[str]:
    """
    After retrieval, determine which analysis nodes to run.
    Returns a list of node names for parallel forking.
    """
    mode = state.get("analysis_mode", "full")

    if mode == "qa":
        return ["qa"]

    if mode == "risk_only":
        return ["risk"]

    if mode == "legal_only":
        return ["legal"]

    # Full analysis — always run risk + growth + web_search
    targets = ["risk", "growth", "web_search"]

    # Also run legal if legal documents exist
    docs_metadata = state.get("documents_metadata", [])
    has_legal = any(
        d.get("doc_type") == "legal_contract" for d in docs_metadata
    )
    if has_legal:
        targets.append("legal")

    return targets


def should_run_summary(state: DiligenceState) -> str:
    """
    After risk + growth (+ legal) complete, decide next step.
    For QA mode, go to END. For analysis modes, go to summary.
    """
    mode = state.get("analysis_mode", "full")

    if mode == "qa":
        return "end"

    return "summary"


def route_after_summary(state: DiligenceState) -> str:
    """After summary, always go to assemble report."""
    return "assemble"
