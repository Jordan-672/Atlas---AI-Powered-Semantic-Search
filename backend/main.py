import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from models import (
    IngestRequest,
    SearchRequest,
    SearchResponse,
    SearchResult,
    GraphResponse,
    GraphNode,
    GraphEdge,
)
from ingestion import ingest_directory
from vector_store import add_documents, clear_collection, get_all_documents
from graph import build_graph_from_documents, get_graph_data, reset_graph
from search import search


UPLOAD_DIR = "./uploads"


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    # Rebuild the in-memory knowledge graph from ChromaDB on startup so that
    # server restarts do not require re-ingestion.
    try:
        documents = get_all_documents()
        print(f"Retrieved {len(documents)} documents from ChromaDB.")
        if documents:
            print(f"Sample sources: {[d['source'] for d in documents[:3]]}")
            build_graph_from_documents(documents)
            unique_files = len(set(d["source"] for d in documents))
            print(f"Rebuilt knowledge graph from {unique_files} persisted files.")
    except Exception as e:
        print(f"Warning: Could not rebuild graph on startup: {e}")
    yield


app = FastAPI(
    title="Atlas API",
    description="AI-Powered Local Knowledge Engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Atlas API is running", "version": "1.0.0"}


@app.post("/ingest")
async def ingest(request: IngestRequest):
    """Ingests a local directory by reading files, embedding chunks, storing
    in ChromaDB, and constructing the knowledge graph.

    Args:
        request: Contains the directory path to ingest.

    Returns:
        Summary dict with files_processed and chunks_stored counts.

    Raises:
        HTTPException: 400 if the directory is not found or contains no
            supported files.
        HTTPException: 500 on unexpected ingestion errors.
    """
    directory = request.directory

    if not os.path.isdir(directory):
        raise HTTPException(status_code=400, detail=f"Directory not found: {directory}")

    try:
        clear_collection()
        reset_graph()

        documents = ingest_directory(directory)

        if not documents:
            raise HTTPException(
                status_code=400,
                detail="No supported files found in the directory."
            )

        add_documents(documents)
        build_graph_from_documents(documents)

        return {
            "message": "Ingestion complete",
            "files_processed": len(set(doc["source"] for doc in documents)),
            "chunks_stored": len(documents),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search", response_model=SearchResponse)
async def search_endpoint(request: SearchRequest):
    """Performs semantic search over ingested documents.

    Args:
        request: Contains the query string and top_k result count.

    Returns:
        Ranked SearchResponse with results and the original query echoed back.

    Raises:
        HTTPException: 500 on unexpected search errors.
    """
    try:
        raw_results = search(request.query, top_k=request.top_k)

        results = [
            SearchResult(
                id=r["id"],
                content=r["content"],
                source=r["source"],
                score=r["score"],
            )
            for r in raw_results
        ]

        return SearchResponse(results=results, query=request.query)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/graph", response_model=GraphResponse)
async def get_graph_endpoint():
    """Returns the serialized knowledge graph for D3 visualization.

    Returns:
        GraphResponse with nodes and edges.

    Raises:
        HTTPException: 500 on unexpected errors.
    """
    try:
        data = get_graph_data()
        nodes = [GraphNode(**n) for n in data["nodes"]]
        edges = [GraphEdge(**e) for e in data["edges"]]
        return GraphResponse(nodes=nodes, edges=edges)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/reset")
async def reset():
    """Resets the Atlas index by clearing the vector store and knowledge graph.

    Raises:
        HTTPException: 500 on unexpected errors.
    """
    try:
        clear_collection()
        reset_graph()
        return {"message": "Atlas index reset successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
