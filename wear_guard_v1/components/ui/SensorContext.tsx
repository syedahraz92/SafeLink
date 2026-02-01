import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

// Define SensorData type
interface SensorData {
  ambientTemp: number;
  objectTemp: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  irValue: number;
  heartRate: number;
  avgHeartRate: number;
  fingerDetected: boolean;
  gpsData: string;
  timestamp: number;
}

// Create express app and HTTP server
const app = express();
app.use(cors());
const server = http.createServer(app);

// Create Socket.IO server for client-side connections
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Create WebSocket server for ESP32 connections
const wss = new WebSocketServer({
  server,
  path: '/ws',
  maxPayload: 4096 // Allow larger messages
});

// Store the latest sensor data
let latestSensorData: SensorData | null = null;

// WebSocket server for ESP32
wss.on('connection', (ws) => {
  console.log('ESP32 connected on /ws');

  // Add ping/pong for connection stability
  const pingInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.ping();
    }
  }, 30000);

  ws.on('message', (message) => {
    try {
      // Parse the incoming WebSocket message
      const data = JSON.parse(message.toString()) as SensorData;
      console.log('Data received from ESP32:', data.timestamp);

      // Store the latest data
      latestSensorData = data;

      // Broadcast to all Socket.IO clients
      io.emit('sensorData', data);
    } catch (e) {
      console.error('Error parsing WebSocket message:', e);
    }
  });

  ws.on('close', () => {
    console.log('ESP32 disconnected');
    clearInterval(pingInterval);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('pong', () => {
    console.log('Pong received from ESP32');
  });
});

// Socket.IO for web clients
io.on('connection', (socket) => {
  console.log('Web client connected');

  // Send the latest data to newly connected clients
  if (latestSensorData) {
    socket.emit('sensorData', latestSensorData);
  }

  socket.on('disconnect', () => {
    console.log('Web client disconnected');
  });
});

// Basic route for checking if server is running
app.get('/', (req, res) => {
  res.send('ESP32 WebSocket server is running');
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});