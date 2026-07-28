'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// 🎀 Thy Fated Reads
//
// NEW: the search-and-add bar (previously its own separate tab) now lives
// directly above this list, scoped to add straight into Fated Reads.
// ============================================================================

import { useState } from 'react';
import BookMiniCover from './BookMiniCover';
import BookSearchBar from './AddBookSearch';

export default function FatedReads({ books, onStatusChange }) {

  const [finishMessage, setFinishMessage] = useState('');

  const queued = books
    .filter(book => book.queued_at)
    .sort((a, b) => new Date(a.queued_at) - new Date(b.queued_at));

  async function updateStatus(id, action, bookTitle) {

    if (action === 'finish') {
      setFinishMessage(
        `📖 "${bookTitle}" — It is decreed: this tome is VANQUISHED. Onward to thy next unread victim.`
      );
      setTimeout(() => setFinishMessage(''), 5000);
    }

    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    onStatusChange?.();
  }

  return (
    <>
      {/* NEW: scoped search bar - adds straight to this list */}
      <BookSearchBar
        books={books}
        onStatusChange={onStatusChange}
        action="queue"
        actionLabel="Add to Fated Reads"
        actionIcon="💌"
        heading="🔍 Add a Tome to Thy Fated Reads"
      />

      <div className="card fated-reads">

        <h2>🎀 Thy Fated Reads</h2>

        {finishMessage && (
          <p className="hint fated-finish-banner">
            {finishMessage}
          </p>
        )}

        {queued.length === 0 ? (
          <p className="hint">
            Tomes thou hast chosen from the Oracle shall gather here, awaiting their turn...
          </p>
        ) : (
          <>
            <p className="hint">
              The threads of fate thou hast already chosen...
            </p>

            <ul className="fated-list fated-scroll">

              {queued.map(book => (

                <li key={book.id} className="fated-item">

                  <div className="fated-item-info">
                    <BookMiniCover book={book} />
                    <div>
                      <p className="fated-item-title">{book.title}</p>
                      <p className="fated-item-author">{book.author}</p>
                    </div>
                  </div>

                  <div className="fated-item-actions">

                    <button
                      type="button"
                      className="fated-icon-btn"
                      title="Finished this tome!"
                      onClick={() => updateStatus(book.id, 'finish', book.title)}
                    >
                      ✅
                    </button>

                    <button
                      type="button"
                      className="fated-icon-btn"
                      title="Remove from Fated Reads"
                      onClick={() => updateStatus(book.id, 'unqueue', book.title)}
                    >
                      💔
                    </button>

                  </div>

                </li>

              ))}

            </ul>
          </>
        )}

      </div>
    </>
  );
}