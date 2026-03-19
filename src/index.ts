import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { swaggerUI } from '@hono/swagger-ui'

// Import types
import type { Bindings } from './types'

// Import routes
import { healthRoutes } from './routes/health'
import { usersRoutes } from './routes/users'
import { filesRoutes } from './routes/files'
import { createAIRoutes } from './routes/ai'
import { barcodeRoutes } from './routes/barcode'

import { AIAnalysisHandler } from './handlers/ai-analysis.handler'
import { getOpenAPISpec } from './docs/openapi'
import type { AIService } from './services/ai/gemini-ai.service'
import { GeminiProxyDO } from './durable-objects/gemini-proxy'

interface AppDependencies {
  aiService?: AIService
}

export function createApp(dependencies: AppDependencies = {}) {
  const app = new Hono<{ Bindings: Bindings }>()
  const aiHandler = new AIAnalysisHandler({
    getAIService: () => dependencies.aiService
  })

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
  app.route('/api/users', usersRoutes)
  app.route('/api/files', filesRoutes)
  app.route(
    '/api/ai',
    createAIRoutes(
      dependencies.aiService
        ? {
            getAIService: () => dependencies.aiService
          }
        : {}
    )
  )
  app.get('/uploads/:filename', (c) => aiHandler.getUploadedFile(c))
  app.route('/api/barcode', barcodeRoutes)

  // OpenAPI and Swagger
  app.get('/api/docs/openapi.json', (c) => {
    const origin = new URL(c.req.url).origin
    return c.json(getOpenAPISpec(origin))
  })
  app.get('/api/docs', swaggerUI({ url: '/api/docs/openapi.json' }))

  // 404 handler
  app.notFound((c) => {
    return c.json({ error: 'Not Found', path: c.req.path }, 404)
  })

  // Error handler
  app.onError((err, c) => {
    console.error('Error:', err)
    return c.json({ error: 'Internal Server Error', message: err.message }, 500)
  })

  return app
}

const app = createApp()

// Export app and Durable Objects
export default {
  fetch: app.fetch,

  // Queue consumer
  // async queue(batch: MessageBatch, env: Bindings): Promise<void> {
  //   for (const message of batch.messages) {
  //     const { type, data } = message.body as { type: string; data: any }

  //     try {
  //       console.log(`Processing ${type}:`, data)
  //       // Process the task here
  //       await processTask(type, data, env)
  //       message.ack()
  //     } catch (error) {
  //       console.error('Queue processing error:', error)
  //       message.retry()
  //     }
  //   }
  // },

  // // Scheduled events (cron)
  // async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext): Promise<void> {
  //   console.log('Running scheduled task:', event.cron)
    
  //   switch (event.cron) {
  //     case '0 * * * *': // Every hour
  //       await hourlyTask(env)
  //       break
  //   }
  // }
}

export { GeminiProxyDO }

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
