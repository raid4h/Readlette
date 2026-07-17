'use client';

// =============================================================================
// Lets you pick your goodreads_library_export.csv file and sends its raw
// text to /api/import-csv. You only need to do this once, to backfill your
// existing 1251 books - see README.md for how to export that file from
// Goodreads. After that, the daily RSS sync (SyncPanel.js) takes over.
// =============================================================================
import { useState } from 'react';

export default function UploadCsv({ onImported }) {
  const [status, setStatus] = useState('idle'); // idle | uploading | done | error
  const [message, setMessage] = useState('');

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('uploading');
    setMessage('');

    try {
      const csvText = await file.text();

      const res = await fetch('/api/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: csvText,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong reading that file.');
        return;
      }

      setStatus('done');
      setMessage(`Tucked ${data.imported} books onto the shelf. 🌿`);
      onImported?.();
    } catch (err) {
      setStatus('error');
      setMessage('Could not read that file - make sure it is the CSV Goodreads gives you.');
    }
  }

  return (
    <div className="card">
      <h2>🌱 Plant your library</h2>
      <p className="hint">
        On Goodreads: My Books → Import and Export → Export Library. Once it's
        ready, upload the CSV it gives you here. This only needs to happen once.
      </p>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        disabled={status === 'uploading'}
      />

      {status === 'uploading' && <p className="hint">Reading your shelf...</p>}
      {status === 'done' && <p className="hint" style={{ color: '#3e5641' }}>{message}</p>}
      {status === 'error' && <p className="hint" style={{ color: '#a23b3b' }}>{message}</p>}
    </div>
  );
}
