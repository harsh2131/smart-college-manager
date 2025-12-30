const express = require('express');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const { isTeacher, isTeacherOrStudent } = require('../middleware/role.middleware');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * @route   POST /api/attendance/mark
 * @desc    Mark attendance for a class
 * @access  Teacher
 */
router.post('/mark', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { subjectId, date, attendanceData } = req.body;

        if (!subjectId || !date || !attendanceData || !Array.isArray(attendanceData)) {
            return res.status(400).json({ success: false, message: 'Invalid data' });
        }

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        // Remove existing attendance for this date
        await Attendance.deleteMany({ subjectId, date: attendanceDate });

        // Create new attendance records
        const records = attendanceData.map(item => ({
            studentId: item.studentId,
            subjectId,
            date: attendanceDate,
            status: item.status
        }));

        await Attendance.insertMany(records);

        res.status(201).json({
            success: true,
            message: `Attendance marked for ${records.length} students`,
            count: records.length
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/attendance/subject/:subjectId
 * @desc    Get attendance for a subject (with optional date filter)
 * @access  Teacher
 */
router.get('/subject/:subjectId', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { date } = req.query;
        const query = { subjectId: req.params.subjectId };

        if (date) {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            const nextDay = new Date(d);
            nextDay.setDate(nextDay.getDate() + 1);
            query.date = { $gte: d, $lt: nextDay };
        }

        const attendance = await Attendance.find(query)
            .populate('studentId', 'name email semester')
            .sort({ date: -1 });

        res.json({ success: true, count: attendance.length, attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/attendance/student/:studentId
 * @desc    Get attendance summary for a student
 * @access  Student (own) or Teacher
 */
router.get('/student/:studentId', [authMiddleware, isTeacherOrStudent], async (req, res) => {
    try {
        const { studentId } = req.params;

        // Access control
        if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Get summary by subject
        const summary = await Attendance.aggregate([
            { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
            {
                $group: {
                    _id: '$subjectId',
                    totalClasses: { $sum: 1 },
                    presentDays: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
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
                    subjectCode: '$subject.subjectCode',
                    subjectName: '$subject.subjectName',
                    totalClasses: 1,
                    presentDays: 1,
                    percentage: {
                        $round: [{ $multiply: [{ $divide: ['$presentDays', '$totalClasses'] }, 100] }, 1]
                    }
                }
            }
        ]);

        res.json({ success: true, summary });
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/attendance/low-attendance/:subjectId
 * @desc    Get students with low attendance (<75%)
 * @access  Teacher
 */
router.get('/low-attendance/:subjectId', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const lowAttendance = await Attendance.aggregate([
            { $match: { subjectId: new mongoose.Types.ObjectId(req.params.subjectId) } },
            {
                $group: {
                    _id: '$studentId',
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
                }
            },
            {
                $addFields: {
                    percentage: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] }
                }
            },
            { $match: { percentage: { $lt: 75 } } },
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
                    name: '$student.name',
                    email: '$student.email',
                    total: 1,
                    present: 1,
                    percentage: 1
                }
            },
            { $sort: { percentage: 1 } }
        ]);

        res.json({ success: true, count: lowAttendance.length, students: lowAttendance });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/attendance/:id
 * @desc    Update individual attendance record
 * @access  Teacher
 */
router.put('/:id', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !['present', 'absent', 'late'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Valid status (present, absent, late) is required'
            });
        }

        const attendance = await Attendance.findById(req.params.id);
        if (!attendance) {
            return res.status(404).json({ success: false, message: 'Attendance record not found' });
        }

        // Verify teacher owns the subject
        const subject = await Subject.findById(attendance.subjectId);
        if (!subject || subject.teacherId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this record' });
        }

        attendance.status = status;
        await attendance.save();

        res.json({ success: true, message: 'Attendance updated', attendance });
    } catch (error) {
        console.error('Update attendance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   DELETE /api/attendance/:id
 * @desc    Delete individual attendance record
 * @access  Teacher
 */
router.delete('/:id', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id);
        if (!attendance) {
            return res.status(404).json({ success: false, message: 'Attendance record not found' });
        }

        // Verify teacher owns the subject
        const subject = await Subject.findById(attendance.subjectId);
        if (!subject || subject.teacherId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this record' });
        }

        await attendance.deleteOne();
        res.json({ success: true, message: 'Attendance record deleted' });
    } catch (error) {
        console.error('Delete attendance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   DELETE /api/attendance/subject/:subjectId/date/:date
 * @desc    Delete all attendance records for a subject on a specific date
 * @access  Teacher
 */
router.delete('/subject/:subjectId/date/:date', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { subjectId, date } = req.params;

        // Verify teacher owns the subject
        const subject = await Subject.findById(subjectId);
        if (!subject || subject.teacherId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(attendanceDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const result = await Attendance.deleteMany({
            subjectId,
            date: { $gte: attendanceDate, $lt: nextDay }
        });

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} attendance records`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Delete attendance by date error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
