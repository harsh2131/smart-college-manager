const express = require('express');
const Subject = require('../models/Subject');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const { isTeacher } = require('../middleware/role.middleware');

const router = express.Router();

/**
 * @route   GET /api/subjects
 * @desc    Get all subjects (with optional filters)
 * @access  Authenticated
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { semester, teacherId } = req.query;
        const query = {};
        if (semester) query.semester = semester;
        if (teacherId) query.teacherId = teacherId;

        const subjects = await Subject.find(query)
            .populate('teacherId', 'name email')
            .sort({ subjectCode: 1 });

        res.json({ success: true, count: subjects.length, subjects });
    } catch (error) {
        console.error('Get subjects error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/subjects/my
 * @desc    Get teacher's subjects or student's semester subjects
 * @access  Authenticated
 */
router.get('/my', authMiddleware, async (req, res) => {
    try {
        let subjects;
        if (req.user.role === 'teacher' || req.user.role === 'admin') {
            subjects = await Subject.find({ teacherId: req.user._id }).populate('teacherId', 'name');
        } else {
            subjects = await Subject.find({ semester: req.user.semester }).populate('teacherId', 'name');
        }
        res.json({ success: true, subjects });
    } catch (error) {
        console.error('Get my subjects error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   POST /api/subjects
 * @desc    Create new subject
 * @access  Teacher
 */
router.post('/', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { subjectName, subjectCode, semester } = req.body;

        const exists = await Subject.findOne({ subjectCode: subjectCode.toUpperCase() });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Subject code already exists' });
        }

        const subject = await Subject.create({
            subjectName,
            subjectCode: subjectCode.toUpperCase(),
            teacherId: req.user._id,
            semester
        });

        res.status(201).json({ success: true, message: 'Subject created', subject });
    } catch (error) {
        console.error('Create subject error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/subjects/:id
 * @desc    Get subject by ID
 * @access  Authenticated
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id).populate('teacherId', 'name email');
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        res.json({ success: true, subject });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/subjects/:id/students
 * @desc    Get students for a subject (by semester)
 * @access  Teacher
 */
router.get('/:id/students', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        const students = await User.find({
            role: 'student',
            semester: subject.semester
        }).select('name email semester department').sort({ name: 1 });

        res.json({ success: true, count: students.length, students });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/subjects/:id
 * @desc    Update subject
 * @access  Teacher (owner)
 */
router.put('/:id', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        if (subject.teacherId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { subjectName, semester } = req.body;
        if (subjectName) subject.subjectName = subjectName;
        if (semester) subject.semester = semester;
        await subject.save();

        res.json({ success: true, message: 'Subject updated', subject });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   DELETE /api/subjects/:id
 * @desc    Delete subject
 * @access  Teacher (owner)
 */
router.delete('/:id', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        if (subject.teacherId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await subject.deleteOne();
        res.json({ success: true, message: 'Subject deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
