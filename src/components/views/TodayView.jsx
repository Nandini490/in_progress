import React from 'react';
import { getDisplayTitle } from '../../models/validation';
import { TodayIcon, PlusIcon, TagIcon } from '../shared/Icons';
import './TodayView.css';

export function TodayView({
  entries = [],
  onNewEntry,
  onEditEntry,
  onSelectEntry,
}) {
  const localToday = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find((e) => e.date === localToday);

  const formattedToday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="today-view-container" aria-label="Today's Journal Overview">
      {/* Header */}
      <header className="today-header">
        <span className="today-badge">
          <TodayIcon size={14} /> Today
        </span>
        <h2 className="today-heading">{formattedToday}</h2>
        <p className="today-subtext">
          {todayEntry
            ? "You've documented today. Take time to reflect or make updates."
            : 'Capture your thoughts, lessons, and breakthroughs as they happen.'}
        </p>
      </header>

      {/* Today's Status Card */}
      <section className="today-status-card" aria-label="Today's Entry Status">
        {todayEntry ? (
          <div className="today-entry-summary">
            <div className="summary-header-row">
              <span className="summary-tag">Today's Entry</span>
              <button
                className="btn-summary-edit"
                onClick={() => onEditEntry(todayEntry)}
              >
                Edit Entry
              </button>
            </div>

            <h3 className="summary-title">{getDisplayTitle(todayEntry)}</h3>

            {/* Quick narrative snippet */}
            {todayEntry.didToday && (
              <div className="summary-section">
                <span className="summary-label">What happened:</span>
                <p className="summary-text">{todayEntry.didToday}</p>
              </div>
            )}

            {todayEntry.learned && (
              <div className="summary-section">
                <span className="summary-label">Learned:</span>
                <p className="summary-text">{todayEntry.learned}</p>
              </div>
            )}

            {todayEntry.built && (
              <div className="summary-section">
                <span className="summary-label">Built:</span>
                <p className="summary-text">{todayEntry.built}</p>
              </div>
            )}

            {/* Tags preview */}
            {todayEntry.tags && todayEntry.tags.length > 0 && (
              <div className="summary-tags-row">
                {todayEntry.tags.map((tag) => (
                  <span key={tag} className="summary-tag-pill">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="today-empty-state">
            <p className="today-empty-title">Nothing documented yet.</p>
            <p className="today-empty-desc">
              Documenting continuously gives you a personal record of how you evolve over time.
            </p>
            <button className="btn-today-start" onClick={onNewEntry}>
              <PlusIcon size={16} />
              <span>Start today's entry</span>
            </button>
          </div>
        )}
      </section>

      {/* Recent Previous Entries Section */}
      {entries.length > 0 && (
        <section className="recent-entries-section" aria-label="Recent entries">
          <h3 className="recent-entries-title">Recent Memories & Reflections</h3>
          <div className="recent-entries-grid">
            {entries.slice(0, 3).map((entry) => (
              <article
                key={entry.id}
                className="recent-entry-card"
                onClick={() => onEditEntry(entry)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onEditEntry(entry)}
              >
                <div className="recent-card-meta">
                  <span className="recent-card-date">{entry.date}</span>
                  {entry.tags && entry.tags.length > 0 && (
                    <span className="recent-card-tag">#{entry.tags[0]}</span>
                  )}
                </div>
                <h4 className="recent-card-title">{getDisplayTitle(entry)}</h4>
                <p className="recent-card-snippet">
                  {entry.didToday ||
                    entry.learned ||
                    entry.built ||
                    entry.challenges ||
                    'View documented notes...'}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
