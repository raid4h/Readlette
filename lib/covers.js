// =============================================================================
// Readlette
// ----------------------------------------------------------------------------
// Cover art helper.
//
// The Goodreads CSV export doesn't include cover images at all (confirmed:
// 0 of 1254 books had cover_url set) - but it DOES include ISBN/ISBN13,
// and Open Library can turn an ISBN into a cover image for free, no API
// key needed. So instead of storing a cover_url in the database, we just
// build the image URL on demand wherever a book is displayed.
// =============================================================================

export function getCoverUrl(book, size = 'M') {
  // Prefer ISBN13 (more standardized/complete), fall back to ISBN10.
  const isbn = book?.isbn13 || book?.isbn;
  if (!isbn) return null; // no ISBN at all - nothing we can do

  // "?default=false" tells Open Library to return a real 404 when it has
  // no cover for this ISBN, instead of silently returning a blank grey
  // placeholder image. That's what lets onError handlers below actually
  // detect a missing cover and hide the broken-image icon.
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg?default=false`;
}