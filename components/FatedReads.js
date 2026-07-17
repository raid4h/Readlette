'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// 🎀 Thy Fated Reads
//
// A little shelf of books the Oracle has already chosen for you, saved to
// read next - so you don't lose the thread between shuffles.
// ============================================================================

export default function FatedReads({ books, onStatusChange }) {

  const queued = books
    .filter(book => book.queued_at)
    .sort((a, b) => new Date(b.queued_at) - new Date(a.queued_at));

  async function updateStatus(id, action) {
    await fetch('/api/books/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    onStatusChange?.();
  }

  if (queued.length === 0) {
    return (
      <div className="card fated-reads">
        <h2>🎀 Thy Fated Reads</h2>
        <p className="hint">
          Tomes thou hast chosen from the Oracle shall gather here, awaiting their turn...
        </p>
      </div>
    );
  }

  return (
    <div className="card fated-reads">

      <h2>🎀 Thy Fated Reads</h2>

      <p className="hint">
        The threads of fate thou hast already chosen...
      </p>

      <ul className="fated-list">

        {queued.map(book => (

          <li key={book.id} className="fated-item">

            <div className="fated-item-info">
              <p className="fated-item-title">{book.title}</p>
              <p className="fated-item-author">{book.author}</p>
            </div>

            <div className="fated-item-actions">

              <button
                type="button"
                className="fated-icon-btn"
                title="Finished this tome!"
                onClick={() => updateStatus(book.id, 'finish')}
              >
                ✅
              </button>

              <button
                type="button"
                className="fated-icon-btn"
                title="Remove from Fated Reads"
                onClick={() => updateStatus(book.id, 'unqueue')}
              >
                💔
              </button>

            </div>

          </li>

        ))}

      </ul>

    </div>
  );
}