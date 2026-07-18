'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// Small cover thumbnail for list rows (search results, Fated Reads, Kobo
// shelf). Renders nothing at all - not even an empty box - if the book has
// no ISBN or Open Library has no cover for it, so rows without art still
// line up cleanly instead of showing a broken-image icon.
// ============================================================================

import { useState } from 'react';
import { getCoverUrl } from '../lib/covers';

export default function BookMiniCover({ book }) {
  // Tracks whether the image failed to load (404, no ISBN, etc).
  const [failed, setFailed] = useState(false);

  const src = getCoverUrl(book, 'S'); // 'S' = small, right size for a list row

  if (!src || failed) return null;

  return (
    <img
      className="book-mini-cover"
      src={src}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}