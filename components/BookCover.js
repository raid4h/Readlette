'use client';

// ============================================================================
// Readlette
// ----------------------------------------------------------------------------
// The ONE component every cover in the app now goes through.
//
// It tries sources in order, moving on whenever an image fails to load:
//   1. Open Library (built from the ISBN - see lib/covers.js)
//   2. Google Books (see lib/googleCovers.js)
//   3. Nothing - renders no image at all (no broken-image icon)
//
// IMPORTANT: always give it key={book.id} where you use it, so switching to
// a different book starts fresh from step 1 instead of reusing old state.
// ============================================================================

import { useState, useEffect } from 'react';
import { getCoverUrl } from '../lib/covers';
import { fetchGoogleCover } from '../lib/googleCovers';

export default function BookCover({ book, size = 'M', className = '', alt = '' }) {
  const openLibraryUrl = getCoverUrl(book, size); // null if the book has no ISBN

  // Which source we're on: 'open-library' -> 'google' -> 'none'.
  // No ISBN means Open Library can't even be tried, so start at Google.
  const [stage, setStage] = useState(openLibraryUrl ? 'open-library' : 'google');
  const [googleUrl, setGoogleUrl] = useState(null);

  // Runs when we reach the Google stage: ask Google Books for a cover URL.
  useEffect(() => {
    if (stage !== 'google') return;

    let cancelled = false; // ignore the answer if this component went away

    fetchGoogleCover(book, size).then((url) => {
      if (cancelled) return;
      if (url) setGoogleUrl(url);
      else setStage('none'); // Google had nothing either
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, book.id, size]);

  // Stage 1: Open Library. If the image 404s, fall through to Google.
  if (stage === 'open-library') {
    return (
      <img
        className={className}
        src={openLibraryUrl}
        alt={alt}
        onError={() => setStage('google')}
      />
    );
  }

  // Stage 2: Google Books. If that image fails to load too, give up quietly.
  if (stage === 'google' && googleUrl) {
    return (
      <img
        className={className}
        src={googleUrl}
        alt={alt}
        onError={() => setStage('none')}
      />
    );
  }

  // Stage 3 (or still waiting on Google): show nothing.
  return null;
}