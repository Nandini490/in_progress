/**
 * Backend Entry Validation & Sanitization Middleware
 * Enforces data integrity before requests reach controllers or the database.
 */
export function validateEntryInput(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Invalid request body. JSON object expected.',
    });
  }

  const errors = [];

  // 1. Date Validation
  if (!body.date || typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date.trim())) {
    errors.push('Date is required and must follow the format YYYY-MM-DD.');
  }

  // 2. Prevent Completely Blank Entries
  const textFields = [
    body.title,
    body.didToday,
    body.learned,
    body.built,
    body.challenges,
    body.solutions,
    body.importantMoments,
    body.discoveries,
    body.improvements,
    body.tomorrow,
    body.dsa,
    body.projects,
    body.collegeWork,
    body.mistakes,
    ...(body.customSections ? Object.values(body.customSections) : []),
  ];

  const hasText = textFields.some((f) => f && typeof f === 'string' && f.trim().length > 0);
  const hasTags = Array.isArray(body.tags) && body.tags.length > 0;
  const hasLinks = Array.isArray(body.links) && body.links.length > 0;
  const hasImages = Array.isArray(body.images) && body.images.length > 0;

  if (!hasText && !hasTags && !hasLinks && !hasImages) {
    errors.push('Cannot save an empty reflection. Provide a title, note, or tag.');
  }

  // 3. Link URL Validation
  if (Array.isArray(body.links)) {
    for (const link of body.links) {
      if (link && link.url && !/^https?:\/\//i.test(link.url.trim())) {
        errors.push(`Invalid URL protocol: "${link.url}". URLs must begin with http:// or https://`);
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: errors.join(' '),
      errors,
    });
  }

  // 4. Sanitize Input Data
  req.sanitizedEntry = {
    ...body,
    date: body.date.trim(),
    title: (body.title && body.title.trim()) || '',
    didToday: (body.didToday && body.didToday.trim()) || '',
    learned: (body.learned && body.learned.trim()) || '',
    built: (body.built && body.built.trim()) || '',
    challenges: (body.challenges && body.challenges.trim()) || '',
    solutions: (body.solutions && body.solutions.trim()) || '',
    importantMoments: (body.importantMoments && body.importantMoments.trim()) || '',
    discoveries: (body.discoveries && body.discoveries.trim()) || '',
    improvements: (body.improvements && body.improvements.trim()) || '',
    tomorrow: (body.tomorrow && body.tomorrow.trim()) || '',
    dsa: (body.dsa && body.dsa.trim()) || '',
    projects: (body.projects && body.projects.trim()) || '',
    collegeWork: (body.collegeWork && body.collegeWork.trim()) || '',
    mistakes: (body.mistakes && body.mistakes.trim()) || '',
    customSections: body.customSections && typeof body.customSections === 'object' ? body.customSections : {},
    tags: Array.isArray(body.tags)
      ? Array.from(
          new Set(
            body.tags
              .map((t) => (typeof t === 'string' ? t.trim().replace(/^#/, '') : ''))
              .filter(Boolean)
          )
        )
      : [],
    links: Array.isArray(body.links)
      ? body.links
          .filter((l) => l && l.url && l.url.trim())
          .map((l) => ({
            id: l.id || `link_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title: (l.title && l.title.trim()) || l.url.trim(),
            url: l.url.trim(),
          }))
      : [],
    images: Array.isArray(body.images) ? body.images : [],
  };

  next();
}
