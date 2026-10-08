// =============================================================================
// Parses a Goodreads "Export Library" CSV into a clean list of book objects.
//
// Returns EVERY book in the export, tagged with its real current shelf
// ("to-read", "read", "currently-reading", etc.) - not just to-read ones.
// This lets the import route reconcile status.
//
// NEW: also keeps "My Rating" and "Date Read" so the Tomes Read tab can
// show them. Both are optional - plenty of books have neither.
// =============================================================================
import Papa from 'papaparse';

// Goodreads exports ISBNs in a spreadsheet-formula-escaped format so Excel
// doesn't strip leading zeros, e.g.  ="0060590297"
// This turns that into a plain "0060590297" (or '' if there's nothing there).
function cleanIsbn(raw) {
  if (!raw) return '';
  return raw.replace(/^="?/, '').replace(/"?$/, '').trim();
}

// NEW: "My Rating" is 0 when you haven't rated the book. We store null for
// that, so "unrated" and "rated" are easy to tell apart later.
function parseRating(raw) {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1 || n > 5) return null;
  return n;
}

// NEW: Goodreads writes dates like 2024/03/15. We keep them as a plain
// "2024-03-15" text string (not a JS Date) so timezones can never shift a
// date by a day. Returns null if the date is blank or in an unexpected format.
function parseDateRead(raw) {
  if (!raw) return null;
  const normalized = raw.trim().replace(/\//g, '-');
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

/**
 * @param {string} csvText - the raw contents of goodreads_library_export.csv
 * @returns {Array<object>} every book in the export, normalized into the
 *                           shape our database expects
 */
export function parseGoodreadsCsv(csvText) {
  const { data, errors } = Papa.parse(csvText, {
    header: true,        // use the first row as field names
    skipEmptyLines: true,
  });

  if (errors.length) {
    // A couple of malformed rows shouldn't block the whole import.
    console.warn('CSV parse warnings:', errors.slice(0, 5));
  }

  return data
    .map((row) => ({
      goodreadsId: row['Book Id'],
      title: row['Title'],
      author: row['Author'],
      isbn: cleanIsbn(row['ISBN']),
      isbn13: cleanIsbn(row['ISBN13']),
      shelf: row['Exclusive Shelf'] || 'read',
      pubYear: parseInt(row['Original Publication Year'] || row['Year Published'], 10) || null,
      dateAdded: row['Date Added'] ? new Date(row['Date Added']) : null,
      coverUrl: null, // the CSV export doesn't include cover images

      // NEW
      myRating: parseRating(row['My Rating']),
      dateRead: parseDateRead(row['Date Read']),
    }))
    .filter((book) => book.goodreadsId && book.title);
}