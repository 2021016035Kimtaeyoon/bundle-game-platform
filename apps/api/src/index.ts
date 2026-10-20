import './env.js';
import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import gamesRouter from './routes/games.js';
import pointsRouter from './routes/points.js';
import shipmentsRouter from './routes/shipments.js';
import { startDeliveryTrackingCron, startGameStatusCron } from './lib/cron.js';
import { UPLOADS_ROOT } from './lib/upload.js';

const app = express();
const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_ROOT));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/games', gamesRouter);
app.use('/api/points', pointsRouter);
app.use('/api/shipments', shipmentsRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});

startGameStatusCron();
startDeliveryTrackingCron();
