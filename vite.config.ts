import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vinext from 'vinext'
import { cloudflare } from '@cloudflare/vite-plugin'
export default defineConfig({
  // Thirdweb's browser dependencies otherwise select Node transports under workerd.
  resolve: { alias: [
    { find: /^rpc-websockets$/, replacement: fileURLToPath(new URL('./node_modules/rpc-websockets/dist/index.browser.mjs', import.meta.url)) },
    { find: /^pino$/, replacement: fileURLToPath(new URL('./node_modules/pino/browser.js', import.meta.url)) },
  ] },
  plugins: [vinext(), cloudflare({ viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] } })],
})
