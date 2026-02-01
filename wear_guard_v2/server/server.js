// server.js
import express from 'express';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { IncomingMessage } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const leafletImagesPath = path.join(__dirname, 'node_modules', 'leaflet', 'dist', 'images');
app.get('/marker-icon.png', (req, res) =>
  res.sendFile(path.join(leafletImagesPath, 'marker-icon.png'))
);
app.get('/marker-icon-2x.png', (req, res) =>
  res.sendFile(path.join(leafletImagesPath, 'marker-icon-2x.png'))
);
app.get('/marker-shadow.png', (req, res) =>
  res.sendFile(path.join(leafletImagesPath, 'marker-shadow.png'))
);

app.use(express.static(path.join(__dirname, 'public')));

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const wss = new WebSocketServer({
  noServer: true,
  maxPayload: 8192,
});

server.on('upgrade', (request, socket, head) => {
  const url = request.url || '/';
  const pathname = new URL(url, `http://${request.headers.host}`).pathname;

  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

const logFile = fs.createWriteStream('websocket-debug.log', { flags: 'a' });
const logMessage = (msg) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${msg}\n`;
  logFile.write(logEntry);
  console.log(logEntry.trim());
};

wss.on('connection', (wsRaw, req) => {
  const ws = wsRaw;
  const ip = req.socket.remoteAddress || 'unknown';

  logMessage(`ESP32 connected from ${ip}`);

  ws.isAlive = true;

  ws.on('pong', () => {
    logMessage(`Received pong from ${ip}`);
    ws.isAlive = true;
  });

  const interval = setInterval(() => {
    if (!ws.isAlive) {
      logMessage(`Terminating stale connection from ${ip}`);
      clearInterval(interval);
      return ws.terminate();
    }
    ws.isAlive = false;
    try {
      ws.ping();
      logMessage(`Ping sent to ${ip}`);
    } catch (e) {
      logMessage(`Ping error: ${e.message}`);
      clearInterval(interval);
      ws.terminate();
    }
  }, 30000);

  let messageCount = 0;
  let lastMessageTime = Date.now();

  ws.on('message', (data) => {
    logMessage(`Raw WS message from ${ip}: ${data.toString()}`);

    try {
      messageCount++;
      lastMessageTime = Date.now();

      if (messageCount % 10 === 0) {
        logMessage(`Received ${messageCount} messages from ${ip}`);
      }

      const jsonData = JSON.parse(data.toString());
      io.emit('sensor-data', jsonData);
      logMessage(`Emitted sensor-data to web clients: ${JSON.stringify(jsonData)}`);

      ws.send(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    } catch (e) {
      logMessage(`Message parse error: ${e.message}, Raw data: ${data.toString().substring(0, 100)}...`);
    }
  });

  ws.on('error', (error) => {
    logMessage(`WebSocket error from ${ip}: ${error.message}`);
  });

  ws.on('close', (code, reason) => {
    logMessage(`ESP32 disconnected from ${ip}. Code: ${code}, Reason: ${reason.toString() || 'No reason provided'}`);
    logMessage(`Connection stats: Messages: ${messageCount}, Last message: ${new Date(lastMessageTime).toISOString()}`);
    clearInterval(interval);
  });

  ws.send(JSON.stringify({
    status: 'connected',
    message: 'Welcome ESP32',
    timestamp: Date.now(),
    config: { pingInterval: 30000 }
  }));
});

io.on('connection', (socket) => {
  logMessage(`Web client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logMessage(`Web client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  logMessage(`Server running on http://localhost:${PORT}`);
  logMessage(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
  logMessage(`Socket.IO endpoint: http://localhost:${PORT}`);
});
