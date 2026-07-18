'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// 🔍 Summon a Tome by Name
//
// Search your full library directly by title, and:
//   - 💌 add it straight to Fated Reads
//   - 📱 add it straight to Kobo
//   - 🗑️ remove it from your to-read shelf entirely (e.g. you changed your
//     mind and Goodreads hasn't been reconciled yet)
// ============================================================================

import { useState, useMemo } from 'react';
import BookMiniCover from './BookMiniCover';

export default function AddBookSearch({ books, onStatusChange }) {

  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    return books
      .filter(book => book.title.toLowerCase().includes(q))
      .slice(0, 8);
  }, [books, query]);

  async function updateStatus(id, action) {
    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    onStatusChange?.();
    setQuery('');
  }

  return (
    <div className="card add-book-search">

      <h2>🔍 Summon a Tome by Name</h2>

      <p className="hint">
        Already know what's next? Search thy full library directly.
      </p>

      <input
        type="text"
        className="search-input"
        placeholder="Type a title..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {matches.length > 0 && (
        <ul className="search-results">

          {matches.map(book => (

            <li key={book.id} className="search-result-item">

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
                  title="Add to Kobo"
                  onClick={() => updateStatus(book.id, 'kobo')}
                >
                  📱
                </button>

                <button
                  type="button"
                  className="fated-icon-btn"
                  title="Remove from Library"
                  onClick={() => updateStatus(book.id, 'remove')}
                >
                  🗑️
                </button>

              </div>

            </li>

          ))}

        </ul>
      )}

      {query.trim().length >= 2 && matches.length === 0 && (
        <p className="hint">No tomes found by that name in thy library.</p>
      )}

    </div>
  );
}