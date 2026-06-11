"""
LangGraph node functions — each takes DiligenceState and returns partial updates.
All nodes are async. No blocking I/O.
"""

import asyncio
from datetime import datetime, timezone

from backend.graph.state import DiligenceState
from backend.chains.retrieval import retrieve_multi_query, retrieve_relevant_chunks
from backend.chains.risk_chain import run_risk_assessment
from backend.chains.growth_chain import run_growth_analysis
from backend.chains.legal_chain import run_legal_analysis
from backend.chains.summary_chain import run_executive_summary
from backend.chains.qa_chain import run_qa, load_chat_history
from backend.utils.citations import extract_citations_from_chunks, format_chunks_for_prompt

# Risk-relevant keywords for filtering
RISK_KEYWORDS = [
    "risk", "litigation", "regulatory", "debt", "covenant",
    "contingent liability", "impairment", "default", "lawsuit",
    "investigation", "penalty", "compliance", "adverse",
]

# Growth-relevant keywords for filtering
GROWTH_KEYWORDS = [
    "growth", "pipeline", "expansion", "tam", "guidance",
    "runway", "revenue", "opportunity", "market share",
    "acquisition", "partnership", "innovation", "scale",
]


def _filter_chunks_by_keywords(chunks: list, keywords: list[str]) -> list:
    """Filter chunks to those containing any of the specified keywords."""
    filtered = []
    for chunk in chunks:
        content_lower = chunk.page_content.lower()
        if any(kw in content_lower for kw in keywords):
            filtered.append(chunk)

    # If filtering is too aggressive, fall back to all chunks
    if len(filtered) < 3 and len(chunks) > 0:
        return chunks[:10]

    return filtered


async def retrieve_node(state: DiligenceState) -> dict:
    """
    Retrieve relevant chunks via parallel multi-query search.
    Runs 3 simultaneous searches for risk, growth, and legal signals.
    """
    try:
        session_id = state["session_id"]

        queries = [
            "What are the key risk factors, litigation, regulatory issues, and liabilities?",
            "What are the growth opportunities, revenue drivers, market expansion plans?",
            "What are the key contractual terms, legal obligations, and governing provisions?",
        ]

        chunks = await retrieve_multi_query(
            session_id=session_id,
            queries=queries,
            k=8,
        )

        citations = extract_citations_from_chunks(chunks)

        return {
            "retrieved_chunks": chunks,
            "citations": citations,
            "steps_completed": ["retrieve"],
        }

    except Exception as e:
        return {
            "retrieved_chunks": [],
            "citations": [],
            "errors": [f"Retrieval error: {str(e)}"],
            "steps_completed": ["retrieve"],
        }


async def risk_assessment_node(state: DiligenceState) -> dict:
    """
    Run risk assessment on retrieved chunks filtered to risk-relevant content.
    Outputs structured markdown with High/Medium/Low risk tags.
    """
    try:
        chunks = state.get("retrieved_chunks", [])
        risk_chunks = _filter_chunks_by_keywords(chunks, RISK_KEYWORDS)

        result = await run_risk_assessment(risk_chunks)

        return {
            "risk_assessment": result,
            "steps_completed": ["risk_assessment"],
        }

    except Exception as e:
        return {
            "risk_assessment": f"Error generating risk assessment: {str(e)}",
            "errors": [f"Risk node error: {str(e)}"],
            "steps_completed": ["risk_assessment"],
        }


async def growth_opportunities_node(state: DiligenceState) -> dict:
    """
    Run growth analysis on chunks filtered to forward-looking content.
    Outputs structured markdown with opportunity categories.
    """
    try:
        chunks = state.get("retrieved_chunks", [])
        growth_chunks = _filter_chunks_by_keywords(chunks, GROWTH_KEYWORDS)

        result = await run_growth_analysis(growth_chunks)

        return {
            "growth_opportunities": result,
            "steps_completed": ["growth_opportunities"],
        }

    except Exception as e:
        return {
            "growth_opportunities": f"Error generating growth analysis: {str(e)}",
            "errors": [f"Growth node error: {str(e)}"],
            "steps_completed": ["growth_opportunities"],
        }


async def legal_analysis_node(state: DiligenceState) -> dict:
    """
    Run legal clause analysis. Only executes if legal documents exist in session.
    """
    try:
        docs_metadata = state.get("documents_metadata", [])
        has_legal = any(
            d.get("doc_type") == "legal_contract" for d in docs_metadata
        )

        if not has_legal:
            return {
                "legal_analysis": "No legal documents found in this session.",
                "steps_completed": ["legal_analysis"],
            }

        chunks = state.get("retrieved_chunks", [])
        legal_chunks = [
            c for c in chunks
            if c.metadata.get("doc_type") == "legal_contract"
        ]

        # Fallback if no chunks matched the filter
        if not legal_chunks:
            legal_keywords = [
                "agreement", "contract", "whereas", "indemnification",
                "termination", "governing law", "liability",
            ]
            legal_chunks = _filter_chunks_by_keywords(chunks, legal_keywords)

        result = await run_legal_analysis(legal_chunks)

        return {
            "legal_analysis": result,
            "steps_completed": ["legal_analysis"],
        }

    except Exception as e:
        return {
            "legal_analysis": f"Error in legal analysis: {str(e)}",
            "errors": [f"Legal node error: {str(e)}"],
            "steps_completed": ["legal_analysis"],
        }


async def executive_summary_node(state: DiligenceState) -> dict:
    """
    Generate C-suite-ready executive summary from risk + growth + legal outputs.
    Runs after the analysis nodes complete.
    """
    try:
        chunks = state.get("retrieved_chunks", [])
        context = format_chunks_for_prompt(chunks[:6])

        result = await run_executive_summary(
            risk_assessment=state.get("risk_assessment", ""),
            growth_opportunities=state.get("growth_opportunities", ""),
            legal_analysis=state.get("legal_analysis", ""),
            web_search_results=state.get("web_search_results", ""),
            context=context,
        )

        return {
            "executive_summary": result,
            "steps_completed": ["executive_summary"],
        }

    except Exception as e:
        return {
            "executive_summary": f"Error generating summary: {str(e)}",
            "errors": [f"Summary node error: {str(e)}"],
            "steps_completed": ["executive_summary"],
        }


async def qa_node(state: DiligenceState) -> dict:
    """
    Freeform Q&A node — retrieves relevant chunks for the query
    and runs the conversational chain with chat history.
    """
    try:
        session_id = state["session_id"]
        user_id = state["user_id"]
        query = state.get("query", "")

        if not query:
            return {
                "qa_answer": "No question provided.",
                "steps_completed": ["qa"],
            }

        # Retrieve chunks specifically for this question
        chunks = await retrieve_relevant_chunks(
            session_id=session_id,
            query=query,
            k=8,
        )

        citations = extract_citations_from_chunks(chunks)

        answer = await run_qa(
            question=query,
            chunks=chunks,
            session_id=session_id,
            user_id=user_id,
        )

        return {
            "qa_answer": answer,
            "retrieved_chunks": chunks,
            "citations": citations,
            "steps_completed": ["qa"],
        }

    except Exception as e:
        return {
            "qa_answer": f"Error answering question: {str(e)}",
            "errors": [f"QA node error: {str(e)}"],
            "steps_completed": ["qa"],
        }


from backend.chains.web_search_chain import run_web_search

async def web_search_node(state: DiligenceState) -> dict:
    """
    Search the internet for external context about the subject matter.
    Provides an agentic capability to bring in outside information.
    """
    try:
        chunks = state.get("retrieved_chunks", [])
        
        result = await run_web_search(chunks)
        
        return {
            "web_search_results": result,
            "steps_completed": ["web_search"],
        }
    except Exception as e:
        return {
            "web_search_results": f"Error performing web search: {str(e)}",
            "errors": [f"Web search node error: {str(e)}"],
            "steps_completed": ["web_search"],
        }


async def assemble_report_node(state: DiligenceState) -> dict:
    """
    Combine all analysis outputs into the final_report dict.
    This is the terminal node for full analysis mode.
    """
    report = {
        "risk_assessment": state.get("risk_assessment"),
        "growth_opportunities": state.get("growth_opportunities"),
        "legal_analysis": state.get("legal_analysis"),
        "executive_summary": state.get("executive_summary"),
        "citations": state.get("citations", []),
        "metadata": {
            "session_id": state["session_id"],
            "analysis_mode": state.get("analysis_mode", "full"),
            "documents_analyzed": len(state.get("documents_metadata", [])),
            "chunks_retrieved": len(state.get("retrieved_chunks", [])),
            "errors": state.get("errors", []),
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    return {
        "final_report": report,
        "steps_completed": ["assemble_report"],
    }
