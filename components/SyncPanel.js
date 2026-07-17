'use client';

// =============================================================================
// Two jobs live here:
//
// 1. "Sync now" - manually triggers the same RSS check that runs
//    automatically once a day via Vercel Cron (see vercel.json + README).
//    Mostly useful right after you add a book and don't want to wait for
//    the daily cron.
//
// 2. Enrichment progress - genre & author-gender lookups happen in batches
//    (see app/api/enrich/route.js) rather than all at once. This panel
//    shows how many books still need enriching and lets you run it now
//    instead of waiting for it to happen gradually.
// =============================================================================
import { useState } from 'react';

export default function SyncPanel({ books, onDataChanged }) {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [enriching, setEnriching] = useState(false);

  const total = books.length;
  const enrichedCount = books.filter((b) => b.enriched).length;
  const remaining = total - enrichedCount;
  const percent = total === 0 ? 0 : Math.round((enrichedCount / total) * 100);

  async function handleSync() {
    setSyncing(true);
    setSyncMessage('');
    try {
      const res = await fetch('/api/sync-rss');
      const data = await res.json();
      if (!res.ok) {
        setSyncMessage(data.error || 'Sync failed.');
      } else {
        setSyncMessage(
          data.newBooksAdded > 0
            ? `Found ${data.newBooksAdded} new book(s)! 🍃`
            : 'All caught up - no new books since last sync.'
        );
        onDataChanged?.();
      }
    } catch {
      setSyncMessage('Could not reach Goodreads. Try again in a moment.');
    } finally {
      setSyncing(false);
    }
  }

  // Keeps calling /api/enrich (20 books at a time) until nothing is left,
  // refreshing the book list after every batch so the progress bar - and
  // your filters - update as it goes.
  async function handleEnrichAll() {
    setEnriching(true);
    let stillRemaining = remaining;

    while (stillRemaining > 0) {
      const res = await fetch('/api/enrich', { method: 'POST' });
      const data = await res.json();
      stillRemaining = data.remaining;
      onDataChanged?.();
      if (data.processed === 0) break; // safety valve against infinite loops
    }

    setEnriching(false);
  }

  return (
    <div className="card">
      <h2>🔄 Keep it fresh</h2>
      <p className="hint">
        New books added on Goodreads show up here automatically once a day.
        Don't want to wait? Sync now.
      </p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={handleSync} disabled={syncing}>
          {syncing ? 'Checking Goodreads...' : 'Sync now'}
        </button>
        {syncMessage && <span className="hint" style={{ margin: 0 }}>{syncMessage}</span>}
      </div>

      {remaining > 0 && (
        <div style={{ marginTop: 18 }}>
          <p className="hint" style={{ marginBottom: 4 }}>
            Sorting genres & author details: {enrichedCount} / {total} done
          </p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <button
            className="btn btn-secondary"
            style={{ marginTop: 10, fontSize: '0.8rem', padding: '8px 16px' }}
            onClick={handleEnrichAll}
            disabled={enriching}
          >
            {enriching ? 'Working through the shelf...' : 'Sort remaining books now'}
          </button>
        </div>
      )}
    </div>
  );
}
