import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'w3rk.net — Onchain tasking, UBI-ready',
  description: 'A decentralized task board with escrow, messaging, and an Active Seeker Dividend.',
  openGraph: {
    title: 'w3rk.net',
    description: 'Onchain tasking, UBI-ready.',
    url: 'https://w3rk.net',
    siteName: 'w3rk.net',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="brand">
            <span className="brand-dot" />
            w3rk<span style={{opacity:0.7}}>.net</span>
          </div>
          <nav className="nav">
            <a href="/jobs">Jobs</a>
            <a href="/post">Post a job</a>
            <a href="/about">About</a>
          </nav>
        </header>
        <main className="container">{children}</main>
        <footer className="footer small">
          © {new Date().getFullYear()} w3rk.net — Onchain work, built for Base.
        </footer>
      </body>
    </html>
  )
}
