import React from "react";
import clsx from "clsx";

interface SearchResult {
  id: string;
  content: string;
  source: string;
  score: number;
}

interface ResultCardProps {
  result: SearchResult;
  /** Position in the results list, used to stagger entrance animations. */
  index: number;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, index }) => {
  const scorePercent = Math.round(result.score * 100);

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return "text-atlas-success";
    if (score >= 0.5) return "text-atlas-warning";
    return "text-atlas-muted";
  };

  const filename = result.source.split("/").pop() || result.source;
  const displayPath = result.source.length > 60
    ? "..." + result.source.slice(-57)
    : result.source;

  return (
    <div
      className={clsx(
        "group relative p-5 rounded-xl",
        "bg-atlas-surface border border-atlas-border",
        "hover:border-atlas-accent/50 transition-all duration-300",
        "animate-slide-up",
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="absolute inset-0 rounded-xl bg-atlas-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-atlas-accent/10 border border-atlas-accent/20 text-atlas-accent text-xs font-mono">
              📄 {filename}
            </span>
          </div>
          <p className="text-xs text-atlas-muted font-mono truncate" title={result.source}>
            {displayPath}
          </p>
        </div>

        <div className="flex-shrink-0 text-right">
          <div className={clsx("text-lg font-bold font-mono", getScoreColor(result.score))}>
            {scorePercent}%
          </div>
          <div className="text-xs text-atlas-muted">match</div>
        </div>
      </div>

      <div className="w-full h-0.5 bg-atlas-border rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-atlas-accent rounded-full transition-all duration-700"
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      <pre className={clsx(
        "text-sm text-atlas-text/90 font-mono",
        "whitespace-pre-wrap break-words",
        "leading-relaxed",
        "overflow-hidden",
        "max-h-40",
      )}>
        {result.content.trim().slice(0, 400)}
        {result.content.length > 400 && (
          <span className="text-atlas-muted">...</span>
        )}
      </pre>

      <div className="mt-3 pt-3 border-t border-atlas-border/50">
        <span className="text-xs text-atlas-muted/60 font-mono">
          ID: {result.id.split("::").pop()}
        </span>
      </div>
    </div>
  );
};

export default ResultCard;