// =============================================================================
// Parses a Goodreads "Export Library" CSV into a clean list of book objects.
//
// This is ONLY used for the one-time (or occasional manual) backfill, because
// the Goodreads RSS feed caps out at 100 books - too small for a 1251-book
// shelf. The CSV export has no such limit, so it's the only way to get your
// FULL history in. After this first import, the daily RSS sync (see
// lib/parseGoodreadsRss.js) takes over and keeps things up to date.
// =============================================================================
import Papa from 'papaparse';

// Goodreads exports ISBNs in a spreadsheet-formula-escaped format so Excel
// doesn't strip leading zeros, e.g.  ="0060590297"
// This turns that into a plain "0060590297" (or '' if there's nothing there).
function cleanIsbn(raw) {
  if (!raw) return '';
  return raw.replace(/^="?/, '').replace(/"?$/, '').trim();
}

/**
 * @param {string} csvText - the raw contents of goodreads_library_export.csv
 * @returns {Array<object>} books currently on the "to-read" shelf, normalized
 *                           into the shape our database expects
 */
export function parseGoodreadsCsv(csvText) {
  const { data, errors } = Papa.parse(csvText, {
    header: true,        // use the first row as field names
    skipEmptyLines: true,
  });

  if (errors.length) {
    // We don't throw here - a couple of malformed rows shouldn't block the
    // whole import. We just log it so it's visible in Vercel's function logs.
    console.warn('CSV parse warnings:', errors.slice(0, 5));
  }

  return data
    // "Exclusive Shelf" is Goodreads' term for the one shelf a book belongs
    // to (read / currently-reading / to-read) - this is how we only pull in
    // your to-read pile and skip books you've already finished.
    .filter((row) => row['Exclusive Shelf'] === 'to-read')
    .map((row) => ({
      goodreadsId: row['Book Id'],
      title: row['Title'],
      author: row['Author'],
      isbn: cleanIsbn(row['ISBN']),
      isbn13: cleanIsbn(row['ISBN13']),
      // Prefer "Original Publication Year" (e.g. when a book was first
      // written) over "Year Published" (which can reflect a reprint edition)
      // since that's what you actually want for a decade filter.
      pubYear: parseInt(row['Original Publication Year'] || row['Year Published'], 10) || null,
      dateAdded: row['Date Added'] ? new Date(row['Date Added']) : null,
      coverUrl: null, // the CSV export doesn't include cover images
    }))
    .filter((book) => book.goodreadsId && book.title);
}
