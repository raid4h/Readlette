'use client';

// =============================================================================
// The whole app lives on one page. It:
//   1. Loads your full to-read book list from /api/books once on mount
//   2. Filters it client-side based on genre/decade/gender chips
//   3. Narrows to one-earliest-per-series (unless standalone-only is on,
//      in which case series books are excluded entirely)
//   4. Hands that narrowed pool to ShuffleCard for picking
//
// 📖 Currently Reading banner sits at the top (only renders if non-empty).
// Sidebar: 🔍 Search -> 🎀 Fated Reads -> 📱 Kobo -> 📚 Series Progress.
// Royal Messenger Service is a full-width band at the very bottom.
// =============================================================================
import { useState, useEffect, useMemo, useCallback } from 'react';
import UploadCsv from '../components/UploadCsv';
import SyncPanel from '../components/SyncPanel';
import FilterPanel from '../components/FilterPanel';
import ShuffleCard from '../components/ShuffleCard';
import FatedReads from '../components/FatedReads';
import KoboList from '../components/KoboList';
import AddBookSearch from '../components/AddBookSearch';
import CurrentlyReading from '../components/CurrentlyReading';
import AboutFooter from '../components/AboutFooter';
import { parseSeriesInfo } from '../lib/seriesUtils';
import { getPageLengthLabel } from '../lib/pageLength';

const EMPTY_FILTERS = {
  genres: new Set(),
  decades: new Set(),
  customYear: '',
  genders: new Set(),
  lengths: new Set(),
};

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showReupload, setShowReupload] = useState(false);

  // NEW: when true, the Oracle pool excludes ALL series books entirely -
  // not just later volumes, but even the earliest unread one in a series.
  const [standaloneOnly, setStandaloneOnly] = useState(false);

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

      // page-count length filter
      if (filters.lengths.size > 0) {
        const label = getPageLengthLabel(book.page_count);
        if (!label || !filters.lengths.has(label)) return false;
      }

      return true;
    });
  }, [books, filters]);

  const oraclePool = useMemo(() => {
    // NEW: standalone-only mode - drop every book that matches the series
    // title pattern at all, before doing the earliest-per-series step.
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
      <div className="page-layout">

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
            <UploadCsv onImported={loadBooks} />
          ) : (
            <>
              {/* NEW: only renders if you actually have a currently-reading book */}
              <CurrentlyReading />

              <FilterPanel books={books} filters={filters} setFilters={setFilters} />

              {/* NEW: standalone-only toggle, styled like an existing filter chip */}
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

              <div style={{ textAlign: 'center', margin: '30px 0' }}>
                <button className="btn btn-secondary" onClick={() => setShowReupload((s) => !s)}>
                  {showReupload ? '📜 The Oracle Hath Seen Enough' : '📜 Present Thy Library'}
                </button>
              </div>

              {showReupload && (
                <UploadCsv
                  onImported={() => {
                    loadBooks();
                    setShowReupload(false);
                  }}
                />
              )}
            </>
          )}
        </div>

        {!loading && !loadError && books.length > 0 && (
          <aside className="fated-sidebar">
            <AddBookSearch books={books} onStatusChange={loadBooks} />
            <FatedReads books={books} onStatusChange={loadBooks} />
            <KoboList books={books} onStatusChange={loadBooks} />
          </aside>
        )}

      </div>

      {!loading && !loadError && books.length > 0 && (
        <div className="messenger-band">
          <SyncPanel books={books} onDataChanged={loadBooks} />
        </div>
      )}

      <AboutFooter />
    </>
  );
}