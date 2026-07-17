'use client';

// =============================================================================
// Readlette
// ----------------------------------------------------------------------------
// The heart of the app.
//
// Clicking the button:
//
// 1. Plays a little "Fairy Court is deciding..." animation.
// 2. Cycles through magical loading messages.
// 3. Picks a random book.
// 4. Displays a random royal decree.
// 5. Shows sparkles.
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

export default function ShuffleCard({ filteredBooks }) {
  const [pickedBook, setPickedBook] = useState(null);

  const [shuffleCount, setShuffleCount] = useState(0);

  const [sparkles, setSparkles] = useState([]);

  /* Is the Fairy Court currently "thinking"? */
  const [thinking, setThinking] = useState(false);

  /* The message shown while the Court deliberates */
  const [thinkingMessage, setThinkingMessage] = useState("");

  /* Final decree shown above the chosen book */
  const [decreeTitle, setDecreeTitle] = useState("");

  async function handleShuffle() {

  if (filteredBooks.length === 0 || thinking) return;

  setThinking(true);

  setPickedBook(null);

  setSparkles(randomSparkles());

  for (const line of deliberationSequence) {

    setThinkingMessage(line);

    await new Promise(resolve => setTimeout(resolve, 300));

  }

  const choice =
    filteredBooks[
      Math.floor(Math.random() * filteredBooks.length)
    ];

  setPickedBook(choice);

  setDecreeTitle(

    decreeTitles[
      Math.floor(Math.random() * decreeTitles.length)
    ]

  );

  setSparkles(randomSparkles());

  setShuffleCount(n => n + 1);

  setThinking(false);

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

        <div
          className="sparkle-field"
          key={shuffleCount}
        >
          {sparkles.map(s => (

            <span
              key={s.id}
              className="sparkle"
              style={{
                top: s.top,
                left: s.left,
                animationDelay: s.delay,
              }}
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

          <div className="thinking-stars">

            ✦ ✧ ✦

          </div>

          <p>

            {thinkingMessage}

          </p>

        </div>

      )}

      {pickedBook && (

        <div
          className="book-reveal"
          key={pickedBook.id}
        >

          <p className="royal-decree">

            {decreeTitle}

          </p>

          <div className="royal-divider">

            ✦ ───────── ✦

          </div>

          <h2 className="thou-shalt">

            THOU SHALT READ

          </h2>

          {pickedBook.cover_url && (

            <img
              className="book-cover"
              src={pickedBook.cover_url}
              alt={pickedBook.title}
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

        </div>

      )}

    </div>

  );

}