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
// Note: WHERE shelf = 'to-read' means finished/removed books disappear from
// this list entirely the moment they're marked as such.
// =============================================================================
import { sql } from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  const { rows } = await sql`
    SELECT id, title, author, pub_year, cover_url, genres, author_gender, enriched, queued_at, kobo_at, isbn, isbn13
    FROM books
    WHERE shelf = 'to-read'
    ORDER BY title ASC
  `;
  // ^ added isbn and isbn13 - the frontend uses these to build a cover
  // image URL on the fly (see lib/covers.js), since the CSV never gives us
  // a real cover_url to store.

  return Response.json({ books: rows });
}