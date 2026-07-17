// =============================================================================
// POST /api/books/status
//
// Handles quick per-book actions from the UI:
//   - { id, action: 'queue' }    -> save this book to Thy Fated Reads
//   - { id, action: 'unqueue' }  -> remove it from that list (still to-read)
//   - { id, action: 'finish' }   -> mark it read right now, in Readlette only
//
// Note: this never writes back to Goodreads (Goodreads has no API for
// that). Treat 'finish' as a fast local shortcut. Goodreads stays the real
// source of truth - your next full CSV re-upload reconciles everything to
// match whatever Goodreads actually says, so remember to also mark the book
// read there whenever you get a chance.
// =============================================================================
import { sql } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

const ACTIONS = ['queue', 'unqueue', 'finish'];

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
    await sql`UPDATE books SET shelf = 'read', queued_at = NULL WHERE id = ${id}`;
  }

  return Response.json({ ok: true });
}