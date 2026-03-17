import { createMiddleware } from 'hono/factory'
import type { Bindings } from '../types'

// Authentication middleware
export const authMiddleware = createMiddleware<{ Bindings: Bindings }>(
  async (c, next) => {
    const apiKey = c.req.header('X-API-Key')

    if (!apiKey) {
      return c.json({ error: 'API key is required' }, 401)
    }

    if (apiKey !== c.env.API_KEY) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    await next()
  }
)

// Rate limiting middleware (simple in-memory version)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export const rateLimitMiddleware = createMiddleware(
  async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown'
    const now = Date.now()
    const windowMs = 60000 // 1 minute
    const maxRequests = 100

    const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs }

    if (now > record.resetTime) {
      record.count = 0
      record.resetTime = now + windowMs
    }

    record.count++
    rateLimitMap.set(ip, record)

    c.header('X-RateLimit-Limit', String(maxRequests))
    c.header('X-RateLimit-Remaining', String(Math.max(0, maxRequests - record.count)))
    c.header('X-RateLimit-Reset', String(record.resetTime))

    if (record.count > maxRequests) {
      return c.json({ error: 'Rate limit exceeded' }, 429)
    }

    await next()
  }
)

// Request timing middleware
export const timingMiddleware = createMiddleware(
  async (c, next) => {
    const start = Date.now()
    await next()
    const duration = Date.now() - start
    c.header('X-Response-Time', `${duration}ms`)
  }
)
