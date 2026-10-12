import { defineConfig } from 'vite'
import vinext from 'vinext'
import { cloudflare } from '@cloudflare/vite-plugin'
import { buildRevision } from './scripts/build-revision.mjs'
export default defineConfig({
  define: { 'process.env.W3RK_BUILD_REVISION': JSON.stringify(buildRevision()) },
  plugins: [vinext(), cloudflare({ viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] } })],
})
