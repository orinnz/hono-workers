import { Hono } from 'hono'
import type { Bindings, User } from '../types'

export const usersRoutes = new Hono<{ Bindings: Bindings }>()

// Get all users
usersRoutes.get('/', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM users ORDER BY created_at DESC')
    .all()

  return c.json({ users: results as unknown as User[] })
})

// Get user by ID
usersRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const user = await c.env.DB
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first()

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ user })
})

// Create user
usersRoutes.post('/', async (c) => {
  const { name, email } = await c.req.json()

  if (!name || !email) {
    return c.json({ error: 'Name and email are required' }, 400)
  }

  const result = await c.env.DB
    .prepare('INSERT INTO users (name, email) VALUES (?, ?)')
    .bind(name, email)
    .run()

  return c.json({
    success: result.success,
    id: result.meta?.last_row_id
  }, 201)
})

// Update user
usersRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const { name, email } = await c.req.json()

  const result = await c.env.DB
    .prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
    .bind(name, email, id)
    .run()

  if (!result.success) {
    return c.json({ error: 'Failed to update user' }, 500)
  }

  return c.json({ success: true })
})

// Delete user
usersRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')

  const result = await c.env.DB
    .prepare('DELETE FROM users WHERE id = ?')
    .bind(id)
    .run()

  if (!result.success) {
    return c.json({ error: 'Failed to delete user' }, 500)
  }

  return c.json({ success: true })
})

// Batch create users
usersRoutes.post('/batch', async (c) => {
  const { users } = await c.req.json()

  if (!Array.isArray(users)) {
    return c.json({ error: 'Users must be an array' }, 400)
  }

  const statements = users.map((user: { name: string; email: string }) =>
    c.env.DB
      .prepare('INSERT INTO users (name, email) VALUES (?, ?)')
      .bind(user.name, user.email)
  )

  const results = await c.env.DB.batch(statements)

  return c.json({
    success: results.every(r => r.success),
    count: results.length,
    ids: results.map(r => r.meta?.last_row_id).filter(Boolean)
  }, 201)
})

// Search users
usersRoutes.get('/search/:query', async (c) => {
  const query = c.req.param('query')
  const { results } = await c.env.DB
    .prepare('SELECT * FROM users WHERE name LIKE ? OR email LIKE ?')
    .bind(`%${query}%`, `%${query}%`)
    .all()

  return c.json({ users: results as unknown as User[], count: results.length })
})
