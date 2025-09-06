import './globals.css'
import type { Metadata } from 'next'
import Providers from './providers'
import PrivyAuthButton from '../components/PrivyAuthButton'
import NetworkIndicator from '../components/NetworkIndicator'

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
        <Providers>
          <header className="header">
            <a href="/" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="brand-dot" />
              w3rk<span style={{opacity:0.7}}>.net</span>
            </a>
                    <nav className="nav">
          <a href="/j">Jobs</a>
          <a href="/s">Services</a>
          <a href="/chat">Chat</a>
          <a href="/profile">Profile</a>
          <a href="/u">Users</a>
          <a href="/about">About</a>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto'}}>
            <NetworkIndicator />
            <PrivyAuthButton />
          </div>
        </nav>
          </header>
          <main className="container">{children}</main>
          <footer className="footer small">
            © {new Date().getFullYear()} w3rk.net — Onchain work, built for Base.
          </footer>
        </Providers>
      </body>
    </html>
  )
}
