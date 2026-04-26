import re
import os
import networkx as nx
from typing import List, Dict, Any

_graph: nx.DiGraph | None = None


def get_graph() -> nx.DiGraph:
    """Returns the singleton directed knowledge graph, creating it if absent.

    Returns:
        The global nx.DiGraph instance.
    """
    global _graph
    if _graph is None:
        _graph = nx.DiGraph()
    return _graph


def reset_graph() -> None:
    """Replaces the current graph with an empty directed graph."""
    global _graph
    _graph = nx.DiGraph()


def _extract_imports(content: str, filepath: str) -> List[str]:
    """Extracts imported module names from Python or JS/TS source content.

    Uses heuristic regex patterns. Does not resolve transitive imports or
    handle dynamic import expressions.

    Args:
        content: Source file text.
        filepath: Path to the source file, used to determine language.

    Returns:
        List of imported module or path strings.
    """
    imports = []
    ext = os.path.splitext(filepath)[1]

    if ext == ".py":
        pattern = r"^(?:from\s+([\w.]+)|import\s+([\w.]+))"
        for line in content.split("\n"):
            match = re.match(pattern, line.strip())
            if match:
                module = match.group(1) or match.group(2)
                if module:
                    imports.append(module)

    elif ext in {".ts", ".tsx", ".js", ".jsx"}:
        pattern = r"from\s+['\"]([^'\"]+)['\"]"
        imports.extend(re.findall(pattern, content))

    return imports


def build_graph_from_documents(documents: List[Dict[str, Any]]) -> None:
    """Builds the knowledge graph from ingested document chunks.

    Creates one node per unique source file, then adds directed 'imports'
    edges resolved by heuristic name matching against existing node IDs.

    Args:
        documents: List of chunk records as returned by ingest_directory.
    """
    print(f"Building graph from {len(documents)} documents.")
    reset_graph()
    graph = get_graph()

    seen_files: set = set()
    for doc in documents:
        source = doc["source"]
        if source not in seen_files:
            seen_files.add(source)
            print(f"Adding node for source: {source}")
            graph.add_node(
                source,
                label=os.path.basename(source),
                type="file",
            )

    # Build a map of possible import targets for faster matching
    node_ids = list(graph.nodes())
    node_stems = {os.path.basename(n).replace(os.path.splitext(n)[1], ""): n for n in node_ids}
    
    for doc in documents:
        source = doc["source"]
        content = doc["content"]
        for imp in _extract_imports(content, source):
            imp_stem = os.path.splitext(os.path.basename(imp))[0]
            if imp_stem in node_stems and node_stems[imp_stem] != source:
                graph.add_edge(source, node_stems[imp_stem], label="imports")
                continue

            # Fallback: substring match on full node paths
            for node_id in node_ids:
                if (imp in node_id or node_id in imp) and node_id != source:
                    graph.add_edge(source, node_id, label="imports")
                    break


def get_graph_data() -> Dict[str, Any]:
    """Serializes the knowledge graph into JSON-serializable nodes and edges.

    Returns:
        Dict with 'nodes' and 'edges' lists suitable for D3 visualization.
    """
    graph = get_graph()
    print(f"Graph has {len(graph.nodes)} nodes and {len(graph.edges)} edges.")

    nodes = [
        {"id": node_id, "label": attrs.get("label", node_id), "type": attrs.get("type", "file")}
        for node_id, attrs in graph.nodes(data=True)
    ]

    edges = [
        {"source": source, "target": target, "label": attrs.get("label", "related")}
        for source, target, attrs in graph.edges(data=True)
    ]

    return {"nodes": nodes, "edges": edges}
