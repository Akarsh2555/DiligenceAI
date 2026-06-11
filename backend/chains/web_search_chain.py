"""
Web Search Chain — extracts main company/topic from chunks and searches DuckDuckGo.
Provides external internet context for the LangGraph agentic system.
"""

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.tools import DuckDuckGoSearchResults
from langchain_core.documents import Document

from backend.config import get_settings
from backend.utils.citations import format_chunks_for_prompt

EXTRACT_PROMPT = """You are an AI assistant. Based on the following document excerpts, identify the PRIMARY company, product, or central subject being discussed.
Return ONLY the name of the primary subject, nothing else.

Excerpts:
{context}

Subject name:"""

async def run_web_search(chunks: list[Document]) -> str:
    """Extract main topic from chunks and perform DuckDuckGo search."""
    if not chunks:
        return "No documents available to determine search context."
        
    settings = get_settings()
    llm = ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=0.0,
    )
    
    # Take first few chunks to determine context quickly
    context = format_chunks_for_prompt(chunks[:5])
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", EXTRACT_PROMPT),
    ])
    
    chain = prompt | llm
    
    try:
        # 1. Extract subject
        subject_result = await chain.ainvoke({"context": context})
        subject = subject_result.content.strip()
        
        if not subject or "no subject" in subject.lower():
            return "Could not determine a clear subject to search for."
            
        # 2. Search DuckDuckGo
        search = DuckDuckGoSearchResults()
        query = f"{subject} news OR market OR controversy OR latest updates"
        
        # DuckDuckGo run is synchronous but fast enough
        search_results = search.run(query)
        
        return f"### DuckDuckGo Search Results for '{subject}'\n\n{search_results}"
        
    except Exception as e:
        return f"Web search failed: {str(e)}"
