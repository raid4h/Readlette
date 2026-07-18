'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// 📱 Thy Kobo Shelf
//
// Entirely manual - Readlette has no way to know what's actually on your
// Kobo, so books land here only when you flag them yourself. From here you
// can promote any book straight into 🎀 Thy Fated Reads.
// ============================================================================

import BookMiniCover from './BookMiniCover';

export default function KoboList({ books, onStatusChange }) {

  const koboBooks = books
    .filter(book => book.kobo_at)
    .sort((a, b) => new Date(b.kobo_at) - new Date(a.kobo_at));

  async function updateStatus(id, action) {
    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    onStatusChange?.();
  }

  return (
    <div className="card kobo-list">

    <div className="court-label">
    ✦ ENCHANTED TRAVELLING LIBRARY ✦
    </div>

    <h2 className="court-title">
        Thy Kobo Shelf
    </h2>

    <p className="court-subtitle">
        Tomes prepared for adventures beyond the castle walls.
    </p>

      {koboBooks.length === 0 ? (
        <p className="hint">
          No enchanted tomes await thy travels.
          Perhaps the Royal Messenger should deliver one.
        </p>
      ) : (
        <ul className="fated-list">

          {koboBooks.map(book => (

            <li key={book.id} className="fated-item">

              {/* NEW: cover thumbnail */}
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
                  title="Add to Fated Reads"
                  onClick={() => updateStatus(book.id, 'queue')}
                >
                  💌
                </button>

                <button
                  type="button"
                  className="fated-icon-btn"
                  title="Remove from Kobo"
                  onClick={() => updateStatus(book.id, 'unkobo')}
                >
                  🕊️
                </button>

              </div>

            </li>

          ))}

        </ul>
      )}

    </div>
  );
}