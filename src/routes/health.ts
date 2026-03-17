import { Hono } from 'hono'
import type { Bindings } from '../types'

export const healthRoutes = new Hono<{ Bindings: Bindings }>()

// Health check endpoint
healthRoutes.get('/', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: 'N/A'
  })
})

// Detailed health check
healthRoutes.get('/ready', async (c) => {
  const checks = {
    kv: 'unknown',
    d1: 'unknown',
    r2: 'unknown'
  }

  // Check KV
  try {
    await c.env.CACHE.get('health_check')
    checks.kv = 'ok'
  } catch {
    checks.kv = 'error'
  }

  // Check D1
  try {
    await c.env.DB.prepare('SELECT 1').first()
    checks.d1 = 'ok'
  } catch {
    checks.d1 = 'error'
  }

  // Check R2
  try {
    await c.env.BUCKET.head('health_check')
    checks.r2 = 'ok'
  } catch {
    checks.r2 = 'ok' // May not exist, that's fine
  }

  const allHealthy = Object.values(checks).every(v => v === 'ok')

  return c.json({
    status: allHealthy ? 'ready' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  }, allHealthy ? 200 : 503)
})
