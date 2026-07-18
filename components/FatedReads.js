'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// 🎀 Thy Fated Reads
//
// A little shelf of books the Oracle has already chosen for you, saved to
// read next - so you don't lose the thread between shuffles.
// Each row shows a small cover thumbnail via BookMiniCover, when available.
// ============================================================================

import { useState } from 'react';
import BookMiniCover from './BookMiniCover';

export default function FatedReads({ books, onStatusChange }) {

  const [finishMessage, setFinishMessage] = useState('');

  const queued = books
    .filter(book => book.queued_at)
    .sort((a, b) => new Date(b.queued_at) - new Date(a.queued_at));

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
    <div className="card fated-reads">

    <div className="court-label">
        ✦ ROYAL WAITING CHAMBER ✦
    </div>

    <h2 className="court-title">
        Thy Fated Reads
    </h2>

    <p className="court-subtitle">
        The Fairy Court awaiteth thy diligence.
        These decrees remain binding until fulfilled.
    </p>

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
            The Royal Archivists have reserved these tomes especially for thee.
          </p>

          <ul className="fated-list">

            {queued.map(book => (

              <li key={book.id} className="fated-item">

                {/* NEW: cover thumbnail sits to the left of title/author */}
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
                    👑
                  </button>

                  <button
                    type="button"
                    className="fated-icon-btn"
                    title="Remove from Fated Reads"
                    onClick={() => updateStatus(book.id, 'unqueue', book.title)}
                  >
                    🕊️
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