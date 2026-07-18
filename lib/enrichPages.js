// =============================================================================
// Readlette
// ----------------------------------------------------------------------------
// Fetches a page count for one book from Open Library, using the same
// ISBN-based approach as covers (lib/covers.js) - but hitting Open
// Library's book-data endpoint instead of the image endpoint.
//
// Returns null (not an error) if there's no ISBN, the fetch fails, or
// Open Library just doesn't have a page count on file for this edition -
// same "graceful gap" pattern as covers, since not every book will have
// this data available.
// =============================================================================

export async function enrichPages(book) {
  const isbn = book.isbn13 || book.isbn;
  if (!isbn) return null; // nothing to look up without an ISBN

  try {
    const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    if (!res.ok) return null; // 404, rate limit, etc - just skip this book

    const data = await res.json();
    return data.number_of_pages || null;
  } catch {
    // Network error, malformed JSON, etc - fail quietly, same as a missing ISBN
    return null;
  }
}