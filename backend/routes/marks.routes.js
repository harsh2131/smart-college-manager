const express = require('express');
const { body, validationResult } = require('express-validator');
const Marks = require('../models/Marks');
const Subject = require('../models/Subject');
const authMiddleware = require('../middleware/auth.middleware');
const { isTeacher, isTeacherOrStudent } = require('../middleware/role.middleware');

const router = express.Router();

/**
 * @route   POST /api/marks
 * @desc    Enter marks (single or batch)
 * @access  Teacher only
 */
router.post('/', [
    authMiddleware,
    isTeacher,
    body('subjectId').notEmpty().withMessage('Subject ID is required'),
    body('category').isIn(['internal', 'practical', 'external']).withMessage('Invalid category'),
    body('testType').notEmpty().withMessage('Test type is required'),
    body('testName').notEmpty().withMessage('Test name is required'),
    body('maxMarks').isInt({ min: 1 }).withMessage('Max marks must be positive'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('marksData').isArray({ min: 1 }).withMessage('Marks data array is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { subjectId, category, testType, testName, maxMarks, date, marksData } = req.body;

        // Validate marks don't exceed max
        const invalidMarks = marksData.filter(m => m.marksObtained > maxMarks);
        if (invalidMarks.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some marks exceed maximum marks',
                invalidEntries: invalidMarks
            });
        }

        // Create marks records
        const records = marksData.map(item => ({
            studentId: item.studentId,
            subjectId,
            category,
            testType,
            testName,
            marksObtained: item.marksObtained,
            maxMarks,
            date: new Date(date),
            remarks: item.remarks || '',
            enteredBy: req.user._id
        }));

        await Marks.insertMany(records);

        res.status(201).json({
            success: true,
            message: `Marks entered for ${records.length} students`,
            testName
        });
    } catch (error) {
        console.error('Enter marks error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate marks entry. Marks already exist for this test.'
            });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/marks/subject/:subjectId/test/:testName
 * @desc    Get marks for a specific test
 * @access  Teacher
 */
router.get('/subject/:subjectId/test/:testName', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { subjectId, testName } = req.params;

        const marks = await Marks.find({ subjectId, testName })
            .populate('studentId', 'name rollNumber')
            .sort({ 'studentId.rollNumber': 1 });

        // Calculate statistics
        const totalStudents = marks.length;
        const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
        const maxPossible = marks.length > 0 ? marks[0].maxMarks * totalStudents : 0;
        const average = totalStudents > 0 ? (totalObtained / totalStudents).toFixed(2) : 0;
        const highest = Math.max(...marks.map(m => m.marksObtained), 0);
        const lowest = Math.min(...marks.map(m => m.marksObtained), 0);

        res.json({
            success: true,
            testName,
            statistics: { totalStudents, average, highest, lowest },
            marks
        });
    } catch (error) {
        console.error('Get test marks error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/marks/student/:studentId
 * @desc    Get all marks for a student
 * @access  Student (own) or Teacher
 */
router.get('/student/:studentId', [authMiddleware, isTeacherOrStudent], async (req, res) => {
    try {
        const { studentId } = req.params;

        if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const marks = await Marks.find({ studentId })
            .populate('subjectId', 'subjectCode subjectName marksDistribution')
            .sort({ date: -1 });

        res.json({ success: true, count: marks.length, marks });
    } catch (error) {
        console.error('Get student marks error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/marks/student/:studentId/subject/:subjectId
 * @desc    Get student's marks for a specific subject with summary
 * @access  Student (own) or Teacher
 */
router.get('/student/:studentId/subject/:subjectId', [authMiddleware, isTeacherOrStudent], async (req, res) => {
    try {
        const { studentId, subjectId } = req.params;

        if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        const marks = await Marks.find({ studentId, subjectId }).sort({ date: -1 });

        // Calculate totals by category
        const categories = ['internal', 'practical', 'external'];
        const summary = {};

        categories.forEach(cat => {
            const catMarks = marks.filter(m => m.category === cat);
            const obtained = catMarks.reduce((sum, m) => sum + m.marksObtained, 0);
            const max = catMarks.reduce((sum, m) => sum + m.maxMarks, 0);
            const percentage = max > 0 ? Math.round((obtained / max) * 100 * 10) / 10 : 0;

            summary[cat] = {
                obtained,
                max,
                percentage,
                count: catMarks.length
            };
        });

        // Calculate overall
        const totalObtained = Object.values(summary).reduce((sum, s) => sum + s.obtained, 0);
        const totalMax = Object.values(summary).reduce((sum, s) => sum + s.max, 0);
        const overallPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 10) / 10 : 0;

        // Predict final internal marks based on current percentage
        const predictedInternal = Math.round((overallPercentage / 100) * subject.marksDistribution.internal * 10) / 10;

        res.json({
            success: true,
            subject: {
                _id: subject._id,
                subjectCode: subject.subjectCode,
                subjectName: subject.subjectName,
                marksDistribution: subject.marksDistribution
            },
            summary,
            overall: {
                obtained: totalObtained,
                max: totalMax,
                percentage: overallPercentage,
                predictedInternal
            },
            marks
        });
    } catch (error) {
        console.error('Get subject marks error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/marks/summary/:studentId
 * @desc    Get marks summary for all subjects
 * @access  Student (own) or Teacher
 */
router.get('/summary/:studentId', [authMiddleware, isTeacherOrStudent], async (req, res) => {
    try {
        const { studentId } = req.params;

        if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const summary = await Marks.aggregate([
            { $match: { studentId: require('mongoose').Types.ObjectId(studentId) } },
            {
                $group: {
                    _id: '$subjectId',
                    totalObtained: { $sum: '$marksObtained' },
                    totalMax: { $sum: '$maxMarks' },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'subjects',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'subject'
                }
            },
            { $unwind: '$subject' },
            {
                $project: {
                    subjectId: '$_id',
                    subjectCode: '$subject.subjectCode',
                    subjectName: '$subject.subjectName',
                    totalObtained: 1,
                    totalMax: 1,
                    count: 1,
                    percentage: {
                        $round: [{ $multiply: [{ $divide: ['$totalObtained', '$totalMax'] }, 100] }, 1]
                    }
                }
            }
        ]);

        res.json({ success: true, summary });
    } catch (error) {
        console.error('Get marks summary error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/marks/:id
 * @desc    Update marks entry
 * @access  Teacher
 */
router.put('/:id', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { marksObtained, remarks } = req.body;

        const mark = await Marks.findById(req.params.id);
        if (!mark) {
            return res.status(404).json({ success: false, message: 'Marks not found' });
        }

        if (marksObtained > mark.maxMarks) {
            return res.status(400).json({
                success: false,
                message: `Marks cannot exceed ${mark.maxMarks}`
            });
        }

        mark.marksObtained = marksObtained;
        mark.remarks = remarks || mark.remarks;
        await mark.save();

        res.json({ success: true, message: 'Marks updated', mark });
    } catch (error) {
        console.error('Update marks error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   DELETE /api/marks/:id
 * @desc    Delete marks entry
 * @access  Teacher
 */
router.delete('/:id', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const mark = await Marks.findByIdAndDelete(req.params.id);
        if (!mark) {
            return res.status(404).json({ success: false, message: 'Marks not found' });
        }

        res.json({ success: true, message: 'Marks deleted' });
    } catch (error) {
        console.error('Delete marks error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
