// =============================================================================
// GET /api/sync-rss
//
// This is the route that makes new Goodreads additions show up automatically.
// It's called two ways:
//   1. By Vercel Cron, once a day (see vercel.json) - fully automatic.
//   2. By the "Sync now" button in the UI, if you don't want to wait.
//
// It fetches your to-read shelf's RSS feed (your ~100 most recently added
// books) and upserts them. Anything already in the DB just gets its details
// refreshed; anything new gets inserted with enriched=false, which queues it
// up for the next enrichment pass (see /api/enrich).
// =============================================================================
import { sql } from '../../../lib/db';
import { fetchGoodreadsRss } from '../../../lib/parseGoodreadsRss';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // When Vercel Cron calls this route, it automatically sends
  // "Authorization: Bearer <CRON_SECRET>". We check it IF it's present, but
  // don't require it, so the "Sync now" button in the browser can also call
  // this route directly. If you want to lock this down further (e.g. this
  // app will ever be reachable by anyone but you), require the header always.
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const goodreadsUserId = process.env.GOODREADS_USER_ID;
  if (!goodreadsUserId) {
    return Response.json({ error: 'GOODREADS_USER_ID is not set.' }, { status: 500 });
  }

  let books;
  try {
    books = await fetchGoodreadsRss(goodreadsUserId);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }

  let newCount = 0;
  let refreshedCount = 0;

  for (const book of books) {
    const { rowCount, rows } = await sql`
      INSERT INTO books (goodreads_id, title, author, isbn, isbn13, pub_year, cover_url, date_added, shelf)
      VALUES (${book.goodreadsId}, ${book.title}, ${book.author}, ${book.isbn}, ${book.isbn13}, ${book.pubYear}, ${book.coverUrl}, ${book.dateAdded}, 'to-read')
      ON CONFLICT (goodreads_id) DO UPDATE SET
        title = EXCLUDED.title,
        cover_url = EXCLUDED.cover_url
      RETURNING (xmax = 0) AS inserted
    `;
    // xmax = 0 is a Postgres trick that tells us whether this row was a
    // fresh INSERT (new book!) or an UPDATE (we already knew about it).
    if (rows[0]?.inserted) newCount++;
    else refreshedCount++;
  }

  return Response.json({ newBooksAdded: newCount, alreadyKnown: refreshedCount, syncedAt: new Date().toISOString() });
}
