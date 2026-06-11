"""
Growth Opportunities Chain — powered by Gemini.
Identifies revenue, market, operational, and strategic growth signals.
"""

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from backend.config import get_settings
from backend.utils.citations import format_chunks_for_prompt

GROWTH_SYSTEM_PROMPT = """You are a growth equity analyst. Analyze the provided excerpts and identify growth opportunities.

Format your response exactly as:

## Growth Opportunities

### 💰 Revenue Expansion
[Opportunities with evidence and size estimates where available]

### 🌍 Market Expansion
[Geographic or segment expansion opportunities]

### 🔧 Operational Leverage
[Margin improvement, efficiency, or scale opportunities]

### 🤝 Strategic Opportunities
[M&A, partnerships, platform extensions]

### Opportunity Score: X/10
[Brief justification]

RULES:
- Every opportunity MUST cite source with [Source: filename, p.X]
- Distinguish between stated guidance and analyst inference
- Flag if projections are management estimates vs. third-party verified
"""


def get_growth_chain():
    """Build the growth opportunities LangChain chain using Gemini."""
    settings = get_settings()

    llm = ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=0.3,
        max_output_tokens=4096,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", GROWTH_SYSTEM_PROMPT),
        ("human", """Analyze the following document excerpts for growth opportunities:

{context}

Provide your structured growth analysis:"""),
    ])

    return prompt | llm


async def run_growth_analysis(chunks: list) -> str:
    """Execute the growth analysis chain on the given chunks."""
    context = format_chunks_for_prompt(chunks)
    chain = get_growth_chain()
    result = await chain.ainvoke({"context": context})
    return result.content
