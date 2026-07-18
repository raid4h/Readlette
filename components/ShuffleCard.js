'use client';

// =============================================================================
// Readlette
// ----------------------------------------------------------------------------
// Two draw modes:
//   - Consult the Oracle: single big reveal
//   - 🔮 Draw Three Fates: 3-book tarot-style spread
//
// FIXED THIS PASS (after a UI-only edit elsewhere had unintentionally
// broken three things in the single-reveal block):
//   1. CRASH: court-message read royalDecrees.length directly during
//      render. If royalDecrees ever comes through undefined, that throws
//      and takes down the whole page (no error boundary catches it). Now
//      picked once per shuffle into state, with a safe fallback.
//   2. Cover was reading pickedBook.cover_url (always null - the DB never
//      stores this) instead of the computed ISBN-based coverSrc. Restored.
//   3. The 💌/✅/🗑️ action buttons had been dropped from the single
//      reveal entirely. Restored, styled to sit with the new layout.
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

// NEW: guarded version of randomItem specifically for court-message.
// Never throws, even if royalDecrees turns out to be undefined, empty, or
// not an array at all - returns '' instead, which just renders nothing.
function safeRandomItem(array) {
  if (!Array.isArray(array) || array.length === 0) return '';
  return array[Math.floor(Math.random() * array.length)];
}

function pickUniqueBooks(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function callStatus(id, action) {
  await fetch('/api/books/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action }),
  });
}

export default function ShuffleCard({ filteredBooks, onStatusChange }) {
  const [pickedBook, setPickedBook] = useState(null);
  const [threeFates, setThreeFates] = useState(null);

  const [shuffleCount, setShuffleCount] = useState(0);
  const [sparkles, setSparkles] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState("");
  const [decreeTitle, setDecreeTitle] = useState("");

  // NEW: the italicized court-message line, now picked once per shuffle
  // and stored in state - same pattern as decreeTitle - instead of being
  // recomputed live inside JSX on every render (which was both the crash
  // source and would have re-randomized on every unrelated re-render,
  // e.g. every time you clicked a button).
  const [courtMessage, setCourtMessage] = useState("");

  const [actionMessage, setActionMessage] = useState("");

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
    setThreeFates(null);
    setActionMessage("");

    await runDeliberation();

    const choice = filteredBooks[Math.floor(Math.random() * filteredBooks.length)];

    setPickedBook(choice);
    setDecreeTitle(decreeTitles[Math.floor(Math.random() * decreeTitles.length)]);
    setCourtMessage(safeRandomItem(royalDecrees)); // NEW: picked once here, safely
    setSparkles(randomSparkles());
    setShuffleCount(n => n + 1);
    setThinking(false);
  }

  async function handleDrawThree() {
    if (filteredBooks.length === 0 || thinking) return;

    setThinking(true);
    setPickedBook(null);
    setThreeFates(null);
    setActionMessage("");

    await runDeliberation();

    const picks = pickUniqueBooks(filteredBooks, Math.min(3, filteredBooks.length));

    setThreeFates(picks);
    setDecreeTitle(decreeTitles[Math.floor(Math.random() * decreeTitles.length)]);
    setSparkles(randomSparkles());
    setShuffleCount(n => n + 1);
    setThinking(false);
  }

  // --- Single-pick actions ---

  async function toggleFated() {
    if (!pickedBook) return;
    const isQueued = !!pickedBook.queued_at;
    const action = isQueued ? 'unqueue' : 'queue';

    setPickedBook(prev => ({
      ...prev,
      queued_at: isQueued ? null : new Date().toISOString(),
    }));

    await callStatus(pickedBook.id, action);
    onStatusChange?.();
  }

  async function markFinished() {
    if (!pickedBook) return;

    setActionMessage(
      "It is decreed: this tome is VANQUISHED. Onward to thy next unread victim."
    );

    const id = pickedBook.id;
    setPickedBook(prev => ({ ...prev, shelf: 'read', queued_at: null }));

    await callStatus(id, 'finish');
    onStatusChange?.();
  }

  async function removeBook() {
    if (!pickedBook) return;

    const title = pickedBook.title;
    const id = pickedBook.id;

    setActionMessage(
      `📕 "${title}" — The Court hath decreed this tome BANISHED from the Royal Archives, as though it never existed at all.`
    );
    setPickedBook(null);

    await callStatus(id, 'remove');
    onStatusChange?.();
  }

  // --- Tarot-spread actions (unchanged - this path was working fine) ---

  async function toggleFatedInSpread(index) {
    const book = threeFates[index];
    const isQueued = !!book.queued_at;
    const action = isQueued ? 'unqueue' : 'queue';

    setThreeFates(prev =>
      prev.map((b, i) =>
        i === index ? { ...b, queued_at: isQueued ? null : new Date().toISOString() } : b
      )
    );

    await callStatus(book.id, action);
    onStatusChange?.();
  }

  async function markFinishedInSpread(index) {
    const book = threeFates[index];

    setActionMessage(
      "It is decreed: this tome is VANQUISHED. Onward to thy next unread victim."
    );

    setThreeFates(prev =>
      prev.map((b, i) => (i === index ? { ...b, shelf: 'read', queued_at: null } : b))
    );

    await callStatus(book.id, 'finish');
    onStatusChange?.();
  }

  async function removeFromSpread(index) {
    const book = threeFates[index];

    setActionMessage(
      `📕 "${book.title}" — The Court hath decreed this tome BANISHED from the Royal Archives, as though it never existed at all.`
    );

    setThreeFates(prev => prev.filter((_, i) => i !== index));

    await callStatus(book.id, 'remove');
    onStatusChange?.();
  }

  // Restored: this builds the cover from ISBN via Open Library, same as
  // everywhere else in the app - NOT pickedBook.cover_url, which is
  // always null.
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

      {pickedBook && (

        <div
          className="book-reveal"
          key={pickedBook.id}
        >

          <div className="royal-scroll-top">
            ✦════════════════════✦
          </div>

          <p className="royal-decree">
            {decreeTitle}
          </p>

          <h2 className="thou-shalt">
            THOU SHALT READ...
          </h2>

          {/* FIXED: was reading royalDecrees.length live during render,
              which crashed if royalDecrees was undefined. Now reads from
              state, set safely once per shuffle above. Only renders the
              paragraph at all if there's actually a message to show. */}
          {courtMessage && (
            <p className="court-message">
              {courtMessage}
            </p>
          )}

          {/* FIXED: was pickedBook.cover_url (always null in the DB).
              Now uses coverSrc, built from ISBN via Open Library, same
              as the tarot spread and every list view. Hides gracefully
              on 404 instead of showing a broken-image icon. */}
          {coverSrc && (
            <img
              className="book-cover"
              src={coverSrc}
              alt={pickedBook.title}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}

          <p className="book-title">
            {pickedBook.title}
          </p>

          <p className="book-author">
            by {pickedBook.author}
          </p>

          <div className="book-tags">

            {pickedBook.pub_year && (
              <span>{pickedBook.pub_year}</span>
            )}

            {(pickedBook.genres || []).map(g => (
              <span key={g}>
                {g}
              </span>
            ))}

          </div>

          {/* RESTORED: these three buttons existed before and were
              dropped during the UI edit - toggleFated/markFinished/
              removeBook were still defined in this file, just no longer
              called from anywhere. */}
          <div className="book-reveal-actions">

            <button
              type="button"
              className="btn btn-secondary fated-save-btn"
              onClick={toggleFated}
            >
              {pickedBook.queued_at ? '💔 Remove from Fated Reads' : '💌 Save to Fated Reads'}
            </button>

            {pickedBook.shelf !== 'read' && (
              <button
                type="button"
                className="btn btn-secondary fated-save-btn"
                onClick={markFinished}
              >
                ✅ 'Tis Already Read
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary fated-save-btn"
              onClick={removeBook}
            >
              🗑️ Banish This Tome
            </button>

          </div>

          <div className="royal-scroll-bottom">
            ✦════════════════════✦
          </div>

        </div>

      )}

      {/* --- Three Fates tarot spread (unchanged - this was working) --- */}
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

                    <button
                      type="button"
                      className="fated-icon-btn"
                      title="Not interested - remove from library"
                      onClick={() => removeFromSpread(i)}
                    >
                      🗑️
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {actionMessage && (
        <p className="hint fated-finish-banner">{actionMessage}</p>
      )}

    </div>

  );
}