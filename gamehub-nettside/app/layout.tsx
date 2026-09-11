import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GameHub — every PC game, one place',
  description: 'GameHub puts every game from every launcher in one library. Instant replay with game audio, freeze any game mid-cutscene, quests and streaks. Free for Windows.',
  icons: { icon: '/icon.svg' },
  openGraph: {
    title: 'GameHub — every PC game, one place',
    description: 'Free Windows app: one library for Steam, Epic, Xbox, EA, Ubisoft, Battle.net, GOG and Riot. Replay with sound. Freeze the game.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="aurora" aria-hidden="true"><i /><i /></div>
        <div className="page">
          <a href="/" className="brand"><img src="/logo.svg" alt="" width={32} height={32} className="brand-logo" /> GameHub</a>
          {children}
          <footer>GameHub for Windows 10 and 11 · free · open source · <a href="https://github.com/hakon0607/Gamehub">GitHub</a></footer>
        </div>
      </body>
    </html>
  );
}
