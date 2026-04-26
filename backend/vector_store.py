import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
from embeddings import embed_texts, embed_query

COLLECTION_NAME = "atlas_documents"

_client: Optional[chromadb.ClientAPI] = None
_collection = None


def get_client() -> chromadb.ClientAPI:
    """Returns the singleton ChromaDB client, persisting data to ./chroma_db/.

    Returns:
        The ChromaDB PersistentClient instance.
    """
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path="./chroma_db")
    return _client


def get_collection():
    """Returns the Atlas document collection, creating it if it does not exist.

    Configures HNSW indexing with cosine similarity space.

    Returns:
        The ChromaDB collection instance.
    """
    global _collection
    if _collection is None:
        client = get_client()
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
    return _collection


def add_documents(documents: List[Dict[str, Any]]) -> None:
    """Embeds and stores a list of document chunks in ChromaDB.

    Args:
        documents: List of dicts with keys: id, content, source, metadata.
    """
    collection = get_collection()

    ids = [doc["id"] for doc in documents]
    texts = [doc["content"] for doc in documents]
    metadatas = [{"source": doc["source"], **doc.get("metadata", {})} for doc in documents]

    print(f"Embedding {len(texts)} chunks...")
    embeddings = embed_texts(texts)

    collection.add(
        ids=ids,
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas,
    )
    print(f"Stored {len(ids)} chunks in ChromaDB.")


def search_documents(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Searches the vector store for chunks semantically similar to a query.

    Args:
        query: Natural language search query.
        top_k: Maximum number of results to return.

    Returns:
        List of result dicts with keys: id, content, source, score.
        score is a cosine similarity value in [0.0, 1.0].
    """
    collection = get_collection()
    query_vector = embed_query(query)

    results = collection.query(
        query_embeddings=[query_vector],
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas", "distances"]
    )

    ids = results["ids"][0]
    documents = results["documents"][0]
    metadatas = results["metadatas"][0]
    distances = results["distances"][0]

    output = []
    for i in range(len(ids)):
        # ChromaDB cosine space returns distance in [0, 2]; convert to similarity in [0, 1].
        score = 1.0 - distances[i]
        output.append({
            "id": ids[i],
            "content": documents[i],
            "source": metadatas[i].get("source", "unknown"),
            "score": round(score, 4),
        })

    return output


def get_all_documents() -> List[Dict[str, Any]]:
    """Retrieves all stored document chunks from ChromaDB.

    Used on server startup to rebuild the in-memory knowledge graph from
    persisted vector store data.

    Returns:
        List of chunk records with keys: id, content, source, metadata.
        Returns an empty list if the collection is empty.
    """
    collection = get_collection()
    if collection.count() == 0:
        return []

    result = collection.get(include=["documents", "metadatas"])
    return [
        {
            "id": doc_id,
            "content": content,
            "source": metadata.get("source", ""),
            "metadata": metadata,
        }
        for doc_id, content, metadata in zip(
            result["ids"], result["documents"], result["metadatas"]
        )
    ]


def clear_collection() -> None:
    """Deletes and recreates the collection, wiping all stored data."""
    global _collection
    client = get_client()
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    _collection = None
