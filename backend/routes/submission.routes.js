const express = require('express');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const authMiddleware = require('../middleware/auth.middleware');
const { isTeacher, isStudent, isTeacherOrStudent } = require('../middleware/role.middleware');

const router = express.Router();

/**
 * @route   POST /api/submissions
 * @desc    Submit assignment
 * @access  Student
 */
router.post('/', [authMiddleware, isStudent], async (req, res) => {
    try {
        const { assignmentId, fileUrl, originalName, fileSize, fileType } = req.body;

        if (!assignmentId || !fileUrl) {
            return res.status(400).json({ success: false, message: 'Assignment ID and file URL required' });
        }

        // Check if already submitted
        const existing = await Submission.findOne({ assignmentId, studentId: req.user._id });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Already submitted' });
        }

        const submission = await Submission.create({
            assignmentId,
            studentId: req.user._id,
            fileUrl,
            originalName: originalName || '',
            fileSize: fileSize || 0,
            fileType: fileType || ''
        });

        res.status(201).json({ success: true, message: 'Submitted successfully', submission });
    } catch (error) {
        console.error('Submit error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/submissions/assignment/:assignmentId
 * @desc    Get all submissions for an assignment
 * @access  Teacher
 */
router.get('/assignment/:assignmentId', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const submissions = await Submission.find({ assignmentId: req.params.assignmentId })
            .populate('studentId', 'name email semester rollNumber division')
            .sort({ submittedAt: -1 });

        res.json({ success: true, count: submissions.length, submissions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/submissions/student/:studentId
 * @desc    Get student's submissions
 * @access  Student (own) or Teacher
 */
router.get('/student/:studentId', [authMiddleware, isTeacherOrStudent], async (req, res) => {
    try {
        if (req.user.role === 'student' && req.user._id.toString() !== req.params.studentId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const submissions = await Submission.find({ studentId: req.params.studentId })
            .populate({
                path: 'assignmentId',
                select: 'title dueDate subjectId',
                populate: { path: 'subjectId', select: 'subjectCode' }
            })
            .sort({ submittedAt: -1 });

        res.json({ success: true, submissions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/submissions/:id/grade
 * @desc    Grade submission
 * @access  Teacher
 */
router.put('/:id/grade', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { marks } = req.body;

        if (marks === undefined) {
            return res.status(400).json({ success: false, message: 'Marks required' });
        }

        const submission = await Submission.findByIdAndUpdate(
            req.params.id,
            { marks },
            { new: true }
        );

        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        res.json({ success: true, message: 'Graded', submission });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
