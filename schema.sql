-- =============================================================================
-- SPINE TIME - Database schema
-- Run this ONCE against your Vercel Postgres database before using the app.
-- (Instructions for how to run this are in README.md, Step 2.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS books (
  id              SERIAL PRIMARY KEY,

  -- Goodreads' own book ID. This is how we recognize "have we already seen
  -- this book before?" when the CSV import and the RSS sync both try to add
  -- the same book - it's what stops you from getting duplicates.
  goodreads_id    TEXT UNIQUE NOT NULL,

  title           TEXT NOT NULL,
  author          TEXT NOT NULL,
  isbn            TEXT,
  isbn13          TEXT,
  pub_year        INTEGER,          -- used for the decade / year filter
  cover_url       TEXT,

  -- Genres pulled from Open Library after the fact. A book can have more
  -- than one (e.g. {"Fantasy","Romance"}), so it's an array, not a single
  -- text field. Starts empty until the enrichment step fills it in.
  genres          TEXT[] DEFAULT '{}',

  -- 'male' | 'female' | 'unknown' - looked up from Wikidata by author name.
  -- Defaults to 'unknown' until enrichment runs, and stays 'unknown' if we
  -- can't confidently match the author.
  author_gender   TEXT DEFAULT 'unknown',

  shelf           TEXT DEFAULT 'to-read',

  -- When you save a book from the Oracle's pick to read next, this gets set
  -- to the current timestamp. NULL means "not on your list." Using a
  -- timestamp (not just true/false) lets the sidebar sort itself by most
  -- recently chosen, for free.
  queued_at       TIMESTAMP,

  -- Has the genre/gender lookup been attempted for this book yet? The
  -- enrichment endpoint processes books in small batches, so this flag is
  -- how it knows what's left to do.
  enriched        BOOLEAN DEFAULT FALSE,

  date_added      TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Speeds up "give me the next batch of un-enriched books"
CREATE INDEX IF NOT EXISTS idx_books_enriched ON books (enriched) WHERE enriched = FALSE;

-- Speeds up "give me everything on the to-read shelf"
CREATE INDEX IF NOT EXISTS idx_books_shelf ON books (shelf);

CREATE INDEX IF NOT EXISTS idx_books_queued ON books (queued_at) WHERE queued_at IS NOT NULL;
