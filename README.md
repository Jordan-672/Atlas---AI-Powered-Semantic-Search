# Atlas — AI-Powered Local Knowledge Engine

> Semantic search + knowledge graph visualization for your codebase. Runs 100% locally.

## Features
- 🔍 Semantic search using SentenceTransformers embeddings
- 🕸️ Knowledge graph built from import relationships  
- ⚡ Fast vector search via ChromaDB
- 🎨 Beautiful dark UI built with Next.js + TailwindCSS
- 📊 Interactive D3.js force-directed graph

## Stack
**Backend**: Python · FastAPI · SentenceTransformers · ChromaDB · NetworkX  
**Frontend**: Next.js · TypeScript · TailwindCSS · D3.js

## Quick Start

### Backend
\`\`\`bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

Open http://localhost:3000

## Architecture
```
Files → Ingestion → Chunking → Embeddings → ChromaDB
                                           ↓
                              NetworkX Graph ← Import Analysis
                                           ↓
                              FastAPI (/search, /graph, /ingest)
                                           ↓
                              Next.js UI (Search + D3 Graph)
```
