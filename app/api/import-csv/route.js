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

  // We insert one at a time in a loop rather than one giant bulk statement -
  // slightly slower, but much simpler to read and debug, and 1251 rows still
  // only takes a few seconds.
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
        date_added = EXCLUDED.date_added
    `;
    imported++;
  }

  return Response.json({ imported });
}
