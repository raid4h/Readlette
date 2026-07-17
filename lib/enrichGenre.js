// =============================================================================
// Looks up genre tags for a book using Open Library (free, no API key).
//
// Goodreads doesn't give us real genres (their "genres" are just whichever
// shelf-tags other users typed in most often), and neither the CSV export
// nor the RSS feed include them. So instead, we look each book up by ISBN
// on Open Library, which returns a big messy list of "subjects" - things
// like "Fantasy fiction", "Juvenile fiction", "Dragons", "New York Times
// bestseller", etc. We map that messy list down to a short, useful set of
// genre buckets for filtering.
// =============================================================================

// Keyword -> bucket mapping. Order matters a little (first match per keyword
// wins), but a book can land in multiple buckets, which is what we want -
// e.g. a book can be both "Fantasy" and "Romance".
const GENRE_KEYWORDS = {
  Fantasy: ['fantasy', 'magic', 'dragon', 'wizard'],
  'Science Fiction': ['science fiction', 'sci-fi', 'dystopia', 'space opera'],
  Romance: ['romance', 'love stories'],
  Mystery: ['mystery', 'detective', 'crime'],
  Thriller: ['thriller', 'suspense'],
  Horror: ['horror', 'ghost stories', 'supernatural'],
  'Historical Fiction': ['historical fiction'],
  'Literary Fiction': ['literary fiction', 'literature'],
  'Young Adult': ['young adult', 'juvenile fiction', 'teen'],
  Classics: ['classic'],
  Nonfiction: ['biography', 'autobiography', 'essays', 'nonfiction', 'history'],
  Poetry: ['poetry', 'poems'],
  Graphic: ['graphic novel', 'comics'],
};

function bucketSubjects(subjects) {
  const found = new Set();
  const lowerSubjects = subjects.map((s) => s.toLowerCase());

  for (const [bucket, keywords] of Object.entries(GENRE_KEYWORDS)) {
    if (keywords.some((kw) => lowerSubjects.some((s) => s.includes(kw)))) {
      found.add(bucket);
    }
  }

  return [...found];
}

/**
 * @param {{isbn: string, isbn13: string}} book
 * @returns {Promise<string[]>} genre bucket names, e.g. ["Fantasy","Romance"].
 *          Returns [] if we couldn't find/match anything - that's normal and
 *          fine, it just means the book won't show up under a genre filter
 *          (it'll still show up when no genre filter is applied).
 */
export async function enrichGenre(book) {
  const isbn = book.isbn13 || book.isbn;
  if (!isbn) return [];

  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const bookData = data[`ISBN:${isbn}`];
    const subjects = (bookData?.subjects || []).map((s) => s.name);

    return bucketSubjects(subjects);
  } catch (err) {
    // Network hiccups shouldn't crash the whole enrichment batch - just
    // treat this one book as "no genre data found".
    console.warn(`Genre lookup failed for ISBN ${isbn}:`, err.message);
    return [];
  }
}
