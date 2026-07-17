// =============================================================================
// GET /api/books
//
// Returns every book on your to-read shelf as JSON. We deliberately return
// the WHOLE list in one go, rather than adding server-side filter/shuffle
// endpoints - even at 1251+ books this is a small enough payload that it's
// simpler and snappier to just filter and pick randomly in the browser (see
// app/page.js). That also means shuffling again is instant, no server
// round-trip needed.
// =============================================================================
import { sql } from '../../../lib/db';

// Without this, Next.js may try to statically cache this route's response at
// build time - but the book list changes whenever a sync/import/enrich runs,
// so it always needs to hit the database fresh on every request.
export const dynamic = 'force-dynamic';

export async function GET() {
  const { rows } = await sql`
    SELECT id, title, author, pub_year, cover_url, genres, author_gender, enriched
    FROM books
    WHERE shelf = 'to-read'
    ORDER BY title ASC
  `;

  return Response.json({ books: rows });
}
