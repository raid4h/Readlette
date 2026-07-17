// =============================================================================
// Root layout - wraps every page. This is where we load the two fonts that
// give Spine Time its storybook feel:
//   - Fraunces: a warm, slightly wonky serif for titles and the big reveal
//     moment (it has real "fairytale book cover" energy)
//   - Quicksand: a soft, rounded sans-serif for everything else, so the app
//     stays easy to read despite the decorative display font
// =============================================================================
import { Fraunces, Quicksand } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
});

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

export const metadata = {
  title: 'Spine Time 🌿',
  description: 'A little woodland magic for picking your next read.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${quicksand.variable}`}>
      <body>{children}</body>
    </html>
  );
}
