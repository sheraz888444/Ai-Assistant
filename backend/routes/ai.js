import express from 'express';
import { interpretCommand } from '../controllers/aiController.js';

const ai = express.Router();

// POST /api/ai/interpret
ai.post('/interpret', interpretCommand);

export default ai;