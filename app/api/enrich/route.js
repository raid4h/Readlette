// =============================================================================
// POST /api/enrich
//
// Fills in genre + author gender for books that don't have it yet, in small
// batches (BATCH_SIZE at a time). We batch instead of doing everything at
// once because:
//   1. Serverless functions have a time limit, and looking up 1251 books
//      one-by-one against two external APIs would run way past it.
//   2. It's polite to the free Open Library / Wikidata APIs we're using.
//
// The frontend (see components/SyncPanel.js) calls this repeatedly in a
// loop - "give me 20 more, tell me how many are left" - and shows a little
// progress bar until `remaining` hits 0. You can also just leave it running
// in the background; it'll pick up right where it left off if interrupted.
// =============================================================================
import { sql } from '../../../lib/db';
import { enrichGenre } from '../../../lib/enrichGenre';
import { enrichGender } from '../../../lib/enrichGender';

const BATCH_SIZE = 20;

export const dynamic = 'force-dynamic';

export async function POST() {
  const { rows: batch } = await sql`
    SELECT id, isbn, isbn13, author FROM books
    WHERE enriched = FALSE
    LIMIT ${BATCH_SIZE}
  `;

  for (const book of batch) {
    const [genres, gender] = await Promise.all([
      enrichGenre(book),
      enrichGender(book.author),
    ]);

    // The ::text[] cast makes sure Postgres treats the incoming JS array as
    // a text array parameter rather than trying to guess its type.
    await sql`
      UPDATE books
      SET genres = ${genres}::text[], author_gender = ${gender}, enriched = TRUE
      WHERE id = ${book.id}
    `;

    // A short, polite pause between books so we're not hammering the free
    // Open Library / Wikidata APIs in a tight loop.
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  const { rows } = await sql`SELECT COUNT(*)::int AS remaining FROM books WHERE enriched = FALSE`;

  return Response.json({ processed: batch.length, remaining: rows[0].remaining });
}
