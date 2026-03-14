import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import uploadRoutes from './routes/upload.routes.js';
import chatRoutes from './routes/chat.routes.js';
import { swaggerSpec } from './docs/swagger.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

// Ensure Ollama JS client points at configured base URL
if (process.env.OLLAMA_BASE_URL) {
  process.env.OLLAMA_HOST = process.env.OLLAMA_BASE_URL;
}

const app = express();
const port = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/upload', uploadRoutes);
app.use('/chat', chatRoutes);

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  const status = err.status || 500;
  const message =
    err.publicMessage ||
    err.message ||
    'An unexpected error occurred. Please try again later.';

  res.status(status).json({
    error: {
      message,
      ...(err.code && { code: err.code })
    }
  });
});

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
  logger.info(`Swagger UI available at /api-docs`);
});

