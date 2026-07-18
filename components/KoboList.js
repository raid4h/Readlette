'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// 📱 Thy Kobo Shelf
//
// Readlette (and Goodreads) has no way to know what's actually loaded on
// your Kobo - so this list is entirely manual. Books land here only when
// YOU flag them, either from this list's own search (see AddBookSearch)
// or from wherever else a "kobo" action gets fired.
//
// From here you can promote any book straight into 🎀 Thy Fated Reads when
// you're ready to actually read it next.
// ============================================================================

export default function KoboList({ books, onStatusChange }) {

  // Books flagged "on my Kobo", most recently flagged first.
  const koboBooks = books
    .filter(book => book.kobo_at)
    .sort((a, b) => new Date(b.kobo_at) - new Date(a.kobo_at));

  async function updateStatus(id, action) {
    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    onStatusChange?.();
  }

  return (
    <div className="card kobo-list">

      <h2>📱 Thy Kobo Shelf</h2>

      {koboBooks.length === 0 ? (
        <p className="hint">
          No tomes marked yet. Use the search below to summon one onto thy Kobo.
        </p>
      ) : (
        <ul className="fated-list">

          {koboBooks.map(book => (

            <li key={book.id} className="fated-item">

              <div className="fated-item-info">
                <p className="fated-item-title">{book.title}</p>
                <p className="fated-item-author">{book.author}</p>
              </div>

              <div className="fated-item-actions">

                {/* Promote straight into Fated Reads - the button you asked for */}
                <button
                  type="button"
                  className="fated-icon-btn"
                  title="Add to Fated Reads"
                  onClick={() => updateStatus(book.id, 'queue')}
                >
                  💌
                </button>

                <button
                  type="button"
                  className="fated-icon-btn"
                  title="Remove from Kobo"
                  onClick={() => updateStatus(book.id, 'unkobo')}
                >
                  🗑️
                </button>

              </div>

            </li>

          ))}

        </ul>
      )}

    </div>
  );
}