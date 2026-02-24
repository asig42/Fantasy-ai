import express from 'express'
import cors from 'cors'
import path from 'path'
import apiRouter from './routes/api'

const app = express()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api', apiRouter)

// Serve React build in production (non-Vercel self-hosted only)
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  const distPath = path.join(process.cwd(), 'dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

export default app
