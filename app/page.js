'use client';

// =============================================================================
// The whole app lives on one page, now organized into tabs instead of a
// sidebar (the old layout got too crowded once Search/Fated Reads/Kobo
// were all visible simultaneously).
//
// Tabs:
//   🔮 The Oracle    - filters, standalone toggle, Consult/Draw Three Fates,
//                       Currently Reading banner
//   🔍 Summon a Tome - search-and-add bar
//   🎀 Fated Reads   - the saved-for-later shortlist
//   📱 Kobo Shelf    - manually tracked e-reader list
//   📜 Thy Library   - CSV upload/reupload + Royal Messenger Service
//
// The About box renders below every tab, not inside any one of them -
// it's a one-time "what is this" note for strangers, so it shouldn't be
// hidden behind a tab click most visitors would never make.
// =============================================================================
import { useState, useEffect, useMemo, useCallback } from 'react';
import UploadCsv from '../components/UploadCsv';
import SyncPanel from '../components/SyncPanel';
import FilterPanel from '../components/FilterPanel';
import ShuffleCard from '../components/ShuffleCard';
import FatedReads from '../components/FatedReads';
import KoboList from '../components/KoboList';
import CurrentlyReading from '../components/CurrentlyReading';
import AboutFooter from '../components/AboutFooter';
import TabNav from '../components/TabNav';
import { parseSeriesInfo } from '../lib/seriesUtils';
import { getPageLengthLabel } from '../lib/pageLength';

const EMPTY_FILTERS = {
  genres: new Set(),
  decades: new Set(),
  customYear: '',
  genders: new Set(),
  lengths: new Set(),
};

// Defined outside the component since it's static - no need to recreate
// this array on every render.
const TABS = [
  { id: 'oracle', label: '🔮 The Oracle' },
  { id: 'fated', label: '🎀 Fated Reads' },
  { id: 'kobo', label: '📱 Kobo Shelf' },
  { id: 'library', label: '📜 Thy Library' },
];

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [standaloneOnly, setStandaloneOnly] = useState(false);

  // NEW: which tab is currently showing. Defaults to the Oracle since
  // that's the core interaction most visits are for.
  const [activeTab, setActiveTab] = useState('oracle');

  const loadBooks = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch('/api/books', { cache: 'no-store' });
      if (!res.ok) throw new Error(`/api/books returned ${res.status}`);
      const data = await res.json();
      setBooks(data.books || []);
    } catch (err) {
      console.error('Failed to load books:', err);
      setLoadError('The Fairy Court could not reach the Royal Library. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      if (filters.genres.size > 0) {
        const bookGenres = book.genres || [];
        if (!bookGenres.some((g) => filters.genres.has(g))) return false;
      }

      const yearFilterActive = filters.decades.size > 0 || filters.customYear !== '';
      if (yearFilterActive) {
        const decade = book.pub_year ? `${Math.floor(book.pub_year / 10) * 10}s` : null;
        const matchesDecade = decade && filters.decades.has(decade);
        const matchesYear =
          filters.customYear !== '' && book.pub_year === Number(filters.customYear);
        if (!matchesDecade && !matchesYear) return false;
      }

      if (filters.genders.size > 0) {
        if (!filters.genders.has(book.author_gender)) return false;
      }

      if (filters.lengths.size > 0) {
        const label = getPageLengthLabel(book.page_count);
        if (!label || !filters.lengths.has(label)) return false;
      }

      return true;
    });
  }, [books, filters]);

  const oraclePool = useMemo(() => {
    const candidatePool = standaloneOnly
      ? filteredBooks.filter((book) => !parseSeriesInfo(book.title))
      : filteredBooks;

    const earliestInSeries = new Map();

    for (const book of candidatePool) {
      const info = parseSeriesInfo(book.title);
      if (!info) continue;

      const current = earliestInSeries.get(info.seriesName);
      if (current === undefined || info.seriesNumber < current) {
        earliestInSeries.set(info.seriesName, info.seriesNumber);
      }
    }

    return candidatePool.filter((book) => {
      const info = parseSeriesInfo(book.title);
      if (!info) return true;
      return info.seriesNumber === earliestInSeries.get(info.seriesName);
    });
  }, [filteredBooks, standaloneOnly]);

  return (
    <>
      <div className="app-shell">

        <header className="header">
          <h1>ʚ Readlette ɞ</h1>
          <p>the Fairy Court hath selected thy next tome.</p>
        </header>
        <div className="vine-divider">
        ✦ ₊˚ʚ 📖 ɞ˚₊ ✦
        </div>

        {loading ? (
          <p className="empty-state">✨ Summoning the Fairy Council...</p>
        ) : loadError ? (
          <div className="empty-state">
            <p>{loadError}</p>
            <button onClick={loadBooks}>Try again</button>
          </div>
        ) : books.length === 0 ? (
          // First-time setup - no tabs shown at all until there's
          // actually a library to browse.
          <UploadCsv onImported={loadBooks} />
        ) : (
          <>
            <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === 'oracle' && (
              <>
                <CurrentlyReading />

                <FilterPanel books={books} filters={filters} setFilters={setFilters} />

                <div className="standalone-toggle-row">
                  <button
                    type="button"
                    className="chip"
                    aria-pressed={standaloneOnly}
                    onClick={() => setStandaloneOnly((s) => !s)}
                  >
                    📖 Standalones only
                  </button>
                </div>

                <ShuffleCard filteredBooks={oraclePool} onStatusChange={loadBooks} />
              </>
            )}

            {activeTab === 'fated' && (
              <FatedReads books={books} onStatusChange={loadBooks} />
            )}

            {activeTab === 'kobo' && (
              <KoboList books={books} onStatusChange={loadBooks} />
            )}

            {activeTab === 'library' && (
              <>
                <UploadCsv onImported={loadBooks} />
                <SyncPanel books={books} onDataChanged={loadBooks} />
              </>
            )}
          </>
        )}
      </div>

      {/* Persistent across every tab, including the first-time upload
          screen above - see the comment at the top of this file for why. */}
      <AboutFooter />
    </>
  );
}