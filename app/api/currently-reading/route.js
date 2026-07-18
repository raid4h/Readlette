// =============================================================================
// GET /api/currently-reading
//
// A separate, lightweight endpoint just for books tagged "currently-reading"
// on Goodreads. Kept separate from /api/books (which only returns
// shelf = 'to-read') so nothing about the Oracle pool or existing sidebar
// lists has to change - this is purely additive.
// =============================================================================
import { sql } from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  const { rows } = await sql`
    SELECT id, title, author, isbn, isbn13, genres
    FROM books
    WHERE shelf = 'currently-reading'
    ORDER BY title ASC
  `;

  return Response.json({ books: rows });
}