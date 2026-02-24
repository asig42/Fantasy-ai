import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import path from 'path'
import { ensureDirs, loadConfig } from './services/storage.service'
import { setAnthropicApiKey } from './services/claude.service'
import apiRouter from './routes/api'

const app = express()
const PORT = parseInt(process.env.PORT ?? '3000', 10)

// Middleware
app.use(cors({
  origin: true,  // Allow all origins for AWS/mobile access
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Serve static images from public directory
app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')))

// API Routes
app.use('/api', apiRouter)

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

async function start() {
  await ensureDirs()

  // Load persisted config (overrides .env if user set keys via UI)
  const config = await loadConfig()
  if (config.anthropicApiKey) {
    setAnthropicApiKey(config.anthropicApiKey)
    console.log('[Config] Loaded API key from saved config')
  }
  if (config.falKey) {
    process.env.FAL_KEY = config.falKey
  }

  const hasApiKey = !!(config.anthropicApiKey || process.env.ANTHROPIC_API_KEY)

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════╗
║   🏰 Fantasy AI TRPG Server          ║
║   Port: ${PORT}                          ║
║   Mode: ${process.env.NODE_ENV ?? 'development'}              ║
║   Claude API: ${hasApiKey ? '✓ Ready' : '✗ Not set (set via UI)'}    ║
║   Image API: ${process.env.FAL_KEY ? 'fal.ai ✓' : 'Placeholder mode'}       ║
╚══════════════════════════════════════╝
    `)
  })
}

start().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
