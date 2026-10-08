// =============================================================================
// GET /api/read-books
//
// Every book on the "read" shelf, for the Tomes Read tab. Separate from
// /api/books (which only returns to-read books) so nothing about the Oracle
// pool changes.
//
// to_char(...) hands the date back as a plain "YYYY-MM-DD" string, so the
// browser never has to deal with timezone conversions.
// =============================================================================
import { sql } from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  const { rows } = await sql`
    SELECT id, title, author, isbn, isbn13, my_rating,
           to_char(date_read, 'YYYY-MM-DD') AS date_read
    FROM books
    WHERE shelf = 'read'
    ORDER BY books.date_read DESC NULLS LAST, title ASC
  `;

  return Response.json({ books: rows });
}