// =============================================================================
// POST /api/import-csv
//
// Step 2 of a two-step import (see /api/import-csv/parse for step 1).
// Receives one JSON batch of already-parsed books and upserts just that
// batch. The frontend calls this repeatedly, one batch at a time, so it can
// show real "X of Y tomes catalogued" progress - see components/UploadCsv.js.
//
// NEW: also saves my_rating and date_read.
//   - my_rating follows Goodreads exactly (un-rate a book there and it
//     clears here on the next upload).
//   - date_read uses COALESCE: if the CSV has no date for a book but we
//     already have one saved (e.g. set by the in-app finish button), we
//     keep the one we have instead of wiping it.
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
    // "?? null" turns a missing value into null, so the query never
    // receives "undefined" (which the database driver rejects).
    await sql`
      INSERT INTO books (goodreads_id, title, author, isbn, isbn13, pub_year, date_added, shelf, my_rating, date_read)
      VALUES (${book.goodreadsId}, ${book.title}, ${book.author}, ${book.isbn}, ${book.isbn13}, ${book.pubYear}, ${book.dateAdded}, ${book.shelf}, ${book.myRating ?? null}, ${book.dateRead ?? null})
      ON CONFLICT (goodreads_id) DO UPDATE SET
        title = EXCLUDED.title,
        author = EXCLUDED.author,
        isbn = EXCLUDED.isbn,
        isbn13 = EXCLUDED.isbn13,
        pub_year = EXCLUDED.pub_year,
        date_added = EXCLUDED.date_added,
        shelf = EXCLUDED.shelf,
        my_rating = EXCLUDED.my_rating,
        date_read = COALESCE(EXCLUDED.date_read, books.date_read)
    `;
    imported++;
  }

  return Response.json({ imported });
}