'use client';

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

  const total = books.length;

  const enrichedCount = books.filter(book => book.enriched).length;

  const remaining = total - enrichedCount;

  const percent =
    total === 0
      ? 0
      : Math.round((enrichedCount / total) * 100);

  async function handleSync() {

    setSyncing(true);

    setSyncMessage("🕊 Dispatching ravens to Goodreads...");

    try {

      const res = await fetch('/api/sync-rss');

      const data = await res.json();

      if (!res.ok) {

        setSyncMessage(

          data.error ||

          "The ravens returned confused."

        );

      } else {

        if (data.newBooksAdded > 0) {

          setSyncMessage(

            `${randomItem(syncMessages)}

📚 ${data.newBooksAdded} new tome${data.newBooksAdded === 1 ? '' : 's'} entered the Royal Library.`

          );

        } else {

          setSyncMessage(

            "🦉 The ravens returned empty-clawed. No new tomes were discovered."

          );

        }

        onDataChanged?.();

      }

    } catch {

      setSyncMessage(

        "The messenger owl appears to have unionised."

      );

    }

    setSyncing(false);

  }

  async function handleEnrichAll() {

    setEnriching(true);

    let stillRemaining = remaining;

    while (stillRemaining > 0) {

      const res = await fetch('/api/enrich', {

        method: 'POST',

      });

      const data = await res.json();

      stillRemaining = data.remaining;

      onDataChanged?.();

      if (data.processed === 0) break;

    }

    setEnriching(false);

  }

  return (

    <div className="card">

      <h2>

        🕊 Royal Messenger Service

      </h2>

      <p className="hint">

        Her Majesty periodically dispatches ravens to inspect thy Goodreads shelf.
        Should impatience consume thee, summon one immediately.

      </p>

      <button
        className="btn btn-secondary"
        disabled={syncing}
        onClick={handleSync}
      >

        {syncing
          ? "Consulting the ravens..."
          : "Summon a raven"}

      </button>

      {syncMessage && (

        <p
          className="hint"
          style={{
            marginTop:15,
            whiteSpace:"pre-line"
          }}
        >

          {syncMessage}

        </p>

      )}

      {remaining > 0 && (

        <>

          <div className="progress-track">

            <div
              className="progress-fill"
              style={{
                width:`${percent}%`
              }}
            />

          </div>

          <p className="hint">

            {enrichedCount} of {total} books have been reviewed by the Royal Librarians.

          </p>

          <button
            className="btn btn-secondary"
            disabled={enriching}
            onClick={handleEnrichAll}
          >

            {enriching
              ? randomItem(enrichMessages)
              : "Summon additional librarians"}

          </button>

        </>

      )}

    </div>

  );

}