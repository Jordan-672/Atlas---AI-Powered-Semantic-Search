import os
from typing import List, Dict, Any
from vector_store import search_documents
from graph import get_graph


def search(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Performs vector search augmented with graph-based context enrichment.

    Primary results are retrieved by cosine similarity. For each unique source
    file, up to three graph neighbors (files that import or are imported by
    the source) are attached as a 'related_files' metadata field.

    Args:
        query: Natural language search string.
        top_k: Number of primary results to retrieve from the vector store.

    Returns:
        List of result dicts, deduplicated by source file, with an optional
        'related_files' key listing graph-adjacent filenames.
    """
    results = search_documents(query, top_k=top_k)
    if not results:
        return []

    graph = get_graph()
    enriched = []
    seen_sources = set()

    for result in results:
        source = result["source"]
        if source not in seen_sources:
            seen_sources.add(source)
            if graph.has_node(source):
                neighbors = list(graph.neighbors(source))
                result["related_files"] = [os.path.basename(n) for n in neighbors[:3]]
        enriched.append(result)

    return enriched
