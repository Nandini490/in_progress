/**
 * Validates an entry before saving.
 * Ensures the entry has a valid date and is not completely blank.
 */
export function validateEntry(entry) {
  const errors = [];

  if (!entry) {
    errors.push('Entry data is missing.');
    return { isValid: false, errors };
  }

  // 1. Date check
  if (!entry.date || typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    errors.push('Please provide a valid date in YYYY-MM-DD format.');
  }

  // 2. Content check: Must not be completely empty
  const hasTextContent = [
    entry.title,
    entry.didToday,
    entry.learned,
    entry.built,
    entry.challenges,
    entry.solutions,
    entry.importantMoments,
    entry.discoveries,
    entry.improvements,
    entry.tomorrow,
    entry.dsa,
    entry.projects,
    entry.collegeWork,
    entry.mistakes,
    ...(entry.customSections ? Object.values(entry.customSections) : []),
  ].some((field) => field && typeof field === 'string' && field.trim().length > 0);

  const hasMedia = (entry.images && entry.images.length > 0) || (entry.links && entry.links.length > 0);
  const hasTags = entry.tags && entry.tags.length > 0;

  if (!hasTextContent && !hasMedia && !hasTags) {
    errors.push('Cannot save an empty entry. Write at least a few thoughts or add a title.');
  }

  // 3. Links check
  if (entry.links && Array.isArray(entry.links)) {
    for (const link of entry.links) {
      if (link.url && !/^https?:\/\//i.test(link.url.trim())) {
        errors.push(`Invalid URL format: "${link.url}". URLs must begin with http:// or https://`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes entry fields before persistence.
 */
export function sanitizeEntry(entry) {
  const sanitized = { ...entry };

  // Trim title
  if (sanitized.title) sanitized.title = sanitized.title.trim();

  // Deduplicate and trim tags
  if (Array.isArray(sanitized.tags)) {
    const seen = new Set();
    sanitized.tags = sanitized.tags
      .map((t) => (typeof t === 'string' ? t.trim().replace(/^#/, '') : ''))
      .filter((t) => {
        if (!t) return false;
        const lower = t.toLowerCase();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
      });
  }

  // Trim links
  if (Array.isArray(sanitized.links)) {
    sanitized.links = sanitized.links
      .filter((l) => l && l.url && l.url.trim().length > 0)
      .map((l) => ({
        id: l.id || `link_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: (l.title && l.title.trim()) || l.url.trim(),
        url: l.url.trim(),
      }));
  }

  return sanitized;
}

/**
 * Returns a clean display title for an entry.
 * If no title is given, provides an archival date fallback.
 */
export function getDisplayTitle(entry) {
  if (entry?.title && entry.title.trim().length > 0) {
    return entry.title.trim();
  }

  if (entry?.date) {
    try {
      const [year, month, day] = entry.date.split('-');
      const dateObj = new Date(year, parseInt(month, 10) - 1, day);
      return `Reflection for ${new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(dateObj)}`;
    } catch {
      return `Daily Reflection (${entry.date})`;
    }
  }

  return 'Daily Reflection';
}
