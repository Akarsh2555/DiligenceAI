"""
Pydantic schemas for DiligenceSession, Report, and ChatMessage.
Supabase is the storage backend — these are validation/serialization models.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Session ──────────────────────────────────────────────────

class SessionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class SessionResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    status: str
    document_count: int
    total_chunks: int
    created_at: str
    updated_at: str


class SessionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    document_count: Optional[int] = None
    total_chunks: Optional[int] = None


# ── Report ───────────────────────────────────────────────────

class ReportResponse(BaseModel):
    id: str
    session_id: str
    user_id: str
    analysis_mode: str
    risk_assessment: Optional[str] = None
    growth_opportunities: Optional[str] = None
    legal_analysis: Optional[str] = None
    executive_summary: Optional[str] = None
    citations: list[dict] = []
    report_metadata: dict = {}
    status: str
    error_message: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None


# ── Chat Messages ────────────────────────────────────────────

class ChatMessageCreate(BaseModel):
    session_id: str
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    user_id: str
    role: str
    content: str
    citations: list[dict] = []
    created_at: str


# ── Auth ─────────────────────────────────────────────────────

class SignUpRequest(BaseModel):
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user_id: str
    email: str
    expires_at: Optional[int] = None


class ProfileResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: str
