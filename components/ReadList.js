'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// 📖 Thy Conquered Tomes
//
// Books you've finished: cover, title, author, your star rating, and the
// date you read it. Data comes from the Goodreads CSV (re-upload it in
// Thy Library to refresh), plus anything finished with the in-app ✅ button.
//
// Fetches fresh every time the tab opens (the tab unmounts when you leave
// it), so a CSV re-upload shows up as soon as you come back here.
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import BookMiniCover from './BookMiniCover';

// The three ways the list can be ordered.
const SORTS = [
  { id: 'recent', label: '🕰 Recently Read' },
  { id: 'rating', label: '⭐ Highest Rated' },
  { id: 'title', label: '🔤 Title A–Z' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2024-03-15" -> "15 Mar 2024". Done by hand (no Date object) so the day
// can never shift because of timezones.
function formatDate(str) {
  if (!str) return 'Date unrecorded';
  const [y, m, d] = str.split('-');
  return `${parseInt(d, 10)} ${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

// 4 -> ★★★★☆   (or "Unrated" if there's no rating)
function Stars({ rating }) {
  if (!rating) return <span className="read-unrated">Unrated</span>;
  return (
    <span className="read-stars" title={`${rating} out of 5`}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export default function ReadList() {
  const [books, setBooks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetch('/api/read-books', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setBooks(data.books || []))
      .catch(() => setBooks([]))
      .finally(() => setLoaded(true));
  }, []);

  // Re-sorts only when the books or the chosen sort change. Books missing a
  // date (or rating) always sink to the bottom of that ordering.
  const sorted = useMemo(() => {
    const list = [...books];

    if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'rating') {
      list.sort((a, b) =>
        (b.my_rating || 0) - (a.my_rating || 0) ||
        (b.date_read || '').localeCompare(a.date_read || '')
      );
    } else {
      // 'recent': newest date first, undated books last
      list.sort((a, b) => {
        if (!a.date_read && !b.date_read) return a.title.localeCompare(b.title);
        if (!a.date_read) return 1;
        if (!b.date_read) return -1;
        return b.date_read.localeCompare(a.date_read);
      });
    }

    return list;
  }, [books, sortBy]);

  return (
    <div className="card">

      <h2>📖 Thy Conquered Tomes</h2>

      {!loaded ? (
        <p className="hint">✨ Unrolling the Royal Chronicle...</p>
      ) : books.length === 0 ? (
        <p className="hint">
          No vanquished tomes on record. Present thy Goodreads CSV in Thy Library,
          and the Court shall fill this chronicle.
        </p>
      ) : (
        <>
          <p className="hint">
            {books.length} tome{books.length === 1 ? '' : 's'} vanquished.
          </p>

          <div className="chip-row">
            {SORTS.map(s => (
              <button
                key={s.id}
                type="button"
                className="chip"
                aria-pressed={sortBy === s.id}
                onClick={() => setSortBy(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <ul className="read-list fated-scroll">
            {sorted.map(book => (
              <li key={book.id} className="read-item">

                <div className="fated-item-info">
                  <BookMiniCover book={book} />
                  <div>
                    <p className="fated-item-title">{book.title}</p>
                    <p className="fated-item-author">{book.author}</p>
                  </div>
                </div>

                <div className="read-item-meta">
                  <Stars rating={book.my_rating} />
                  <span className="read-date">{formatDate(book.date_read)}</span>
                </div>

              </li>
            ))}
          </ul>
        </>
      )}

    </div>
  );
}