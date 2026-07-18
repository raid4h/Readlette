'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// 📖 What Thou Art Presently Reading
//
// Pulls from the separate /api/currently-reading endpoint. Renders nothing
// at all (not even an empty card) if there's nothing on that shelf right
// now, so it doesn't clutter the page when it's not relevant.
// ============================================================================

import { useState, useEffect } from 'react';
import BookMiniCover from './BookMiniCover';

export default function CurrentlyReading() {
  const [books, setBooks] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/currently-reading', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setBooks(data.books || []))
      .catch(() => setBooks([]))
      .finally(() => setLoaded(true));
  }, []);

  // Nothing to show yet, or nothing on this shelf at all - render nothing.
  if (!loaded || books.length === 0) return null;

  return (
    <div className="card currently-reading-banner">

      <h2>📖 What Thou Art Presently Reading</h2>

      <div className="currently-reading-list">
        {books.map(book => (
          <div key={book.id} className="currently-reading-item">
            <BookMiniCover book={book} />
            <span>{book.title}</span>
          </div>
        ))}
      </div>

    </div>
  );
}