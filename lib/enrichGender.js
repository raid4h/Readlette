// =============================================================================
// Looks up an author's gender using Wikidata (free, no API key).
//
// We deliberately do NOT guess gender from the author's first name (a common
// shortcut using services like genderize.io) - that approach is unreliable
// and misgenders people constantly, especially for non-Western or ambiguous
// names. Instead we look the actual person up on Wikidata and read their
// "sex or gender" (property P21) if they have a page there. If we can't
// confidently find them, the book stays labeled "unknown" rather than
// guessing - "unknown" is a real, intentional filter option in this app,
// not a placeholder.
// =============================================================================

const WIKIDATA_GENDER_MAP = {
  Q6581097: 'male',
  Q6581072: 'female',
};

/**
 * @param {string} authorName
 * @returns {Promise<'male'|'female'|'unknown'>}
 */
export async function enrichGender(authorName) {
  if (!authorName) return 'unknown';

  try {
    // Step 1: search Wikidata for an entity matching this name.
    const searchUrl =
      `https://www.wikidata.org/w/api.php?action=wbsearchentities` +
      `&search=${encodeURIComponent(authorName)}&language=en&type=item&format=json&limit=1`;

    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'SpineTime/1.0 (personal book-picker app)' },
    });
    if (!searchRes.ok) return 'unknown';

    const searchData = await searchRes.json();
    const entityId = searchData?.search?.[0]?.id;
    if (!entityId) return 'unknown';

    // Step 2: fetch that entity's claims and read property P21 ("sex or
    // gender"). This is a real, structured fact about the actual person -
    // not a guess based on how their name sounds.
    const entityUrl =
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}` +
      `&props=claims&format=json`;

    const entityRes = await fetch(entityUrl, {
      headers: { 'User-Agent': 'SpineTime/1.0 (personal book-picker app)' },
    });
    if (!entityRes.ok) return 'unknown';

    const entityData = await entityRes.json();
    const genderClaim =
      entityData?.entities?.[entityId]?.claims?.P21?.[0]?.mainsnak?.datavalue?.value?.id;

    return WIKIDATA_GENDER_MAP[genderClaim] || 'unknown';
  } catch (err) {
    console.warn(`Gender lookup failed for "${authorName}":`, err.message);
    return 'unknown';
  }
}
