from pydantic import BaseModel
from typing import List, Optional


class IngestRequest(BaseModel):
    """Request body for the /ingest endpoint."""
    directory: str


class SearchRequest(BaseModel):
    """Request body for the /search endpoint."""
    query: str
    top_k: Optional[int] = 5


class SearchResult(BaseModel):
    """A single search result returned to the frontend."""
    id: str
    content: str
    source: str
    score: float  # Cosine similarity in [0.0, 1.0].


class SearchResponse(BaseModel):
    """Response body for the /search endpoint."""
    results: List[SearchResult]
    query: str


class GraphNode(BaseModel):
    """A node in the knowledge graph."""
    id: str
    label: str
    type: str


class GraphEdge(BaseModel):
    """A directed edge in the knowledge graph."""
    source: str
    target: str
    label: str


class GraphResponse(BaseModel):
    """Response body for the /graph endpoint."""
    nodes: List[GraphNode]
    edges: List[GraphEdge]
