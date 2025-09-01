import express from 'express';
import { interpretCommand, generalChat } from '../controllers/aiController.js';

const ai = express.Router();

// POST /api/ai/interpret
ai.post('/interpret', interpretCommand);

// POST /api/ai/chat
ai.post('/chat', generalChat);

export default ai;
