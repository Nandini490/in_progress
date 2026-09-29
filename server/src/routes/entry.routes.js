import { Router } from 'express';
import { entryController } from '../controllers/entry.controller.js';
import { validateEntryInput } from '../middleware/validation.js';

export const entryRouter = Router();

// Search endpoint (defined before /:id parameter)
entryRouter.get('/entries/search', entryController.search);

// List all entries
entryRouter.get('/entries', entryController.getAll);

// Single entry by ID
entryRouter.get('/entries/:id', entryController.getById);

// Create entry
entryRouter.post('/entries', validateEntryInput, entryController.create);

// Update entry
entryRouter.put('/entries/:id', validateEntryInput, entryController.update);

// Delete entry
entryRouter.delete('/entries/:id', entryController.delete);
