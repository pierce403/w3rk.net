import './globals.css'
import type { Metadata } from 'next'
import Providers from './providers'
import PrivyAuthButton from '../components/PrivyAuthButton'
import NetworkIndicator from '../components/NetworkIndicator'
import FarcasterSDK from '../components/FarcasterSDK'

export const metadata: Metadata = {
  metadataBase: new URL('https://w3rk.net'),
  title: 'w3rk.net — Onchain tasking, UBI-ready',
  description: 'A decentralized task board with escrow, messaging, and an Active Seeker Dividend.',
  manifest: '/manifest.json',
  themeColor: '#0052ff',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  appleWebApp: {
    capable: true,
    title: 'w3rk',
    statusBarStyle: 'default',
  },
  openGraph: {
    title: 'w3rk.net',
    description: 'Onchain tasking, UBI-ready.',
    url: 'https://w3rk.net',
    siteName: 'w3rk.net',
    images: ['/icon-512.png'],
  },
  robots: { index: true, follow: true },
  other: {
    // Farcaster miniapp metadata for embed detection (current format)
    'fc:miniapp': JSON.stringify({
      version: '1',
      imageUrl: 'https://w3rk.net/icon-512.png',
      button: {
        title: 'Launch w3rk',
        action: {
          type: 'launch_miniapp',
          name: 'w3rk.net',
          url: 'https://w3rk.net',
          splashImageUrl: 'https://w3rk.net/icon-512.png',
          splashBackgroundColor: '#0052ff'
        }
      }
    }),
    // Legacy frame format for backward compatibility
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://w3rk.net/icon-512.png',
    'fc:frame:button': 'Launch w3rk',
    'fc:frame:button:action': 'launch_frame',
    'fc:frame:button:target': 'https://w3rk.net',
  },
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
                    {/* Desktop navigation */}
                    <nav className="nav hidden sm:flex">
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
        
        {/* Mobile navigation */}
        <nav className="nav sm:hidden fixed bottom-0 left-0 right-0 mobile-nav" style={{background: 'white', borderTop: '1px solid #e5e7eb', padding: '0.5rem 1rem', zIndex: 50}}>
          <a href="/j" data-mobile data-icon="💼">Jobs</a>
          <a href="/s" data-mobile data-icon="⚡">Services</a>
          <a href="/chat" data-mobile data-icon="💬">Chat</a>
          <a href="/profile" data-mobile data-icon="👤">Profile</a>
          <div style={{position: 'absolute', top: '-3rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <NetworkIndicator />
            <PrivyAuthButton />
          </div>
        </nav>
          </header>
          <main className="container" style={{paddingBottom: '6rem'}}>{children}</main>
          <footer className="footer small">
            © {new Date().getFullYear()} w3rk.net — Onchain work, built for Base.
          </footer>
        </Providers>
        <FarcasterSDK />
      </body>
    </html>
  )
}
