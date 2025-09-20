const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Simple Socket.IO setup for testing
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Simple test route
app.get('/', (req, res) => {
    res.send('Collaborative Editor Server is running! Go to /collaborative-editor.html');
});

// Socket connection handler for testing
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-session', (data) => {
        console.log('Join session:', data);
        socket.join(data.roomId);
        socket.emit('session-joined', {
            roomId: data.roomId,
            code: '// Welcome to collaborative editor\nconsole.log("Hello World!");',
            language: 'javascript',
            participants: [],
            connectedUsers: [socket.id]
        });
    });

    socket.on('code-change', (data) => {
        console.log('Code change in room:', data.roomId);
        socket.to(data.roomId).emit('code-updated', {
            code: data.code,
            language: data.language,
            author: { name: 'Test User', _id: socket.id }
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
    console.log(`Access editor at: http://localhost:${PORT}/collaborative-editor.html`);
});