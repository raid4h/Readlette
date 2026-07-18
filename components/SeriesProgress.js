'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// 📚 Threads of Fate (series in progress)
//
// Shows every series with at least one unread entry left, with a progress
// bar and a one-click "queue the next one" button straight to Fated Reads.
// ============================================================================

import { useState, useEffect } from 'react';
import BookMiniCover from './BookMiniCover';

export default function SeriesProgress({ onStatusChange }) {
  const [series, setSeries] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Refetch whenever the parent says something changed (e.g. a book got
  // queued or marked finished elsewhere) - keeps progress bars accurate.
  useEffect(() => {
    fetch('/api/series-progress', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setSeries(data.series || []))
      .catch(() => setSeries([]))
      .finally(() => setLoaded(true));
  }, [onStatusChange]);

  async function queueNext(id) {
    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'queue' }),
    });
    onStatusChange?.();
  }

  if (!loaded || series.length === 0) return null;

  return (
    <div className="card series-progress">

      <h2>📚 Threads of Fate</h2>

      <p className="hint">Series thou hast already begun...</p>

      <ul className="fated-list">

        {series.map(s => {
          const percent = Math.round((s.readCount / s.total) * 100);

          return (
            <li key={s.seriesName} className="series-progress-item">

              <div className="series-progress-header">
                <span className="series-progress-name">{s.seriesName}</span>
                <span className="series-progress-count">
                  {s.readCount} of {s.total} read
                </span>
              </div>

              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${percent}%` }} />
              </div>

              <div className="series-progress-next">
                <div className="fated-item-info">
                  <BookMiniCover book={s.nextUnread} />
                  <span className="fated-item-title">{s.nextUnread.title}</span>
                </div>

                <button
                  type="button"
                  className="fated-icon-btn"
                  title="Add next book to Fated Reads"
                  onClick={() => queueNext(s.nextUnread.id)}
                >
                  💌
                </button>
              </div>

            </li>
          );
        })}

      </ul>

    </div>
  );
}