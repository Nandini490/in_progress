import React from 'react';
import {
  TodayIcon,
  TimelineIcon,
  EntriesIcon,
  SearchIcon,
  PlusIcon,
  SunIcon,
  MoonIcon,
  JournalLogoIcon,
} from '../shared/Icons';
import './Header.css';

export function Header({
  activeView,
  onNavigate,
  onNewEntry,
  theme,
  onToggleTheme,
}) {
  const navItems = [
    { id: 'today', label: 'Today', icon: TodayIcon },
    { id: 'timeline', label: 'Timeline', icon: TimelineIcon },
    { id: 'entries', label: 'Entries', icon: EntriesIcon },
    { id: 'search', label: 'Search', icon: SearchIcon },
  ];

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Brand & Subtitle */}
        <div className="brand-group" onClick={() => onNavigate('today')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onNavigate('today')}>
          <div className="brand-title-row">
            <span className="brand-icon">
              <JournalLogoIcon size={20} />
            </span>
            <h1 className="brand-name">In Progress</h1>
          </div>
          <p className="brand-subtitle">Documenting the journey while it happens.</p>
        </div>

        {/* Center Navigation */}
        <nav className="header-nav" aria-label="Main Navigation">
          <div className="nav-pill-group">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  className={`nav-tab ${isActive ? 'nav-tab-active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={16} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Action Controls */}
        <div className="header-actions">
          <button
            id="btn-new-entry"
            className="btn-new-entry"
            onClick={onNewEntry}
            title="Create a new daily entry"
          >
            <PlusIcon size={16} />
            <span className="btn-new-label">New Entry</span>
          </button>

          <button
            id="btn-theme-toggle"
            className="btn-theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
