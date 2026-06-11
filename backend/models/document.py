"""
Pydantic schemas for Document and Chunk.
Used for API request/response validation — Supabase is the source of truth.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DocumentCreate(BaseModel):
    """Schema for creating a new document record in Supabase."""
    session_id: str
    user_id: str
    filename: str
    file_path: str
    file_type: str
    file_size: int = 0
    doc_type: str = "unknown"
    page_count: int = 0
    chunk_count: int = 0
    status: str = "pending"


class DocumentResponse(BaseModel):
    """Schema for document responses from Supabase."""
    id: str
    session_id: str
    user_id: str
    filename: str
    file_path: str
    file_type: str
    file_size: int
    doc_type: str
    page_count: int
    chunk_count: int
    status: str
    error_message: Optional[str] = None
    created_at: str
    updated_at: str


class DocumentUpdate(BaseModel):
    """Schema for updating a document record."""
    doc_type: Optional[str] = None
    page_count: Optional[int] = None
    chunk_count: Optional[int] = None
    status: Optional[str] = None
    error_message: Optional[str] = None
