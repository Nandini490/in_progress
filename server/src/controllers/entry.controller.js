import { entryService } from '../services/entry.service.js';

export const entryController = {
  /**
   * GET /api/entries
   */
  async getAll(req, res, next) {
    try {
      const entries = await entryService.getAll();
      res.json({
        success: true,
        count: entries.length,
        data: entries,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/entries/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const entry = await entryService.getById(id);

      if (!entry) {
        return res.status(404).json({
          success: false,
          error: `Entry with ID '${id}' was not found.`,
        });
      }

      res.json({
        success: true,
        data: entry,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/entries
   */
  async create(req, res, next) {
    try {
      const entryData = req.sanitizedEntry || req.body;
      const saved = await entryService.create(entryData);

      res.status(201).json({
        success: true,
        data: saved,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/entries/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const entryData = req.sanitizedEntry || req.body;

      const updated = await entryService.update(id, entryData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: `Entry with ID '${id}' was not found.`,
        });
      }

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/entries/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await entryService.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: `Entry with ID '${id}' was not found.`,
        });
      }

      res.json({
        success: true,
        message: 'Entry successfully removed from archive.',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/entries/search?q=...
   */
  async search(req, res, next) {
    try {
      const query = req.query.q || '';
      const results = await entryService.search(query);

      res.json({
        success: true,
        count: results.length,
        query,
        data: results,
      });
    } catch (err) {
      next(err);
    }
  },
};
