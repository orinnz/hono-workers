import type { Context } from 'hono'

// Type definitions for Cloudflare bindings

export type Bindings = {
  // Environment variables
  API_KEY: string
  APP_NAME: string
  GEMINI_API_KEY?: string
  GEMINI_DO_LOCATION_HINT?: 'wnam' | 'enam' | 'sam' | 'weur' | 'eeur' | 'apac' | 'oc' | 'afr' | 'me'

  // KV Namespaces
  CACHE: KVNamespace

  // D1 Databases
  DB: D1Database

  // R2 Buckets
  BUCKET: R2Bucket

  // Durable Objects
  GEMINI_PROXY?: DurableObjectNamespace

  // Queues
  MY_QUEUE?: Queue
}

// User type for D1
export interface User {
  id: number
  name: string
  email: string
  created_at: string
}

// Cache metadata type
export interface CacheMetadata {
  createdAt: string
  role?: string
}

// Task type for Queue
export interface Task {
  type: string
  data: any
  timestamp: string
}

// Hono context with bindings
export type AppContext = Context<{ Bindings: Bindings }>
