import './globals.css'
import type { Metadata } from 'next'
import Providers from './providers'
import AuthButton from '../components/AuthButton'
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
            <div className="brand">
              <span className="brand-dot" />
              w3rk<span style={{opacity:0.7}}>.net</span>
            </div>
            <nav className="nav">
              <a href="/jobs">Jobs</a>
              <a href="/post">Post a job</a>
              <a href="/services">Services</a>
              <a href="/advertise">Advertise</a>
              <a href="/skills">Skills</a>
              <a href="/profile">Profile</a>
              <a href="/about">About</a>
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <NetworkIndicator />
                <AuthButton />
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
