'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// 🎀 Thy Fated Reads
//
// A little shelf of books the Oracle has already chosen for you, saved to
// read next - so you don't lose the thread between shuffles.
//
// NEW: finishing a book now shows a themed "vanquished" banner. It's kept
// as its own bit of local state (not tied to the queued-books list) because
// finishing a book clears queued_at, which means the book disappears from
// this list the instant the parent refetches - if the banner lived inside
// the empty/non-empty branching below, it would vanish along with the book.
// ============================================================================

import { useState } from 'react';

export default function FatedReads({ books, onStatusChange }) {

  // Text of the "you finished a book!" banner. Empty string = hidden.
  const [finishMessage, setFinishMessage] = useState('');

  const queued = books
    .filter(book => book.queued_at)
    .sort((a, b) => new Date(b.queued_at) - new Date(a.queued_at));

  async function updateStatus(id, action, bookTitle) {

    // Only 'finish' gets the celebratory banner - queue/unqueue stay silent.
    if (action === 'finish') {
      setFinishMessage(
        `📖 "${bookTitle}" — It is decreed: this tome is VANQUISHED. Onward to thy next unread victim.`
      );
      // Auto-clear after 5 seconds so it doesn't sit there forever.
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
    <div className="card fated-reads">

      <h2>🎀 Thy Fated Reads</h2>

      {/* Victory banner - survives even if the list below goes empty */}
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

          <ul className="fated-list">

            {queued.map(book => (

              <li key={book.id} className="fated-item">

                <div className="fated-item-info">
                  <p className="fated-item-title">{book.title}</p>
                  <p className="fated-item-author">{book.author}</p>
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
  );
}