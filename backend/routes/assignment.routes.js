const express = require('express');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Subject = require('../models/Subject');
const authMiddleware = require('../middleware/auth.middleware');
const { isTeacher, isTeacherOrStudent } = require('../middleware/role.middleware');

const router = express.Router();

/**
 * @route   POST /api/assignments
 * @desc    Create new assignment
 * @access  Teacher
 */
router.post('/', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { subjectId, title, description, dueDate } = req.body;

        if (!subjectId || !title || !dueDate) {
            return res.status(400).json({ success: false, message: 'Subject, title and due date are required' });
        }

        const assignment = await Assignment.create({
            subjectId,
            title,
            description,
            dueDate: new Date(dueDate),
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, message: 'Assignment created', assignment });
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/assignments
 * @desc    Get assignments
 * @access  Authenticated
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { subjectId } = req.query;
        let query = {};

        if (subjectId) {
            query.subjectId = subjectId;
        } else if (req.user.role === 'teacher' || req.user.role === 'admin') {
            query.createdBy = req.user._id;
        } else {
            // Student: get subjects by semester
            const subjects = await Subject.find({ semester: req.user.semester });
            query.subjectId = { $in: subjects.map(s => s._id) };
        }

        let assignments = await Assignment.find(query)
            .populate('subjectId', 'subjectCode subjectName')
            .populate('createdBy', 'name')
            .sort({ dueDate: 1 });

        // For teachers, include submission counts
        if (req.user.role === 'teacher' || req.user.role === 'admin') {
            const assignmentsWithCounts = await Promise.all(
                assignments.map(async (assignment) => {
                    const totalSubmissions = await Submission.countDocuments({ assignmentId: assignment._id });
                    const gradedSubmissions = await Submission.countDocuments({
                        assignmentId: assignment._id,
                        marks: { $ne: null }
                    });
                    return {
                        ...assignment.toObject(),
                        submissions: {
                            total: totalSubmissions,
                            graded: gradedSubmissions,
                            pending: totalSubmissions - gradedSubmissions
                        }
                    };
                })
            );
            return res.json({ success: true, count: assignmentsWithCounts.length, assignments: assignmentsWithCounts });
        }

        res.json({ success: true, count: assignments.length, assignments });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/assignments/pending-review
 * @desc    Get assignments with pending submissions (ungraded)
 * @access  Teacher
 */
router.get('/pending-review', [authMiddleware, isTeacher], async (req, res) => {
    try {
        // Get all assignments created by this teacher
        const assignments = await Assignment.find({ createdBy: req.user._id })
            .populate('subjectId', 'subjectCode subjectName')
            .sort({ dueDate: -1 });

        // For each assignment, count pending submissions (where marks is null)
        const assignmentsWithPending = [];
        for (const assignment of assignments) {
            const pendingCount = await Submission.countDocuments({
                assignmentId: assignment._id,
                marks: null
            });
            if (pendingCount > 0) {
                assignmentsWithPending.push({
                    ...assignment.toObject(),
                    pendingCount
                });
            }
        }

        res.json({ success: true, assignments: assignmentsWithPending });
    } catch (error) {
        console.error('Get pending reviews error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/assignments/upcoming
 * @desc    Get upcoming assignments
 * @access  Authenticated
 */
router.get('/upcoming', authMiddleware, async (req, res) => {
    try {
        let query = { dueDate: { $gte: new Date() } };

        if (req.user.role === 'teacher') {
            query.createdBy = req.user._id;
        } else {
            const subjects = await Subject.find({ semester: req.user.semester });
            query.subjectId = { $in: subjects.map(s => s._id) };
        }

        const assignments = await Assignment.find(query)
            .populate('subjectId', 'subjectCode subjectName')
            .sort({ dueDate: 1 })
            .limit(5);

        res.json({ success: true, assignments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/assignments/:id
 * @desc    Get assignment by ID with submissions
 * @access  Authenticated
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id)
            .populate('subjectId', 'subjectCode subjectName')
            .populate('createdBy', 'name');

        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        let submissions = [];
        if (req.user.role === 'teacher') {
            submissions = await Submission.find({ assignmentId: req.params.id })
                .populate('studentId', 'name email semester');
        }

        res.json({ success: true, assignment, submissions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/assignments/:id
 * @desc    Update assignment
 * @access  Teacher (owner)
 */
router.put('/:id', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }
        if (assignment.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { title, description, dueDate } = req.body;
        if (title) assignment.title = title;
        if (description !== undefined) assignment.description = description;
        if (dueDate) assignment.dueDate = new Date(dueDate);
        await assignment.save();

        res.json({ success: true, message: 'Assignment updated', assignment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Delete assignment
 * @access  Teacher (owner)
 */
router.delete('/:id', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }
        if (assignment.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await assignment.deleteOne();
        await Submission.deleteMany({ assignmentId: req.params.id });

        res.json({ success: true, message: 'Assignment deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
