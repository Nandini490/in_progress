import React, { useState, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { useEntries } from './hooks/useEntries';
import { Header } from './components/layout/Header';
import { TodayView } from './components/views/TodayView';
import { TimelineView } from './components/views/TimelineView';
import { EntryDetailView } from './components/views/EntryDetailView';
import { EntryEditorView } from './components/views/EntryEditorView';
import { SearchView } from './components/views/SearchView';
import { EntriesView } from './components/views/EntriesView';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const { entries, isLoading, saveEntry, deleteEntry, searchEntries } = useEntries();

  // Active view: 'today' | 'timeline' | 'entries' | 'search' | 'editor' | 'detail'
  const [activeView, setActiveView] = useState('today');
  const [previousView, setPreviousView] = useState('today');

  // Currently selected entry for Detail view
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Currently active entry for Editor view (null if creating new)
  const [editingEntry, setEditingEntry] = useState(null);

  // Global error notification (auto-dismisses after 8 seconds)
  const [globalError, setGlobalError] = useState('');
  useEffect(() => {
    if (globalError) {
      const timer = setTimeout(() => setGlobalError(''), 8000);
      return () => clearTimeout(timer);
    }
  }, [globalError]);

  // Navigation from Header tabs
  const handleNavigate = (viewId) => {
    setEditingEntry(null);
    setPreviousView(viewId);
    setActiveView(viewId);
  };

  // Start new entry
  const handleNewEntry = () => {
    setEditingEntry(null);
    setActiveView('editor');
  };

  // Open entry detail
  const handleSelectEntry = (entry) => {
    setPreviousView(activeView);
    setSelectedEntry(entry);
    setActiveView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Edit entry
  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setActiveView('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save entry from editor
  const handleSaveEntry = async (entryData) => {
    try {
      const saved = await saveEntry(entryData);
      setEditingEntry(null);
      setSelectedEntry(saved);
      setActiveView('detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setGlobalError('Failed to save. Please try again.');
      throw err;
    }
  };

  // Delete entry
  const handleDeleteEntry = async (entryId) => {
    try {
      await deleteEntry(entryId);
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null);
      }
      setEditingEntry(null);
      setActiveView('timeline');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setGlobalError(err.message || 'Failed to delete entry. Please try again.');
    }
  };

  // Cancel editor
  const handleCancelEditor = () => {
    setEditingEntry(null);
    if (selectedEntry) {
      setActiveView('detail');
    } else {
      setActiveView(previousView || 'today');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back from detail view
  const handleBackFromDetail = () => {
    const target = previousView === 'detail' || previousView === 'editor' ? 'timeline' : previousView;
    setActiveView(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      {/* Main App Header */}
      <Header
        activeView={activeView === 'detail' ? previousView : activeView}
        onNavigate={handleNavigate}
        onNewEntry={handleNewEntry}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Viewport Container */}
      <main className="main-content" id="main-content">
        {/* Global Error Notification */}
        {globalError && (
          <div className="global-error-bar" role="alert">
            <span>{globalError}</span>
            <button onClick={() => setGlobalError('')} aria-label="Dismiss error">×</button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && entries.length === 0 && (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading your archive...</p>
          </div>
        )}

        {/* Today View */}
        {activeView === 'today' && (
          <TodayView
            entries={entries}
            onNewEntry={handleNewEntry}
            onEditEntry={handleSelectEntry}
          />
        )}

        {/* Timeline View */}
        {activeView === 'timeline' && (
          <TimelineView
            entries={entries}
            onSelectEntry={handleSelectEntry}
            onNewEntry={handleNewEntry}
          />
        )}

        {/* Entries (Flat Archive List) */}
        {activeView === 'entries' && (
          <EntriesView
            entries={entries}
            onSelectEntry={handleSelectEntry}
            onNewEntry={handleNewEntry}
          />
        )}

        {/* Search View */}
        {activeView === 'search' && (
          <SearchView
            entries={entries}
            onSearch={searchEntries}
            onSelectEntry={handleSelectEntry}
          />
        )}

        {/* Entry Detail View */}
        {activeView === 'detail' && (
          <EntryDetailView
            entry={selectedEntry}
            entries={entries}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            onBack={handleBackFromDetail}
            onSelectEntry={handleSelectEntry}
          />
        )}

        {/* Entry Editor View */}
        {activeView === 'editor' && (
          <EntryEditorView
            initialEntry={editingEntry}
            onSave={handleSaveEntry}
            onCancel={handleCancelEditor}
            onDelete={handleDeleteEntry}
          />
        )}
      </main>

      {/* Subtle Archival Footer */}
      <footer className="shell-footer">
        <p>In Progress — Documenting the journey while it happens.</p>
      </footer>
    </div>
  );
}
export default App;
