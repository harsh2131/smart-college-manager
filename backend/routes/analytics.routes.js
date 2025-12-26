const express = require('express');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Subject = require('../models/Subject');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const { isTeacher, isTeacherOrStudent } = require('../middleware/role.middleware');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * @route   GET /api/analytics/teacher-dashboard
 * @desc    Get teacher dashboard summary
 * @access  Teacher
 */
router.get('/teacher-dashboard', [authMiddleware, isTeacher], async (req, res) => {
    try {
        // Get teacher's subjects
        const subjects = await Subject.find({ teacherId: req.user._id });
        const subjectIds = subjects.map(s => s._id);

        // Get semesters taught
        const semesters = [...new Set(subjects.map(s => s.semester))];

        // Total students (by semester)
        const totalStudents = await User.countDocuments({
            role: 'student',
            semester: { $in: semesters }
        });

        // Today's attendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAttendance = await Attendance.aggregate([
            { $match: { subjectId: { $in: subjectIds }, date: { $gte: today, $lt: tomorrow } } },
            { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } }
        ]);

        const attendanceToday = todayAttendance.length > 0
            ? Math.round((todayAttendance[0].present / todayAttendance[0].total) * 100)
            : null;

        // Pending assignments to review
        const pendingSubmissions = await Submission.countDocuments({
            assignmentId: { $in: await Assignment.find({ createdBy: req.user._id }).distinct('_id') },
            marks: null
        });

        // Low attendance students (<75%)
        const lowAttendance = await Attendance.aggregate([
            { $match: { subjectId: { $in: subjectIds } } },
            { $group: { _id: '$studentId', total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } },
            { $addFields: { percentage: { $multiply: [{ $divide: ['$present', '$total'] }, 100] } } },
            { $match: { percentage: { $lt: 75 } } },
            { $count: 'count' }
        ]);
        const lowAttendanceCount = lowAttendance.length > 0 ? lowAttendance[0].count : 0;

        // Upcoming deadlines
        const upcomingDeadlines = await Assignment.find({
            createdBy: req.user._id,
            dueDate: { $gte: new Date() }
        }).populate('subjectId', 'subjectCode').sort({ dueDate: 1 }).limit(5);

        // Get student count and lecture count per subject
        const subjectsWithStats = await Promise.all(subjects.map(async (s) => {
            const studentsCount = await User.countDocuments({
                role: 'student',
                semester: s.semester
            });
            const lecturesConducted = await Attendance.distinct('date', { subjectId: s._id }).then(dates => dates.length);
            return {
                _id: s._id,
                subjectCode: s.subjectCode,
                subjectName: s.subjectName,
                semester: s.semester,
                studentsCount,
                lecturesConducted
            };
        }));

        res.json({
            success: true,
            stats: {
                totalStudents,
                totalSubjects: subjects.length,
                attendanceToday,
                pendingReviews: pendingSubmissions,
                atRiskStudents: lowAttendanceCount,
                lowAttendanceStudents: lowAttendanceCount
            },
            subjects: subjectsWithStats,
            upcomingDeadlines
        });
    } catch (error) {
        console.error('Teacher dashboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/analytics/student-dashboard
 * @desc    Get student dashboard summary
 * @access  Student
 */
router.get('/student-dashboard', authMiddleware, async (req, res) => {
    try {
        const studentId = req.user._id;
        const semester = req.user.semester;

        // Get subjects for student's semester
        const subjects = await Subject.find({ semester }).populate('teacherId', 'name');

        // Attendance summary (calculated dynamically)
        const attendanceSummary = await Attendance.aggregate([
            { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
            { $group: { _id: '$subjectId', total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } },
            { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
            { $unwind: '$subject' },
            { $project: { subjectCode: '$subject.subjectCode', subjectName: '$subject.subjectName', totalClasses: '$total', presentDays: '$present', percentage: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] } } }
        ]);

        // Upcoming deadlines
        const upcomingDeadlines = await Assignment.find({
            subjectId: { $in: subjects.map(s => s._id) },
            dueDate: { $gte: new Date() }
        }).populate('subjectId', 'subjectCode').sort({ dueDate: 1 }).limit(5);

        // Recent submissions with marks
        const submissions = await Submission.find({ studentId })
            .populate({
                path: 'assignmentId',
                select: 'title dueDate',
                populate: { path: 'subjectId', select: 'subjectCode' }
            })
            .sort({ submittedAt: -1 }).limit(5);

        res.json({
            success: true,
            subjects,
            attendanceSummary,
            upcomingDeadlines,
            recentSubmissions: submissions
        });
    } catch (error) {
        console.error('Student dashboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/analytics/class/:subjectId
 * @desc    Get class analytics
 * @access  Teacher
 */
router.get('/class/:subjectId', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.subjectId);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        const students = await Attendance.aggregate([
            { $match: { subjectId: new mongoose.Types.ObjectId(req.params.subjectId) } },
            { $group: { _id: '$studentId', total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } },
            { $addFields: { percentage: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'student' } },
            { $unwind: '$student' },
            { $project: { name: '$student.name', email: '$student.email', total: 1, present: 1, percentage: 1 } },
            { $sort: { percentage: 1 } }
        ]);

        const totalStudents = students.length;
        const avgAttendance = totalStudents > 0
            ? (students.reduce((sum, s) => sum + s.percentage, 0) / totalStudents).toFixed(1)
            : 0;
        const lowAttendance = students.filter(s => s.percentage < 75);

        res.json({
            success: true,
            subject: { subjectCode: subject.subjectCode, subjectName: subject.subjectName },
            stats: { totalStudents, avgAttendance: parseFloat(avgAttendance), lowAttendanceCount: lowAttendance.length },
            students,
            lowAttendanceStudents: lowAttendance
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
