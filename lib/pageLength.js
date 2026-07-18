// =============================================================================
// Readlette
// ----------------------------------------------------------------------------
// Turns a raw page count into one of three named length categories.
// Shared between FilterPanel.js (to render the chips) and page.js (to
// actually filter books) so the bucketing logic only lives in one place.
// =============================================================================

// Order matters here - used to render chips in a sensible short-to-long
// sequence, not alphabetically.
export const LENGTH_ORDER = ['Short Quest', 'Standard Journey', 'Epic Tome'];

export function getPageLengthLabel(pageCount) {
  // No data yet (not enriched, or Open Library had nothing) - this book
  // simply won't show up under any length filter, same as how a book with
  // no pub_year doesn't show up under any decade filter.
  if (pageCount === null || pageCount === undefined) return null;

  if (pageCount < 250) return 'Short Quest';
  if (pageCount <= 450) return 'Standard Journey';
  return 'Epic Tome';
}