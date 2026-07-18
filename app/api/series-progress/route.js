// =============================================================================
// GET /api/series-progress
//
// Groups ALL your books (regardless of shelf) by detected series, so we can
// show real completion progress ("3 of 7 read").
//
// FIXED: previously returned any series with an unread entry left, even if
// you'd never read anything from that series (0 of 4, etc). Now only
// returns series where readCount > 0 - i.e. ones you've actually begun.
// =============================================================================
import { sql } from '../../../lib/db';
import { parseSeriesInfo } from '../../../lib/seriesUtils';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  const { rows } = await sql`
    SELECT id, title, shelf, isbn, isbn13
    FROM books
  `;

  const seriesMap = new Map();

  for (const book of rows) {
    const info = parseSeriesInfo(book.title);
    if (!info) continue;

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
    const nextUnread = books.find(b => b.shelf === 'to-read');

    // Must have something left to read AND already have started reading it.
    // This is the actual fix - readCount > 0 is the new condition.
    if (!nextUnread || readCount === 0) continue;

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