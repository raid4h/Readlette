// =============================================================================
// POST /api/enrich-pages
//
// Same batching pattern as /api/enrich (see that file's comments for the
// full reasoning) - but for page counts, using its OWN pages_enriched flag
// instead of the existing enriched flag. This is deliberately separate:
// all 1254 books already have enriched = TRUE from genre/gender enrichment,
// so reusing that flag here would mean this code never runs for any
// existing book. pages_enriched starts FALSE for everyone, independent of
// that earlier pass.
// =============================================================================
import { sql } from '../../../lib/db';
import { enrichPages } from '../../../lib/enrichPages';

const BATCH_SIZE = 20;

export const dynamic = 'force-dynamic';

export async function POST() {
  const { rows: batch } = await sql`
    SELECT id, isbn, isbn13 FROM books
    WHERE pages_enriched = FALSE
    LIMIT ${BATCH_SIZE}
  `;

  for (const book of batch) {
    const pageCount = await enrichPages(book);

    await sql`
      UPDATE books
      SET page_count = ${pageCount}, pages_enriched = TRUE
      WHERE id = ${book.id}
    `;

    // Same polite pause as the existing enrich route, being kind to
    // Open Library's free API.
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  const { rows } = await sql`SELECT COUNT(*)::int AS remaining FROM books WHERE pages_enriched = FALSE`;

  return Response.json({ processed: batch.length, remaining: rows[0].remaining });
}