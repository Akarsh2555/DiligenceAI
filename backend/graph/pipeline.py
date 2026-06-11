"""
LangGraph pipeline — compiles the full DiligenceAI analysis graph.
Singleton compiled graph, built once at startup.
"""

from langgraph.graph import StateGraph, END
from langchain_core.runnables import RunnableConfig

from backend.graph.state import DiligenceState
from backend.graph.nodes import (
    retrieve_node,
    risk_assessment_node,
    growth_opportunities_node,
    legal_analysis_node,
    executive_summary_node,
    qa_node,
    assemble_report_node,
    web_search_node,
)
from backend.graph.edges import route_after_retrieve


def build_diligence_graph():
    """
    Build and compile the DiligenceAI LangGraph pipeline.

    Flow:
      retrieve → [risk + growth + legal (parallel)] → summary → assemble
      retrieve → qa (for Q&A mode)
    """
    graph = StateGraph(DiligenceState)

    # ── Add all nodes ──
    graph.add_node("retrieve", retrieve_node)
    graph.add_node("risk", risk_assessment_node)
    graph.add_node("growth", growth_opportunities_node)
    graph.add_node("legal", legal_analysis_node)
    graph.add_node("summary", executive_summary_node)
    graph.add_node("qa", qa_node)
    graph.add_node("assemble", assemble_report_node)
    graph.add_node("web_search", web_search_node)

    # ── Entry point ──
    graph.set_entry_point("retrieve")

    # ── Conditional routing after retrieval ──
    graph.add_conditional_edges(
        "retrieve",
        route_after_retrieve,
        {
            "risk": "risk",
            "growth": "growth",
            "legal": "legal",
            "web_search": "web_search",
            "qa": "qa",
        },
    )

    # ── Analysis nodes → summary ──
    graph.add_edge("risk", "summary")
    graph.add_edge("growth", "summary")
    graph.add_edge("legal", "summary")
    graph.add_edge("web_search", "summary")

    # ── Summary → assemble report ──
    graph.add_edge("summary", "assemble")

    # ── Terminal nodes ──
    graph.add_edge("assemble", END)
    graph.add_edge("qa", END)

    return graph.compile()


# Singleton — compile once on import
diligence_graph = build_diligence_graph()


async def run_pipeline(
    session_id: str,
    user_id: str,
    analysis_mode: str = "full",
    documents_metadata: list[dict] | None = None,
    query: str | None = None,
) -> DiligenceState:
    """
    Execute the full LangGraph pipeline with LangSmith tracing.
    Returns the final state with all outputs.
    """
    initial_state: DiligenceState = {
        "session_id": session_id,
        "user_id": user_id,
        "documents_metadata": documents_metadata or [],
        "analysis_mode": analysis_mode,
        "query": query,
        "retrieved_chunks": [],
        "risk_assessment": None,
        "growth_opportunities": None,
        "executive_summary": None,
        "legal_analysis": None,
        "qa_answer": None,
        "citations": [],
        "errors": [],
        "steps_completed": [],
        "final_report": None,
    }

    # LangSmith tracing config
    config = RunnableConfig(
        run_name=f"diligence-{session_id[:8]}",
        tags=["production", analysis_mode],
        metadata={
            "session_id": session_id,
            "user_id": user_id,
            "doc_count": len(documents_metadata or []),
            "analysis_mode": analysis_mode,
        },
    )

    result = await diligence_graph.ainvoke(initial_state, config=config)
    return result
