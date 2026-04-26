import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import axios from "axios";
import SearchBar from "@/components/SearchBar";
import ResultCard from "@/components/ResultCard";

interface SearchResult {
  id: string;
  content: string;
  source: string;
  score: number;
}

interface IngestStatus {
  loading: boolean;
  message: string;
  error: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function HomePage() {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Tracks whether the user has submitted at least one search, used to
  // distinguish the "no results" state from the pre-search landing state.
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const [ingestDir, setIngestDir] = useState<string>("");
  const [ingestStatus, setIngestStatus] = useState<IngestStatus>({
    loading: false,
    message: "",
    error: null,
  });

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setIsSearching(true);
    setSearchError(null);
    setResults([]);
    setHasSearched(true);

    try {
      const response = await axios.post(`${API_URL}/search`, {
        query: searchQuery,
        top_k: 8,
      });
      setResults(response.data.results || []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setSearchError(err.response?.data?.detail || "Search failed. Is the backend running?");
      } else {
        setSearchError("An unexpected error occurred.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleIngest = async () => {
    if (!ingestDir.trim()) return;

    setIngestStatus({ loading: true, message: "Ingesting...", error: null });

    try {
      const response = await axios.post(`${API_URL}/ingest`, {
        directory: ingestDir.trim(),
      });
      setIngestStatus({
        loading: false,
        message: `✓ ${response.data.files_processed} files, ${response.data.chunks_stored} chunks indexed.`,
        error: null,
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setIngestStatus({
          loading: false,
          message: "",
          error: err.response?.data?.detail || "Ingestion failed.",
        });
      }
    }
  };

  return (
    <>
      <Head>
        <title>Atlas — AI Knowledge Engine</title>
        <meta name="description" content="Local AI-powered semantic search for your codebase" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-atlas-bg text-atlas-text">
        <nav className="border-b border-atlas-border/50 backdrop-blur-sm sticky top-0 z-50 bg-atlas-bg/80">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-atlas-accent/20 border border-atlas-accent/40 flex items-center justify-center">
                <span className="text-atlas-accent text-sm font-bold font-mono">A</span>
              </div>
              <span className="font-display font-semibold text-lg tracking-tight">Atlas</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-atlas-accent text-sm font-mono border-b border-atlas-accent pb-0.5">
                Search
              </span>
              <Link
                href="/graph"
                className="text-atlas-muted hover:text-atlas-text text-sm font-mono transition-colors duration-200"
              >
                Graph
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-atlas-accent/10 border border-atlas-accent/20 text-atlas-accent text-xs font-mono mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-atlas-accent animate-pulse-slow" />
              Local AI Engine · Offline · Private
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6">
              <span className="text-atlas-text">Know your</span>
              <br />
              <span className="text-atlas-accent" style={{ textShadow: "0 0 40px rgba(59,130,246,0.4)" }}>
                codebase
              </span>
            </h1>

            <p className="text-atlas-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
              Semantic search, AI understanding, and knowledge graph visualization —
              all running locally on your machine.
            </p>

            <SearchBar onSearch={handleSearch} isLoading={isSearching} />
          </div>

          <div className="mb-12 p-6 rounded-2xl bg-atlas-surface border border-atlas-border">
            <h2 className="text-sm font-mono text-atlas-muted uppercase tracking-widest mb-4">
              Index a Directory
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={ingestDir}
                onChange={(e) => setIngestDir(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleIngest()}
                placeholder="/path/to/your/project"
                className="flex-1 px-4 py-2.5 bg-atlas-bg border border-atlas-border rounded-lg text-sm font-mono text-atlas-text placeholder-atlas-muted focus:outline-none focus:border-atlas-accent transition-colors"
              />
              <button
                onClick={handleIngest}
                disabled={ingestStatus.loading || !ingestDir.trim()}
                className="px-5 py-2.5 bg-atlas-surface border border-atlas-border rounded-lg text-sm font-mono text-atlas-text hover:border-atlas-accent hover:text-atlas-accent transition-all duration-200 disabled:opacity-40"
              >
                {ingestStatus.loading ? "Indexing..." : "Index →"}
              </button>
            </div>

            {ingestStatus.message && (
              <p className="mt-3 text-sm font-mono text-atlas-success">{ingestStatus.message}</p>
            )}
            {ingestStatus.error && (
              <p className="mt-3 text-sm font-mono text-red-400">{ingestStatus.error}</p>
            )}
          </div>

          {searchError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono">
              {searchError}
            </div>
          )}

          {hasSearched && !isSearching && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-mono text-atlas-muted">
                  {results.length > 0
                    ? `${results.length} results for "${query}"`
                    : `No results for "${query}"`}
                </h2>
                {results.length > 0 && (
                  <span className="text-xs font-mono text-atlas-muted/60">
                    sorted by relevance
                  </span>
                )}
              </div>

              <div className="grid gap-4">
                {results.map((result, index) => (
                  <ResultCard key={result.id} result={result} index={index} />
                ))}
              </div>

              {results.length === 0 && (
                <div className="text-center py-16 text-atlas-muted">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="font-mono text-sm">No matching documents found.</p>
                  <p className="font-mono text-xs mt-2 opacity-60">Try indexing a directory first.</p>
                </div>
              )}
            </div>
          )}

          {!hasSearched && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: "⚡", title: "Semantic Search", desc: "Find code by meaning, not keywords" },
                { icon: "🧠", title: "AI Understanding", desc: "Get explanations of any module" },
                { icon: "🕸️", title: "Knowledge Graph", desc: "Visualize file relationships" },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-5 rounded-xl bg-atlas-surface border border-atlas-border hover:border-atlas-accent/30 transition-all duration-300"
                >
                  <div className="text-2xl mb-3">{feature.icon}</div>
                  <div className="font-mono text-sm font-medium text-atlas-text mb-1">{feature.title}</div>
                  <div className="text-xs text-atlas-muted">{feature.desc}</div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
