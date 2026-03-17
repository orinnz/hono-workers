// Type definitions for Cloudflare bindings

export type Bindings = {
  // Environment variables
  API_KEY: string
  APP_NAME: string

  // KV Namespaces
  CACHE: KVNamespace

  // D1 Databases
  DB: D1Database

  // R2 Buckets
  BUCKET: R2Bucket

  // Durable Objects
  COUNTER: DurableObjectNamespace

  // Queues
  MY_QUEUE: Queue
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
