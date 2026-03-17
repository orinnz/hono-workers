import { Hono } from 'hono'
import type { Bindings, Task } from '../types'

export const tasksRoutes = new Hono<{ Bindings: Bindings }>()

// Queue a single task
tasksRoutes.post('/', async (c) => {
  const { type, data } = await c.req.json()

  if (!type) {
    return c.json({ error: 'Task type is required' }, 400)
  }

  const task: Task = {
    type,
    data,
    timestamp: new Date().toISOString()
  }

  await c.env.MY_QUEUE.send(task)

  return c.json({ queued: true, task }, 201)
})

// Queue multiple tasks
tasksRoutes.post('/batch', async (c) => {
  const { tasks } = await c.req.json()

  if (!Array.isArray(tasks)) {
    return c.json({ error: 'Tasks must be an array' }, 400)
  }

  const taskMessages = tasks.map((task: { type: string; data: any }) => ({
    body: {
      type: task.type,
      data: task.data,
      timestamp: new Date().toISOString()
    } as Task
  }))

  await c.env.MY_QUEUE.sendBatch(taskMessages)

  return c.json({ queued: true, count: tasks.length }, 201)
})

// Get queue stats (example)
tasksRoutes.get('/stats', async (c) => {
  // Note: Cloudflare Queues doesn't expose queue depth directly via bindings
  // This is a placeholder for queue statistics
  return c.json({
    name: 'hono-app-queue',
    status: 'active',
    timestamp: new Date().toISOString()
  })
})
