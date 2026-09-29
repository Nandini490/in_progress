import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalStorageAdapter } from '../../src/storage/local-storage.adapter.js';
import { autosaveService } from '../../src/services/autosave.service.js';

// In-memory mock for localStorage in Node environment
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

globalThis.localStorage = new MockLocalStorage();

test('Frontend Storage & Journal Workflow Suite', async (t) => {
  const adapter = new LocalStorageAdapter('test_journal_entries');

  // Test 1: Create entry
  let createdEntry;
  await t.test('Create entry saves valid entry and returns it with ID', async () => {
    const input = {
      date: '2026-09-29',
      title: 'Day 1 of Developer Journal',
      didToday: 'Implemented offline-first storage and error boundaries.',
      learned: 'Storage abstractions keep the frontend resilient.',
      built: 'Personal dev journal workflow.',
      tags: ['React', 'Architecture'],
      links: [{ title: 'Doc', url: 'https://developer.mozilla.org' }],
    };

    createdEntry = await adapter.save(input);
    assert.ok(createdEntry.id);
    assert.equal(createdEntry.title, 'Day 1 of Developer Journal');
    assert.equal(createdEntry.date, '2026-09-29');
    assert.ok(createdEntry.createdAt);
    assert.ok(createdEntry.updatedAt);
  });

  // Test 2: Read entries
  await t.test('Read entries via getAll(), getById(), and getByDate()', async () => {
    const all = await adapter.getAll();
    assert.equal(all.length, 1);
    assert.equal(all[0].id, createdEntry.id);

    const byId = await adapter.getById(createdEntry.id);
    assert.equal(byId.title, 'Day 1 of Developer Journal');

    const byDate = await adapter.getByDate('2026-09-29');
    assert.equal(byDate.id, createdEntry.id);
  });

  // Test 3: Edit entry
  await t.test('Edit entry updates existing record without duplicating', async () => {
    const updated = await adapter.save({
      ...createdEntry,
      title: 'Day 1 of Developer Journal - Polished',
      learned: 'Learned even more about clean architecture.',
    });

    assert.equal(updated.id, createdEntry.id);
    assert.equal(updated.title, 'Day 1 of Developer Journal - Polished');

    const all = await adapter.getAll();
    assert.equal(all.length, 1);
    assert.equal(all[0].title, 'Day 1 of Developer Journal - Polished');
  });

  // Test 4: Search entries
  await t.test('Search finds entries by keyword, tag, or topic safely', async () => {
    // Keyword search in content
    const res1 = await adapter.search('clean architecture');
    assert.equal(res1.length, 1);
    assert.equal(res1[0].id, createdEntry.id);

    // Tag search
    const res2 = await adapter.search('React');
    assert.equal(res2.length, 1);

    // Date search
    const res3 = await adapter.search('2026-09');
    assert.equal(res3.length, 1);

    // No match
    const res4 = await adapter.search('NonExistentKeywordXYZ');
    assert.equal(res4.length, 0);

    // Special regex characters in search do not throw or crash
    const res5 = await adapter.search('(.*)*+?^$');
    assert.equal(res5.length, 0);
  });

  // Test 5: Delete entry
  await t.test('Delete entry removes it cleanly from storage', async () => {
    const deleted = await adapter.delete(createdEntry.id);
    assert.equal(deleted, true);

    const all = await adapter.getAll();
    assert.equal(all.length, 0);

    const byId = await adapter.getById(createdEntry.id);
    assert.equal(byId, null);
  });

  // Test 6: Autosave service
  await t.test('Autosave service handles drafts correctly', () => {
    localStorage.clear();
    assert.equal(autosaveService.hasDraft(), false);

    const draft = {
      title: 'Unsaved Thoughts',
      didToday: 'Drafting today notes...',
      date: '2026-09-30',
    };

    autosaveService.saveDraft(draft);
    assert.equal(autosaveService.hasDraft(), true);

    const retrieved = autosaveService.getDraft();
    assert.equal(retrieved.entry.title, 'Unsaved Thoughts');
    assert.ok(retrieved.savedAt);

    autosaveService.clearDraft();
    assert.equal(autosaveService.hasDraft(), false);
    assert.equal(autosaveService.getDraft(), null);
  });
});
