const Session = require('../models/sessionModel');
const { activeEditorSessions } = require('../controllers/collaborativeEditorController');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Socket authentication middleware - requires valid JWT token
const authenticateSocket = async (socket, next) => {
    try {
        // Try to get token from multiple sources: auth header, cookies, or query params
        let token = socket.handshake.auth.token ||
            socket.handshake.headers.cookie?.split(';')
                .find(c => c.trim().startsWith('token='))
                ?.split('=')[1] ||
            socket.handshake.query.token;

        // Reject connection if no token provided
        if (!token || token.trim() === '') {
            return next(new Error('Access token is required'));
        }

        // Validate JWT token using the same logic as the auth middleware
        try {
            const decodeObj = jwt.verify(token, process.env.SECRET_KEY);
            const { _id } = decodeObj;

            // Find the user in the database
            const user = await User.findById(_id);
            if (!user) {
                return next(new Error('User not found - invalid token'));
            }

            // Set authenticated user data from database
            socket.user = {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || 'user',
                token: token,
                isAuthenticated: true
            };

            console.log(`User ${socket.user.name} (${socket.user.email}) authenticated successfully`);
            next();

        } catch (jwtError) {
            // Handle specific JWT errors
            if (jwtError.name === 'TokenExpiredError') {
                return next(new Error('Token has expired'));
            } else if (jwtError.name === 'JsonWebTokenError') {
                return next(new Error('Invalid token format'));
            } else {
                return next(new Error('Token verification failed: ' + jwtError.message));
            }
        }

    } catch (error) {
        return next(new Error('Authentication failed: ' + error.message));
    }
};

// Handle collaborative editor events
const handleCollaborativeEditor = (io) => {
    // Authentication middleware for all socket connections
    io.use(authenticateSocket);

    io.on('connection', (socket) => {
        console.log(`User ${socket.user.name} connected to collaborative editor`);

        // Join a coding session room
        socket.on('join-session', async (data) => {
            try {
                const { roomId, user } = data;

                // Update socket user if provided in join data
                if (user) {
                    socket.user = {
                        _id: user.id || socket.user._id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        name: user.name || socket.user.name || 'Anonymous User',
                        email: user.email || socket.user.email || 'user@example.com',
                        role: user.role || socket.user.role || 'user',
                        token: user.token || socket.user.token,
                        isAuthenticated: socket.user.isAuthenticated
                    };
                }

                // Try to find session in database, fallback to mock session
                let session;
                try {
                    session = await Session.findOne({ roomId })
                        .populate('participants', 'name email');

                    if (!session) {
                        // Create a new session if not found
                        session = {
                            roomId: roomId,
                            currentCode: '// Welcome to collaborative editor\n// Anyone can edit and collaborate!\nconsole.log("Hello World!");',
                            language: 'javascript',
                            participants: [socket.user]
                        };

                        // Try to save to database if available
                        try {
                            const newSession = new Session({
                                roomId: roomId,
                                title: `Session ${roomId}`,
                                currentCode: session.currentCode,
                                language: session.language,
                                participants: [socket.user._id],
                                createdBy: socket.user._id
                            });
                            await newSession.save();
                            session = await Session.findOne({ roomId }).populate('participants', 'name email');
                        } catch (dbError) {
                            console.warn('Could not save session to database:', dbError.message);
                        }
                    }
                } catch (dbError) {
                    console.warn('Database error, using mock session:', dbError.message);
                    // Fallback to mock session
                    session = {
                        roomId: roomId,
                        currentCode: '// Welcome to collaborative editor\n// Anyone can edit and collaborate!\nconsole.log("Hello World!");',
                        language: 'javascript',
                        participants: [socket.user]
                    };
                }

                // Join the room
                socket.join(roomId);
                socket.currentRoom = roomId;

                // Initialize or update active session
                let activeSession = activeEditorSessions.get(roomId);
                if (!activeSession) {
                    activeSession = {
                        code: session.currentCode || '',
                        language: session.language,
                        participants: session.participants,
                        cursors: new Map(),
                        connectedUsers: new Set()
                    };
                    activeEditorSessions.set(roomId, activeSession);
                }

                // Ensure user ID exists before adding to connected users
                const userId = socket.user._id;
                if (userId) {
                    activeSession.connectedUsers.add(userId.toString());
                }

                // Send current session state
                socket.emit('session-joined', {
                    roomId,
                    code: activeSession.code,
                    language: activeSession.language,
                    participants: session.participants,
                    connectedUsers: Array.from(activeSession.connectedUsers),
                    user: socket.user
                });

                // Notify others that user joined
                socket.to(roomId).emit('user-joined', {
                    user: {
                        _id: socket.user._id,
                        name: socket.user.name,
                        email: socket.user.email
                    },
                    connectedUsers: Array.from(activeSession.connectedUsers)
                });

            } catch (error) {
                console.error('Error joining session:', error);
                socket.emit('error', { message: 'Failed to join session' });
            }
        });

        // Handle real-time code changes
        socket.on('code-change', async (data) => {
            try {
                const { roomId, code, language, change } = data;

                if (socket.currentRoom !== roomId) {
                    socket.emit('error', { message: 'Not connected to this session' });
                    return;
                }

                // Update active session
                const activeSession = activeEditorSessions.get(roomId);
                if (activeSession) {
                    activeSession.code = code;
                    activeSession.language = language || activeSession.language;
                    activeSession.lastModified = new Date();
                }

                // Broadcast changes to other users in the room
                socket.to(roomId).emit('code-updated', {
                    code,
                    language: language || activeSession?.language,
                    change,
                    author: {
                        _id: socket.user._id,
                        name: socket.user.name
                    },
                    timestamp: new Date()
                });

                // Update database every few seconds (debounced)
                clearTimeout(socket.saveTimeout);
                socket.saveTimeout = setTimeout(async () => {
                    try {
                        const session = await Session.findOne({ roomId });
                        if (session) {
                            session.currentCode = code;
                            session.language = language || session.language;
                            session.lastModified = new Date();
                            session.lastModifiedBy = socket.user._id;

                            // Add to history if significant change
                            if (code.length > (session.currentCode?.length || 0) + 50 ||
                                code.length < (session.currentCode?.length || 0) - 50) {
                                session.codeHistory.push({
                                    code,
                                    timestamp: new Date(),
                                    author: socket.user._id,
                                    language: language || session.language
                                });
                            }

                            await session.save();
                        }
                    } catch (error) {
                        console.error('Error saving code to database:', error);
                    }
                }, 3000); // Save to DB after 3 seconds of inactivity

            } catch (error) {
                console.error('Error handling code change:', error);
                socket.emit('error', { message: 'Failed to process code change' });
            }
        });

        // Handle cursor position updates
        socket.on('cursor-update', (data) => {
            try {
                const { roomId, cursorPosition, selection } = data;

                if (socket.currentRoom !== roomId) {
                    return;
                }

                const activeSession = activeEditorSessions.get(roomId);
                if (activeSession) {
                    // Ensure user ID exists before setting cursor
                    const userId = socket.user._id;
                    if (userId) {
                        activeSession.cursors.set(userId.toString(), {
                            userId: userId.toString(),
                            userName: socket.user.name,
                            cursorPosition,
                            selection,
                            timestamp: new Date()
                        });
                    }

                    // Broadcast cursor position to other users
                    socket.to(roomId).emit('cursor-updated', {
                        userId: socket.user._id,
                        userName: socket.user.name,
                        cursorPosition,
                        selection
                    });
                }
            } catch (error) {
                console.error('Error updating cursor:', error);
            }
        });

        // Handle language change
        socket.on('language-change', async (data) => {
            try {
                const { roomId, language } = data;

                if (socket.currentRoom !== roomId) {
                    socket.emit('error', { message: 'Not connected to this session' });
                    return;
                }

                // Update active session and database
                const activeSession = activeEditorSessions.get(roomId);
                if (activeSession) {
                    activeSession.language = language;
                }

                try {
                    const session = await Session.findOne({ roomId });
                    if (session) {
                        session.language = language;
                        session.lastModified = new Date();
                        session.lastModifiedBy = socket.user._id;
                        await session.save();
                    }
                } catch (dbError) {
                    console.warn('Could not save language to database:', dbError.message);
                }

                // Broadcast language change to all users in room
                io.to(roomId).emit('language-updated', {
                    language,
                    changedBy: {
                        _id: socket.user._id,
                        name: socket.user.name
                    }
                });

            } catch (error) {
                console.error('Error changing language:', error);
                socket.emit('error', { message: 'Failed to change language' });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`User ${socket.user.name} disconnected from collaborative editor`);

            if (socket.currentRoom) {
                const activeSession = activeEditorSessions.get(socket.currentRoom);
                if (activeSession && socket.user._id) {
                    activeSession.connectedUsers.delete(socket.user._id.toString());
                    activeSession.cursors.delete(socket.user._id.toString());

                    // Notify others that user left
                    socket.to(socket.currentRoom).emit('user-left', {
                        user: {
                            _id: socket.user._id,
                            name: socket.user.name
                        },
                        connectedUsers: Array.from(activeSession.connectedUsers)
                    });

                    // Clean up empty sessions
                    if (activeSession.connectedUsers.size === 0) {
                        setTimeout(() => {
                            if (activeSession.connectedUsers.size === 0) {
                                activeEditorSessions.delete(socket.currentRoom);
                            }
                        }, 300000); // Clean up after 5 minutes of inactivity
                    }
                }
            }

            // Clear save timeout
            if (socket.saveTimeout) {
                clearTimeout(socket.saveTimeout);
            }
        });
    });
};

module.exports = { handleCollaborativeEditor };