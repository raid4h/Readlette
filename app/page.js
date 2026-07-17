'use client';

// =============================================================================
// The whole app lives on one page. It:
//   1. Loads your full book list from /api/books once on mount
//   2. Filters it client-side based on whatever chips are toggled
//   3. Hands the filtered list to ShuffleCard, which does the actual picking
//
// If you haven't imported anything yet (books.length === 0), it shows the
// CSV upload panel instead of the filters/shuffle UI.
//
// Layout: main content (filters/shuffle/sync) lives in .app-shell; Thy Fated
// Reads sits beside it as a sticky sidebar on wide screens, and stacks below
// it on narrower ones (see .page-layout in globals.css).
// =============================================================================
import { useState, useEffect, useMemo, useCallback } from 'react';
import UploadCsv from '../components/UploadCsv';
import SyncPanel from '../components/SyncPanel';
import FilterPanel from '../components/FilterPanel';
import ShuffleCard from '../components/ShuffleCard';
import FatedReads from '../components/FatedReads';

const EMPTY_FILTERS = {
  genres: new Set(),
  decades: new Set(),
  customYear: '',
  genders: new Set(),
};

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null); // NEW: surface fetch failures instead of hanging silently
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const loadBooks = useCallback(async () => {
    setLoadError(null);
    try {
      // cache: 'no-store' just makes sure the browser itself never serves a
      // stale copy of this response - belt-and-suspenders alongside the
      // dynamic = 'force-dynamic' export that the route handler needs.
      const res = await fetch('/api/books', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`/api/books returned ${res.status}`);
      }
      const data = await res.json();
      setBooks(data.books || []);
    } catch (err) {
      // Previously this just threw silently and the UI never updated -
      // which is exactly what "nothing happens after upload" looks like.
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
          // NEW: visible error + retry instead of a silent, indefinite hang
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
            <SyncPanel books={books} onDataChanged={loadBooks} />
          </>
        )}
      </div>

      {!loading && !loadError && books.length > 0 && (
        <aside className="fated-sidebar">
          <FatedReads books={books} onStatusChange={loadBooks} />
        </aside>
      )}

    </div>
  );
}