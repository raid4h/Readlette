// =============================================================================
// POST /api/import-csv
//
// Step 2 of a two-step import (see /api/import-csv/parse for step 1).
// Receives one JSON batch of already-parsed books and upserts just that
// batch. The frontend calls this repeatedly, one batch at a time, so it can
// show real "X of Y tomes catalogued" progress - see components/UploadCsv.js.
// =============================================================================
import { sql } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { books } = await request.json();

  if (!Array.isArray(books) || books.length === 0) {
    return Response.json({ error: 'No books in batch.' }, { status: 400 });
  }

  let imported = 0;

  for (const book of books) {
    await sql`
      INSERT INTO books (goodreads_id, title, author, isbn, isbn13, pub_year, date_added, shelf)
      VALUES (${book.goodreadsId}, ${book.title}, ${book.author}, ${book.isbn}, ${book.isbn13}, ${book.pubYear}, ${book.dateAdded}, ${book.shelf})
      ON CONFLICT (goodreads_id) DO UPDATE SET
        title = EXCLUDED.title,
        author = EXCLUDED.author,
        isbn = EXCLUDED.isbn,
        isbn13 = EXCLUDED.isbn13,
        pub_year = EXCLUDED.pub_year,
        date_added = EXCLUDED.date_added,
        shelf = EXCLUDED.shelf
    `;
    imported++;
  }

  return Response.json({ imported });
}