'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// 📖 What Thou Art Presently Reading
//
// NEW: when you're reading MORE THAN ONE book, this makes that obvious:
//   - a "Two tomes at once" line under the subtitle
//   - books sit side by side in their own cards (.is-multiple)
//   - each card gets a "TOME I / TOME II" label
// With only one book it looks the same as before.
//
// NEW: covers now use <BookCover>, which tries Open Library first and then
// Google Books if Open Library has nothing (see components/BookCover.js).
// ============================================================================

import { useState, useEffect } from 'react';
import BookCover from './BookCover';

// Roman numerals for the "TOME I / II / III" labels.
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

// Number words for the "Two tomes at once" line (falls back to digits).
const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];

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

  // True only when 2+ books are on the currently-reading shelf.
  const multiple = books.length > 1;
  const countWord = NUMBER_WORDS[books.length] || books.length;

  return (
    <div className="card currently-reading-banner">

      <div className="court-label">
        ✦ ROYAL READING CHAMBER ✦
      </div>

      <h2 className="court-title">
        What Thou Art Presently Reading
      </h2>

      <p className="court-subtitle">
        May the Fairy Court grant thee sufficient emotional resilience.
      </p>

      {/* Only shown when reading several books at once */}
      {multiple && (
        <p className="currently-reading-count">
          📚 {countWord} tomes at once. The Court is scandalised, yet quietly impressed.
        </p>
      )}

      {/* "is-multiple" switches the list from stacked to side-by-side */}
      <div className={`currently-reading-list${multiple ? ' is-multiple' : ''}`}>
        {books.map((book, i) => (

          <div key={book.id} className="currently-reading-item">

            {/* "TOME I", "TOME II"... only when there's more than one */}
            {multiple && (
              <p className="currently-reading-numeral">
                TOME {ROMAN[i] || i + 1}
              </p>
            )}

            <BookCover
              key={book.id}
              book={book}
              size="M"
              className="currently-reading-cover"
              alt={book.title}
            />

            <p className="currently-reading-title">{book.title}</p>
            <p className="currently-reading-author">by {book.author}</p>
            <p className="currently-reading-status">
              📖 Currently under Royal Observation
            </p>

            {(book.genres || []).length > 0 && (
              <div className="book-tags">
                {book.genres.map(g => <span key={g}>{g}</span>)}
              </div>
            )}

          </div>

        ))}
      </div>

    </div>
  );
}