"""
DiligenceAI — Supabase client setup.
Provides both anon-key client (for auth-aware operations)
and service-role client (for admin/backend operations).
"""

from functools import lru_cache
from supabase import create_client, Client

from backend.config import get_settings


@lru_cache()
def get_supabase_client() -> Client:
    """
    Service-role Supabase client for backend operations.
    Bypasses RLS — use only in trusted server-side code.
    """
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@lru_cache()
def get_supabase_anon_client() -> Client:
    """
    Anon-key Supabase client for auth operations.
    Respects RLS policies.
    """
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)
