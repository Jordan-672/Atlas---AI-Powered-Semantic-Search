from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np

MODEL_NAME = "all-MiniLM-L6-v2"

# Lazily initialized to avoid loading ~80MB of model weights at import time.
_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    """Returns the singleton SentenceTransformer model, loading it on first call.

    Returns:
        The loaded SentenceTransformer instance.
    """
    global _model
    if _model is None:
        print(f"Loading embedding model: {MODEL_NAME}...")
        _model = SentenceTransformer(MODEL_NAME)
        print("Model loaded.")
    return _model


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Encodes a list of strings into 384-dimensional embedding vectors.

    Args:
        texts: List of strings to embed.

    Returns:
        List of float vectors, one per input string. Shape: [len(texts), 384].
    """
    model = get_model()
    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        show_progress_bar=True,
        batch_size=32,
    )
    return embeddings.tolist()


def embed_query(query: str) -> List[float]:
    """Encodes a single query string into a 384-dimensional embedding vector.

    Args:
        query: The query string to embed.

    Returns:
        A list of 384 floats representing the query embedding.
    """
    model = get_model()
    return model.encode(query, convert_to_numpy=True).tolist()
