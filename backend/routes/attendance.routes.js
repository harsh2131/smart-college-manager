const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const authMiddleware = require('../middleware/auth.middleware');
const { isTeacher, isTeacherOrStudent } = require('../middleware/role.middleware');

const router = express.Router();

/**
 * @route   POST /api/attendance/mark
 * @desc    Mark attendance for a class (batch)
 * @access  Teacher only
 */
router.post('/mark', [
    authMiddleware,
    isTeacher,
    body('subjectId').notEmpty().withMessage('Subject ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('lectureNumber').isInt({ min: 1 }).withMessage('Lecture number must be positive'),
    body('attendanceData').isArray({ min: 1 }).withMessage('Attendance data array is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { subjectId, date, lectureNumber, attendanceData, topic } = req.body;

        // Check if attendance already marked for this lecture
        const existing = await Attendance.findOne({
            subjectId,
            date: new Date(date),
            lectureNumber
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked for this lecture. Use update endpoint to modify.'
            });
        }

        // Create attendance records
        const records = attendanceData.map(item => ({
            studentId: item.studentId,
            subjectId,
            date: new Date(date),
            lectureNumber,
            status: item.status,
            topic: topic || '',
            markedBy: req.user._id
        }));

        await Attendance.insertMany(records);

        // Increment lectures conducted in subject
        await Subject.findByIdAndUpdate(subjectId, {
            $inc: { lecturesConducted: 1 }
        });

        res.status(201).json({
            success: true,
            message: `Attendance marked for ${records.length} students`,
            lectureNumber
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate attendance entry detected'
            });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/attendance/subject/:subjectId/date/:date
 * @desc    Get attendance for a specific date
 * @access  Teacher
 */
router.get('/subject/:subjectId/date/:date', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { subjectId, date } = req.params;

        const attendance = await Attendance.find({
            subjectId,
            date: new Date(date)
        }).populate('studentId', 'name rollNumber');

        res.json({
            success: true,
            count: attendance.length,
            attendance
        });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/attendance/student/:studentId
 * @desc    Get all attendance for a student
 * @access  Student (own) or Teacher
 */
router.get('/student/:studentId', [authMiddleware, isTeacherOrStudent], async (req, res) => {
    try {
        const { studentId } = req.params;

        // Students can only view their own attendance
        if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own attendance.'
            });
        }

        const attendance = await Attendance.find({ studentId })
            .populate('subjectId', 'subjectCode subjectName minAttendancePercent')
            .sort({ date: -1 });

        res.json({ success: true, count: attendance.length, attendance });
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/attendance/student/:studentId/subject/:subjectId
 * @desc    Get student's attendance for a specific subject with calculations
 * @access  Student (own) or Teacher
 */
router.get('/student/:studentId/subject/:subjectId', [authMiddleware, isTeacherOrStudent], async (req, res) => {
    try {
        const { studentId, subjectId } = req.params;

        // Students can only view their own attendance
        if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied.'
            });
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        const attendance = await Attendance.find({ studentId, subjectId }).sort({ date: -1 });

        // Calculate statistics
        const totalLectures = attendance.length;
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const absentCount = attendance.filter(a => a.status === 'absent').length;
        const percentage = totalLectures > 0
            ? Math.round((presentCount / totalLectures) * 100 * 10) / 10
            : 100;

        // Determine eligibility
        const minRequired = subject.minAttendancePercent;
        let eligibility = {
            status: 'ALLOWED',
            message: 'Eligible for exam'
        };

        if (percentage < minRequired) {
            if (percentage >= minRequired - 10) {
                eligibility = {
                    status: 'CONDONATION',
                    message: 'Condonation required'
                };
            } else {
                eligibility = {
                    status: 'DETAINED',
                    message: 'Not allowed for exam'
                };
            }
        }

        // Calculate how many can be missed or need to attend
        const requiredPresent = Math.ceil((minRequired / 100) * totalLectures);
        const canMiss = Math.max(0, presentCount - requiredPresent);

        let needToAttend = 0;
        if (presentCount < requiredPresent) {
            needToAttend = Math.ceil(
                (minRequired * totalLectures - 100 * presentCount) / (100 - minRequired)
            );
        }

        res.json({
            success: true,
            subject: {
                _id: subject._id,
                subjectCode: subject.subjectCode,
                subjectName: subject.subjectName,
                minAttendancePercent: minRequired
            },
            statistics: {
                totalLectures,
                presentCount,
                absentCount,
                percentage,
                eligibility,
                canMiss,
                needToAttend
            },
            attendance
        });
    } catch (error) {
        console.error('Get subject attendance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/attendance/summary/:studentId
 * @desc    Get attendance summary for all subjects
 * @access  Student (own) or Teacher
 */
router.get('/summary/:studentId', [authMiddleware, isTeacherOrStudent], async (req, res) => {
    try {
        const { studentId } = req.params;

        if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        // Aggregate attendance by subject
        const summary = await Attendance.aggregate([
            { $match: { studentId: require('mongoose').Types.ObjectId(studentId) } },
            {
                $group: {
                    _id: '$subjectId',
                    total: { $sum: 1 },
                    present: {
                        $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
                    }
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
                    minRequired: '$subject.minAttendancePercent',
                    total: 1,
                    present: 1,
                    absent: { $subtract: ['$total', '$present'] },
                    percentage: {
                        $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1]
                    }
                }
            }
        ]);

        // Add status to each subject
        const enrichedSummary = summary.map(s => ({
            ...s,
            status: s.percentage >= s.minRequired ? 'safe'
                : s.percentage >= s.minRequired - 5 ? 'warning'
                    : 'danger'
        }));

        res.json({ success: true, summary: enrichedSummary });
    } catch (error) {
        console.error('Get attendance summary error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/attendance/at-risk/:subjectId
 * @desc    Get students below attendance threshold
 * @access  Teacher
 */
router.get('/at-risk/:subjectId', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { subjectId } = req.params;

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        // Aggregate to find at-risk students
        const atRisk = await Attendance.aggregate([
            { $match: { subjectId: require('mongoose').Types.ObjectId(subjectId) } },
            {
                $group: {
                    _id: '$studentId',
                    total: { $sum: 1 },
                    present: {
                        $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
                    }
                }
            },
            {
                $addFields: {
                    percentage: {
                        $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1]
                    }
                }
            },
            { $match: { percentage: { $lt: subject.minAttendancePercent } } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'student'
                }
            },
            { $unwind: '$student' },
            {
                $project: {
                    studentId: '$_id',
                    name: '$student.name',
                    rollNumber: '$student.rollNumber',
                    total: 1,
                    present: 1,
                    percentage: 1
                }
            },
            { $sort: { percentage: 1 } }
        ]);

        res.json({
            success: true,
            count: atRisk.length,
            minRequired: subject.minAttendancePercent,
            atRiskStudents: atRisk
        });
    } catch (error) {
        console.error('Get at-risk students error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/attendance/:id
 * @desc    Update attendance record
 * @access  Teacher
 */
router.put('/:id', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { status, editReason } = req.body;

        const attendance = await Attendance.findByIdAndUpdate(
            req.params.id,
            {
                status,
                lastEditedBy: req.user._id,
                lastEditedAt: new Date(),
                editReason
            },
            { new: true }
        );

        if (!attendance) {
            return res.status(404).json({ success: false, message: 'Attendance record not found' });
        }

        res.json({ success: true, message: 'Attendance updated', attendance });
    } catch (error) {
        console.error('Update attendance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
