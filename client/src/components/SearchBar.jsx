import { useState, useEffect, useCallback } from 'react';

export default function SearchBar({ onSearch, placeholder = 'Search projects...', value = '' }) {
  const [query, setQuery] = useState(value);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-400">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
      </div>
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        className="form-input pl-10 pr-4"
        aria-label="Search projects"
      />
      {query && (
        <button
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          onClick={() => { setQuery(''); onSearch(''); }}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
