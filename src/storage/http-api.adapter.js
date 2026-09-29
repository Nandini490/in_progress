import { IEntryRepository } from './storage.interface.js';

const DEFAULT_API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE_URL) || '/api';

export class HttpApiAdapter extends IEntryRepository {
  constructor(baseUrl = DEFAULT_API_BASE) {
    super();
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const err = new Error(data.error || `HTTP error! Status: ${res.status}`);
        err.status = res.status;
        throw err;
      }

      return data;
    } catch (err) {
      if (!(options.silent404 && (err.status === 404 || (err.message && err.message.includes('not found'))))) {
        console.error(`[HttpApiAdapter Error] ${endpoint}:`, err.message);
      }
      throw err;
    }
  }

  async getAll() {
    const response = await this._request('/entries');
    return response.data || [];
  }

  async getById(id) {
    if (!id) return null;
    try {
      const response = await this._request(`/entries/${id}`);
      return response.data || null;
    } catch (err) {
      if (err.message.includes('404')) return null;
      throw err;
    }
  }

  async getByDate(date) {
    if (!date) return null;
    const response = await this._request(`/entries/search?q=${encodeURIComponent(date)}`);
    const results = response.data || [];
    return results.find((e) => e.date === date) || null;
  }

  async save(entryData) {
    const id = entryData.id;

    // Try PUT first for entries with an ID (common case: editing existing entries)
    if (id) {
      try {
        const response = await this._request(`/entries/${id}`, {
          method: 'PUT',
          body: JSON.stringify(entryData),
          silent404: true,
        });
        return response.data;
      } catch (err) {
        // If entry doesn't exist yet (404), fall through to create via POST
        if (err.status === 404 || (err.message && (err.message.includes('404') || err.message.includes('not found')))) {
          // Continue to POST
        } else {
          throw err;
        }
      }
    }

    const response = await this._request('/entries', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
    return response.data;
  }

  async delete(id) {
    if (!id) return false;
    await this._request(`/entries/${id}`, {
      method: 'DELETE',
    });
    return true;
  }

  async search(query) {
    const response = await this._request(`/entries/search?q=${encodeURIComponent(query || '')}`);
    return response.data || [];
  }
}

// Singleton instance ready for switching
export const httpApiAdapter = new HttpApiAdapter();
