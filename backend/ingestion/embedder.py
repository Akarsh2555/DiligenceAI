"""
Embedding model wrapper — abstracts the choice of embedding provider.
Currently uses Google text-embedding-004.
"""

from langchain_core.embeddings import Embeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import os

def get_embedding_model() -> Embeddings:
    """
    Factory for the embedding model.
    Uses Google text-embedding-004.
    """
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-2", 
        google_api_key=api_key
    )
