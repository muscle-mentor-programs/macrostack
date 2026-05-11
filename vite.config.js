import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Read API key directly from .env — bypasses Vite's loadEnv entirely
function readEnvKey(key) {
  try {
    const file = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    const match = file.match(new RegExp(`^${key}=(.+)$`, 'm'))
    return match ? match[1].trim() : ''
  } catch {
    return ''
  }
}

const apiKey = readEnvKey('ANTHROPIC_API_KEY')

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'anthropic-proxy',
      configureServer(server) {
        // Matches the production endpoint: POST /api/ai/messages
        server.middlewares.use('/api/ai/messages', (req, res) => {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', async () => {
            try {
              const response = await fetch('https://api.anthropic.com/v1/messages', {
                method:  req.method,
                headers: {
                  'content-type':      'application/json',
                  'x-api-key':         apiKey,
                  'anthropic-version': '2023-06-01',
                },
                body: body || undefined,
              })
              const text = await response.text()
              res.writeHead(response.status, { 'content-type': 'application/json' })
              res.end(text)
            } catch (e) {
              res.writeHead(500, { 'content-type': 'application/json' })
              res.end(JSON.stringify({ error: e.message }))
            }
          })
        })
      },
    },
  ],
})
