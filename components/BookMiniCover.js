'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// Small cover thumbnail for list rows (search results, Fated Reads, Kobo
// shelf). Now just a thin wrapper around <BookCover>, so it gets the
// Open Library -> Google Books fallback automatically. Renders nothing if
// neither source has a cover, so rows without art still line up cleanly.
// ============================================================================

import BookCover from './BookCover';

export default function BookMiniCover({ book }) {
  return (
    <BookCover
      key={book.id}
      book={book}
      size="S"
      className="book-mini-cover"
    />
  );
}