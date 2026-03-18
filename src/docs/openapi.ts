export function getOpenAPISpec(baseUrl = 'http://localhost:8787') {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Hono Worker API',
      version: '1.0.0',
      description: 'API documentation for the Hono Worker project including image analysis endpoints.'
    },
    servers: [{ url: baseUrl }],
    paths: {
      '/api/ai/analyze': {
        post: {
          summary: 'Analyze an uploaded image',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['image'],
                  properties: {
                    image: {
                      type: 'string',
                      format: 'binary',
                      description: 'Image file to analyze'
                    },
                    prompt: {
                      type: 'string',
                      description: 'Optional custom prompt for image analysis'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Image analyzed successfully',
              content: {
                'application/json': {
                  example: {
                    id: 1,
                    imageUrl: '/uploads/8d66e8eb-c213-480f-a949-b89f95f7f7d5.jpg',
                    originalName: 'sample.jpg',
                    mimeType: 'image/jpeg',
                    aiResponse: 'A person standing in front of a mountain.',
                    promptUsed: 'What is in this image? Please provide a detailed description.'
                  }
                }
              }
            },
            '400': {
              description: 'Invalid input / no file / invalid data'
            },
            '503': {
              description: 'AI dependency not configured'
            },
            '500': {
              description: 'Unexpected internal error'
            }
          }
        }
      },
      '/api/ai/analyses': {
        get: {
          summary: 'List image analyses',
          parameters: [
            {
              in: 'query',
              name: 'limit',
              schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
            },
            {
              in: 'query',
              name: 'offset',
              schema: { type: 'integer', minimum: 0, default: 0 }
            }
          ],
          responses: {
            '200': {
              description: 'List of analyses with pagination',
              content: {
                'application/json': {
                  example: {
                    data: [
                      {
                        id: 1,
                        imageUrl: '/uploads/8d66e8eb-c213-480f-a949-b89f95f7f7d5.jpg',
                        originalName: 'sample.jpg',
                        mimeType: 'image/jpeg',
                        aiResponse: 'A person standing in front of a mountain.',
                        promptUsed: 'What is in this image? Please provide a detailed description.',
                        createdAt: '2026-03-18T09:10:00.000Z'
                      }
                    ],
                    pagination: {
                      limit: 20,
                      offset: 0,
                      total: 1
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Invalid pagination parameters'
            },
            '500': {
              description: 'Unexpected internal error'
            }
          }
        }
      },
      '/api/ai/analyses/{id}': {
        get: {
          summary: 'Get image analysis by id',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer', minimum: 1 }
            }
          ],
          responses: {
            '200': {
              description: 'Analysis detail',
              content: {
                'application/json': {
                  example: {
                    id: 1,
                    imageUrl: '/uploads/8d66e8eb-c213-480f-a949-b89f95f7f7d5.jpg',
                    originalName: 'sample.jpg',
                    mimeType: 'image/jpeg',
                    aiResponse: 'A person standing in front of a mountain.',
                    promptUsed: 'What is in this image? Please provide a detailed description.',
                    createdAt: '2026-03-18T09:10:00.000Z'
                  }
                }
              }
            },
            '400': {
              description: 'Invalid id'
            },
            '404': {
              description: 'Resource not found'
            },
            '500': {
              description: 'Unexpected internal error'
            }
          }
        }
      }
    }
  }
}
