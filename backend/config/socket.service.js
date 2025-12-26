const { Server } = require('socket.io');
let io;

// Store user socket mappings
const userSockets = new Map();

/**
 * Initialize Socket.IO with the HTTP server
 */
function initializeSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:4200',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('🔌 Client connected:', socket.id);

        // User joins their personal room for notifications
        socket.on('join', (userId) => {
            if (userId) {
                socket.join(`user:${userId}`);
                userSockets.set(userId, socket.id);
                console.log(`👤 User ${userId} joined room`);
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            // Remove user from mapping
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    break;
                }
            }
            console.log('🔌 Client disconnected:', socket.id);
        });
    });

    return io;
}

/**
 * Get the Socket.IO instance
 */
function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
}

/**
 * Send notification to a specific user
 */
function sendNotificationToUser(userId, notification) {
    if (io) {
        io.to(`user:${userId}`).emit('notification', notification);
        console.log(`📬 Notification sent to user ${userId}`);
    }
}

/**
 * Send notification to multiple users
 */
function sendNotificationToUsers(userIds, notification) {
    if (io) {
        userIds.forEach(userId => {
            io.to(`user:${userId}`).emit('notification', notification);
        });
        console.log(`📬 Notification sent to ${userIds.length} users`);
    }
}

/**
 * Broadcast to all connected clients
 */
function broadcastNotification(notification) {
    if (io) {
        io.emit('notification', notification);
        console.log('📣 Broadcast notification sent');
    }
}

module.exports = {
    initializeSocket,
    getIO,
    sendNotificationToUser,
    sendNotificationToUsers,
    broadcastNotification
};
