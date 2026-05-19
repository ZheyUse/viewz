import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import sessionRoutes from './routes/session.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json());

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', ({ sessionId }) => {
    socket.join(sessionId);
    console.log(`[DEBUG Server] Socket ${socket.id} joined room: ${sessionId}`);
  });

  // Relay progress events to the session room
  socket.on('progress', ({ current, total, sessionId }) => {
    console.log(`[DEBUG Server] Relaying progress to room ${sessionId}: ${current}/${total}`);
    socket.to(sessionId).emit('progress', { current, total });
  });

  // Relay done events to the session room
  socket.on('done', ({ sessionId, total }) => {
    console.log(`[DEBUG Server] Relaying done to room ${sessionId}`);
    socket.to(sessionId).emit('done', { sessionId, total });
  });

  // Relay error events to the session room
  socket.on('error', ({ sessionId, message }) => {
    console.log(`[DEBUG Server] Relaying error to room ${sessionId}: ${message}`);
    socket.to(sessionId).emit('error', { sessionId, message });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use('/api', sessionRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`ViewZ server running on port ${PORT}`);
});