// server/dummyServer.ts

import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('🟢 Dummy client connected');

  const interval = setInterval(() => {
    const fakeData = {
      ambientTemp: (20 + Math.random() * 5).toFixed(2),
      objectTemp: (30 + Math.random() * 5).toFixed(2),
      accelX: (Math.random() * 2 - 1).toFixed(2),
      accelY: (Math.random() * 2 - 1).toFixed(2),
      accelZ: (9.8 + Math.random()).toFixed(2),
      irValue: Math.floor(Math.random() * 1024),
      heartRate: Math.floor(Math.random() * 100) + 60,
      avgHeartRate: Math.floor(Math.random() * 100) + 60,
      fingerDetected: Math.random() < 0.5,
      // latitude: (Math.random() * 180 - 90).toFixed(6),
      // longitude: (Math.random() * 360 - 180).toFixed(6),
      timestamp: Date.now(),
      rssi: Math.floor(Math.random() * 100) - 50,
    };

    socket.emit('sensor-data', fakeData);
    console.log(`Emitted sensor-data to web clients: ${JSON.stringify(fakeData)}`);

  }, 1000);

  socket.on('disconnect', () => {
    clearInterval(interval);
    console.log('🔴 Dummy client disconnected');
  });
});

httpServer.listen(8080, () => {
  console.log('🚀 Dummy server running on http://localhost:8080');
});
