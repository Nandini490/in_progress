import React, { useMemo } from 'react';
import { getDisplayTitle } from '../../models/validation.js';
import {
  TimelineIcon,
  PlusIcon,
  ImageIcon,
  LinkIcon,
} from '../shared/Icons.jsx';
import './TimelineView.css';

export function TimelineView({
  entries = [],
  onSelectEntry,
  onNewEntry,
}) {
  // Sort chronologically (newest first)
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [entries]);

  // Group entries by Month & Year (e.g., "September 2026")
  const groupedEntries = useMemo(() => {
    const groups = {};

    sortedEntries.forEach((entry) => {
      try {
        const [year, month] = entry.date.split('-');
        const dateObj = new Date(year, parseInt(month, 10) - 1, 1);
        const groupKey = new Intl.DateTimeFormat('en-US', {
          month: 'long',
          year: 'numeric',
        }).format(dateObj);

        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(entry);
      } catch {
        if (!groups['Archives']) groups['Archives'] = [];
        groups['Archives'].push(entry);
      }
    });

    return Object.entries(groups);
  }, [sortedEntries]);

  // Helper to extract first non-empty text preview
  const getExcerpt = (entry) => {
    const candidates = [
      entry.didToday,
      entry.learned,
      entry.built,
      entry.challenges,
      entry.importantMoments,
      entry.discoveries,
      entry.dsa,
      entry.projects,
    ];

    for (const text of candidates) {
      if (text && typeof text === 'string' && text.trim().length > 0) {
        return text.trim();
      }
    }
    return 'Documented personal reflections for this day.';
  };

  // Helper to format date day and day-of-week
  const formatCardDate = (dateStr) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const dateObj = new Date(year, parseInt(month, 10) - 1, day);
      return {
        monthDay: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(dateObj),
        weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(dateObj),
      };
    } catch {
      return { monthDay: dateStr, weekday: '' };
    }
  };

  if (!entries || entries.length === 0) {
    return (
      <section className="timeline-container" aria-label="Journey Timeline">
        <header className="timeline-header">
          <span className="timeline-badge">
            <TimelineIcon size={14} /> The Timeline
          </span>
          <h2 className="timeline-title">The Journey</h2>
          <p className="timeline-subtitle">
            A continuous, chronological story of what you are becoming.
          </p>
        </header>

        <div className="timeline-empty-card">
          <p className="timeline-empty-title">Your timeline begins with your first entry.</p>
          <p className="timeline-empty-desc">
            As you document your daily thoughts, struggles, lessons, and breakthroughs, this page
            becomes your personal life archive.
          </p>
          <button className="btn-timeline-start" onClick={onNewEntry}>
            <PlusIcon size={16} />
            <span>Document your first day</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="timeline-container" aria-label="Journey Timeline">
      <header className="timeline-header">
        <div className="timeline-header-row">
          <div>
            <span className="timeline-badge">
              <TimelineIcon size={14} /> The Timeline
            </span>
            <h2 className="timeline-title">The Journey</h2>
            <p className="timeline-subtitle">
              {entries.length} {entries.length === 1 ? 'reflection' : 'reflections'} documented across your journey.
            </p>
          </div>
          <button className="btn-timeline-new" onClick={onNewEntry}>
            <PlusIcon size={15} />
            <span>New Entry</span>
          </button>
        </div>
      </header>

      {/* Chronological Month Groups */}
      <div className="timeline-flow">
        {groupedEntries.map(([monthYear, monthEntries]) => (
          <div key={monthYear} className="timeline-month-group">
            {/* Month Header Banner */}
            <div className="timeline-month-marker">
              <h3 className="timeline-month-label">{monthYear}</h3>
              <span className="timeline-month-count">
                {monthEntries.length} {monthEntries.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {/* Spine & Cards */}
            <div className="timeline-spine">
              {monthEntries.map((entry) => {
                const dateInfo = formatCardDate(entry.date);
                const hasImages = entry.images && entry.images.length > 0;
                const hasLinks = entry.links && entry.links.length > 0;

                return (
                  <article
                    key={entry.id}
                    className="timeline-entry-node"
                    onClick={() => onSelectEntry(entry)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onSelectEntry(entry)}
                  >
                    {/* Left Date Anchor */}
                    <div className="timeline-date-col">
                      <span className="timeline-node-day">{dateInfo.monthDay}</span>
                      <span className="timeline-node-weekday">{dateInfo.weekday}</span>
                    </div>

                    {/* Node Dot on Spine */}
                    <div className="timeline-node-dot" />

                    {/* Entry Card */}
                    <div className="timeline-card">
                      <div className="timeline-card-header">
                        <h4 className="timeline-card-title">{getDisplayTitle(entry)}</h4>
                        <div className="timeline-card-badges">
                          {hasImages && (
                            <span className="attachment-badge" title={`${entry.images.length} attached screenshots`}>
                              <ImageIcon size={13} />
                              <span>{entry.images.length}</span>
                            </span>
                          )}
                          {hasLinks && (
                            <span className="attachment-badge" title={`${entry.links.length} attached links`}>
                              <LinkIcon size={13} />
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="timeline-card-excerpt">{getExcerpt(entry)}</p>

                      {/* Tags */}
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="timeline-card-tags">
                          {entry.tags.map((tag) => (
                            <span key={tag} className="timeline-tag-pill">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
