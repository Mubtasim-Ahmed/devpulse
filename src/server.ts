import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { initializeDatabase } from './db/schema.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/routes.js';
import issuesRoutes from './modules/issues/routes.js';

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Devpulse API is running' });
});

app.use(errorHandler);

//404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const startServer = async (): Promise<void> => {
  try {
    await initializeDatabase();

    const port = config.port;
    app.listen(port, () => {
      console.log(`DevPulse API running on port ${port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;