// =============================================================================
// GET /api/series-progress
//
// Groups ALL your books (regardless of shelf) by detected series, so we can
// show real completion progress ("3 of 7 read") - something /api/books
// can't do alone since it only ever returns shelf = 'to-read' books.
//
// Only returns series that still have at least one unread entry - a
// completed series has nothing useful to show here.
// =============================================================================
import { sql } from '../../../lib/db';
import { parseSeriesInfo } from '../../../lib/seriesUtils';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  // Deliberately no WHERE clause - we need read + to-read + everything to
  // compute true series completion.
  const { rows } = await sql`
    SELECT id, title, shelf, isbn, isbn13
    FROM books
  `;

  const seriesMap = new Map(); // seriesName -> array of books in that series

  for (const book of rows) {
    const info = parseSeriesInfo(book.title);
    if (!info) continue; // not part of a recognizable series

    if (!seriesMap.has(info.seriesName)) {
      seriesMap.set(info.seriesName, []);
    }
    seriesMap.get(info.seriesName).push({ ...book, seriesNumber: info.seriesNumber });
  }

  const result = [];

  for (const [seriesName, books] of seriesMap.entries()) {
    books.sort((a, b) => a.seriesNumber - b.seriesNumber);

    const total = books.length;
    const readCount = books.filter(b => b.shelf === 'read').length;

    // Lowest-numbered book still marked to-read - since the array is
    // sorted, .find() naturally gives us the earliest one.
    const nextUnread = books.find(b => b.shelf === 'to-read');

    // Skip series with nothing left to read (fully finished, or every
    // remaining entry got removed) - nothing useful to show.
    if (!nextUnread) continue;

    result.push({
      seriesName,
      total,
      readCount,
      nextUnread: {
        id: nextUnread.id,
        title: nextUnread.title,
        isbn: nextUnread.isbn,
        isbn13: nextUnread.isbn13,
      },
    });
  }

  result.sort((a, b) => a.seriesName.localeCompare(b.seriesName));

  return Response.json({ series: result });
}