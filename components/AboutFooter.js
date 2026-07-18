'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// Small "what is this?" box for anyone who stumbles onto the live site
// without context. Sits at the very bottom of the page, below the Royal
// Messenger Service band. Pure static content - no state, no fetches.
// ============================================================================

export default function AboutFooter() {
  return (
    <footer className="about-footer">

      <div className="card about-footer-card">

        <h2>🧚 What is this?</h2>

        <p className="hint">
          Readlette is a personal project - a little Fairy Court oracle that
          picks a random book from my 1250+ book Goodreads to-read shelf,
          with filters for genre, decade, and author gender. Built as a
          portfolio piece with Next.js and Postgres.
        </p>

        <div className="about-footer-links">
          
            <a href="https://github.com/raid4h/Readlette"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            💻 GitHub
          </a>
          
            <a href="https://www.goodreads.com/user/show/28064716"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            📚 Goodreads
          </a>
          
            <a href="mailto:valfrae15@gmail.com"
            className="btn btn-secondary"
          >
            ✉️ Email me
          </a>

        </div>

      </div>

    </footer>
  );
}