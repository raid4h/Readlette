'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// 📖 What Thou Art Presently Reading
//
// Layout changed to stacked + centered (cover on top, then title/author/
// genres below) to match the Oracle reveal's look - the previous
// side-by-side row read oddly with just one or two books shown.
// ============================================================================

import { useState, useEffect } from 'react';
import { getCoverUrl } from '../lib/covers';

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

  if (!loaded || books.length === 0) return null;

  return (
    <div className="card currently-reading-banner">

      <h2>📖 What Thou Art Presently Reading</h2>

      <div className="currently-reading-list">
        {books.map(book => {
          const cover = getCoverUrl(book, 'M');

          return (
            <div key={book.id} className="currently-reading-item">

              {cover && (
                <img
                  className="currently-reading-cover"
                  src={cover}
                  alt={book.title}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}

              <p className="currently-reading-title">{book.title}</p>
              <p className="currently-reading-author">by {book.author}</p>

              {(book.genres || []).length > 0 && (
                <div className="book-tags">
                  {book.genres.map(g => <span key={g}>{g}</span>)}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}