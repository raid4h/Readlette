'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// 🔍 Inline tome search bar - reusable.
//
// Previously its own standalone tab; now embedded directly inside both
// Thy Fated Reads and Thy Kobo Shelf, since that's the more natural place
// to reach for it when specifically building up one of those lists.
//
// Which "add" action it performs is controlled by props, so this one
// component powers both tabs instead of duplicating the search logic:
//   - Fated Reads passes action="queue"
//   - Kobo Shelf passes action="kobo"
// Both also get a 🗑️ remove-from-library option, since "I don't want
// this on my to-read shelf at all" is relevant in either place.
// ============================================================================

import { useState, useMemo } from 'react';
import BookMiniCover from './BookMiniCover';

export default function BookSearchBar({
  books,
  onStatusChange,
  action,       // 'queue' or 'kobo' - which status action the primary button sends
  actionLabel,  // tooltip text for the primary button, e.g. "Add to Fated Reads"
  actionIcon,   // emoji for the primary button, e.g. "💌"
  heading,      // card heading text, so each embedding can word it differently
}) {

  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    return books
      .filter(book => book.title.toLowerCase().includes(q))
      .slice(0, 8);
  }, [books, query]);

  async function updateStatus(id, chosenAction) {
    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: chosenAction }),
    });
    onStatusChange?.();
    setQuery('');
  }

  return (
    <div className="card add-book-search">

      <h2>{heading}</h2>

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
                  title={actionLabel}
                  onClick={() => updateStatus(book.id, action)}
                >
                  {actionIcon}
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