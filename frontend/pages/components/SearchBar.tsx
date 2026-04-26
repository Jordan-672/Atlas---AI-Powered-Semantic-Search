import React, { useState, KeyboardEvent } from "react";
import clsx from "clsx";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading = false,
  placeholder = "Search your codebase...",
}) => {
  const [query, setQuery] = useState<string>("");

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="relative flex items-center w-full max-w-3xl mx-auto">
      <div className="absolute inset-0 bg-atlas-accent/10 rounded-xl blur-xl pointer-events-none" />

      <div className="absolute left-4 z-10 text-atlas-muted">
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className={clsx(
          "w-full pl-12 pr-32 py-4 text-base",
          "bg-atlas-surface border border-atlas-border",
          "rounded-xl text-atlas-text placeholder-atlas-muted",
          "focus:outline-none focus:border-atlas-accent focus:ring-1 focus:ring-atlas-accent",
          "transition-all duration-200",
          "font-mono text-sm",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      />

      <button
        onClick={handleSearch}
        disabled={isLoading || !query.trim()}
        className={clsx(
          "absolute right-2 px-4 py-2",
          "bg-atlas-accent text-white rounded-lg",
          "font-mono text-sm font-medium",
          "transition-all duration-200",
          "hover:bg-atlas-accent-glow hover:shadow-lg hover:shadow-atlas-accent/25",
          "disabled:opacity-40 disabled:cursor-not-allowed",
        )}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Searching...
          </span>
        ) : (
          "Search"
        )}
      </button>
    </div>
  );
};

export default SearchBar;
