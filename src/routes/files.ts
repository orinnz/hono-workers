import { Hono } from 'hono'
import type { Bindings } from '../types'

export const filesRoutes = new Hono<{ Bindings: Bindings }>()

// Upload file
filesRoutes.post('/:key', async (c) => {
  const key = c.req.param('key')
  const body = await c.req.arrayBuffer()
  const contentType = c.req.header('Content-Type') || 'application/octet-stream'

  await c.env.BUCKET.put(key, body, {
    httpMetadata: { contentType }
  })

  return c.json({ success: true, key })
})

// Download file
filesRoutes.get('/:key', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.BUCKET.get(key)

  if (!object) {
    return c.json({ error: 'File not found' }, 404)
  }

  const headers = new Headers()
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
  headers.set('ETag', object.httpEtag)

  return new Response(object.body, { headers })
})

// Get file metadata
filesRoutes.get('/:key/meta', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.BUCKET.get(key)

  if (!object) {
    return c.json({ error: 'File not found' }, 404)
  }

  return c.json({
    key,
    size: object.size,
    uploaded: object.uploaded,
    contentType: object.httpMetadata?.contentType,
    etag: object.httpEtag
  })
})

// Delete file
filesRoutes.delete('/:key', async (c) => {
  const key = c.req.param('key')
  await c.env.BUCKET.delete(key)

  return c.json({ success: true, key })
})

// List files
filesRoutes.get('/', async (c) => {
  const prefix = c.req.query('prefix') || ''
  const limit = parseInt(c.req.query('limit') || '100')

  const list = await c.env.BUCKET.list({ prefix, limit })

  return c.json({
    objects: list.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded
    })),
    count: list.objects.length,
    truncated: list.truncated
  })
})

// Copy file
filesRoutes.post('/:sourceKey/copy/:destKey', async (c) => {
  const sourceKey = c.req.param('sourceKey')
  const destKey = c.req.param('destKey')

  const object = await c.env.BUCKET.get(sourceKey)

  if (!object) {
    return c.json({ error: 'Source file not found' }, 404)
  }

  await c.env.BUCKET.put(destKey, object.body, {
    httpMetadata: object.httpMetadata
  })

  return c.json({ success: true, source: sourceKey, destination: destKey })
})
