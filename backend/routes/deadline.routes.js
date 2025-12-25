const express = require('express');
const { body, validationResult } = require('express-validator');
const Deadline = require('../models/Deadline');
const authMiddleware = require('../middleware/auth.middleware');
const { isTeacher } = require('../middleware/role.middleware');

const router = express.Router();

// POST /api/deadlines - Create deadline
router.post('/', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { title, description, subjectId, type, dueDate, dueTime, marksWeightage, appliesTo } = req.body;
        const deadline = await Deadline.create({
            title, description, subjectId, type,
            dueDate: new Date(dueDate),
            dueTime: dueTime || '23:59',
            marksWeightage: marksWeightage || 0,
            appliesTo: appliesTo || {},
            createdBy: req.user._id
        });
        res.status(201).json({ success: true, deadline });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/deadlines - Get all deadlines
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { subjectId, type } = req.query;
        const query = { isActive: true };
        if (subjectId) query.subjectId = subjectId;
        if (type) query.type = type;

        const deadlines = await Deadline.find(query)
            .populate('subjectId', 'subjectCode subjectName')
            .sort({ dueDate: 1 });
        res.json({ success: true, count: deadlines.length, deadlines });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/deadlines/upcoming - Next 7 days
router.get('/upcoming', authMiddleware, async (req, res) => {
    try {
        const now = new Date();
        const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const deadlines = await Deadline.find({
            isActive: true,
            dueDate: { $gte: now, $lte: weekLater }
        }).populate('subjectId', 'subjectCode subjectName').sort({ dueDate: 1 });
        res.json({ success: true, deadlines });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/deadlines/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const deadline = await Deadline.findById(req.params.id)
            .populate('subjectId', 'subjectCode subjectName');
        if (!deadline) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, deadline });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/deadlines/:id
router.put('/:id', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const deadline = await Deadline.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!deadline) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, deadline });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/deadlines/:id
router.delete('/:id', [authMiddleware, isTeacher], async (req, res) => {
    try {
        await Deadline.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ success: true, message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
