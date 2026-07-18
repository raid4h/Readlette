// =============================================================================
// Readlette
// ----------------------------------------------------------------------------
// Series parsing helper.
//
// Goodreads titles often look like:
//   "A Court of Mist and Fury (A Court of Thorns and Roses, #2)"
// This pulls the series name + book number out of that pattern. Used to
// stop the Oracle from suggesting ACOTAR #6 while #1-5 are still unread.
// =============================================================================

// Matches "... (Series Name, #4)" at the end of a title.
// Number can be a decimal, e.g. "#2.5" for a novella.
const SERIES_PATTERN = /\(([^,()]+),?\s*#([\d.]+)\)\s*$/;

export function parseSeriesInfo(title) {
  if (!title) return null;

  const match = title.match(SERIES_PATTERN);
  if (!match) return null; // not part of a series, or doesn't follow this format

  const [, seriesName, seriesNumberRaw] = match;
  const seriesNumber = parseFloat(seriesNumberRaw);

  if (Number.isNaN(seriesNumber)) return null;

  return {
    seriesName: seriesName.trim(),
    seriesNumber,
  };
}