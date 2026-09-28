// =============================================================================
// Readlette
// ----------------------------------------------------------------------------
// Google Books cover lookup - the SECOND choice, only used when Open Library
// has no cover for a book.
//
// Unlike Open Library (which is just an image URL), Google Books needs two
// steps: (1) ask its search API "do you have this book?", (2) read the image
// URL out of the answer. This file does step 1 + 2 and hands back a plain
// image URL, or null if nothing was found.
//
// No API key needed for light personal use. If Google ever starts refusing
// requests (quota), this just returns null and no cover shows - nothing breaks.
// =============================================================================

// Remembers answers for this page visit, so the same book is never looked up
// twice (e.g. when the list re-renders). Key: "bookId:size" -> Promise.
const cache = new Map();

// "Jane Eyre: An Autobiography (Classics, #2)" -> "Jane Eyre"
// (Goodreads titles carry series info and subtitles, which confuse searches.)
function cleanTitle(title) {
  return (title || '')
    .replace(/\s*\([^)]*\)\s*$/, '') // drop a trailing "(Series, #N)"
    .split(':')[0]                   // drop any ": subtitle"
    .trim();
}

// Lowercase letters/numbers only, so "Pride & Prejudice" == "pride prejudice".
function normalize(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Pulls an image URL out of one Google Books result, or null if it has none.
function pickImage(volumeInfo, size) {
  const links = volumeInfo?.imageLinks;
  if (!links) return null;

  // 'S' (tiny list thumbnails) prefers the small one; everything else the normal one.
  const raw =
    size === 'S'
      ? links.smallThumbnail || links.thumbnail
      : links.thumbnail || links.smallThumbnail;

  if (!raw) return null;

  return raw
    .replace(/^http:/, 'https:') // Google often returns http://, which browsers may block
    .replace('&edge=curl', '');  // removes the curled-page-corner effect
}

// One call to the Google Books search API. Returns a list of results ([] on any problem).
async function queryGoogle(q) {
  let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5&printType=books`;

  // Optional: if you ever get a Google Books API key, put it in Vercel as
  // NEXT_PUBLIC_GOOGLE_BOOKS_KEY and this will use it automatically.
  const key = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_KEY;
  if (key) url += `&key=${key}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  return data.items || [];
}

// The actual lookup: ISBN first, then title + author.
async function lookup(book, size) {
  try {
    // Step A: exact edition by ISBN. An ISBN match is the same book, so accept it.
    const isbn = book.isbn13 || book.isbn;
    if (isbn) {
      const items = await queryGoogle(`isbn:${isbn}`);
      for (const item of items) {
        const img = pickImage(item.volumeInfo, size);
        if (img) return img;
      }
    }

    // Step B: no ISBN, or Google didn't know it - search by title + author.
    const title = cleanTitle(book.title);
    if (!title) return null;

    const q = `intitle:"${title}"` + (book.author ? ` inauthor:"${book.author}"` : '');
    const items = await queryGoogle(q);

    // Only accept a result whose title actually matches, so we don't attach
    // some unrelated book's cover.
    const wanted = normalize(title);
    for (const item of items) {
      const got = normalize(item.volumeInfo?.title);
      const img = pickImage(item.volumeInfo, size);
      if (img && got && (got.includes(wanted) || wanted.includes(got))) return img;
    }

    return null;
  } catch {
    // Network error, blocked request, etc. - just means "no cover".
    return null;
  }
}

// What the components call. Returns a Promise of an image URL (or null).
export function fetchGoogleCover(book, size = 'M') {
  const key = `${book.id}:${size}`;
  if (!cache.has(key)) cache.set(key, lookup(book, size));
  return cache.get(key);
}