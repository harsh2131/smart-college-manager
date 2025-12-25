const express = require('express');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Deadline = require('../models/Deadline');
const authMiddleware = require('../middleware/auth.middleware');
const { isTeacher, isTeacherOrStudent } = require('../middleware/role.middleware');
const mongoose = require('mongoose');

const router = express.Router();

// GET /api/analytics/student/:studentId - Complete student dashboard
router.get('/student/:studentId', [authMiddleware, isTeacherOrStudent], async (req, res) => {
    try {
        const { studentId } = req.params;

        if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const student = await User.findById(studentId).populate('enrolledSubjects');
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        // Attendance summary
        const attendanceSummary = await Attendance.aggregate([
            { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
            {
                $group: {
                    _id: '$subjectId',
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
                }
            },
            { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
            { $unwind: '$subject' },
            {
                $project: {
                    subjectCode: '$subject.subjectCode',
                    subjectName: '$subject.subjectName',
                    minRequired: '$subject.minAttendancePercent',
                    total: 1, present: 1,
                    percentage: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] }
                }
            }
        ]);

        // Marks summary
        const marksSummary = await Marks.aggregate([
            { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
            {
                $group: {
                    _id: '$subjectId',
                    obtained: { $sum: '$marksObtained' },
                    max: { $sum: '$maxMarks' }
                }
            },
            { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
            { $unwind: '$subject' },
            {
                $project: {
                    subjectCode: '$subject.subjectCode',
                    subjectName: '$subject.subjectName',
                    obtained: 1, max: 1,
                    percentage: { $round: [{ $multiply: [{ $divide: ['$obtained', '$max'] }, 100] }, 1] }
                }
            }
        ]);

        // Upcoming deadlines
        const now = new Date();
        const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcomingDeadlines = await Deadline.find({
            isActive: true,
            dueDate: { $gte: now, $lte: weekLater }
        }).populate('subjectId', 'subjectCode subjectName').limit(5);

        // Warnings
        const warnings = [];
        attendanceSummary.forEach(s => {
            if (s.percentage < s.minRequired) {
                warnings.push({ type: 'attendance', subjectCode: s.subjectCode, message: `Low attendance: ${s.percentage}%` });
            }
        });

        res.json({
            success: true,
            student: { name: student.name, rollNumber: student.rollNumber, semester: student.semester, division: student.division },
            attendanceSummary,
            marksSummary,
            upcomingDeadlines,
            warnings
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/analytics/class/:subjectId - Class analytics
router.get('/class/:subjectId', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const { subjectId } = req.params;
        const subject = await Subject.findById(subjectId);
        if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

        const stats = await Attendance.aggregate([
            { $match: { subjectId: new mongoose.Types.ObjectId(subjectId) } },
            {
                $group: {
                    _id: '$studentId',
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
                }
            },
            { $addFields: { percentage: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'student' } },
            { $unwind: '$student' },
            { $project: { name: '$student.name', rollNumber: '$student.rollNumber', total: 1, present: 1, percentage: 1 } }
        ]);

        const totalStudents = stats.length;
        const avgAttendance = totalStudents > 0 ? (stats.reduce((s, x) => s + x.percentage, 0) / totalStudents).toFixed(1) : 0;
        const atRisk = stats.filter(s => s.percentage < subject.minAttendancePercent);

        res.json({
            success: true,
            subject: { subjectCode: subject.subjectCode, subjectName: subject.subjectName },
            statistics: { totalStudents, avgAttendance, atRiskCount: atRisk.length },
            students: stats,
            atRiskStudents: atRisk
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/analytics/at-risk - All at-risk students
router.get('/at-risk', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const subjects = await Subject.find({ teachers: req.user._id });
        const subjectIds = subjects.map(s => s._id);

        const atRisk = await Attendance.aggregate([
            { $match: { subjectId: { $in: subjectIds } } },
            {
                $group: {
                    _id: { student: '$studentId', subject: '$subjectId' },
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
                }
            },
            { $addFields: { percentage: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] } } },
            { $match: { percentage: { $lt: 75 } } },
            { $lookup: { from: 'users', localField: '_id.student', foreignField: '_id', as: 'student' } },
            { $lookup: { from: 'subjects', localField: '_id.subject', foreignField: '_id', as: 'subject' } },
            { $unwind: '$student' }, { $unwind: '$subject' },
            { $project: { name: '$student.name', rollNumber: '$student.rollNumber', subjectCode: '$subject.subjectCode', percentage: 1 } },
            { $sort: { percentage: 1 } }
        ]);

        res.json({ success: true, count: atRisk.length, atRiskStudents: atRisk });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
