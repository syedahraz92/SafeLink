import { Server } from 'socket.io';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { NextApiRequest, NextApiResponse } from 'next';

// This prevents the API route from being handled by Next.js
export const config = {
api: {
bodyParser: false,
},
};

// Store the latest sensor data
let latestData: any = {};

// Initialize WebSocket server only once
let wsServer: WebSocketServer;

export default function handler(_: NextApiRequest, res: NextApiResponse) {
if (res.socket && !wsServer) {
const server = createServer();

// Create a WebSocket server to receive data from ESP32
wsServer = new WebSocketServer({ noServer: true });

wsServer.on('connection', (socket) => {
    console.log('ESP32 connected');

    socket.on('message', (message) => {
    try {
        // Parse the incoming data
        const data = JSON.parse(message.toString());
        latestData = data;

        // Broadcast to Socket.IO clients (browser)
        if (io) {
        io.emit('sensorData', data);
        }
    } catch (e) {
        console.error('Error parsing message:', e);
    }
    });

    socket.on('close', () => {
    console.log('ESP32 disconnected');
    });
});

// Create Socket.IO server for browser communication
const io = new Server(server, {
    cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    },
});

io.on('connection', (socket) => {
    console.log('Browser connected');

    // Send latest data to newly connected clients
    if (Object.keys(latestData).length > 0) {
    socket.emit('sensorData', latestData);
    }

    socket.on('disconnect', () => {
    console.log('Browser disconnected');
    });
});

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (ws) => {
    wsServer.emit('connection', ws, request);
    });
});

// Start server
server.listen(8080, () => {
    console.log('WebSocket server running on port 8080');
});
}

res.status(200).json({ message: 'WebSocket server running' });
}