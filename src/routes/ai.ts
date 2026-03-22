import { Hono } from 'hono'
import type { Bindings } from '../types'
import { AIAnalysisHandler, type AIHandlerDependencies } from '../handlers/ai-analysis.handler'

export function createAIRoutes(dependencies: AIHandlerDependencies = {}) {
  const aiRoutes = new Hono<{ Bindings: Bindings }>()
  const handler = new AIAnalysisHandler(dependencies)

  aiRoutes.post('/scan', (c) => handler.analyze(c))
  aiRoutes.get('/scan', (c) => handler.getList(c))
  aiRoutes.get('/scan/:id', (c) => handler.getDetail(c))

  return aiRoutes
}
