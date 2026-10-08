// =============================================================================
// POST /api/books/status
//
// Handles quick per-book actions from the UI:
//   - { id, action: 'queue' }    -> save this book to Thy Fated Reads
//   - { id, action: 'unqueue' }  -> remove it from that list (still to-read)
//   - { id, action: 'finish' }   -> mark it read right now, in Readlette only
//   - { id, action: 'kobo' }     -> flag this book as "on my Kobo"
//   - { id, action: 'unkobo' }   -> remove that flag
//   - { id, action: 'remove' }   -> NEW: manually take a book off your
//                                   to-read shelf, e.g. you changed your
//                                   mind and don't want to read it anymore
//
// Note: none of this writes back to Goodreads. 'remove' just sets shelf to
// 'removed' - since /api/books only ever returns shelf = 'to-read' books,
// this makes the book vanish from Readlette immediately. It's also safe
// against a future CSV reupload: since the book won't be in that CSV
// either (you removed it there too, presumably), the upsert simply won't
// touch this row, so it stays 'removed' rather than snapping back.
// =============================================================================
import { sql } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

const ACTIONS = ['queue', 'unqueue', 'finish', 'kobo', 'unkobo', 'remove'];

export async function POST(request) {
  const { id, action } = await request.json();

  if (!id || !ACTIONS.includes(action)) {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (action === 'queue') {
    await sql`UPDATE books SET queued_at = NOW() WHERE id = ${id}`;
  } else if (action === 'unqueue') {
    await sql`UPDATE books SET queued_at = NULL WHERE id = ${id}`;
  } else if (action === 'finish') {
    // Also stamps today's date as "date read" (only if there isn't one
    // already), so books finished in-app show up in Tomes Read with a date.
    await sql`UPDATE books SET shelf = 'read', queued_at = NULL, date_read = COALESCE(date_read, CURRENT_DATE) WHERE id = ${id}`;
  } else if (action === 'kobo') {
    await sql`UPDATE books SET kobo_at = NOW() WHERE id = ${id}`;
  } else if (action === 'unkobo') {
    await sql`UPDATE books SET kobo_at = NULL WHERE id = ${id}`;
  } else if (action === 'remove') {
    // Clears queued/kobo flags too, so it can't linger in either sidebar
    // list after it's gone.
    await sql`UPDATE books SET shelf = 'removed', queued_at = NULL, kobo_at = NULL WHERE id = ${id}`;
  }

  return Response.json({ ok: true });
}