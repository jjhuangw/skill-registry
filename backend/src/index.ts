import express from 'express';
import cors from 'cors';
import skillsRouter from './routes/skills';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/skills', skillsRouter);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

export default app;
