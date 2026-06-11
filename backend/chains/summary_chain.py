"""
Executive Summary Chain — powered by Gemini.
Produces a C-suite-ready executive summary from analysis outputs.
"""

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from backend.config import get_settings

SUMMARY_SYSTEM_PROMPT = """You are a senior managing director at a top-tier advisory firm. Produce a concise, C-suite-ready executive summary based on the risk assessment, growth analysis, and supporting document excerpts provided.

Your summary should:
1. Open with a clear investment thesis / deal recommendation (1-2 sentences)
2. Highlight the top 2-3 material risks with their severity
3. Highlight the top 2-3 growth opportunities with their potential magnitude
4. Include any critical legal findings if applicable
5. Close with a clear next-steps recommendation

Keep it to 3-5 paragraphs. Use specific numbers and facts from the analyses — do not generalize.
Always cite sources using [Source: filename, p.X] format.
"""


def get_summary_chain():
    """Build the executive summary LangChain chain using Gemini."""
    settings = get_settings()

    llm = ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=0.3,
        max_output_tokens=3000,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SUMMARY_SYSTEM_PROMPT),
        ("human", """Based on the following analyses, produce an executive summary:

--- Risk Assessment ---
{risk_assessment}

--- Growth Opportunities ---
{growth_opportunities}

--- Legal Analysis (if applicable) ---
{legal_analysis}

--- External Web Search Context ---
{web_search_results}

--- Key Supporting Excerpts ---
{context}

Executive Summary:"""),
    ])

    return prompt | llm


async def run_executive_summary(
    risk_assessment: str,
    growth_opportunities: str,
    legal_analysis: str,
    web_search_results: str,
    context: str,
) -> str:
    """Execute the executive summary chain."""
    chain = get_summary_chain()
    result = await chain.ainvoke({
        "risk_assessment": risk_assessment or "No risk assessment available.",
        "growth_opportunities": growth_opportunities or "No growth analysis available.",
        "legal_analysis": legal_analysis or "No legal documents in scope.",
        "web_search_results": web_search_results or "No external context available.",
        "context": context,
    })
    return result.content
