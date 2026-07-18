// =============================================================================
// Thin wrapper around the Neon serverless Postgres driver.
//
// (Note: Vercel Postgres - the older, more commonly-documented option - was
// fully retired and is now just Neon under the hood, offered through the
// Vercel Marketplace. This talks to the same kind of database, just via
// Neon's current, actively-maintained driver instead of the discontinued
// @vercel/postgres package.)
//
// `sql` is a "tagged template" function - you write queries like:
//   await sql`SELECT * FROM books WHERE id = ${someId}`
// and it automatically escapes/parameterizes anything inside ${...} for you,
// so you don't have to worry about SQL injection. Every file in this app
// that touches the database imports `sql` from here.
//
// { fullResults: true } makes queries return { rows, rowCount, ... } instead
// of just a bare array - that's the shape the rest of this app expects.
// =============================================================================
import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL, { fullResults: true });