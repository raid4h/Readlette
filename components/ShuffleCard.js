'use client';

// =============================================================================
// Readlette
// ----------------------------------------------------------------------------
// The heart of the app.
//
// Clicking the button:
// 1. Plays a little "Fairy Court is deciding..." animation.
// 2. Cycles through magical loading messages.
// 3. Picks a random book.
// 4. Displays a random royal decree.
// 5. Shows sparkles.
//
// Once a book is revealed you can:
//   - 💌 Save it to 🎀 Thy Fated Reads
//   - ✅ Mark it already read, right here, without visiting Fated Reads
// =============================================================================

import { useState, useEffect } from 'react';

import {
  royalDecrees,
  decreeTitles,
  deliberationSequence,
} from "../lib/royalDecrees";

const SPARKLE_GLYPHS = [
  '✦',
  '✧',
  '❀',
  '✦',
  '⋆',
  '✿',
  '♡',
  '☾',
];

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

export default function ShuffleCard({ filteredBooks, onStatusChange }) {
  const [pickedBook, setPickedBook] = useState(null);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [sparkles, setSparkles] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState("");
  const [decreeTitle, setDecreeTitle] = useState("");

  // NEW: themed line shown after marking the current pick "already read".
  // Cleared whenever a fresh shuffle happens, so it never carries over
  // onto a different book.
  const [finishMessage, setFinishMessage] = useState("");

  async function handleShuffle() {

    if (filteredBooks.length === 0 || thinking) return;

    setThinking(true);
    setPickedBook(null);
    setFinishMessage(""); // NEW: clear any leftover banner from last pick

    setSparkles(randomSparkles());

    for (const line of deliberationSequence) {
      setThinkingMessage(line);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const choice =
      filteredBooks[Math.floor(Math.random() * filteredBooks.length)];

    setPickedBook(choice);
    setDecreeTitle(decreeTitles[Math.floor(Math.random() * decreeTitles.length)]);
    setSparkles(randomSparkles());
    setShuffleCount(n => n + 1);
    setThinking(false);
  }

  async function toggleFated() {

    if (!pickedBook) return;

    const isQueued = !!pickedBook.queued_at;
    const action = isQueued ? 'unqueue' : 'queue';

    // Optimistic local update so the button flips instantly.
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

  // NEW: mark the currently revealed book as already finished, right here,
  // instead of having to go find it in Thy Fated Reads first.
  async function markFinished() {

    if (!pickedBook) return;

    // Themed confirmation line, shown right away (optimistic, same pattern
    // as toggleFated above).
    setFinishMessage(
      "It is decreed: this tome is VANQUISHED. Onward to thy next unread victim."
    );

    // Optimistically update local state so the button/badge react instantly.
    setPickedBook(prev => ({
      ...prev,
      shelf: 'read',
      queued_at: null, // finishing also drops it out of Fated Reads
    }));

    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pickedBook.id, action: 'finish' }),
    });

    // Refresh the full book list so Fated Reads / everything else stays in sync.
    onStatusChange?.();
  }

  return (

    <div className="card shuffle-card">

      <div className="shuffle-zone">

        <button
          className="shuffle-button"
          onClick={handleShuffle}
          disabled={thinking || filteredBooks.length === 0}
        >

          {thinking ? (
            <>
              ✨
              <br />
              Consulting
              <br />
              the Oracle
            </>
          ) : (
            <>
              ✨
              <br />
              Consult
              <br />
              the Oracle
            </>
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

      <p className="hint">
        {filteredBooks.length} possible destiny
        {filteredBooks.length === 1 ? "" : "ies"}
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

      {pickedBook && (

        <div className="book-reveal" key={pickedBook.id}>

          <p className="royal-decree">{decreeTitle}</p>

          <div className="royal-divider">✦ ───────── ✦</div>

          <h2 className="thou-shalt">THOU SHALT READ</h2>

          {pickedBook.cover_url && (
            <img
              className="book-cover"
              src={pickedBook.cover_url}
              alt={pickedBook.title}
            />
          )}

          <p className="book-title">{pickedBook.title}</p>

          <p className="book-author">by {pickedBook.author}</p>

          <div className="book-tags">
            {pickedBook.pub_year && <span>{pickedBook.pub_year}</span>}
            {(pickedBook.genres || []).map(g => (
              <span key={g}>{g}</span>
            ))}
          </div>

          {/* NEW: wrapper so both action buttons sit side by side */}
          <div className="book-reveal-actions">

            <button
              type="button"
              className="btn btn-secondary fated-save-btn"
              onClick={toggleFated}
            >
              {pickedBook.queued_at ? '💔 Remove from Fated Reads' : '💌 Save to Fated Reads'}
            </button>

            {/* NEW: only show if not already marked read, so you can't
                "finish" the same book twice from this card */}
            {pickedBook.shelf !== 'read' && (
              <button
                type="button"
                className="btn btn-secondary fated-save-btn"
                onClick={markFinished}
              >
                ✅ 'Tis Already Read
              </button>
            )}

          </div>

          {/* NEW: themed confirmation line, shown after clicking the button above */}
          {finishMessage && (
            <p className="hint fated-finish-banner">
              {finishMessage}
            </p>
          )}

        </div>

      )}

    </div>

  );

}