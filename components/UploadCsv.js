'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// The first-time (and reupload) flow.
//
// Three steps:
//   1. Parse the CSV, get the full book list + count up front.
//   2. Upsert in batches of 150, updating a progress bar as we go.
//   3. NEW: reconcile - tell the server every goodreads_id that WAS in this
//      export, so it can retire any book in the database that's now
//      missing entirely (i.e. you deleted it on Goodreads, not just moved
//      shelves - see /api/import-csv/reconcile/route.js).
// ============================================================================

import { useState } from 'react';

import {
  uploadMessages,
} from '../lib/royalDecrees';

const BATCH_SIZE = 150;

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export default function UploadCsv({ onImported }) {

  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(null);

  async function handleFileChange(event) {

    const file = event.target.files?.[0];

    if (!file) return;

    setStatus('uploading');
    setProgress(null);

    setMessage(randomItem([
      "📜 Unrolling thy scroll...",
      "🧚 The librarians are counting thy tomes...",
      "✨ Dusting enchanted shelves...",
      "👑 Presenting thy collection to the Fairy Court...",
      "📖 Reading ancient records...",
      "🌙 Consulting the Royal Archives...",
    ]));

    try {

      const csvText = await file.text();

      // Step 1: parse, so we know the total count up front.
      const parseRes = await fetch('/api/import-csv/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: csvText,
      });

      const parseData = await parseRes.json();

      if (!parseRes.ok) {
        setStatus('error');
        setMessage(parseData.error || "The Fairy Court rejected thy offering.");
        return;
      }

      const allBooks = parseData.books;
      const total = allBooks.length;
      let imported = 0;

      setProgress({ done: 0, total });

      // Step 2: upsert in batches, updating the bar after each one.
      for (let i = 0; i < total; i += BATCH_SIZE) {

        const batch = allBooks.slice(i, i + BATCH_SIZE);

        const res = await fetch('/api/import-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ books: batch }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus('error');
          setMessage(data.error || "The Fairy Court rejected thy offering partway through.");
          return;
        }

        imported += data.imported;
        setProgress({ done: imported, total });

      }

      // Step 3: NEW - reconcile against the full list of IDs in THIS
      // export, so books you deleted entirely from Goodreads get retired
      // here instead of lingering forever.
      let removed = 0;
      try {
        const ids = allBooks.map(b => b.goodreadsId);
        const reconcileRes = await fetch('/api/import-csv/reconcile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goodreadsIds: ids }),
        });
        const reconcileData = await reconcileRes.json();
        if (reconcileRes.ok) {
          removed = reconcileData.removed;
        }
        // If reconcile itself fails, we deliberately don't treat the whole
        // upload as failed - the import already succeeded, this step is a
        // bonus cleanup pass, not required for the import to "count."
      } catch {
        // Same reasoning - swallow reconcile-specific errors quietly.
      }

      setStatus('done');

      setMessage(
        `${randomItem(uploadMessages)}

📚 ${imported} tomes have been reconciled with the Royal Archives.` +
        (removed > 0
          ? `\n🗑️ ${removed} tome${removed === 1 ? '' : 's'} banished, having vanished from thy Goodreads shelf entirely.`
          : '')
      );

      onImported?.();

    } catch {

      setStatus('error');

      setMessage(
        "The scroll could not be deciphered. Ensure thou hast chosen Goodreads' official CSV."
      );

    }

  }

  return (

    <div className="card">

      <h2>👑 Present Thy Library</h2>

      <p className="hint">
        Export thy Goodreads library.
        The Fairy Court shall catalogue every tome and preserve it within the Royal Archives.
      </p>

      <input
        type="file"
        accept=".csv"
        disabled={status === 'uploading'}
        onChange={handleFileChange}
      />

      {status === 'idle' && (
        <p className="hint">
          Goodreads → My Books → Import & Export → Export Library
        </p>
      )}

      {status === 'uploading' && (
        <>
          <p className="hint">{message}</p>

          {progress && (
            <div style={{ marginTop: '0.5rem' }}>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                />
              </div>
              <p className="hint" style={{ marginTop: '0.25rem' }}>
                📚 {progress.done} of {progress.total} tomes admitted to the Royal Library...
              </p>
            </div>
          )}
        </>
      )}

      {status === 'done' && (
        <p className="hint" style={{ color: "var(--success)", whiteSpace: "pre-line" }}>
          {message}
        </p>
      )}

      {status === 'error' && (
        <p className="hint" style={{ color: "var(--danger)", whiteSpace: "pre-line" }}>
          {message}
        </p>
      )}

    </div>

  );

}