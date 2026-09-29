import React, { useState, useEffect, useMemo } from 'react';
import { getDisplayTitle } from '../../models/validation.js';
import {
  SearchIcon,
  XIcon,
  TagIcon,
  ImageIcon,
} from '../shared/Icons.jsx';
import './SearchView.css';

export function SearchView({
  entries = [],
  onSearch,
  onSelectEntry,
}) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(entries);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');

  // Collect all unique tags across all entries
  const allTags = useMemo(() => {
    const tagsMap = new Map();
    entries.forEach((entry) => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach((tag) => {
          const lower = tag.toLowerCase();
          if (!tagsMap.has(lower)) {
            tagsMap.set(lower, { name: tag, count: 1 });
          } else {
            tagsMap.get(lower).count++;
          }
        });
      }
    });
    return Array.from(tagsMap.values()).sort((a, b) => b.count - a.count);
  }, [entries]);

  // Execute search via repository abstraction whenever query or selectedTag changes
  useEffect(() => {
    let isCurrent = true;

    async function doSearch() {
      setIsSearching(true);
      try {
        const searchQuery = selectedTag ? selectedTag : query;
        if (onSearch) {
          const results = await onSearch(searchQuery);
          if (isCurrent) {
            setSearchResults(results);
          }
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (isCurrent) setIsSearching(false);
      }
    }

    const timer = setTimeout(doSearch, 120); // Responsive debounce
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [query, selectedTag, onSearch]);

  const handleQueryChange = (val) => {
    setSelectedTag('');
    setQuery(val);
  };

  const handleTagClick = (tagName) => {
    if (selectedTag.toLowerCase() === tagName.toLowerCase()) {
      setSelectedTag('');
      setQuery('');
    } else {
      setSelectedTag(tagName);
      setQuery(tagName);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSelectedTag('');
  };

  // Find snippet in entry where query matches
  const getMatchSnippet = (entry, term) => {
    const q = term ? term.toLowerCase() : '';
    const candidates = [
      { label: 'Learned', text: entry.learned },
      { label: 'Built', text: entry.built },
      { label: 'What happened', text: entry.didToday },
      { label: 'Challenged', text: entry.challenges },
      { label: 'Solution', text: entry.solutions },
      { label: 'DSA', text: entry.dsa },
      { label: 'Project', text: entry.projects },
      { label: 'Moments', text: entry.importantMoments },
    ];

    if (q) {
      for (const item of candidates) {
        if (item.text && item.text.toLowerCase().includes(q)) {
          return `${item.label}: "${item.text.slice(0, 160)}${item.text.length > 160 ? '...' : ''}"`;
        }
      }
    }

    // Default to didToday or learned
    return entry.didToday || entry.learned || 'Click to view full reflection notes.';
  };

  const activeQuery = selectedTag || query.trim();

  return (
    <section className="search-view-container" aria-label="Archive Search">
      {/* Header */}
      <header className="search-header">
        <span className="search-badge">
          <SearchIcon size={14} /> Search
        </span>
        <h2 className="search-title">Search Archive</h2>
        <p className="search-subtitle">
          Find any past reflection, technical lesson, project note, or problem you've solved.
        </p>
      </header>

      {/* Search Input Bar */}
      <div className="search-input-wrapper">
        <SearchIcon size={18} className="search-input-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search by topic, keyword (e.g. 'RAG', 'Binary Search', 'React'), or date..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          autoFocus
        />
        {query && (
          <button className="btn-search-clear" onClick={handleClear} aria-label="Clear search">
            <XIcon size={16} />
          </button>
        )}
      </div>

      {/* Available Tags Quick Filter */}
      {allTags.length > 0 && (
        <div className="search-tags-filter">
          <span className="search-tags-label">Filter by tag:</span>
          <div className="search-tags-chips">
            {allTags.map((tag) => {
              const isActive = selectedTag.toLowerCase() === tag.name.toLowerCase();
              return (
                <button
                  key={tag.name}
                  className={`search-tag-chip ${isActive ? 'search-tag-chip-active' : ''}`}
                  onClick={() => handleTagClick(tag.name)}
                >
                  <span>#{tag.name}</span>
                  <span className="search-tag-chip-count">{tag.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Results Summary */}
      <div className="search-results-meta">
        {isSearching ? (
          <span className="search-loading-text">Searching archive...</span>
        ) : activeQuery ? (
          <span>
            {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} for "
            <strong>{activeQuery}</strong>"
          </span>
        ) : (
          <span>
            Showing all {searchResults.length} {searchResults.length === 1 ? 'entry' : 'entries'} in archive
          </span>
        )}
      </div>

      {/* Results List */}
      {searchResults.length > 0 ? (
        <div className="search-results-list">
          {searchResults.map((entry) => (
            <article
              key={entry.id}
              className="search-result-card"
              onClick={() => onSelectEntry(entry)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectEntry(entry)}
            >
              <div className="search-result-header">
                <time className="search-result-date">{entry.date}</time>
                <div className="search-result-tags">
                  {entry.tags &&
                    entry.tags.map((tag) => (
                      <span key={tag} className="search-result-tag-pill">
                        #{tag}
                      </span>
                    ))}
                  {entry.images && entry.images.length > 0 && (
                    <span className="search-media-indicator" title="Contains screenshot">
                      <ImageIcon size={12} />
                    </span>
                  )}
                </div>
              </div>

              <h3 className="search-result-title">{getDisplayTitle(entry)}</h3>
              <p className="search-result-snippet">{getMatchSnippet(entry, activeQuery)}</p>
            </article>
          ))}
        </div>
      ) : (
        /* Empty / No Results State */
        <div className="search-no-results">
          <p className="no-results-title">No entries match your search.</p>
          <p className="no-results-desc">
            Try searching for a different keyword, tag, or year/month (e.g. "2026-09").
          </p>
          {activeQuery && (
            <button className="btn-search-reset" onClick={handleClear}>
              Clear search filter
            </button>
          )}
        </div>
      )}
    </section>
  );
}
