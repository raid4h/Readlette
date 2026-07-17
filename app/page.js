'use client';

// =============================================================================
// The whole app lives on one page. It:
//   1. Loads your full book list from /api/books once on mount
//   2. Filters it client-side based on whatever chips are toggled
//   3. Hands the filtered list to ShuffleCard, which does the actual picking
//
// If you haven't imported anything yet (books.length === 0), it shows the
// CSV upload panel instead of the filters/shuffle UI.
// =============================================================================
import { useState, useEffect, useMemo, useCallback } from 'react';
import UploadCsv from '../components/UploadCsv';
import SyncPanel from '../components/SyncPanel';
import FilterPanel from '../components/FilterPanel';
import ShuffleCard from '../components/ShuffleCard';

const EMPTY_FILTERS = {
  genres: new Set(),
  decades: new Set(),
  customYear: '',
  genders: new Set(),
};

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const loadBooks = useCallback(async () => {
    const res = await fetch('/api/books');
    const data = await res.json();
    setBooks(data.books || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Recomputed only when the book list or filter selections change - not on
  // every render - since filtering 1000+ books is cheap but no need to
  // repeat it unnecessarily.
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      // Genre: book must match at least one selected genre (if any selected)
      if (filters.genres.size > 0) {
        const bookGenres = book.genres || [];
        if (!bookGenres.some((g) => filters.genres.has(g))) return false;
      }

      // Era: matches a selected decade OR the typed exact year (if either is set)
      const yearFilterActive = filters.decades.size > 0 || filters.customYear !== '';
      if (yearFilterActive) {
        const decade = book.pub_year ? `${Math.floor(book.pub_year / 10) * 10}s` : null;
        const matchesDecade = decade && filters.decades.has(decade);
        const matchesYear =
          filters.customYear !== '' && book.pub_year === Number(filters.customYear);
        if (!matchesDecade && !matchesYear) return false;
      }

      // Author gender: book must match one of the selected options (if any selected)
      if (filters.genders.size > 0) {
        if (!filters.genders.has(book.author_gender)) return false;
      }

      return true;
    });
  }, [books, filters]);

  return (
    <div className="app-shell">
      <header className="header">
        <h1>Spine Time</h1>
        <p>a little woodland magic for your to-read pile</p>
      </header>
      <div className="vine-divider">🌿 ✦ 🌿</div>

      {loading ? (
        <p className="empty-state">Waking up the shelf...</p>
      ) : books.length === 0 ? (
        <UploadCsv onImported={loadBooks} />
      ) : (
        <>
          <FilterPanel books={books} filters={filters} setFilters={setFilters} />
          <ShuffleCard filteredBooks={filteredBooks} />
          <SyncPanel books={books} onDataChanged={loadBooks} />
        </>
      )}
    </div>
  );
}
