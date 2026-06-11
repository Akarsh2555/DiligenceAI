"""
Conversational Q&A Chain — powered by Gemini with streaming.
Answers freeform questions grounded in retrieved document excerpts.
Persists chat history to Supabase per user per session.
"""

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from backend.config import get_settings
from backend.database import get_supabase_client
from backend.utils.citations import format_chunks_for_prompt

QA_SYSTEM_PROMPT = """You are DiligenceAI, an expert financial and legal analyst. Answer the user's questions about this deal using TWO sources of grounding:

1. The due-diligence REPORT already generated for this data room (executive summary, risk, growth, and legal analysis), and
2. The raw DOCUMENT EXCERPTS retrieved for the current question.

Rules:
- Prefer specific numbers and facts from these materials. Always cite document sources using [Source: filename, p.X] format.
- You may reference the report's conclusions, but if the user asks for underlying detail, ground it in the document excerpts.
- If the answer is not present in either source, say so explicitly — never speculate or hallucinate.
- Be precise and structure your answers clearly.

=== DUE-DILIGENCE REPORT ===
{report_context}

=== DOCUMENT EXCERPTS (retrieved for this question) ===
{context}"""


def get_qa_chain(streaming: bool = True):
    """Build the conversational Q&A chain using Gemini.

    NB: Gemini (langchain-google-genai) only accepts a single system message at
    position 0 — a second `("system", ...)` turn raises "Unexpected message with
    type SystemMessage at position 1". So report + document context are folded
    into ONE system message rather than two.
    """
    settings = get_settings()

    llm = ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=0.2,
        max_output_tokens=2048,
        streaming=streaming,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", QA_SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{question}"),
    ])

    return prompt | llm


async def load_chat_history(session_id: str, user_id: str, limit: int = 10) -> list:
    """Load recent chat history from Supabase for context window."""
    client = get_supabase_client()

    result = client.table("chat_messages") \
        .select("role, content") \
        .eq("session_id", session_id) \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .limit(limit) \
        .execute()

    messages = []
    if result.data:
        # Reverse to get chronological order
        for msg in reversed(result.data):
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))

    return messages


async def save_chat_message(
    session_id: str,
    user_id: str,
    role: str,
    content: str,
    citations: list[dict] | None = None,
) -> None:
    """Persist a chat message to Supabase."""
    client = get_supabase_client()

    client.table("chat_messages").insert({
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "citations": citations or [],
    }).execute()


async def run_qa(
    question: str,
    chunks: list,
    session_id: str,
    user_id: str,
    report_context: str = "",
) -> str:
    """Execute Q&A chain (non-streaming) and persist messages."""
    context = format_chunks_for_prompt(chunks)
    chat_history = await load_chat_history(session_id, user_id)

    chain = get_qa_chain(streaming=False)
    result = await chain.ainvoke({
        "context": context,
        "report_context": report_context or "No analysis report has been generated yet.",
        "chat_history": chat_history,
        "question": question,
    })

    # Persist both messages
    await save_chat_message(session_id, user_id, "user", question)
    await save_chat_message(session_id, user_id, "assistant", result.content)

    return result.content
