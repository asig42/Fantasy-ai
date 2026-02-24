import dotenv from 'dotenv'
dotenv.config()

import path from 'path'
import express from 'express'
import { ensureDirs, loadConfig } from './services/storage.service'
import { setAnthropicApiKey } from './services/claude.service'
import app from './app'

const PORT = parseInt(process.env.PORT ?? '3000', 10)

async function start() {
  await ensureDirs()

  // Load persisted config (API key saved via UI)
  const config = await loadConfig()
  if (config.anthropicApiKey) {
    setAnthropicApiKey(config.anthropicApiKey)
    console.log('[Config] Loaded API key from saved config')
  }
  if (config.falKey) {
    process.env.FAL_KEY = config.falKey
  }

  // Serve local images in dev mode
  app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')))

  const hasApiKey = !!(config.anthropicApiKey || process.env.ANTHROPIC_API_KEY)

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════╗
║   🏰 Fantasy AI TRPG Server          ║
║   Port: ${PORT}                          ║
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
