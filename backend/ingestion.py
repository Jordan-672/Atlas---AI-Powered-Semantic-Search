import os
import re
from typing import List, Dict, Any

SUPPORTED_EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".jsx", ".md", ".txt", ".json", ".yaml", ".yml"}

# ~100 tokens per chunk; balances embedding quality and retrieval granularity.
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Splits a string into overlapping fixed-size character chunks.

    Args:
        text: The full text to split.
        chunk_size: Maximum characters per chunk.
        overlap: Characters shared between consecutive chunks to preserve
            cross-boundary context.

    Returns:
        List of non-empty text chunk strings.
    """
    chunks = []
    start = 0

    while start < len(text):
        chunk = text[start:start + chunk_size].strip()
        if chunk:
            chunks.append(chunk)
        start += chunk_size - overlap

    return chunks


def read_file(filepath: str) -> str:
    """Reads a file and returns its contents as a UTF-8 string.

    Non-decodable bytes are silently ignored to handle mixed-encoding files.

    Args:
        filepath: Absolute path to the file.

    Returns:
        File contents as a string, or an empty string on read failure.
    """
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception as e:
        print(f"Warning: Could not read {filepath}: {e}")
        return ""


def ingest_directory(directory: str) -> List[Dict[str, Any]]:
    """Recursively reads all supported files in a directory and returns chunks.

    Hidden directories (prefixed with '.') and node_modules are skipped.

    Args:
        directory: Root directory path to traverse.

    Returns:
        List of chunk records, each containing:
            id: Unique identifier formatted as '<filepath>::chunk_<index>'.
            content: The text chunk.
            source: The originating file path.
            metadata: Dict with chunk_index, extension, and filename.
    """
    documents = []

    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if not d.startswith(".") and d != "node_modules"]

        for filename in files:
            _, ext = os.path.splitext(filename)
            if ext not in SUPPORTED_EXTENSIONS:
                continue

            filepath = os.path.join(root, filename)
            content = read_file(filepath)
            if not content:
                continue

            for i, chunk in enumerate(chunk_text(content)):
                documents.append({
                    "id": f"{filepath}::chunk_{i}",
                    "content": chunk,
                    "source": filepath,
                    "metadata": {
                        "chunk_index": i,
                        "extension": ext,
                        "filename": filename,
                    }
                })

    return documents
