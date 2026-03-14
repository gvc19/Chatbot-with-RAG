import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'PDF RAG Chatbot API',
    version: '1.0.0',
    description:
      'Backend API for a PDF-based RAG chatbot using ChromaDB and Ollama.'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server'
    }
  ],
  components: {
    schemas: {
      ChatRequest: {
        type: 'object',
        required: ['question'],
        properties: {
          question: {
            type: 'string',
            example: 'What does the document say about pricing?'
          }
        }
      },
      ChatResponse: {
        type: 'object',
        properties: {
          answer: {
            type: 'string',
            example: 'The document states that pricing is based on usage.'
          },
          sources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                documentName: {
                  type: 'string',
                  example: 'contract.pdf'
                },
                chunkIndex: {
                  type: 'integer',
                  example: 2
                }
              }
            }
          }
        }
      },
      UploadResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'PDF indexed successfully'
          },
          chunksIndexed: {
            type: 'integer',
            example: 15
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Only PDF files are supported.'
              },
              code: {
                type: 'string',
                nullable: true
              }
            }
          }
        }
      }
    }
  },
  paths: {
    '/upload': {
      post: {
        tags: ['PDF Ingestion'],
        summary: 'Upload and index a PDF document',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'PDF file to upload and index'
                  }
                },
                required: ['file']
              }
            }
          }
        },
        responses: {
          201: {
            description: 'PDF indexed successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UploadResponse'
                }
              }
            }
          },
          400: {
            description: 'Invalid request or file',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/chat': {
      post: {
        tags: ['Chat'],
        summary: 'Ask a question about the uploaded documents',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ChatRequest'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Answer generated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ChatResponse'
                }
              }
            }
          },
          400: {
            description: 'Invalid question',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    }
  }
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: []
});

