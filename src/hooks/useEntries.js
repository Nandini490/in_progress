import { useState, useEffect, useCallback } from 'react';
import { activeEntryRepository as entryRepository } from '../storage/index.js';

export function useEntries() {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await entryRepository.getAll();
      setEntries(data);
    } catch (err) {
      console.error('Failed to load entries:', err);
      setError(err.message || 'Failed to load entries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const saveEntry = async (entryData) => {
    try {
      const saved = await entryRepository.save(entryData);
      await loadEntries();
      return saved;
    } catch (err) {
      console.error('Failed to save entry:', err);
      throw err;
    }
  };

  const deleteEntry = async (id) => {
    try {
      const success = await entryRepository.delete(id);
      if (success) {
        await loadEntries();
      }
      return success;
    } catch (err) {
      console.error('Failed to delete entry:', err);
      throw err;
    }
  };

  const searchEntries = async (query) => {
    try {
      return await entryRepository.search(query);
    } catch (err) {
      console.error('Failed to search entries:', err);
      return [];
    }
  };

  return {
    entries,
    isLoading,
    error,
    reloadEntries: loadEntries,
    saveEntry,
    deleteEntry,
    searchEntries,
  };
}
