import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PerformanceController } from './controllers/PerformanceController';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/scores', PerformanceController.uploadScores);
app.get('/api/alerts', PerformanceController.getAlerts);
app.get('/api/students', PerformanceController.getStudents);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`UniMetrics Backend running on http://localhost:${PORT}`);
});
