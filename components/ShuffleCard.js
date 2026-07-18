'use client';

// =============================================================================
// Readlette
// ----------------------------------------------------------------------------
// The heart of the app. Two draw modes now:
//   - Consult the Oracle: the original single big reveal
//   - 🔮 Draw Three Fates: pulls 3 unique books, shown as a tarot-style
//     spread, each independently saveable to Fated Reads or markable read
// =============================================================================

import { useState, useEffect } from 'react';

import {
  royalDecrees,
  decreeTitles,
  deliberationSequence,
} from "../lib/royalDecrees";
import { getCoverUrl } from '../lib/covers';

const SPARKLE_GLYPHS = ['✦', '✧', '❀', '✦', '⋆', '✿', '♡', '☾'];
const TAROT_NUMERALS = ['I', 'II', 'III'];

function randomSparkles() {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i,
    glyph: SPARKLE_GLYPHS[Math.floor(Math.random() * SPARKLE_GLYPHS.length)],
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.5}s`,
  }));
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Picks `count` unique random books from a pool. A simple full shuffle is
// plenty fast for pool sizes in the hundreds/low thousands we're dealing
// with here - no need for anything fancier.
function pickUniqueBooks(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function ShuffleCard({ filteredBooks, onStatusChange }) {
  const [pickedBook, setPickedBook] = useState(null);
  const [threeFates, setThreeFates] = useState(null); // array of 3 books, or null

  const [shuffleCount, setShuffleCount] = useState(0);
  const [sparkles, setSparkles] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState("");
  const [decreeTitle, setDecreeTitle] = useState("");
  const [finishMessage, setFinishMessage] = useState("");

  async function runDeliberation() {
    setSparkles(randomSparkles());
    for (const line of deliberationSequence) {
      setThinkingMessage(line);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  async function handleShuffle() {
    if (filteredBooks.length === 0 || thinking) return;

    setThinking(true);
    setPickedBook(null);
    setThreeFates(null); // clear the other mode's result
    setFinishMessage("");

    await runDeliberation();

    const choice = filteredBooks[Math.floor(Math.random() * filteredBooks.length)];

    setPickedBook(choice);
    setDecreeTitle(decreeTitles[Math.floor(Math.random() * decreeTitles.length)]);
    setSparkles(randomSparkles());
    setShuffleCount(n => n + 1);
    setThinking(false);
  }

  async function handleDrawThree() {
    if (filteredBooks.length === 0 || thinking) return;

    setThinking(true);
    setPickedBook(null); // clear the other mode's result
    setThreeFates(null);
    setFinishMessage("");

    await runDeliberation();

    const picks = pickUniqueBooks(filteredBooks, Math.min(3, filteredBooks.length));

    setThreeFates(picks);
    setDecreeTitle(decreeTitles[Math.floor(Math.random() * decreeTitles.length)]);
    setSparkles(randomSparkles());
    setShuffleCount(n => n + 1);
    setThinking(false);
  }

  // --- Single-pick actions (unchanged from before) ---

  async function toggleFated() {
    if (!pickedBook) return;
    const isQueued = !!pickedBook.queued_at;
    const action = isQueued ? 'unqueue' : 'queue';

    setPickedBook(prev => ({
      ...prev,
      queued_at: isQueued ? null : new Date().toISOString(),
    }));

    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pickedBook.id, action }),
    });

    onStatusChange?.();
  }

  async function markFinished() {
    if (!pickedBook) return;

    setFinishMessage(
      "It is decreed: this tome is VANQUISHED. Onward to thy next unread victim."
    );

    setPickedBook(prev => ({ ...prev, shelf: 'read', queued_at: null }));

    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pickedBook.id, action: 'finish' }),
    });

    onStatusChange?.();
  }

  // --- Tarot-spread actions (same logic, applied to one card by index) ---

  async function toggleFatedInSpread(index) {
    const book = threeFates[index];
    const isQueued = !!book.queued_at;
    const action = isQueued ? 'unqueue' : 'queue';

    setThreeFates(prev =>
      prev.map((b, i) =>
        i === index ? { ...b, queued_at: isQueued ? null : new Date().toISOString() } : b
      )
    );

    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: book.id, action }),
    });

    onStatusChange?.();
  }

  async function markFinishedInSpread(index) {
    const book = threeFates[index];

    setFinishMessage(
      "It is decreed: this tome is VANQUISHED. Onward to thy next unread victim."
    );

    setThreeFates(prev =>
      prev.map((b, i) => (i === index ? { ...b, shelf: 'read', queued_at: null } : b))
    );

    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: book.id, action: 'finish' }),
    });

    onStatusChange?.();
  }

  const coverSrc = pickedBook ? getCoverUrl(pickedBook, 'L') : null;

  return (

    <div className="card shuffle-card">

      <div className="shuffle-zone">

        <button
          className="shuffle-button"
          onClick={handleShuffle}
          disabled={thinking || filteredBooks.length === 0}
        >
          {thinking ? (
            <>✨<br />Consulting<br />the Oracle</>
          ) : (
            <>✨<br />Consult<br />the Oracle</>
          )}
        </button>

        <div className="sparkle-field" key={shuffleCount}>
          {sparkles.map(s => (
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

      {/* NEW: secondary draw mode, sits just below the main button */}
      <button
        type="button"
        className="btn btn-secondary draw-three-btn"
        disabled={thinking || filteredBooks.length === 0}
        onClick={handleDrawThree}
      >
        🔮 Draw Three Fates
      </button>

      <p className="hint">
        {filteredBooks.length} possible destin{filteredBooks.length === 1 ? "y" : "ies"}
      </p>

      {filteredBooks.length === 0 && (
        <p className="empty-state">
          The Oracle refuseth.
          <br />
          Thy filters are too ridiculous.
        </p>
      )}

      {thinking && (
        <div className="oracle-thinking">
          <div className="thinking-stars">✦ ✧ ✦</div>
          <p>{thinkingMessage}</p>
        </div>
      )}

      {/* --- Single reveal --- */}
      {pickedBook && (
        <div className="book-reveal" key={pickedBook.id}>

          <p className="royal-decree">{decreeTitle}</p>
          <div className="royal-divider">✦ ───────── ✦</div>
          <h2 className="thou-shalt">THOU SHALT READ</h2>

          {coverSrc && (
            <img
              className="book-cover"
              src={coverSrc}
              alt={pickedBook.title}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}

          <p className="book-title">{pickedBook.title}</p>
          <p className="book-author">by {pickedBook.author}</p>

          <div className="book-tags">
            {pickedBook.pub_year && <span>{pickedBook.pub_year}</span>}
            {(pickedBook.genres || []).map(g => <span key={g}>{g}</span>)}
          </div>

          <div className="book-reveal-actions">
            <button type="button" className="btn btn-secondary fated-save-btn" onClick={toggleFated}>
              {pickedBook.queued_at ? '💔 Remove from Fated Reads' : '💌 Save to Fated Reads'}
            </button>

            {pickedBook.shelf !== 'read' && (
              <button type="button" className="btn btn-secondary fated-save-btn" onClick={markFinished}>
                ✅ 'Tis Already Read
              </button>
            )}
          </div>

        </div>
      )}

      {/* --- NEW: Three Fates tarot spread --- */}
      {threeFates && (
        <div className="book-reveal">

          <p className="royal-decree">{decreeTitle}</p>
          <div className="royal-divider">✦ ───────── ✦</div>
          <h2 className="thou-shalt">THY THREEFOLD FATE</h2>

          <div className="tarot-spread">
            {threeFates.map((book, i) => {
              const cover = getCoverUrl(book, 'M');
              return (
                <div key={book.id} className="tarot-card">

                  <p className="tarot-card-numeral">{TAROT_NUMERALS[i]}</p>

                  {cover && (
                    <img
                      className="tarot-card-cover"
                      src={cover}
                      alt={book.title}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}

                  <p className="tarot-card-title">{book.title}</p>
                  <p className="tarot-card-author">by {book.author}</p>

                  <div className="tarot-card-actions">
                    <button
                      type="button"
                      className="fated-icon-btn"
                      title="Save to Fated Reads"
                      onClick={() => toggleFatedInSpread(i)}
                    >
                      {book.queued_at ? '💔' : '💌'}
                    </button>

                    {book.shelf !== 'read' && (
                      <button
                        type="button"
                        className="fated-icon-btn"
                        title="Already read"
                        onClick={() => markFinishedInSpread(i)}
                      >
                        ✅
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Shared banner for both modes */}
      {finishMessage && (
        <p className="hint fated-finish-banner">{finishMessage}</p>
      )}

    </div>

  );
}