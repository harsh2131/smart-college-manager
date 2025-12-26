const express = require('express');
const Result = require('../models/Result');
const Subject = require('../models/Subject');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdmin, isTeacher } = require('../middleware/role.middleware');

const router = express.Router();

// ==================== ADMIN/TEACHER ROUTES ====================

/**
 * @route   POST /api/results
 * @desc    Create or update student result
 * @access  Admin/Teacher
 */
router.post('/', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { studentId, semester, academicYear, subjects } = req.body;

        // Validate student
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Check if result exists
        let result = await Result.findOne({ studentId, semester, academicYear });

        if (result) {
            // Update existing
            result.subjects = subjects;
            await result.save();
        } else {
            // Create new
            result = await Result.create({
                studentId,
                semester,
                academicYear,
                subjects
            });
        }

        res.status(201).json({
            success: true,
            result,
            message: result.isNew ? 'Result created successfully' : 'Result updated successfully'
        });
    } catch (error) {
        console.error('Create result error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   POST /api/results/bulk
 * @desc    Upload results for multiple students
 * @access  Admin/Teacher
 */
router.post('/bulk', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { semester, academicYear, stream, results } = req.body;

        const created = [];
        const errors = [];

        for (const studentResult of results) {
            try {
                const { studentId, subjects } = studentResult;

                let result = await Result.findOne({ studentId, semester, academicYear });

                if (result) {
                    result.subjects = subjects;
                    await result.save();
                } else {
                    result = await Result.create({
                        studentId,
                        semester,
                        academicYear,
                        subjects
                    });
                }
                created.push(result);
            } catch (err) {
                errors.push({ studentId: studentResult.studentId, error: err.message });
            }
        }

        res.json({
            success: true,
            message: `Processed ${created.length} results`,
            created: created.length,
            errors
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/results/:id/publish
 * @desc    Publish result
 * @access  Admin
 */
router.put('/:id/publish', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const result = await Result.findByIdAndUpdate(
            req.params.id,
            { isPublished: true, publishedAt: new Date() },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ success: false, message: 'Result not found' });
        }

        res.json({ success: true, result, message: 'Result published successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/results/publish-bulk
 * @desc    Publish results for semester/stream
 * @access  Admin
 */
router.put('/publish-bulk', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const { semester, academicYear, stream } = req.body;

        // Get student IDs for the stream
        const students = await User.find({ role: 'student', stream, semester });
        const studentIds = students.map(s => s._id);

        const updated = await Result.updateMany(
            { semester, academicYear, studentId: { $in: studentIds }, isPublished: false },
            { isPublished: true, publishedAt: new Date() }
        );

        res.json({
            success: true,
            message: `Published ${updated.modifiedCount} results`,
            count: updated.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/results/semester/:sem
 * @desc    Get all results for a semester
 * @access  Admin/Teacher
 */
router.get('/semester/:sem', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { stream, academicYear, published } = req.query;

        const filter = { semester: parseInt(req.params.sem) };
        if (academicYear) filter.academicYear = academicYear;
        if (published !== undefined) filter.isPublished = published === 'true';

        let results = await Result.find(filter)
            .populate('studentId', 'name rollNumber stream semester email')
            .sort({ 'studentId.rollNumber': 1 });

        // Filter by stream
        if (stream) {
            results = results.filter(r => r.studentId?.stream === stream);
        }

        res.json({ success: true, results, count: results.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== STUDENT ROUTES ====================

/**
 * @route   GET /api/results/my-results
 * @desc    Get student's own results
 * @access  Student
 */
router.get('/my-results', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const results = await Result.find({
            studentId: req.user._id,
            isPublished: true
        }).sort({ semester: -1 });

        // Calculate CGPA from all semesters
        let totalSgpa = 0;
        results.forEach(r => { totalSgpa += r.sgpa; });
        const cgpa = results.length > 0 ? Math.round((totalSgpa / results.length) * 100) / 100 : 0;

        res.json({
            success: true,
            results,
            cgpa,
            totalSemesters: results.length
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/results/student/:id
 * @desc    Get specific student's results
 * @access  Admin/Teacher
 */
router.get('/student/:id', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const student = await User.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const results = await Result.find({ studentId: req.params.id }).sort({ semester: 1 });

        // Calculate CGPA
        let totalSgpa = 0;
        results.forEach(r => { totalSgpa += r.sgpa; });
        const cgpa = results.length > 0 ? Math.round((totalSgpa / results.length) * 100) / 100 : 0;

        res.json({
            success: true,
            student: {
                name: student.name,
                rollNumber: student.rollNumber,
                stream: student.stream,
                semester: student.semester
            },
            results,
            cgpa
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/results/:id/marksheet
 * @desc    Get marksheet data for PDF generation
 * @access  Student (own) / Admin
 */
router.get('/:id/marksheet', authMiddleware, async (req, res) => {
    try {
        const result = await Result.findById(req.params.id)
            .populate('studentId', 'name rollNumber stream semester email phone address admissionYear photo');

        if (!result) {
            return res.status(404).json({ success: false, message: 'Result not found' });
        }

        // Check access
        if (req.user.role !== 'admin' && result.studentId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (!result.isPublished && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Result not yet published' });
        }

        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/results/admin/summary
 * @desc    Get results summary
 * @access  Admin
 */
router.get('/admin/summary', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const { academicYear, semester } = req.query;

        const filter = {};
        if (academicYear) filter.academicYear = academicYear;
        if (semester) filter.semester = parseInt(semester);

        const results = await Result.find(filter).populate('studentId', 'stream');

        const passed = results.filter(r => r.overallStatus === 'pass');
        const failed = results.filter(r => r.overallStatus === 'fail');
        const atkt = results.filter(r => r.overallStatus === 'atkt');
        const published = results.filter(r => r.isPublished);

        const bcaResults = results.filter(r => r.studentId?.stream === 'BCA');
        const bbaResults = results.filter(r => r.studentId?.stream === 'BBA');

        res.json({
            success: true,
            summary: {
                total: results.length,
                published: published.length,
                unpublished: results.length - published.length,
                passed: passed.length,
                failed: failed.length,
                atkt: atkt.length,
                passPercentage: results.length > 0 ? Math.round((passed.length / results.length) * 100) : 0,
                streamWise: {
                    BCA: { total: bcaResults.length, passed: bcaResults.filter(r => r.overallStatus === 'pass').length },
                    BBA: { total: bbaResults.length, passed: bbaResults.filter(r => r.overallStatus === 'pass').length }
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
