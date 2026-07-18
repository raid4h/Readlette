'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// 📖 What Thou Art Presently Reading
//
// Now shows a real cover (via Open Library, same as everywhere else) and
// genre tags (reusing the .book-tags styling from the Oracle reveal),
// instead of just a bare title.
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
          // 'M' size - bigger than the tiny list thumbnails elsewhere,
          // since this only ever shows 1-2 books at a time.
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

              <div className="currently-reading-info">
                <p className="currently-reading-title">{book.title}</p>
                <p className="currently-reading-author">by {book.author}</p>

                {(book.genres || []).length > 0 && (
                  <div className="book-tags">
                    {book.genres.map(g => <span key={g}>{g}</span>)}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}