// =============================================================================
// POST /api/import-csv
//
// Receives the raw text of your Goodreads export CSV (the frontend reads the
// uploaded file and sends its contents as the request body - see
// components/UploadCsv.js), parses it, and upserts every to-read book into
// the database.
//
// "Upsert" = insert if new, or update if we've already seen that
// goodreads_id before. This makes it SAFE to re-run this import any time
// (e.g. you re-export your library later) without creating duplicates.
// =============================================================================
import { sql } from '../../../lib/db';
import { parseGoodreadsCsv } from '../../../lib/parseGoodreadsCsv';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const csvText = await request.text();

  if (!csvText || csvText.length < 10) {
    return Response.json({ error: 'No CSV content received.' }, { status: 400 });
  }

  const books = parseGoodreadsCsv(csvText);

  if (books.length === 0) {
    return Response.json(
      { error: 'No to-read books found in that file. Is this a Goodreads library export CSV?' },
      { status: 400 }
    );
  }

  let imported = 0;

  for (const book of books) {
    await sql`
      INSERT INTO books (goodreads_id, title, author, isbn, isbn13, pub_year, date_added, shelf)
      VALUES (${book.goodreadsId}, ${book.title}, ${book.author}, ${book.isbn}, ${book.isbn13}, ${book.pubYear}, ${book.dateAdded}, 'to-read')
      ON CONFLICT (goodreads_id) DO UPDATE SET
        title = EXCLUDED.title,
        author = EXCLUDED.author,
        isbn = EXCLUDED.isbn,
        isbn13 = EXCLUDED.isbn13,
        pub_year = EXCLUDED.pub_year,
        date_added = EXCLUDED.date_added,
        shelf = EXCLUDED.shelf
        -- shelf was missing here before. Without it, re-running an import
        -- (or a daily sync) on a book that already exists in the table would
        -- silently leave its shelf value untouched forever - which is why
        -- every row ended up with a shelf value that never matched
        -- WHERE shelf = 'to-read' in /api/books, even though COUNT(*)
        -- correctly showed all 1254 rows existed.
    `;
    imported++;
  }

  return Response.json({ imported });
}