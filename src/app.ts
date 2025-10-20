import express from 'express';
import path from 'path';
import emailRoutes from './routes/emailRoutes';
import logger from './logger';

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', emailRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export default app;
