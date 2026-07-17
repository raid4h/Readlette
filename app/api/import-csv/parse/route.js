// =============================================================================
// POST /api/import-csv/parse
//
// Step 1 of a two-step import. Parses the uploaded CSV and returns the full
// list of to-read books as JSON - no database writes yet. This lets the
// frontend know the total book count up front, so it can show a real
// "X of Y tomes catalogued" progress bar while the actual import (step 2,
// see /api/import-csv) happens in batches.
// =============================================================================
import { parseGoodreadsCsv } from '../../../../lib/parseGoodreadsCsv';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const csvText = await request.text();

  if (!csvText || csvText.length < 10) {
    return Response.json({ error: 'No CSV content received.' }, { status: 400 });
  }

  const books = parseGoodreadsCsv(csvText);

  if (books.length === 0) {
    return Response.json(
      { error: 'The Council found no tomes awaiting thee. Art thou certain this scroll came from Goodreads?' },
      { status: 400 }
    );
  }

  return Response.json({ books });
}