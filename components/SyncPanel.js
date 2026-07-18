'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// Royal Messenger Service - RSS sync, genre/gender enrichment, and NOW
// page-count enrichment as a separate section with its own progress bar,
// since it tracks its own `pages_enriched` flag independently of the
// existing `enriched` flag (see /api/enrich-pages/route.js for why).
// ============================================================================

import { useState } from 'react';
import {
  syncMessages,
  enrichMessages,
} from '../lib/royalDecrees';

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export default function SyncPanel({ books, onDataChanged }) {

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const [enriching, setEnriching] = useState(false);

  // NEW: separate loading state for the page-count enrichment button, so
  // clicking one doesn't disable the other.
  const [enrichingPages, setEnrichingPages] = useState(false);

  const total = books.length;

  const enrichedCount = books.filter(book => book.enriched).length;
  const remaining = total - enrichedCount;
  const percent = total === 0 ? 0 : Math.round((enrichedCount / total) * 100);

  // NEW: same math, but for pages_enriched instead of enriched.
  const pagesEnrichedCount = books.filter(book => book.pages_enriched).length;
  const pagesRemaining = total - pagesEnrichedCount;
  const pagesPercent = total === 0 ? 0 : Math.round((pagesEnrichedCount / total) * 100);

  async function handleSync() {

    setSyncing(true);
    setSyncMessage("🕊 Dispatching ravens to Goodreads...");

    try {

      const res = await fetch('/api/sync-rss');
      const data = await res.json();

      if (!res.ok) {
        setSyncMessage(data.error || "The ravens returned confused.");
      } else {
        if (data.newBooksAdded > 0) {
          setSyncMessage(
            `${randomItem(syncMessages)}\n\n📚 ${data.newBooksAdded} new tome${data.newBooksAdded === 1 ? '' : 's'} entered the Royal Library.`
          );
        } else {
          setSyncMessage("🦉 The ravens returned empty-clawed. No new tomes were discovered.");
        }
        onDataChanged?.();
      }

    } catch {
      setSyncMessage("The messenger owl appears to have unionised.");
    }

    setSyncing(false);
  }

  async function handleEnrichAll() {

    setEnriching(true);
    let stillRemaining = remaining;

    while (stillRemaining > 0) {
      const res = await fetch('/api/enrich', { method: 'POST' });
      const data = await res.json();
      stillRemaining = data.remaining;
      onDataChanged?.();
      if (data.processed === 0) break;
    }

    setEnriching(false);
  }

  // NEW: same loop pattern as handleEnrichAll, calling /api/enrich-pages
  // instead - kept as its own function so the two processes stay fully
  // independent and can't interfere with each other.
  async function handleEnrichPages() {

    setEnrichingPages(true);
    let stillRemaining = pagesRemaining;

    while (stillRemaining > 0) {
      const res = await fetch('/api/enrich-pages', { method: 'POST' });
      const data = await res.json();
      stillRemaining = data.remaining;
      onDataChanged?.();
      if (data.processed === 0) break;
    }

    setEnrichingPages(false);
  }

  return (

    <div className="card">

      <h2>🕊 Royal Messenger Service</h2>

      <p className="hint">
        Her Majesty periodically dispatches ravens to inspect thy Goodreads shelf.
        Should impatience consume thee, summon one immediately.
      </p>

      <button
        className="btn btn-secondary"
        disabled={syncing}
        onClick={handleSync}
      >
        {syncing ? "Consulting the ravens..." : "Summon a raven"}
      </button>

      {syncMessage && (
        <p className="hint" style={{ marginTop: 15, whiteSpace: "pre-line" }}>
          {syncMessage}
        </p>
      )}

      {remaining > 0 && (
        <>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>

          <p className="hint">
            {enrichedCount} of {total} books have been reviewed by the Royal Librarians.
          </p>

          <button
            className="btn btn-secondary"
            disabled={enriching}
            onClick={handleEnrichAll}
          >
            {enriching ? randomItem(enrichMessages) : "Summon additional librarians"}
          </button>
        </>
      )}

      {/* NEW: page-count enrichment section - only shows once at least
          one book needs it, same pattern as the genre/gender section
          above. Reuses enrichMessages for the loading text rather than
          requiring a new export from royalDecrees.js. */}
      {pagesRemaining > 0 && (
        <>
          <div className="progress-track" style={{ marginTop: 20 }}>
            <div className="progress-fill" style={{ width: `${pagesPercent}%` }} />
          </div>

          <p className="hint">
            {pagesEnrichedCount} of {total} tomes have had their length measured.
          </p>

          <button
            className="btn btn-secondary"
            disabled={enrichingPages}
            onClick={handleEnrichPages}
          >
            {enrichingPages ? randomItem(enrichMessages) : "📏 Summon the Royal Cartographers"}
          </button>
        </>
      )}

    </div>

  );

}