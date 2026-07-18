// =============================================================================
// GET /api/books
//
// Returns every book on your to-read shelf as JSON. We deliberately return
// the WHOLE list in one go, rather than adding server-side filter/shuffle
// endpoints - even at 1251+ books this is a small enough payload that it's
// simpler and snappier to just filter and pick randomly in the browser (see
// app/page.js). That also means shuffling again is instant, no server
// round-trip needed.
//
// Note: WHERE shelf = 'to-read' means finished books disappear from this
// list entirely the moment they're marked read - that's intentional, it's
// what stops the Oracle from ever re-picking a book you've already finished.
// =============================================================================
import { sql } from '../../../lib/db';

// Without this, Next.js may try to statically cache this route's response at
// build time - but the book list changes whenever a sync/import/enrich runs,
// so it always needs to hit the database fresh on every request.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  const { rows } = await sql`
    SELECT id, title, author, pub_year, cover_url, genres, author_gender, enriched, queued_at, kobo_at
    FROM books
    WHERE shelf = 'to-read'
    ORDER BY title ASC
  `;
  // ^ added kobo_at above - without it, the Kobo list and search-add
  // buttons would toggle correctly in the database, but the UI would never
  // reflect it since this endpoint is the only source of truth the
  // frontend reads from.

  return Response.json({ books: rows });
}