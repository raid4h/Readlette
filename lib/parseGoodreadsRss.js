// =============================================================================
// Fetches and parses your Goodreads "to-read" shelf RSS feed.
//
// Goodreads killed their developer API in 2020, but every shelf on a PUBLIC
// profile still quietly exposes an RSS feed - no login, no API key needed.
// It shows your ~100 most recently-added books, newest first.
//
// That "100 most recent, newest first" behavior is exactly what makes
// automatic syncing work: as long as you don't add more than 100 books to
// Goodreads between syncs (this app syncs daily), every new book you add
// will show up here and get pulled in automatically. You never have to
// remember to add it anywhere else.
// =============================================================================
import { XMLParser } from 'fast-xml-parser';

/**
 * @param {string} goodreadsUserId - your numeric Goodreads user ID
 * @returns {Promise<Array<object>>} the books currently on your to-read shelf,
 *                                    normalized into the shape our DB expects
 */
export async function fetchGoodreadsRss(goodreadsUserId) {
  const url = `https://www.goodreads.com/review/list_rss/${goodreadsUserId}?shelf=to-read`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Goodreads RSS request failed (${res.status}). Double-check GOODREADS_USER_ID ` +
      `and that your profile's privacy setting is "Public".`
    );
  }

  const xmlText = await res.text();
  const parser = new XMLParser();
  const parsed = parser.parse(xmlText);

  // The feed is namespaced as rss -> channel -> item (one item per book).
  // When there's exactly one book on the shelf, fast-xml-parser gives you a
  // single object instead of an array of one - the [].concat() trick below
  // normalizes both cases into a plain array.
  const items = [].concat(parsed?.rss?.channel?.item || []);

  return items.map((item) => ({
    goodreadsId: String(item.book_id),
    title: item.title,
    author: item.author_name,
    isbn: item.isbn ? String(item.isbn) : '',
    isbn13: item.isbn13 ? String(item.isbn13) : '',
    pubYear: parseInt(item.book_published, 10) || null,
    coverUrl: item.book_medium_image_url || null,
    dateAdded: item.user_date_added ? new Date(item.user_date_added) : new Date(),
  })).filter((book) => book.goodreadsId && book.title);
}
