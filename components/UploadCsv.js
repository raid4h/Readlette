'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// The first-time setup.
//
// Present thy Goodreads library unto the Fairy Court.
// The Court shall inspect thy collection and admit it into the Royal Library.
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
  const [progress, setProgress] = useState(null); // { done, total }

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

      setStatus('done');

      setMessage(
        `${randomItem(uploadMessages)}

📚 ${imported} tomes have been reconciled with the Royal Archives.`
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