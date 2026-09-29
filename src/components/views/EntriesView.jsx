import React, { useMemo } from 'react';
import { getDisplayTitle } from '../../models/validation.js';
import {
  EntriesIcon,
  PlusIcon,
  ImageIcon,
  LinkIcon,
} from '../shared/Icons.jsx';
import './EntriesView.css';

export function EntriesView({
  entries = [],
  onSelectEntry,
  onNewEntry,
}) {
  // Sort chronologically (newest first)
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [entries]);

  const formatDate = (dateStr) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const dateObj = new Date(year, parseInt(month, 10) - 1, day);
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(dateObj);
    } catch {
      return dateStr;
    }
  };

  const getExcerpt = (entry) => {
    const candidates = [
      entry.didToday,
      entry.learned,
      entry.built,
      entry.challenges,
      entry.importantMoments,
    ];
    for (const text of candidates) {
      if (text && typeof text === 'string' && text.trim().length > 0) {
        const trimmed = text.trim();
        return trimmed.length > 140 ? trimmed.slice(0, 140) + '...' : trimmed;
      }
    }
    return 'View entry details...';
  };

  if (!entries || entries.length === 0) {
    return (
      <section className="entries-container" aria-label="Entry Archive">
        <header className="entries-header">
          <span className="entries-badge">
            <EntriesIcon size={14} /> All Entries
          </span>
          <h2 className="entries-title">Entry Archive</h2>
          <p className="entries-subtitle">
            Your complete collection of documented reflections.
          </p>
        </header>

        <div className="entries-empty-card">
          <p className="entries-empty-title">No entries in your archive yet.</p>
          <p className="entries-empty-desc">
            Start documenting your journey to build your personal archive.
          </p>
          <button className="btn-entries-start" onClick={onNewEntry}>
            <PlusIcon size={16} />
            <span>Create your first entry</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="entries-container" aria-label="Entry Archive">
      <header className="entries-header">
        <div className="entries-header-row">
          <div>
            <span className="entries-badge">
              <EntriesIcon size={14} /> All Entries
            </span>
            <h2 className="entries-title">Entry Archive</h2>
            <p className="entries-subtitle">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} in
              your personal archive.
            </p>
          </div>
          <button className="btn-entries-new" onClick={onNewEntry}>
            <PlusIcon size={15} />
            <span>New Entry</span>
          </button>
        </div>
      </header>

      <div className="entries-list">
        {sortedEntries.map((entry) => {
          const hasImages = entry.images && entry.images.length > 0;
          const hasLinks = entry.links && entry.links.length > 0;

          return (
            <article
              key={entry.id}
              className="entry-list-card"
              onClick={() => onSelectEntry(entry)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectEntry(entry)}
            >
              <div className="entry-list-meta">
                <time className="entry-list-date">{formatDate(entry.date)}</time>
                <div className="entry-list-badges">
                  {hasImages && (
                    <span
                      className="entry-list-indicator"
                      title={`${entry.images.length} screenshot(s)`}
                    >
                      <ImageIcon size={13} />{' '}
                      <span>{entry.images.length}</span>
                    </span>
                  )}
                  {hasLinks && (
                    <span
                      className="entry-list-indicator"
                      title={`${entry.links.length} link(s)`}
                    >
                      <LinkIcon size={13} />
                    </span>
                  )}
                </div>
              </div>

              <h3 className="entry-list-title">{getDisplayTitle(entry)}</h3>
              <p className="entry-list-excerpt">{getExcerpt(entry)}</p>

              {entry.tags && entry.tags.length > 0 && (
                <div className="entry-list-tags">
                  {entry.tags.map((tag) => (
                    <span key={`${entry.id}-${tag}`} className="entry-list-tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
