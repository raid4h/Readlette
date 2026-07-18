// =============================================================================
// POST /api/import-csv/reconcile
//
// Step 3 of import - runs ONCE after all batches from /api/import-csv finish
// successfully (see components/UploadCsv.js).
//
// The batch upsert can only ADD or UPDATE rows present in the CSV - if you
// delete a book from Goodreads entirely, it's simply absent from the
// export, and an absent row is never touched by an upsert. This endpoint
// catches that specific case: any book currently in Readlette whose
// goodreads_id does NOT appear anywhere in the freshly uploaded CSV gets
// marked shelf = 'removed', so it disappears from Readlette the same way
// it disappeared from your actual Goodreads shelf.
//
// Note: this is different from the shelf reconciliation that already
// happens in /api/import-csv/route.js - that one handles books that MOVED
// shelves (e.g. to-read -> read) because they're still present in the CSV,
// just tagged differently. This one only catches full deletions.
// =============================================================================
import { sql } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { goodreadsIds } = await request.json();

  if (!Array.isArray(goodreadsIds) || goodreadsIds.length === 0) {
    return Response.json({ error: 'No IDs provided.' }, { status: 400 });
  }

  const { rows } = await sql`
    UPDATE books
    SET shelf = 'removed', queued_at = NULL, kobo_at = NULL
    WHERE shelf != 'removed'
    AND NOT (goodreads_id = ANY(${goodreadsIds}))
    RETURNING id
  `;

  return Response.json({ removed: rows.length });
}