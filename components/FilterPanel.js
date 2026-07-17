'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// The Fairy Court must know thy preferences before making a decree.
// All filtering happens client-side.
// ============================================================================

function toggleInSet(set, value) {
  const next = new Set(set);

  next.has(value)
    ? next.delete(value)
    : next.add(value);

  return next;
}

export default function FilterPanel({
  books,
  filters,
  setFilters,
}) {
  const allGenres = [
    ...new Set(
      books.flatMap(book => book.genres || [])
    ),
  ].sort();

function decadeLabel(pubYear) {
    const isBCE = pubYear < 0;
    const decadeStart = Math.floor(Math.abs(pubYear) / 10) * 10;
    return isBCE ? `${decadeStart}s BCE` : `${decadeStart}s`;
  }

  function decadeSortValue(pubYear) {
    const isBCE = pubYear < 0;
    const decadeStart = Math.floor(Math.abs(pubYear) / 10) * 10;
    return isBCE ? -decadeStart : decadeStart;
  }

  const decadeMap = new Map();
  books
    .filter(book => book.pub_year)
    .forEach(book => {
      const label = decadeLabel(book.pub_year);
      if (!decadeMap.has(label)) {
        decadeMap.set(label, decadeSortValue(book.pub_year));
      }
    });

  const allDecades = [...decadeMap.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([label]) => label);

  const genderOptions = [
    {
      value: "female",
      label: "Ladies"
    },
    {
      value: "male",
      label: "Gentlemen"
    },
    {
      value: "unknown",
      label: "Mysterious Beings"
    },
  ];

  return (

    <div className="card">

      <h2>

        👑 Present Thy Demands

      </h2>

      <p className="hint">

        The Fairy Court shall attempt to obey...

      </p>

      {allGenres.length > 0 && (

        <section className="filter-section">

          <h3 className="filter-title">

            📚 Desired Genres

          </h3>

          <div className="chip-row">

            {allGenres.map(genre => (

              <button
                key={genre}
                type="button"
                className="chip"
                aria-pressed={filters.genres.has(genre)}
                onClick={() =>
                  setFilters(f => ({
                    ...f,
                    genres: toggleInSet(
                      f.genres,
                      genre
                    ),
                  }))
                }
              >

                {genre}

              </button>

            ))}

          </div>

        </section>

      )}

      {allDecades.length > 0 && (

        <section className="filter-section">

          <h3 className="filter-title">

            🕰 Preferred Century

          </h3>

          <div className="chip-row">

            {allDecades.map(decade => (

              <button
                key={decade}
                type="button"
                className="chip"
                aria-pressed={filters.decades.has(decade)}
                onClick={() =>
                  setFilters(f => ({
                    ...f,
                    decades: toggleInSet(
                      f.decades,
                      decade
                    ),
                  }))
                }
              >

                {decade}

              </button>

            ))}

            <input
              className="year-input"
              type="number"
              placeholder="Specific year..."
              value={filters.customYear}
              onChange={e =>
                setFilters(f => ({
                  ...f,
                  customYear: e.target.value,
                }))
              }
            />

          </div>

        </section>

      )}

      <section className="filter-section">

        <h3 className="filter-title">

          ✒ Preferred Authors

        </h3>

        <div className="chip-row">

          {genderOptions.map(option => (

            <button
              key={option.value}
              className="chip"
              type="button"
              aria-pressed={filters.genders.has(option.value)}
              onClick={() =>
                setFilters(f => ({
                  ...f,
                  genders: toggleInSet(
                    f.genders,
                    option.value
                  ),
                }))
              }
            >

              {option.label}

            </button>

          ))}

        </div>

      </section>

    </div>

  );
}