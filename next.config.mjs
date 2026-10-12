export default {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [{ source: '/.well-known/farcaster.json', destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/01991d9c-55ec-49fd-5b66-557d0bbe9d6e', permanent: false }]
  },
  async headers() {
    return [{ source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] }]
  },
}
