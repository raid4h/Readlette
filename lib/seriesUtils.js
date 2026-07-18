// =============================================================================
// Readlette
// ----------------------------------------------------------------------------
// Series parsing helper. Tries two patterns, in order:
//
//   1. "Title (Series Name, #4)" - the standard Goodreads format for most
//      novels, e.g. "A Court of Mist and Fury (A Court of Thorns and
//      Roses, #2)"
//
//   2. "Series Name, Vol. 3: Subtitle" - common for comics/graphic novels,
//      e.g. "Locke & Key, Vol. 3: Crown of Shadows" - these often DON'T
//      carry a trailing "(Series, #N)" parenthetical, so pattern 1 alone
//      was letting mid-series volumes slip through as if standalone.
//
// If a title still isn't being grouped correctly after this, the fix is
// to look at the exact title text (search it in the 🔍 bar) and add a
// third pattern tailored to it - guessing further patterns blind risks
// false-matching unrelated titles that happen to contain a comma or "Vol."
// =============================================================================

const PAREN_PATTERN = /\(([^,()]+),?\s*#([\d.]+)\)\s*$/;
const VOLUME_PATTERN = /^(.+?),\s*Vol(?:ume)?\.?\s*(\d+(?:\.\d+)?)\b/i;

export function parseSeriesInfo(title) {
  if (!title) return null;

  // Try the standard "(Series, #N)" format first.
  const parenMatch = title.match(PAREN_PATTERN);
  if (parenMatch) {
    const [, seriesName, seriesNumberRaw] = parenMatch;
    const seriesNumber = parseFloat(seriesNumberRaw);
    if (!Number.isNaN(seriesNumber)) {
      return { seriesName: seriesName.trim(), seriesNumber };
    }
  }

  // Fall back to "Series, Vol. N: Subtitle" - common for comics.
  const volMatch = title.match(VOLUME_PATTERN);
  if (volMatch) {
    const [, seriesName, seriesNumberRaw] = volMatch;
    const seriesNumber = parseFloat(seriesNumberRaw);
    if (!Number.isNaN(seriesNumber)) {
      return { seriesName: seriesName.trim(), seriesNumber };
    }
  }

  return null; // genuinely standalone, or a format we don't recognize yet
}