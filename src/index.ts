import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

// Import types
import type { Bindings } from './types'

// Import routes
import { healthRoutes } from './routes/health'
import { cacheRoutes } from './routes/cache'
import { usersRoutes } from './routes/users'
import { filesRoutes } from './routes/files'
import { counterRoutes } from './routes/counter'
import { tasksRoutes } from './routes/tasks'

// Import Durable Object
import { Counter } from './durable-objects/counter'

// Create main app
const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('/api/*', cors())

// Root route
app.get('/', (c) => {
  return c.json({
    name: c.env.APP_NAME,
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  })
})

// Mount routes
app.route('/api/health', healthRoutes)
app.route('/api/cache', cacheRoutes)
app.route('/api/users', usersRoutes)
app.route('/api/files', filesRoutes)
app.route('/api/counter', counterRoutes)
app.route('/api/tasks', tasksRoutes)

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({ error: 'Internal Server Error', message: err.message }, 500)
})

// Export app and Durable Objects
export default {
  fetch: app.fetch,

  // Queue consumer
  async queue(batch: MessageBatch, env: Bindings): Promise<void> {
    for (const message of batch.messages) {
      const { type, data } = message.body as { type: string; data: any }

      try {
        console.log(`Processing ${type}:`, data)
        // Process the task here
        await processTask(type, data, env)
        message.ack()
      } catch (error) {
        console.error('Queue processing error:', error)
        message.retry()
      }
    }
  },

  // Scheduled events (cron)
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext): Promise<void> {
    console.log('Running scheduled task:', event.cron)
    
    switch (event.cron) {
      case '0 * * * *': // Every hour
        await hourlyTask(env)
        break
    }
  }
}

export { Counter }

// Task processor
async function processTask(type: string, data: any, env: Bindings): Promise<void> {
  console.log(`Processing task of type: ${type}`)
  // Implement your task processing logic here
}

// Hourly task
async function hourlyTask(env: Bindings): Promise<void> {
  console.log('Running hourly maintenance task')
  // Implement your hourly task logic here
}
