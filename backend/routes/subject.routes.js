const express = require('express');
const { body, validationResult } = require('express-validator');
const Subject = require('../models/Subject');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const { isTeacher } = require('../middleware/role.middleware');

const router = express.Router();

/**
 * @route   POST /api/subjects
 * @desc    Create a new subject
 * @access  Teacher only
 */
router.post('/', [
    authMiddleware,
    isTeacher,
    body('subjectCode').trim().notEmpty().withMessage('Subject code is required'),
    body('subjectName').trim().notEmpty().withMessage('Subject name is required'),
    body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            subjectCode, subjectName, department, semester, divisions,
            totalPlannedLectures, minAttendancePercent, marksDistribution, credits
        } = req.body;

        // Check if subject already exists
        const existingSubject = await Subject.findOne({ subjectCode: subjectCode.toUpperCase() });
        if (existingSubject) {
            return res.status(400).json({
                success: false,
                message: 'Subject with this code already exists'
            });
        }

        const subject = await Subject.create({
            subjectCode: subjectCode.toUpperCase(),
            subjectName,
            department: department || req.user.department,
            semester,
            divisions: divisions || ['A'],
            credits: credits || 4,
            totalPlannedLectures: totalPlannedLectures || 60,
            minAttendancePercent: minAttendancePercent || 75,
            marksDistribution: marksDistribution || { internal: 30, practical: 20, external: 50 },
            createdBy: req.user._id,
            teachers: [req.user._id]
        });

        // Add subject to teacher's subjectsTeaching
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { subjectsTeaching: subject._id }
        });

        res.status(201).json({
            success: true,
            message: 'Subject created successfully',
            subject
        });
    } catch (error) {
        console.error('Create subject error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/subjects
 * @desc    Get all subjects (with optional filters)
 * @access  Authenticated
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { semester, department, division } = req.query;
        const query = { isActive: true };

        if (semester) query.semester = parseInt(semester);
        if (department) query.department = department;
        if (division) query.divisions = division;

        const subjects = await Subject.find(query)
            .populate('createdBy', 'name email')
            .populate('teachers', 'name email')
            .sort({ subjectCode: 1 });

        res.json({ success: true, count: subjects.length, subjects });
    } catch (error) {
        console.error('Get subjects error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/subjects/my
 * @desc    Get subjects for current user (teaching or enrolled)
 * @access  Authenticated
 */
router.get('/my', authMiddleware, async (req, res) => {
    try {
        let subjects;
        if (req.user.role === 'teacher') {
            subjects = await Subject.find({ teachers: req.user._id, isActive: true })
                .populate('enrolledStudents', 'name email rollNumber');
        } else {
            subjects = await Subject.find({ enrolledStudents: req.user._id, isActive: true })
                .populate('teachers', 'name email');
        }

        res.json({ success: true, count: subjects.length, subjects });
    } catch (error) {
        console.error('Get my subjects error:', error);
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
        const subject = await Subject.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('teachers', 'name email')
            .populate('enrolledStudents', 'name email rollNumber semester division');

        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        res.json({ success: true, subject });
    } catch (error) {
        console.error('Get subject error:', error);
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

        // Check ownership
        if (!subject.teachers.includes(req.user._id) && subject.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this subject' });
        }

        const updates = req.body;
        delete updates.subjectCode; // Cannot change subject code
        delete updates.createdBy;

        const updatedSubject = await Subject.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({ success: true, message: 'Subject updated', subject: updatedSubject });
    } catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   POST /api/subjects/:id/students
 * @desc    Assign students to subject
 * @access  Teacher
 */
router.post('/:id/students', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { studentIds } = req.body;

        if (!studentIds || !Array.isArray(studentIds)) {
            return res.status(400).json({ success: false, message: 'studentIds array is required' });
        }

        const subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        // Add students to subject
        await Subject.findByIdAndUpdate(req.params.id, {
            $addToSet: { enrolledStudents: { $each: studentIds } }
        });

        // Add subject to each student's enrolledSubjects
        await User.updateMany(
            { _id: { $in: studentIds } },
            { $addToSet: { enrolledSubjects: req.params.id } }
        );

        res.json({ success: true, message: `${studentIds.length} students assigned to subject` });
    } catch (error) {
        console.error('Assign students error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/subjects/:id/students
 * @desc    Get students enrolled in a subject
 * @access  Teacher
 */
router.get('/:id/students', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id)
            .populate('enrolledStudents', 'userId name email rollNumber semester division');

        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        res.json({
            success: true,
            count: subject.enrolledStudents.length,
            students: subject.enrolledStudents
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/subjects/:id/increment-lecture
 * @desc    Increment lectures conducted
 * @access  Teacher
 */
router.put('/:id/increment-lecture', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const subject = await Subject.findByIdAndUpdate(
            req.params.id,
            { $inc: { lecturesConducted: 1 } },
            { new: true }
        );

        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        res.json({
            success: true,
            message: 'Lecture count updated',
            lecturesConducted: subject.lecturesConducted
        });
    } catch (error) {
        console.error('Increment lecture error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
