import { Hono } from 'hono'
import type { Bindings } from '../types'

export const counterRoutes = new Hono<{ Bindings: Bindings }>()

// Get counter value
counterRoutes.get('/:name', async (c) => {
  const name = c.req.param('name')
  const id = c.env.COUNTER.idFromName(name)
  const stub = c.env.COUNTER.get(id)

  const response = await stub.fetch('http://counter/value')
  const value = await response.text()

  return c.json({ name, value: parseInt(value) })
})

// Increment counter
counterRoutes.post('/:name/increment', async (c) => {
  const name = c.req.param('name')
  const id = c.env.COUNTER.idFromName(name)
  const stub = c.env.COUNTER.get(id)

  const response = await stub.fetch('http://counter/increment')
  const value = await response.text()

  return c.json({ name, value: parseInt(value), action: 'incremented' })
})

// Decrement counter
counterRoutes.post('/:name/decrement', async (c) => {
  const name = c.req.param('name')
  const id = c.env.COUNTER.idFromName(name)
  const stub = c.env.COUNTER.get(id)

  const response = await stub.fetch('http://counter/decrement')
  const value = await response.text()

  return c.json({ name, value: parseInt(value), action: 'decremented' })
})

// Reset counter
counterRoutes.post('/:name/reset', async (c) => {
  const name = c.req.param('name')
  const id = c.env.COUNTER.idFromName(name)
  const stub = c.env.COUNTER.get(id)

  const response = await stub.fetch('http://counter/reset')
  const value = await response.text()

  return c.json({ name, value: parseInt(value), action: 'reset' })
})
