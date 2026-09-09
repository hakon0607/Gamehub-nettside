import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'GameHub — alle spillene dine på ett sted',
  description:
    'GameHub samler Steam, Epic, Xbox, EA, Ubisoft, Battle.net, GOG og Riot i ett bibliotek. Replay med lyd, frys spillet midt i en cutscene, quests og streaks. Gratis for Windows.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb">
      <body>
        <div className="aurora" aria-hidden="true">
          <i />
          <i />
        </div>
        <div className="page">
          <nav className="nav">
            <Link href="/" className="brand">
              <span className="brand-mark">◆</span> GameHub
            </Link>
            <div className="links">
              <Link href="/">Last ned</Link>
              <Link href="/versjoner">Versjoner</Link>
              <Link href="/admin">Admin</Link>
            </div>
          </nav>
          {children}
          <footer>
            <span>GameHub for Windows 10 og 11.</span>
            <span>Gratis, åpen kildekode.</span>
            <a href="https://github.com/hakon0607/Gamehub" target="_blank" rel="noopener">
              Koden på GitHub
            </a>
          </footer>
        </div>
      </body>
    </html>
  );
}
