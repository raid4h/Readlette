// =============================================================================
// POST /api/books/status
//
// Handles quick per-book actions from the UI:
//   - { id, action: 'queue' }    -> save this book to Thy Fated Reads
//   - { id, action: 'unqueue' }  -> remove it from that list (still to-read)
//   - { id, action: 'finish' }   -> mark it read right now, in Readlette only
//   - { id, action: 'kobo' }     -> NEW: flag this book as "on my Kobo"
//   - { id, action: 'unkobo' }   -> NEW: remove that flag
//
// Note: this never writes back to Goodreads (Goodreads has no API for
// that). Treat 'finish' as a fast local shortcut - Goodreads stays the real
// source of truth, and your next full CSV re-upload reconciles everything.
//
// 'kobo' / 'unkobo' are entirely local too - there's no way for Readlette
// or Goodreads to know what's actually loaded on your e-reader, so this is
// just a manual flag you toggle yourself from the Kobo list or search bar.
// =============================================================================
import { sql } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

// Every action this endpoint understands. If you add a new one, it has to
// go in BOTH this array AND the if/else chain below, or it'll 400.
const ACTIONS = ['queue', 'unqueue', 'finish', 'kobo', 'unkobo'];

export async function POST(request) {
  const { id, action } = await request.json();

  // Reject anything malformed before it ever touches the database.
  if (!id || !ACTIONS.includes(action)) {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (action === 'queue') {
    // Add to Thy Fated Reads.
    await sql`UPDATE books SET queued_at = NOW() WHERE id = ${id}`;
  } else if (action === 'unqueue') {
    // Remove from Thy Fated Reads (book stays to-read).
    await sql`UPDATE books SET queued_at = NULL WHERE id = ${id}`;
  } else if (action === 'finish') {
    // Mark read locally, and drop it out of Fated Reads since it's done.
    await sql`UPDATE books SET shelf = 'read', queued_at = NULL WHERE id = ${id}`;
  } else if (action === 'kobo') {
    // NEW: flag this book as living on the Kobo.
    await sql`UPDATE books SET kobo_at = NOW() WHERE id = ${id}`;
  } else if (action === 'unkobo') {
    // NEW: remove the Kobo flag.
    await sql`UPDATE books SET kobo_at = NULL WHERE id = ${id}`;
  }

  return Response.json({ ok: true });
}