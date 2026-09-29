import React, { useState, useEffect, useRef } from 'react';
import { createEmptyEntry } from '../../models/entry.model';
import { validateEntry, sanitizeEntry } from '../../models/validation';
import { autosaveService } from '../../services/autosave.service';
import { imageStorage } from '../../storage/indexeddb-image.adapter';
import { AutosaveBadge } from '../shared/AutosaveBadge';
import { ConfirmModal } from '../shared/ConfirmModal';
import {
  ArrowLeftIcon,
  TrashIcon,
  PlusIcon,
  XIcon,
  LinkIcon,
  ImageIcon,
  TagIcon,
  AlertCircleIcon,
} from '../shared/Icons';
import './EntryEditorView.css';

const PRESET_TAGS = [
  'DSA',
  'AI',
  'RAG',
  'React',
  'Project',
  'College',
  'Interview',
  'Learning',
  'Personal',
  'Mistake',
  'Achievement',
];

export function EntryEditorView({
  initialEntry = null,
  onSave,
  onCancel,
  onDelete,
}) {
  const isEditing = Boolean(initialEntry && initialEntry.id);

  // Form State
  const [entry, setEntry] = useState(() => {
    if (initialEntry) return { ...initialEntry };
    return createEmptyEntry();
  });

  // Track draft recovery status
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [draftRestoredAt, setDraftRestoredAt] = useState('');

  // Autosave Status: 'idle' | 'saving' | 'saved' | 'error'
  const [autosaveStatus, setAutosaveStatus] = useState('idle');
  const [lastSavedTime, setLastSavedTime] = useState('');
  const autosaveTimerRef = useRef(null);
  const isFirstRender = useRef(true);

  // Active Optional Tracks
  const [activeTracks, setActiveTracks] = useState(() => {
    const tracks = new Set();
    if (initialEntry) {
      if (initialEntry.dsa) tracks.add('dsa');
      if (initialEntry.projects) tracks.add('projects');
      if (initialEntry.collegeWork) tracks.add('collegeWork');
      if (initialEntry.mistakes) tracks.add('mistakes');
      if (initialEntry.links && initialEntry.links.length > 0) tracks.add('links');
      if (initialEntry.tags && initialEntry.tags.length > 0) tracks.add('tags');
      if (initialEntry.images && initialEntry.images.length > 0) tracks.add('images');
    }
    return tracks;
  });

  // Input states for links and tags
  const [newTagInput, setNewTagInput] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [imagePreviews, setImagePreviews] = useState({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Modals & Errors
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Check for unsaved draft on mount (only for new entry mode)
  useEffect(() => {
    if (!isEditing && autosaveService.hasDraft()) {
      const saved = autosaveService.getDraft();
      if (saved && saved.entry) {
        setEntry(saved.entry);
        setHasRestoredDraft(true);
        if (saved.savedAt) {
          const time = new Date(saved.savedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          setDraftRestoredAt(time);
        }

        // Restore active tracks
        const tracks = new Set();
        if (saved.entry.dsa) tracks.add('dsa');
        if (saved.entry.projects) tracks.add('projects');
        if (saved.entry.collegeWork) tracks.add('collegeWork');
        if (saved.entry.mistakes) tracks.add('mistakes');
        if (saved.entry.links?.length > 0) tracks.add('links');
        if (saved.entry.tags?.length > 0) tracks.add('tags');
        if (saved.entry.images?.length > 0) tracks.add('images');
        setActiveTracks(tracks);
      }
    }
  }, [isEditing]);

  // 2. Load previews for any attached images from IndexedDB
  useEffect(() => {
    let isMounted = true;
    if (entry.images && entry.images.length > 0) {
      entry.images.forEach(async (img) => {
        if (!imagePreviews[img.id]) {
          try {
            const url = await imageStorage.getImageUrl(img.id);
            if (isMounted && url) {
              setImagePreviews((prev) => ({ ...prev, [img.id]: url }));
            }
          } catch (err) {
            console.error('Failed to load image preview:', err);
          }
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [entry.images]);

  // 3. Debounced Autosave (600ms inactivity)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setAutosaveStatus('saving');
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      try {
        autosaveService.saveDraft(entry);
        const now = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        setLastSavedTime(now);
        setAutosaveStatus('saved');
      } catch {
        setAutosaveStatus('error');
      }
    }, 600);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [entry]);

  // Field change handler
  const handleFieldChange = (field, value) => {
    setEntry((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage('');
  };

  // Toggle optional tracks
  const toggleTrack = (trackKey) => {
    setActiveTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackKey)) {
        next.delete(trackKey);
      } else {
        next.add(trackKey);
      }
      return next;
    });
  };

  // Tag Handlers
  const handleAddTag = (tagText) => {
    const trimmed = tagText.trim().replace(/^#/, '');
    if (!trimmed) return;
    if (!entry.tags.includes(trimmed)) {
      setEntry((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmed],
      }));
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setEntry((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  // Link Handlers
  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    let url = newLinkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    const newLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: newLinkTitle.trim() || url,
      url,
    };

    setEntry((prev) => ({
      ...prev,
      links: [...prev.links, newLink],
    }));

    setNewLinkUrl('');
    setNewLinkTitle('');
  };

  const handleRemoveLink = (linkId) => {
    setEntry((prev) => ({
      ...prev,
      links: prev.links.filter((l) => l.id !== linkId),
    }));
  };

  // Image Upload Handlers (IndexedDB backed)
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    setErrorMessage('');

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setErrorMessage('Please upload valid image files only.');
          continue;
        }

        // Store into IndexedDB
        const storedMeta = await imageStorage.storeImage(file, {
          name: file.name,
          caption: '',
        });

        // Get preview URL
        const previewUrl = await imageStorage.getImageUrl(storedMeta.id);
        setImagePreviews((prev) => ({ ...prev, [storedMeta.id]: previewUrl }));

        // Append to entry (metadata only, no base64 in entry)
        setEntry((prev) => ({
          ...prev,
          images: [...prev.images, storedMeta],
        }));
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setErrorMessage('Failed to save image to browser storage.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = async (imageId) => {
    try {
      await imageStorage.deleteImage(imageId);
      setImagePreviews((prev) => {
        const next = { ...prev };
        delete next[imageId];
        return next;
      });
      setEntry((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img.id !== imageId),
      }));
    } catch (err) {
      console.error('Failed to remove image:', err);
    }
  };

  // Save Entry Handler
  const handleSave = async () => {
    const validation = validateEntry(entry);
    if (!validation.isValid) {
      setErrorMessage(validation.errors.join(' '));
      return;
    }

    setIsSaving(true);
    try {
      const sanitized = sanitizeEntry(entry);
      await onSave(sanitized);
      // Clear draft on successful save
      autosaveService.clearDraft();
    } catch (err) {
      setErrorMessage('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Discard draft handler
  const handleDiscardDraft = () => {
    autosaveService.clearDraft();
    setHasRestoredDraft(false);
    setEntry(createEmptyEntry());
    setIsDiscardModalOpen(false);
  };

  return (
    <div className="editor-container" aria-label="Journal Entry Editor">
      {/* Draft Recovery Banner */}
      {hasRestoredDraft && (
        <div className="draft-banner">
          <div className="draft-banner-text">
            <span>Restored unsaved draft</span>
            {draftRestoredAt && <span className="draft-banner-time">from {draftRestoredAt}</span>}
          </div>
          <button
            className="btn-draft-discard"
            onClick={() => setIsDiscardModalOpen(true)}
          >
            Discard Draft
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="editor-top-bar">
        <button className="btn-editor-back" onClick={onCancel}>
          <ArrowLeftIcon size={16} />
          <span>Back</span>
        </button>

        <div className="editor-top-status">
          <AutosaveBadge status={autosaveStatus} lastSavedTime={lastSavedTime} />
        </div>

        <div className="editor-top-actions">
          {isEditing && (
            <button
              className="btn-editor-delete"
              onClick={() => setIsDeleteModalOpen(true)}
              title="Delete this entry"
            >
              <TrashIcon size={16} />
            </button>
          )}

          <button className="btn-editor-cancel" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>

          <button className="btn-editor-save" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>

      {/* Validation Error Message */}
      {errorMessage && (
        <div className="editor-error-alert" role="alert">
          <AlertCircleIcon size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Journal Flow */}
      <div className="journal-flow">
        {/* Header Prompt Card: Date & Title */}
        <section className="journal-card header-card">
          <div className="card-meta-row">
            <div className="date-input-group">
              <label htmlFor="entry-date" className="field-label">
                Date
              </label>
              <input
                id="entry-date"
                type="date"
                className="input-date"
                value={entry.date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
              />
            </div>
          </div>

          <div className="title-input-group">
            <input
              id="entry-title"
              type="text"
              className="input-title"
              placeholder="Title (optional — e.g. A breakthrough in problem solving)"
              value={entry.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
            />
          </div>
        </section>

        {/* Core Prompt 1: What happened today? */}
        <section className="journal-card">
          <label htmlFor="didToday" className="card-prompt">
            What happened today?
          </label>
          <textarea
            id="didToday"
            className="input-journal-area"
            placeholder="Document the day's narrative, experiences, work, or moments..."
            rows={4}
            value={entry.didToday}
            onChange={(e) => handleFieldChange('didToday', e.target.value)}
          />
        </section>

        {/* Core Prompt 2: What did I learn? */}
        <section className="journal-card">
          <label htmlFor="learned" className="card-prompt">
            What did I learn?
          </label>
          <textarea
            id="learned"
            className="input-journal-area"
            placeholder="New concepts, insights, readings, or architectural lessons..."
            rows={3}
            value={entry.learned}
            onChange={(e) => handleFieldChange('learned', e.target.value)}
          />
        </section>

        {/* Core Prompt 3: What did I build? */}
        <section className="journal-card">
          <label htmlFor="built" className="card-prompt">
            What did I build?
          </label>
          <textarea
            id="built"
            className="input-journal-area"
            placeholder="Features, prototypes, scripts, models, or tangible deliverables..."
            rows={3}
            value={entry.built}
            onChange={(e) => handleFieldChange('built', e.target.value)}
          />
        </section>

        {/* Core Prompt 4: What challenged me & How did I solve it? */}
        <section className="journal-card split-prompts-card">
          <div className="prompt-split-item">
            <label htmlFor="challenges" className="card-prompt">
              What challenged me?
            </label>
            <textarea
              id="challenges"
              className="input-journal-area"
              placeholder="Obstacles, bugs, friction, or mental blocks..."
              rows={3}
              value={entry.challenges}
              onChange={(e) => handleFieldChange('challenges', e.target.value)}
            />
          </div>

          <div className="prompt-split-divider" />

          <div className="prompt-split-item">
            <label htmlFor="solutions" className="card-prompt">
              How did I solve it?
            </label>
            <textarea
              id="solutions"
              className="input-journal-area"
              placeholder="The breakthrough, fix, mental shift, or workaround..."
              rows={3}
              value={entry.solutions}
              onChange={(e) => handleFieldChange('solutions', e.target.value)}
            />
          </div>
        </section>

        {/* Core Prompt 5: Important moments & Discoveries */}
        <section className="journal-card split-prompts-card">
          <div className="prompt-split-item">
            <label htmlFor="importantMoments" className="card-prompt">
              Important moments
            </label>
            <textarea
              id="importantMoments"
              className="input-journal-area"
              placeholder="Conversations, decisions, milestones, or memorable events..."
              rows={3}
              value={entry.importantMoments}
              onChange={(e) => handleFieldChange('importantMoments', e.target.value)}
            />
          </div>

          <div className="prompt-split-divider" />

          <div className="prompt-split-item">
            <label htmlFor="discoveries" className="card-prompt">
              Things I discovered
            </label>
            <textarea
              id="discoveries"
              className="input-journal-area"
              placeholder="Interesting tools, research papers, ideas, or observations..."
              rows={3}
              value={entry.discoveries}
              onChange={(e) => handleFieldChange('discoveries', e.target.value)}
            />
          </div>
        </section>

        {/* Core Prompt 6: What do I want to improve & Tomorrow's plan */}
        <section className="journal-card split-prompts-card">
          <div className="prompt-split-item">
            <label htmlFor="improvements" className="card-prompt">
              What do I want to improve?
            </label>
            <textarea
              id="improvements"
              className="input-journal-area"
              placeholder="Habits, technical focus, communication, or energy management..."
              rows={3}
              value={entry.improvements}
              onChange={(e) => handleFieldChange('improvements', e.target.value)}
            />
          </div>

          <div className="prompt-split-divider" />

          <div className="prompt-split-item">
            <label htmlFor="tomorrow" className="card-prompt">
              Tomorrow's plan
            </label>
            <textarea
              id="tomorrow"
              className="input-journal-area"
              placeholder="The top priorities and intentions for tomorrow..."
              rows={3}
              value={entry.tomorrow}
              onChange={(e) => handleFieldChange('tomorrow', e.target.value)}
            />
          </div>
        </section>

        {/* ================= OPTIONAL TRACKS ================= */}

        {/* Optional Track 1: DSA */}
        {activeTracks.has('dsa') && (
          <section className="journal-card optional-card">
            <div className="card-header-row">
              <label htmlFor="track-dsa" className="card-prompt">
                DSA / Interview Preparation
              </label>
              <button
                className="btn-card-close"
                onClick={() => toggleTrack('dsa')}
                title="Hide section"
              >
                <XIcon size={14} />
              </button>
            </div>
            <textarea
              id="track-dsa"
              className="input-journal-area"
              placeholder="Problems solved, patterns practiced (e.g. two-pointer, DP, graphs), insights..."
              rows={3}
              value={entry.dsa}
              onChange={(e) => handleFieldChange('dsa', e.target.value)}
            />
          </section>
        )}

        {/* Optional Track 2: Projects */}
        {activeTracks.has('projects') && (
          <section className="journal-card optional-card">
            <div className="card-header-row">
              <label htmlFor="track-projects" className="card-prompt">
                Projects Worked On
              </label>
              <button
                className="btn-card-close"
                onClick={() => toggleTrack('projects')}
                title="Hide section"
              >
                <XIcon size={14} />
              </button>
            </div>
            <textarea
              id="track-projects"
              className="input-journal-area"
              placeholder="Project names, repos touched, pull requests, refactorings..."
              rows={3}
              value={entry.projects}
              onChange={(e) => handleFieldChange('projects', e.target.value)}
            />
          </section>
        )}

        {/* Optional Track 3: College / Work */}
        {activeTracks.has('collegeWork') && (
          <section className="journal-card optional-card">
            <div className="card-header-row">
              <label htmlFor="track-collegeWork" className="card-prompt">
                College / Work
              </label>
              <button
                className="btn-card-close"
                onClick={() => toggleTrack('collegeWork')}
                title="Hide section"
              >
                <XIcon size={14} />
              </button>
            </div>
            <textarea
              id="track-collegeWork"
              className="input-journal-area"
              placeholder="Classes, exams, workplace meetings, team syncs, assignments..."
              rows={3}
              value={entry.collegeWork}
              onChange={(e) => handleFieldChange('collegeWork', e.target.value)}
            />
          </section>
        )}

        {/* Optional Track 4: Mistakes or Failures */}
        {activeTracks.has('mistakes') && (
          <section className="journal-card optional-card">
            <div className="card-header-row">
              <label htmlFor="track-mistakes" className="card-prompt">
                Mistakes or Failures
              </label>
              <button
                className="btn-card-close"
                onClick={() => toggleTrack('mistakes')}
                title="Hide section"
              >
                <XIcon size={14} />
              </button>
            </div>
            <textarea
              id="track-mistakes"
              className="input-journal-area"
              placeholder="What went wrong, oversights, misjudgments, and what you learned from it..."
              rows={3}
              value={entry.mistakes}
              onChange={(e) => handleFieldChange('mistakes', e.target.value)}
            />
          </section>
        )}

        {/* Optional Track 5: Tags */}
        {activeTracks.has('tags') && (
          <section className="journal-card optional-card">
            <div className="card-header-row">
              <label className="card-prompt">Tags</label>
              <button
                className="btn-card-close"
                onClick={() => toggleTrack('tags')}
                title="Hide section"
              >
                <XIcon size={14} />
              </button>
            </div>

            {/* Existing Tag Chips */}
            <div className="tags-active-list">
              {entry.tags.map((tag) => (
                <span key={tag} className="tag-chip-editable">
                  <span>#{tag}</span>
                  <button
                    className="btn-tag-remove"
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                  >
                    <XIcon size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div className="tag-input-row">
              <input
                type="text"
                className="input-tag"
                placeholder="Type tag and press Enter..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddTag(newTagInput);
                  }
                }}
              />
              <button
                className="btn-tag-add"
                onClick={() => handleAddTag(newTagInput)}
                disabled={!newTagInput.trim()}
              >
                Add Tag
              </button>
            </div>

            {/* Preset Suggestions */}
            <div className="tags-suggestions">
              <span className="tags-suggestions-label">Suggestions:</span>
              {PRESET_TAGS.map((tag) => {
                const isSelected = entry.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    className={`tag-preset-btn ${isSelected ? 'tag-preset-selected' : ''}`}
                    onClick={() => (isSelected ? handleRemoveTag(tag) : handleAddTag(tag))}
                  >
                    +{tag}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Optional Track 6: Links */}
        {activeTracks.has('links') && (
          <section className="journal-card optional-card">
            <div className="card-header-row">
              <label className="card-prompt">Important Links</label>
              <button
                className="btn-card-close"
                onClick={() => toggleTrack('links')}
                title="Hide section"
              >
                <XIcon size={14} />
              </button>
            </div>

            {/* Existing Links List */}
            {entry.links.length > 0 && (
              <ul className="links-active-list">
                {entry.links.map((link) => (
                  <li key={link.id} className="link-item">
                    <LinkIcon size={14} className="link-item-icon" />
                    <div className="link-item-text">
                      <span className="link-item-title">{link.title}</span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-item-url"
                      >
                        {link.url}
                      </a>
                    </div>
                    <button
                      className="btn-link-remove"
                      onClick={() => handleRemoveLink(link.id)}
                      aria-label="Remove link"
                    >
                      <XIcon size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Link Inputs */}
            <div className="link-input-row">
              <input
                type="text"
                className="input-link-title"
                placeholder="Link title (e.g. Clean Architecture Guide)"
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
              />
              <input
                type="url"
                className="input-link-url"
                placeholder="https://..."
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
              />
              <button
                className="btn-link-add"
                onClick={handleAddLink}
                disabled={!newLinkUrl.trim()}
              >
                Add Link
              </button>
            </div>
          </section>
        )}

        {/* Optional Track 7: Screenshots / Images (IndexedDB Backed) */}
        {activeTracks.has('images') && (
          <section className="journal-card optional-card">
            <div className="card-header-row">
              <label className="card-prompt">Screenshots / Images</label>
              <button
                className="btn-card-close"
                onClick={() => toggleTrack('images')}
                title="Hide section"
              >
                <XIcon size={14} />
              </button>
            </div>

            {/* Image Grid */}
            {entry.images.length > 0 && (
              <div className="images-preview-grid">
                {entry.images.map((img) => {
                  const url = imagePreviews[img.id];
                  return (
                    <div key={img.id} className="image-preview-card">
                      {url ? (
                        <img src={url} alt={img.name} className="image-preview-thumb" />
                      ) : (
                        <div className="image-preview-loading">Loading...</div>
                      )}
                      <div className="image-preview-info">
                        <span className="image-name" title={img.name}>
                          {img.name}
                        </span>
                        <button
                          className="btn-image-delete"
                          onClick={() => handleRemoveImage(img.id)}
                          aria-label={`Remove ${img.name}`}
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Image Upload Trigger */}
            <div className="image-upload-zone">
              <label htmlFor="file-image-upload" className="image-upload-label">
                <ImageIcon size={18} />
                <span>
                  {isUploadingImage
                    ? 'Saving image...'
                    : 'Click to upload screenshot or drag image here'}
                </span>
                <span className="image-upload-subtext">
                  Images are stored safely in local IndexedDB.
                </span>
              </label>
              <input
                id="file-image-upload"
                type="file"
                accept="image/*"
                multiple
                className="input-file-hidden"
                onChange={handleImageUpload}
                disabled={isUploadingImage}
              />
            </div>
          </section>
        )}

        {/* Optional Track Toggles Bar */}
        <section className="optional-tracks-bar" aria-label="Add additional tracks">
          <span className="tracks-bar-title">Add track:</span>
          <div className="tracks-chips-container">
            {[
              { id: 'dsa', label: 'DSA', icon: PlusIcon },
              { id: 'projects', label: 'Projects', icon: PlusIcon },
              { id: 'collegeWork', label: 'College / Work', icon: PlusIcon },
              { id: 'mistakes', label: 'Mistakes', icon: PlusIcon },
              { id: 'tags', label: 'Tags', icon: TagIcon },
              { id: 'links', label: 'Links', icon: LinkIcon },
              { id: 'images', label: 'Screenshots', icon: ImageIcon },
            ].map((track) => {
              const isActive = activeTracks.has(track.id);
              const Icon = track.icon;
              return (
                <button
                  key={track.id}
                  className={`track-pill ${isActive ? 'track-pill-active' : ''}`}
                  onClick={() => toggleTrack(track.id)}
                >
                  <Icon size={13} />
                  <span>{track.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Bottom Save Bar */}
        <div className="editor-bottom-bar">
          <button className="btn-editor-cancel" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
          <button className="btn-editor-save" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete this entry?"
        message="Are you sure you want to permanently delete this daily journal entry? This action cannot be undone."
        confirmLabel="Delete Entry"
        cancelLabel="Keep Entry"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            await onDelete(entry.id);
            setIsDeleteModalOpen(false);
          } finally {
            setIsDeleting(false);
          }
        }}
        onCancel={() => !isDeleting && setIsDeleteModalOpen(false)}
      />

      {/* Discard Draft Confirmation Modal */}
      <ConfirmModal
        isOpen={isDiscardModalOpen}
        title="Discard unsaved draft?"
        message="Are you sure you want to discard your restored draft? The current unsaved changes will be removed."
        confirmLabel="Discard Draft"
        cancelLabel="Keep Draft"
        isDanger={true}
        onConfirm={handleDiscardDraft}
        onCancel={() => setIsDiscardModalOpen(false)}
      />
    </div>
  );
}
