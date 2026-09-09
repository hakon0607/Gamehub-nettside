import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GameHub — last ned',
  description: 'GameHub samler alle spillene dine i ett bibliotek. Replay med lyd, frys spillet, quests og streaks. Gratis for Windows.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb">
      <body>
        <div className="aurora" aria-hidden="true"><i /><i /></div>
        <div className="page">
          <a href="/" className="brand"><span className="brand-mark">◆</span> GameHub</a>
          {children}
          <footer>GameHub for Windows 10 og 11 · gratis</footer>
        </div>
      </body>
    </html>
  );
}
