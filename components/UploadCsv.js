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

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export default function UploadCsv({ onImported }) {

  const [status, setStatus] = useState('idle');

  const [message, setMessage] = useState('');

  async function handleFileChange(event) {

    const file = event.target.files?.[0];

    if (!file) return;

    setStatus('uploading');

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

      const res = await fetch('/api/import-csv', {

        method: 'POST',

        headers: {

          'Content-Type': 'text/csv',

        },

        body: csvText,

      });

      const data = await res.json();

      if (!res.ok) {

        setStatus('error');

        setMessage(

          data.error ||

          "The Fairy Court rejected thy offering."

        );

        return;

      }

      setStatus('done');

      setMessage(

        `${randomItem(uploadMessages)}

📚 ${data.imported} tomes have joined the Royal Library.`

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

      <h2>

        👑 Present Thy Library

      </h2>

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

          Goodreads →

          My Books →

          Import & Export →

          Export Library

        </p>

      )}

      {status === 'uploading' && (

        <p className="hint">

          {message}

        </p>

      )}

      {status === 'done' && (

        <p
          className="hint"
          style={{
            color: "var(--success)",
            whiteSpace: "pre-line",
          }}
        >

          {message}

        </p>

      )}

      {status === 'error' && (

        <p
          className="hint"
          style={{
            color: "var(--danger)",
            whiteSpace: "pre-line",
          }}
        >

          {message}

        </p>

      )}

    </div>

  );

}