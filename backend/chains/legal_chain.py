"""
Legal Analysis Chain — powered by Gemini.
Conducts legal due diligence on contract and legal document excerpts.
"""

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from backend.config import get_settings
from backend.utils.citations import format_chunks_for_prompt

LEGAL_SYSTEM_PROMPT = """You are a senior M&A attorney conducting legal due diligence. Analyze the provided contract and legal document excerpts.

Format your response as:

## Legal Analysis

### ⚠️ Red Flags (Requires Immediate Attention)
### 📋 Key Terms Summary
### 🔒 IP & Ownership
### 💼 Liability & Indemnification
### 🚪 Termination & Exit Provisions
### ⚖️ Governing Law & Dispute Resolution
### 📝 Unusual or Non-Standard Clauses

RULES:
- Cite every clause with [Source: filename, Section X.X] or page number
- Flag one-sided or unusual terms explicitly
- Note missing standard provisions that should typically be present
- Do not provide legal advice — this is a factual summary for counsel review
"""


def get_legal_chain():
    """Build the legal analysis LangChain chain using Gemini."""
    settings = get_settings()

    llm = ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=0.1,
        max_output_tokens=4096,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", LEGAL_SYSTEM_PROMPT),
        ("human", """Analyze the following legal document excerpts:

{context}

Provide your structured legal analysis:"""),
    ])

    return prompt | llm


async def run_legal_analysis(chunks: list) -> str:
    """Execute the legal analysis chain on the given chunks."""
    context = format_chunks_for_prompt(chunks)
    chain = get_legal_chain()
    result = await chain.ainvoke({"context": context})
    return result.content
