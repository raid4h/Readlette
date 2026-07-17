'use client';

// =============================================================================
// All filtering happens client-side against the full book list already
// fetched in app/page.js - with ~1251 books that's a tiny amount of data to
// filter in the browser, and it means every checkbox click is instant with
// no server round-trip.
//
// `filters` shape (lives in app/page.js, passed down):
//   {
//     genres: Set<string>       - empty set = no genre filter (show all)
//     decades: Set<string>      - e.g. Set(['1990s','2010s'])
//     customYear: string        - exact year as typed text, '' = unused
//     genders: Set<string>      - subset of ['female','male','unknown']
//   }
// =============================================================================

function toggleInSet(set, value) {
  const next = new Set(set);
  next.has(value) ? next.delete(value) : next.add(value);
  return next;
}

export default function FilterPanel({ books, filters, setFilters }) {
  // Genres and decades are derived from whatever's actually in your library,
  // so this list is never stale and never shows options with zero matches.
  const allGenres = [...new Set(books.flatMap((b) => b.genres || []))].sort();

  const allDecades = [
    ...new Set(
      books
        .filter((b) => b.pub_year)
        .map((b) => `${Math.floor(b.pub_year / 10) * 10}s`)
    ),
  ].sort();

  const genderOptions = [
    { value: 'female', label: 'Female authors' },
    { value: 'male', label: 'Male authors' },
    { value: 'unknown', label: 'Unknown' },
  ];

  return (
    <div className="card">
      <h2>🍄 Narrow the path</h2>
      <p className="hint">Leave everything unchecked to wander the whole shelf.</p>

      {allGenres.length > 0 && (
        <div className="filter-group">
          <span className="filter-group-label">Genre</span>
          <div className="chip-row">
            {allGenres.map((genre) => (
              <button
                key={genre}
                type="button"
                className="chip"
                aria-pressed={filters.genres.has(genre)}
                onClick={() =>
                  setFilters((f) => ({ ...f, genres: toggleInSet(f.genres, genre) }))
                }
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}

      {allDecades.length > 0 && (
        <div className="filter-group">
          <span className="filter-group-label">Era</span>
          <div className="chip-row">
            {allDecades.map((decade) => (
              <button
                key={decade}
                type="button"
                className="chip"
                aria-pressed={filters.decades.has(decade)}
                onClick={() =>
                  setFilters((f) => ({ ...f, decades: toggleInSet(f.decades, decade) }))
                }
              >
                {decade}
              </button>
            ))}
            <input
              type="number"
              className="year-input"
              placeholder="or a year..."
              value={filters.customYear}
              onChange={(e) => setFilters((f) => ({ ...f, customYear: e.target.value }))}
            />
          </div>
        </div>
      )}

      <div className="filter-group">
        <span className="filter-group-label">Author</span>
        <div className="chip-row">
          {genderOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="chip"
              aria-pressed={filters.genders.has(opt.value)}
              onClick={() =>
                setFilters((f) => ({ ...f, genders: toggleInSet(f.genders, opt.value) }))
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
