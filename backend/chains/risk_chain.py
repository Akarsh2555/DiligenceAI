"""
Risk Assessment Chain — powered by Gemini.
Produces structured risk analysis with High/Medium/Low classifications.
"""

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from backend.config import get_settings
from backend.utils.citations import format_chunks_for_prompt

RISK_SYSTEM_PROMPT = """You are a senior due diligence analyst at a top-tier investment bank. Your task is to analyze the provided source excerpts from company documents and produce a structured risk assessment.

Format your response exactly as:

## Risk Assessment

### 🔴 High Risk
[List each high-severity risk with: risk name, description, source evidence, potential financial/operational impact]

### 🟡 Medium Risk  
[List each medium-severity risk]

### 🟢 Low Risk / Monitored
[List each low-severity or watchlist item]

### Summary
[2-3 sentence overall risk posture]

RULES:
- Every risk MUST cite at least one source excerpt using [Source: filename, p.X] format
- Do not hallucinate risks not evidenced in the provided excerpts
- Be specific: use actual numbers, dates, and entities from the documents
- If a risk category has no evidence, write "No material risks identified in provided excerpts"
"""


def get_risk_chain():
    """Build the risk assessment LangChain chain using Gemini."""
    settings = get_settings()

    llm = ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=0.2,
        max_output_tokens=4096,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", RISK_SYSTEM_PROMPT),
        ("human", """Analyze the following document excerpts for risks:

{context}

Provide your structured risk assessment:"""),
    ])

    return prompt | llm


async def run_risk_assessment(chunks: list) -> str:
    """Execute the risk assessment chain on the given chunks."""
    context = format_chunks_for_prompt(chunks)
    chain = get_risk_chain()
    result = await chain.ainvoke({"context": context})
    return result.content
