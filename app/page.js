'use client';

// =============================================================================
// The whole app lives on one page. It:
//   1. Loads your full book list from /api/books once on mount
//   2. Filters it client-side based on whatever chips are toggled
//   3. Hands the filtered list to ShuffleCard, which does the actual picking
//
// Sidebar (right side / stacked below on narrow screens):
//   🔍 Summon a Tome by Name -> 🎀 Thy Fated Reads -> 📱 Thy Kobo Shelf
//
// Royal Messenger Service (SyncPanel) is a separate full-width band at the
// very bottom of the page, below everything else.
// =============================================================================
import { useState, useEffect, useMemo, useCallback } from 'react';
import UploadCsv from '../components/UploadCsv';
import SyncPanel from '../components/SyncPanel';
import FilterPanel from '../components/FilterPanel';
import ShuffleCard from '../components/ShuffleCard';
import FatedReads from '../components/FatedReads';
import KoboList from '../components/KoboList';
import AddBookSearch from '../components/AddBookSearch';

const EMPTY_FILTERS = {
  genres: new Set(),
  decades: new Set(),
  customYear: '',
  genders: new Set(),
};

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // Toggles the CSV re-upload panel on/off, so it's hidden by default once
  // you already have books, instead of gone forever.
  const [showReupload, setShowReupload] = useState(false);

  const loadBooks = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch('/api/books', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`/api/books returned ${res.status}`);
      }
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

      return true;
    });
  }, [books, filters]);

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
              <FilterPanel books={books} filters={filters} setFilters={setFilters} />
              <ShuffleCard filteredBooks={filteredBooks} onStatusChange={loadBooks} />

              {/* Reupload toggle - the actual fix for "where's my upload button" */}
              <div style={{ textAlign: 'center', margin: '30px 0' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowReupload((s) => !s)}
                >
                  {showReupload ? '📜 Hide the Scroll' : '📜 Reupload My Shelf'}
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
            {/* Sits on top since it can feed either list below it */}
            <AddBookSearch books={books} onStatusChange={loadBooks} />

            <FatedReads books={books} onStatusChange={loadBooks} />

            <KoboList books={books} onStatusChange={loadBooks} />
          </aside>
        )}

      </div>

      {/* Full-width band, always last on the page */}
      {!loading && !loadError && books.length > 0 && (
        <div className="messenger-band">
          <SyncPanel books={books} onDataChanged={loadBooks} />
        </div>
      )}
    </>
  );
}