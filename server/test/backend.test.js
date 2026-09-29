import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { EntryModel } from '../src/models/Entry.js';

const app = createApp();

test('Backend Express API Suite', async (t) => {
  // Test 1: Health check
  await t.test('GET /api/health returns status 200 with JSON payload', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.service, 'In Progress API');
    assert.ok(res.body.timestamp);
    assert.ok(res.body.database); // 'connected' or 'disconnected'
  });

  // Test 2: CORS verification
  await t.test('CORS headers allow requests from frontend origin', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'http://localhost:5174')
      .set('Access-Control-Request-Method', 'GET');
    assert.equal(res.status, 204);
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5174');
  });

  // Test 3: Validation: Reject empty entry
  await t.test('POST /api/entries rejects completely empty entry', async () => {
    const emptyEntry = {
      date: '2026-09-27',
      title: '',
      didToday: '',
      learned: '',
      built: '',
      challenges: '',
    };
    const res = await request(app)
      .post('/api/entries')
      .send(emptyEntry);
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('Cannot save an empty reflection'));
  });

  // Test 4: Validation: Reject invalid date format
  await t.test('POST /api/entries rejects invalid date format', async () => {
    const invalidDate = {
      date: '09/27/2026',
      title: 'Valid title',
      didToday: 'Some notes',
    };
    const res = await request(app)
      .post('/api/entries')
      .send(invalidDate);
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('YYYY-MM-DD'));
  });

  // Test 5: Validation: Reject invalid link protocol
  await t.test('POST /api/entries rejects invalid link URL protocol', async () => {
    const invalidLink = {
      date: '2026-09-27',
      title: 'Valid title',
      didToday: 'Some notes',
      links: [{ title: 'Bad', url: 'javascript:alert(1)' }],
    };
    const res = await request(app)
      .post('/api/entries')
      .send(invalidLink);
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('http:// or https://'));
  });

  // Test 6: Unknown endpoint returns clean 404
  await t.test('GET /api/unknown-route returns structured 404', async () => {
    const res = await request(app).get('/api/unknown-route');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('Resource not found'));
  });

  // Test 7: Mongoose Schema Model validation
  await t.test('EntryModel validates schema correctly in-memory', async () => {
    const entryDoc = new EntryModel({
      id: 'entry_test_123',
      date: '2026-09-27',
      title: 'Test Reflection',
      didToday: 'Valid content',
      tags: ['Node', 'Express'],
      links: [{ id: 'l1', title: 'Example', url: 'https://example.com' }],
      images: [{ id: 'img1', name: 'diagram.png', sizeBytes: 1024, mimeType: 'image/png' }],
    });

    const validationError = entryDoc.validateSync();
    assert.equal(validationError, undefined);

    const json = entryDoc.toJSON();
    assert.equal(json.id, 'entry_test_123');
    assert.equal(json._id, undefined);
    assert.equal(json.__v, undefined);
    assert.equal(json.title, 'Test Reflection');
  });

  // Test 8: Offline database error response
  await t.test('API gracefully handles disconnected database without leaking credentials', async () => {
    const res = await request(app).get('/api/entries');
    assert.equal(res.status, 500);
    assert.equal(res.body.success, false);
    assert.ok(!res.body.error.includes('mongodb+srv'));
    assert.ok(!res.body.error.includes('password'));
  });

  // Test 9: Search with malicious regex input does not cause ReDoS
  await t.test('GET /api/entries/search handles malicious regex input safely', async () => {
    const maliciousInputs = [
      '.*.*.*.*.*.*.*.*!',
      '(a+)+$',
      '([a-zA-Z]+)*X',
      'a]b[',
    ];
    for (const input of maliciousInputs) {
      const res = await request(app)
        .get(`/api/entries/search?q=${encodeURIComponent(input)}`);
      // Should respond without hanging — status depends on DB connection
      assert.ok(res.status === 200 || res.status === 500);
    }
  });
});
