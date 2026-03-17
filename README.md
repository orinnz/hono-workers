# Hono Cloudflare App

A type-safe Hono API deployed to Cloudflare Workers with integrated bindings for KV, D1, R2, Durable Objects, and Queues.

## Features

- 🚀 **Edge Computing** - Deploy globally with Cloudflare Workers
- 📦 **KV Storage** - Fast key-value caching
- 💾 **D1 Database** - Serverless SQLite
- 📁 **R2 Storage** - Object storage for files
- 🔢 **Durable Objects** - Stateful real-time coordination
- 📬 **Queues** - Async task processing
- ⏰ **Scheduled Tasks** - Cron-based handlers
- 🔒 **Type-Safe** - Full TypeScript support

## Quick Start

### Install Dependencies

```bash
npm install
```

### Local Development

```bash
npm run dev
```

This starts Wrangler's local development server.

### Deploy

```bash
npm run deploy
```

## Project Structure

```
hono-cloudflare-app/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types.ts              # Type definitions
│   ├── routes/
│   │   ├── health.ts         # Health check endpoints
│   │   ├── cache.ts          # KV cache endpoints
│   │   ├── users.ts          # D1 user CRUD endpoints
│   │   ├── files.ts          # R2 file storage endpoints
│   │   ├── counter.ts        # Durable Object counter endpoints
│   │   └── tasks.ts          # Queue task endpoints
│   ├── durable-objects/
│   │   └── counter.ts        # Counter Durable Object
│   └── middleware/
│       └── index.ts          # Auth, rate limiting, timing
├── public/
│   └── index.html            # Static landing page
├── schema.sql                # D1 database schema
├── wrangler.toml             # Cloudflare configuration
├── package.json
└── tsconfig.json
```

## API Endpoints

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Basic health check |
| GET | `/api/health/ready` | Detailed readiness check |

### Cache (KV)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cache/:key` | Get cached value |
| GET | `/api/cache/:key/json` | Get JSON value |
| GET | `/api/cache/:key/meta` | Get value with metadata |
| PUT | `/api/cache/:key` | Set cached value |
| POST | `/api/cache/:key` | Set value with metadata |
| DELETE | `/api/cache/:key` | Delete cached value |
| GET | `/api/cache` | List keys |

### Users (D1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
| GET | `/api/users/search/:query` | Search users |
| POST | `/api/users` | Create user |
| POST | `/api/users/batch` | Batch create users |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Files (R2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files/:key` | Download file |
| GET | `/api/files/:key/meta` | Get file metadata |
| POST | `/api/files/:key` | Upload file |
| DELETE | `/api/files/:key` | Delete file |
| GET | `/api/files` | List files |

### Counter (Durable Objects)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/counter/:name` | Get counter value |
| POST | `/api/counter/:name/increment` | Increment counter |
| POST | `/api/counter/:name/decrement` | Decrement counter |
| POST | `/api/counter/:name/reset` | Reset counter |

### Tasks (Queues)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Queue a task |
| POST | `/api/tasks/batch` | Queue multiple tasks |
| GET | `/api/tasks/stats` | Get queue stats |

## Configuration

### Environment Variables

Edit `wrangler.toml` to configure:

```toml
[vars]
API_KEY = "your-api-key"
APP_NAME = "Hono Cloudflare App"
```

### Cloudflare Resources

Before deploying, create the required Cloudflare resources:

```bash
# Create KV namespace
npx wrangler kv:namespace create CACHE

# Create D1 database
npx wrangler d1 create hono-app-db
npx wrangler d1 execute hono-app-db --file=schema.sql

# Create R2 bucket
npx wrangler r2 bucket create hono-app-bucket

# Create Queue
npx wrangler queues create hono-app-queue
```

Update the IDs in `wrangler.toml` after creation.

## Middleware

The app includes built-in middleware:

- **Logger** - Request logging
- **CORS** - Cross-origin support
- **PrettyJSON** - Formatted JSON responses
- **Auth** - API key authentication (optional)
- **Rate Limit** - Request rate limiting (optional)
- **Timing** - Response time header

## Testing

Test the API with curl:

```bash
# Health check
curl http://localhost:8787/api/health

# Set cache value
curl -X PUT http://localhost:8787/api/cache/test \
  -H "Content-Type: application/json" \
  -d '{"value": "hello"}'

# Get cache value
curl http://localhost:8787/api/cache/test

# Create user
curl -X POST http://localhost:8787/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com"}'

# List users
curl http://localhost:8787/api/users

# Increment counter
curl -X POST http://localhost:8787/api/counter/mycounter/increment
```

## License

MIT
# hono-workers
# hono-workers
