import React, { useState, useEffect, useRef } from 'react';
import { getDisplayTitle } from '../../models/validation.js';
import { imageStorage } from '../../storage/indexeddb-image.adapter.js';
import { ConfirmModal } from '../shared/ConfirmModal.jsx';
import {
  ArrowLeftIcon,
  TrashIcon,
  LinkIcon,
  TagIcon,
  ImageIcon,
  XIcon,
} from '../shared/Icons.jsx';
import './EntryDetailView.css';

export function EntryDetailView({
  entry,
  entries = [],
  onEdit,
  onDelete,
  onBack,
  onSelectEntry,
}) {
  const [imageUrls, setImageUrls] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadedImageIdsRef = useRef([]);

  // Load images from IndexedDB — with cleanup to prevent memory leaks
  useEffect(() => {
    let isMounted = true;

    // Release previously loaded image URLs
    loadedImageIdsRef.current.forEach((id) => {
      imageStorage.releaseImage(id);
    });
    loadedImageIdsRef.current = [];
    setImageUrls({});

    if (entry && entry.images && entry.images.length > 0) {
      entry.images.forEach(async (img) => {
        try {
          const url = await imageStorage.getImageUrl(img.id);
          if (isMounted && url) {
            loadedImageIdsRef.current.push(img.id);
            setImageUrls((prev) => ({ ...prev, [img.id]: url }));
          }
        } catch (err) {
          console.error('Failed to load image from IndexedDB:', err);
        }
      });
    }
    return () => {
      isMounted = false;
      loadedImageIdsRef.current.forEach((id) => {
        imageStorage.releaseImage(id);
      });
      loadedImageIdsRef.current = [];
    };
  }, [entry]);

  if (!entry) {
    return (
      <div className="entry-detail-empty">
        <p>Entry not found.</p>
        <button className="btn-detail-back" onClick={onBack}>
          <ArrowLeftIcon size={16} /> Return to Timeline
        </button>
      </div>
    );
  }

  // Calculate chronological previous and next entry
  const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  const currentIndex = sortedEntries.findIndex((e) => e.id === entry.id);
  const newerEntry = currentIndex > 0 ? sortedEntries[currentIndex - 1] : null;
  const olderEntry = currentIndex >= 0 && currentIndex < sortedEntries.length - 1 ? sortedEntries[currentIndex + 1] : null;

  // Format date
  let formattedFullDate = entry.date;
  try {
    const [year, month, day] = entry.date.split('-');
    const dateObj = new Date(year, parseInt(month, 10) - 1, day);
    formattedFullDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  } catch {
    // Keep raw date on error
  }

  // Check if any optional section has content
  const hasOptionalTracks =
    (entry.dsa && entry.dsa.trim()) ||
    (entry.projects && entry.projects.trim()) ||
    (entry.collegeWork && entry.collegeWork.trim()) ||
    (entry.mistakes && entry.mistakes.trim()) ||
    (entry.customSections && Object.values(entry.customSections).some((v) => v && v.trim()));

  return (
    <article className="entry-detail-container" aria-label="Journal Entry">
      {/* Top Navigation & Action Bar */}
      <header className="detail-top-bar">
        <button className="btn-detail-back" onClick={onBack} title="Return to previous view">
          <ArrowLeftIcon size={16} />
          <span>Timeline</span>
        </button>

        <div className="detail-pagination">
          {olderEntry && (
            <button
              className="btn-pagination"
              onClick={() => onSelectEntry(olderEntry)}
              title={`Older: ${olderEntry.date}`}
            >
              &larr; Older
            </button>
          )}
          {newerEntry && (
            <button
              className="btn-pagination"
              onClick={() => onSelectEntry(newerEntry)}
              title={`Newer: ${newerEntry.date}`}
            >
              Newer &rarr;
            </button>
          )}
        </div>

        <div className="detail-top-actions">
          <button
            className="btn-detail-edit"
            onClick={() => onEdit(entry)}
            title="Edit this entry"
          >
            Edit
          </button>
          <button
            className="btn-detail-delete"
            onClick={() => setIsDeleteModalOpen(true)}
            title="Delete this entry"
            aria-label="Delete entry"
          >
            <TrashIcon size={16} />
          </button>
        </div>
      </header>

      {/* Main Journal Article Content */}
      <div className="detail-article-paper">
        {/* Date and Title */}
        <div className="detail-header-block">
          <time dateTime={entry.date} className="detail-date-badge">
            {formattedFullDate}
          </time>
          <h1 className="detail-title">{getDisplayTitle(entry)}</h1>

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="detail-tags-row">
              {entry.tags.map((tag) => (
                <span key={tag} className="detail-tag-pill">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Core Journal Sections (Displayed ONLY if non-empty) */}
        <div className="detail-sections-flow">
          {/* What happened today */}
          {entry.didToday && entry.didToday.trim() && (
            <section className="detail-section">
              <h2 className="detail-section-heading">What happened today</h2>
              <p className="detail-section-body">{entry.didToday}</p>
            </section>
          )}

          {/* What did I learn */}
          {entry.learned && entry.learned.trim() && (
            <section className="detail-section">
              <h2 className="detail-section-heading">What I learned</h2>
              <p className="detail-section-body">{entry.learned}</p>
            </section>
          )}

          {/* What did I build */}
          {entry.built && entry.built.trim() && (
            <section className="detail-section">
              <h2 className="detail-section-heading">What I built</h2>
              <p className="detail-section-body">{entry.built}</p>
            </section>
          )}

          {/* Challenges & Solutions */}
          {((entry.challenges && entry.challenges.trim()) ||
            (entry.solutions && entry.solutions.trim())) && (
            <section className="detail-section detail-split-section">
              {entry.challenges && entry.challenges.trim() && (
                <div className="detail-split-col">
                  <h2 className="detail-section-heading">What challenged me</h2>
                  <p className="detail-section-body">{entry.challenges}</p>
                </div>
              )}
              {entry.solutions && entry.solutions.trim() && (
                <div className="detail-split-col">
                  <h2 className="detail-section-heading">How I solved it</h2>
                  <p className="detail-section-body">{entry.solutions}</p>
                </div>
              )}
            </section>
          )}

          {/* Important moments & Discoveries */}
          {((entry.importantMoments && entry.importantMoments.trim()) ||
            (entry.discoveries && entry.discoveries.trim())) && (
            <section className="detail-section detail-split-section">
              {entry.importantMoments && entry.importantMoments.trim() && (
                <div className="detail-split-col">
                  <h2 className="detail-section-heading">Important moments</h2>
                  <p className="detail-section-body">{entry.importantMoments}</p>
                </div>
              )}
              {entry.discoveries && entry.discoveries.trim() && (
                <div className="detail-split-col">
                  <h2 className="detail-section-heading">Things discovered</h2>
                  <p className="detail-section-body">{entry.discoveries}</p>
                </div>
              )}
            </section>
          )}

          {/* Improvements & Tomorrow */}
          {((entry.improvements && entry.improvements.trim()) ||
            (entry.tomorrow && entry.tomorrow.trim())) && (
            <section className="detail-section detail-split-section">
              {entry.improvements && entry.improvements.trim() && (
                <div className="detail-split-col">
                  <h2 className="detail-section-heading">What to improve</h2>
                  <p className="detail-section-body">{entry.improvements}</p>
                </div>
              )}
              {entry.tomorrow && entry.tomorrow.trim() && (
                <div className="detail-split-col">
                  <h2 className="detail-section-heading">Tomorrow's plan</h2>
                  <p className="detail-section-body">{entry.tomorrow}</p>
                </div>
              )}
            </section>
          )}

          {/* Optional Tracks (Rendered only if content exists) */}
          {hasOptionalTracks && (
            <div className="detail-tracks-group">
              <h3 className="detail-tracks-title">Journey Tracks</h3>

              {entry.dsa && entry.dsa.trim() && (
                <section className="detail-section detail-track-card">
                  <h4 className="detail-track-heading">DSA / Interview Preparation</h4>
                  <p className="detail-section-body">{entry.dsa}</p>
                </section>
              )}

              {entry.projects && entry.projects.trim() && (
                <section className="detail-section detail-track-card">
                  <h4 className="detail-track-heading">Projects Worked On</h4>
                  <p className="detail-section-body">{entry.projects}</p>
                </section>
              )}

              {entry.collegeWork && entry.collegeWork.trim() && (
                <section className="detail-section detail-track-card">
                  <h4 className="detail-track-heading">College / Work</h4>
                  <p className="detail-section-body">{entry.collegeWork}</p>
                </section>
              )}

              {entry.mistakes && entry.mistakes.trim() && (
                <section className="detail-section detail-track-card">
                  <h4 className="detail-track-heading">Mistakes & Reflections</h4>
                  <p className="detail-section-body">{entry.mistakes}</p>
                </section>
              )}

              {/* Dynamic custom sections if any */}
              {entry.customSections &&
                Object.entries(entry.customSections).map(([key, val]) => {
                  if (!val || !val.trim()) return null;
                  return (
                    <section key={key} className="detail-section detail-track-card">
                      <h4 className="detail-track-heading">{key}</h4>
                      <p className="detail-section-body">{val}</p>
                    </section>
                  );
                })}
            </div>
          )}

          {/* Attached Links / Resources */}
          {entry.links && entry.links.length > 0 && (
            <section className="detail-section detail-resources">
              <h3 className="detail-resources-heading">Referenced Links & Readings</h3>
              <div className="detail-resources-grid">
                {entry.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="detail-resource-link"
                  >
                    <LinkIcon size={16} className="resource-link-icon" />
                    <div className="resource-link-info">
                      <span className="resource-link-title">{link.title}</span>
                      <span className="resource-link-url">{link.url}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Attached Screenshots / Images from IndexedDB */}
          {entry.images && entry.images.length > 0 && (
            <section className="detail-section detail-gallery">
              <h3 className="detail-gallery-heading">Attached Screenshots & Visuals</h3>
              <div className="detail-gallery-grid">
                {entry.images.map((img) => {
                  const url = imageUrls[img.id];
                  return (
                    <figure
                      key={img.id}
                      className="detail-gallery-item"
                      onClick={() => url && setSelectedImage({ url, name: img.name })}
                    >
                      {url ? (
                        <img src={url} alt={img.name} className="detail-gallery-image" />
                      ) : (
                        <div className="detail-gallery-loading">Loading visual...</div>
                      )}
                      {img.name && <figcaption className="detail-gallery-caption">{img.name}</figcaption>}
                    </figure>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Archival Timestamp Metadata */}
        <footer className="detail-footer-meta">
          <span>
            Archived on{' '}
            {new Date(entry.createdAt || entry.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
            <span>
              {' '}
              • Updated{' '}
              {new Date(entry.updatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </footer>
      </div>

      {/* Lightbox Modal for Full Image View */}
      {selectedImage && (
        <div className="lightbox-backdrop" onClick={() => setSelectedImage(null)} role="presentation">
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedImage(null)} aria-label="Close image">
              <XIcon size={20} />
            </button>
            <img src={selectedImage.url} alt={selectedImage.name} className="lightbox-image" />
            <p className="lightbox-caption">{selectedImage.name}</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete this entry?"
        message="Are you sure you want to permanently delete this daily journal reflection? This will also remove any attached screenshots from local storage."
        confirmLabel="Delete Reflection"
        cancelLabel="Keep Reflection"
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
    </article>
  );
}
