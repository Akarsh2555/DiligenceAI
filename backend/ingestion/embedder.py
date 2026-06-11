"""
Embedding model wrapper — abstracts the choice of embedding provider.
Currently uses Google text-embedding-004.
"""

from langchain_core.embeddings import Embeddings
from langchain_huggingface import HuggingFaceEmbeddings

def get_embedding_model() -> Embeddings:
    """
    Factory for the embedding model.
    Uses local HuggingFace embeddings (all-MiniLM-L6-v2) to avoid API rate limits.
    """
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
