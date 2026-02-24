import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import path from 'path'
import { ensureDirs } from './services/storage.service'
import apiRouter from './routes/api'

const app = express()
const PORT = process.env.PORT ?? 3000

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
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

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║   🏰 Fantasy AI TRPG Server          ║
║   Port: ${PORT}                          ║
║   Mode: ${process.env.NODE_ENV ?? 'development'}              ║
║   Image API: ${process.env.FAL_KEY ? 'fal.ai ✓' : 'Placeholder mode'}       ║
╚══════════════════════════════════════╝
    `)
  })
}

start().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
