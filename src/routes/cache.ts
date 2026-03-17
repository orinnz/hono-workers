import { Hono } from 'hono'
import type { Bindings, CacheMetadata } from '../types'

export const cacheRoutes = new Hono<{ Bindings: Bindings }>()

// Get value from cache
cacheRoutes.get('/:key', async (c) => {
  const key = c.req.param('key')
  const value = await c.env.CACHE.get(key)

  if (!value) {
    return c.json({ error: 'Not found', key }, 404)
  }

  return c.json({ key, value })
})

// Get JSON value from cache
cacheRoutes.get('/:key/json', async (c) => {
  const key = c.req.param('key')
  const value = await c.env.CACHE.get(key, 'json')

  if (!value) {
    return c.json({ error: 'Not found', key }, 404)
  }

  return c.json({ key, value })
})

// Get value with metadata
cacheRoutes.get('/:key/meta', async (c) => {
  const key = c.req.param('key')
  const { value, metadata } = await c.env.CACHE.getWithMetadata<CacheMetadata>(key, 'json')

  if (!value) {
    return c.json({ error: 'Not found', key }, 404)
  }

  return c.json({ key, value, metadata })
})

// Set value in cache
cacheRoutes.put('/:key', async (c) => {
  const key = c.req.param('key')
  const body = await c.req.json()

  await c.env.CACHE.put(key, JSON.stringify(body), {
    expirationTtl: 3600 // 1 hour
  })

  return c.json({ success: true, key })
})

// Set value with metadata
cacheRoutes.post('/:key', async (c) => {
  const key = c.req.param('key')
  const { value, metadata } = await c.req.json()

  await c.env.CACHE.put(key, JSON.stringify(value), {
    expirationTtl: 3600,
    metadata: {
      createdAt: new Date().toISOString(),
      role: metadata?.role
    } as CacheMetadata
  })

  return c.json({ success: true, key })
})

// Delete value from cache
cacheRoutes.delete('/:key', async (c) => {
  const key = c.req.param('key')
  await c.env.CACHE.delete(key)

  return c.json({ success: true, key })
})

// List keys with optional prefix
cacheRoutes.get('/', async (c) => {
  const prefix = c.req.query('prefix') || ''
  const limit = parseInt(c.req.query('limit') || '100')

  const list = await c.env.CACHE.list({ prefix, limit })

  return c.json({
    keys: list.keys,
    count: list.keys.length,
    complete: list.list_complete
  })
})
