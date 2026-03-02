// Vercel serverless entry point
import { setAnthropicApiKey } from '../server/services/claude.service'
import { fal } from '@fal-ai/client'

// Apply env vars to services (Vercel sets these from dashboard)
if (process.env.ANTHROPIC_API_KEY) {
  setAnthropicApiKey(process.env.ANTHROPIC_API_KEY)
}
if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY })
}

import app from '../server/app'
export default app
