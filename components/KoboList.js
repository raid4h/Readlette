'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// 📱 Thy Kobo Shelf
//
// NEW: the search-and-add bar now lives directly above this list too,
// scoped to add straight onto the Kobo shelf instead of Fated Reads.
// ============================================================================

import BookMiniCover from './BookMiniCover';
import BookSearchBar from './AddBookSearch';

export default function KoboList({ books, onStatusChange }) {

  const koboBooks = books
    .filter(book => book.kobo_at)
    .sort((a, b) => new Date(a.kobo_at) - new Date(b.kobo_at));

  async function updateStatus(id, action) {
    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    onStatusChange?.();
  }

  return (
    <>
      {/* NEW: scoped search bar - adds straight to the Kobo shelf */}
      <BookSearchBar
        books={books}
        onStatusChange={onStatusChange}
        action="kobo"
        actionLabel="Add to Kobo"
        actionIcon="📱"
        heading="🔍 Add a Tome to Thy Kobo Shelf"
      />

      <div className="card kobo-list">

        <h2>📱 Thy Kobo Shelf</h2>

        {koboBooks.length === 0 ? (
          <p className="hint">
            No tomes marked yet. Use the search above to summon one onto thy Kobo.
          </p>
        ) : (
          <ul className="fated-list fated-scroll">

            {koboBooks.map(book => (

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
                    🗑️
                  </button>

                </div>

              </li>

            ))}

          </ul>
        )}

      </div>
    </>
  );
}