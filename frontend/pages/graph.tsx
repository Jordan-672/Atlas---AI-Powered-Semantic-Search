import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import axios from "axios";
import dynamic from "next/dynamic";

// GraphView uses D3, which requires browser APIs unavailable during SSR.
const GraphView = dynamic(() => import("@/components/GraphView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-atlas-muted font-mono text-sm">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Initializing graph engine...
      </div>
    </div>
  ),
});

interface GraphNode {
  id: string;
  label: string;
  type: string;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/graph`);
      setGraphData(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || "Failed to load graph data.");
      } else {
        setError("Unexpected error loading graph.");
      }
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph(true);
  }, []);

  return (
    <>
      <Head>
        <title>Atlas — Knowledge Graph</title>
      </Head>

      <div className="h-screen bg-atlas-bg text-atlas-text flex flex-col">
        <nav className="border-b border-atlas-border/50 bg-atlas-bg/80 backdrop-blur-sm flex-shrink-0">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-atlas-accent/20 border border-atlas-accent/40 flex items-center justify-center">
                <span className="text-atlas-accent text-sm font-bold font-mono">A</span>
              </div>
              <span className="font-display font-semibold text-lg tracking-tight">Atlas</span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-atlas-muted hover:text-atlas-text text-sm font-mono transition-colors duration-200"
              >
                Search
              </Link>
              <span className="text-atlas-accent text-sm font-mono border-b border-atlas-accent pb-0.5">
                Graph
              </span>
            </div>
          </div>
        </nav>

        <div className="flex-shrink-0 px-6 py-3 border-b border-atlas-border/30 bg-atlas-surface/50 flex items-center justify-between">
          <div className="flex items-center gap-6 text-xs font-mono text-atlas-muted">
            <span>
              <span className="text-atlas-accent font-medium">{graphData.nodes.length}</span> nodes
            </span>
            <span>
              <span className="text-atlas-accent font-medium">{graphData.edges.length}</span> edges
            </span>
            <span className="text-atlas-success">● live</span>
          </div>
          <button
            onClick={() => fetchGraph()}
            className="text-xs font-mono text-atlas-muted hover:text-atlas-accent transition-colors duration-200"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-atlas-muted font-mono text-sm flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading knowledge graph...
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="text-red-400 font-mono text-sm mb-2">{error}</div>
                <button
                  onClick={() => fetchGraph()}
                  className="text-xs font-mono text-atlas-muted hover:text-atlas-accent transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && graphData.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center text-atlas-muted">
                <div className="text-4xl mb-4">🕸️</div>
                <p className="font-mono text-sm">No graph data yet.</p>
                <p className="font-mono text-xs mt-2 opacity-60">Index a directory to build the knowledge graph.</p>
              </div>
            </div>
          )}

          {!isLoading && !error && graphData.nodes.length > 0 && (
            <GraphView nodes={graphData.nodes} edges={graphData.edges} />
          )}
        </div>
      </div>
    </>
  );
}
