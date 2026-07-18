'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// 🔍 Summon a Tome by Name
//
// Search your full library directly by title, and add any book straight to
// Fated Reads or Kobo - no need to wait for the Oracle to pick it for you.
// ============================================================================

import { useState, useMemo } from 'react';

export default function AddBookSearch({ books, onStatusChange }) {

  const [query, setQuery] = useState('');

  // Only search once there's something meaningful typed - avoids dumping
  // all 1254+ books on screen after a single keystroke.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    return books
      .filter(book => book.title.toLowerCase().includes(q))
      .slice(0, 8); // cap so the dropdown stays scannable
  }, [books, query]);

  async function addBook(id, action) {
    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    onStatusChange?.();
    // Clear the search so the dropdown closes and the box is ready again.
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

              <div className="fated-item-info">
                <p className="fated-item-title">{book.title}</p>
                <p className="fated-item-author">{book.author}</p>
              </div>

              <div className="fated-item-actions">

                <button
                  type="button"
                  className="fated-icon-btn"
                  title="Add to Fated Reads"
                  onClick={() => addBook(book.id, 'queue')}
                >
                  💌
                </button>

                <button
                  type="button"
                  className="fated-icon-btn"
                  title="Add to Kobo"
                  onClick={() => addBook(book.id, 'kobo')}
                >
                  📱
                </button>

              </div>

            </li>

          ))}

        </ul>
      )}

      {/* Only show "no results" once they've actually typed enough to search */}
      {query.trim().length >= 2 && matches.length === 0 && (
        <p className="hint">No tomes found by that name in thy library.</p>
      )}

    </div>
  );
}