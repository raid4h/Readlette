'use client';

// =============================================================================
// The actual "pick a book" moment. Clicking the wax-seal button:
//   1. Picks a random book from whatever's left after filtering
//   2. Scatters a few sparkle glyphs around the button (pure CSS animation,
//      replayed each time by giving the sparkle wrapper a new `key`, which
//      makes React remount it from scratch)
//   3. Reveals the picked book in a little card below
// =============================================================================
import { useState } from 'react';

const SPARKLE_GLYPHS = ['✦', '✧', '❀', '✦'];

function randomSparkles() {
  // A handful of sparkles at random angles/distances around the button,
  // each with a slightly staggered start so they don't all pop at once.
  return Array.from({ length: 7 }, (_, i) => ({
    id: i,
    glyph: SPARKLE_GLYPHS[i % SPARKLE_GLYPHS.length],
    top: `${50 + Math.sin((i / 7) * Math.PI * 2) * 42}%`,
    left: `${50 + Math.cos((i / 7) * Math.PI * 2) * 42}%`,
    delay: `${i * 0.04}s`,
  }));
}

export default function ShuffleCard({ filteredBooks }) {
  const [pickedBook, setPickedBook] = useState(null);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [sparkles, setSparkles] = useState([]);

  function handleShuffle() {
    if (filteredBooks.length === 0) return;
    const choice = filteredBooks[Math.floor(Math.random() * filteredBooks.length)];
    setPickedBook(choice);
    setSparkles(randomSparkles());
    setShuffleCount((n) => n + 1); // forces the sparkle field to remount & replay
  }

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div className="shuffle-zone">
        <button
          type="button"
          className="shuffle-button"
          onClick={handleShuffle}
          disabled={filteredBooks.length === 0}
          aria-label="Pick a random book"
        >
          Pick a Book
        </button>

        {/* key={shuffleCount} remounts this div every shuffle so the CSS
            animation on each sparkle plays again from the start */}
        <div className="sparkle-field" key={shuffleCount} aria-hidden="true">
          {sparkles.map((s) => (
            <span
              key={s.id}
              className="sparkle"
              style={{ top: s.top, left: s.left, animationDelay: s.delay }}
            >
              {s.glyph}
            </span>
          ))}
        </div>
      </div>

      <p className="hint" style={{ marginTop: 4 }}>
        {filteredBooks.length} book{filteredBooks.length === 1 ? '' : 's'} match right now
      </p>

      {filteredBooks.length === 0 && (
        <p className="empty-state">No books match those filters yet - try loosening one.</p>
      )}

      {pickedBook && (
        <div className="book-reveal" key={pickedBook.id}>
          {pickedBook.cover_url && (
            <img className="book-cover" src={pickedBook.cover_url} alt="" />
          )}
          <p className="book-title">{pickedBook.title}</p>
          <p className="book-author">by {pickedBook.author}</p>
          <div className="book-tags">
            {pickedBook.pub_year && <span>{pickedBook.pub_year}</span>}
            {(pickedBook.genres || []).map((g) => (
              <span key={g}>{g}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
