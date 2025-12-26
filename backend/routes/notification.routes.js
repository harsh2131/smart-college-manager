const express = require('express');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth.middleware');
const { sendNotificationToUser } = require('../config/socket.service');

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications
 * @access  Authenticated
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { unreadOnly } = req.query;
        const query = { userId: req.user._id };
        if (unreadOnly === 'true') query.isRead = false;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

        res.json({ success: true, unreadCount, notifications });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Authenticated
 */
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Authenticated
 */
router.put('/read-all', authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user._id }, { isRead: true });
        res.json({ success: true, message: 'All marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   POST /api/notifications
 * @desc    Create notification (internal use or admin)
 * @access  Teacher/Admin
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { userId, message, type } = req.body;
        const notification = await Notification.create({ userId, message, type });

        // Emit real-time notification
        sendNotificationToUser(userId.toString(), {
            _id: notification._id,
            message: notification.message,
            type: notification.type,
            isRead: false,
            createdAt: notification.createdAt
        });

        res.status(201).json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * Helper function to create and send notification
 * Can be called from other routes
 */
async function createAndSendNotification(userId, message, type) {
    try {
        const notification = await Notification.create({ userId, message, type });
        sendNotificationToUser(userId.toString(), {
            _id: notification._id,
            message: notification.message,
            type: notification.type,
            isRead: false,
            createdAt: notification.createdAt
        });
        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
        return null;
    }
}

module.exports = router;
module.exports.createAndSendNotification = createAndSendNotification;

