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

      <div className="court-label">
    ✦ ROYAL RECORD ✦
      </div>

      <h2 className="court-title">
          Concerning Readlette 🧚
      </h2>

      <p className="court-subtitle">
          A brief account preserved within the Royal Archives.
      </p>

        <p className="hint">
          Readlette is an enchanted librarian disguised as a web application.
          It consulteth a Fairy Court, issueth absurd royal decrees, and
          selecteth one unfortunate tome from a rather unreasonable Goodreads
          collection. Fashioned with Next.js, PostgreSQL, and entirely too much
          dramatic bureaucracy. Built for personal use.
        </p>

        <div className="about-footer-links">
          
            <a href="https://github.com/raid4h/Readlette"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            💻 Royal Blueprints (GitHub Repository)
          </a>
          
            <a href="https://www.goodreads.com/user/show/28064716"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            📚 Royal Library (Goodreads)
          </a>
          
            <a href="mailto:valfrae15@gmail.com"
            className="btn btn-secondary"
          >
            🕊️ Dispatch a Raven
          </a>

        </div>

      </div>

    </footer>
  );
}