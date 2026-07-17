// =============================================================================
// Parses a Goodreads "Export Library" CSV into a clean list of book objects.
//
// Returns EVERY book in the export, tagged with its real current shelf
// ("to-read", "read", "currently-reading", etc.) - not just to-read ones.
// This lets the import route reconcile status: a book that's moved off
// to-read (because you finished it) gets its existing row's shelf updated
// to match, so it naturally disappears from the app without needing to be
// deleted. New to-read books get inserted as usual.
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
 * @returns {Array<object>} every book in the export, normalized into the
 *                           shape our database expects, each tagged with
 *                           its real current shelf
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
    .map((row) => ({
      goodreadsId: row['Book Id'],
      title: row['Title'],
      author: row['Author'],
      isbn: cleanIsbn(row['ISBN']),
      isbn13: cleanIsbn(row['ISBN13']),
      // "Exclusive Shelf" is Goodreads' term for the one shelf a book
      // currently belongs to. We carry it through as-is so the import route
      // can reconcile books that have moved off to-read since last import.
      shelf: row['Exclusive Shelf'] || 'read',
      // Prefer "Original Publication Year" (e.g. when a book was first
      // written) over "Year Published" (which can reflect a reprint edition)
      // since that's what you actually want for a decade filter.
      pubYear: parseInt(row['Original Publication Year'] || row['Year Published'], 10) || null,
      dateAdded: row['Date Added'] ? new Date(row['Date Added']) : null,
      coverUrl: null, // the CSV export doesn't include cover images
    }))
    .filter((book) => book.goodreadsId && book.title);
}