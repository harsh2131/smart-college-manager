const express = require('express');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Subject = require('../models/Subject');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const { isTeacher, isAdmin, isTeacherOrStudent } = require('../middleware/role.middleware');
const mongoose = require('mongoose');

const router = express.Router();

// ==================== STUDENT ANALYTICS ====================

/**
 * @route   GET /api/analytics/student/:id/performance
 * @desc    Get comprehensive student performance analytics
 * @access  Student (own) / Teacher / Admin
 */
router.get('/student/:id/performance', [authMiddleware, isTeacherOrStudent], async (req, res) => {
    try {
        const studentId = req.params.id;

        // Check access: students can only view their own data
        if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Get subjects for student's semester
        const subjects = await Subject.find({ semester: student.semester });
        const subjectIds = subjects.map(s => s._id);

        // Attendance analytics
        const attendanceStats = await Attendance.aggregate([
            { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
            {
                $group: {
                    _id: '$subjectId',
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                    late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
                }
            },
            { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
            { $unwind: '$subject' },
            {
                $project: {
                    subjectId: '$_id',
                    subjectCode: '$subject.subjectCode',
                    subjectName: '$subject.subjectName',
                    totalClasses: '$total',
                    present: 1,
                    late: 1,
                    absent: { $subtract: ['$total', { $add: ['$present', '$late'] }] },
                    percentage: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] }
                }
            }
        ]);

        // Overall attendance
        const overallAttendance = attendanceStats.length > 0
            ? Math.round(attendanceStats.reduce((sum, a) => sum + a.percentage, 0) / attendanceStats.length)
            : 0;

        // Assignment analytics
        const totalAssignments = await Assignment.countDocuments({ subjectId: { $in: subjectIds } });
        const submissions = await Submission.find({ studentId }).populate('assignmentId');
        const submittedCount = submissions.length;
        const gradedSubmissions = submissions.filter(s => s.marks !== null);
        const avgGrade = gradedSubmissions.length > 0
            ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.marks / (s.assignmentId?.totalMarks || 100)) * 100, 0) / gradedSubmissions.length)
            : null;

        // On-time vs late submissions
        const onTimeSubmissions = submissions.filter(s =>
            s.assignmentId && new Date(s.submittedAt) <= new Date(s.assignmentId.dueDate)
        ).length;

        res.json({
            success: true,
            student: { name: student.name, rollNumber: student.userId, email: student.email, semester: student.semester },
            attendance: {
                overall: overallAttendance,
                bySubject: attendanceStats,
                atRisk: overallAttendance < 75
            },
            assignments: {
                total: totalAssignments,
                submitted: submittedCount,
                pending: totalAssignments - submittedCount,
                completionRate: totalAssignments > 0 ? Math.round((submittedCount / totalAssignments) * 100) : 0,
                onTimeRate: submittedCount > 0 ? Math.round((onTimeSubmissions / submittedCount) * 100) : 0,
                avgGrade
            }
        });
    } catch (error) {
        console.error('Student performance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/analytics/student/:id/attendance-trend
 * @desc    Get student's attendance trend over time
 * @access  Student (own) / Teacher / Admin
 */
router.get('/student/:id/attendance-trend', [authMiddleware, isTeacherOrStudent], async (req, res) => {
    try {
        const studentId = req.params.id;
        const { weeks = 8 } = req.query;

        if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (weeks * 7));

        const trend = await Attendance.aggregate([
            {
                $match: {
                    studentId: new mongoose.Types.ObjectId(studentId),
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%W', date: '$date' } },
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
                }
            },
            { $addFields: { percentage: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] } } },
            { $sort: { '_id': 1 } }
        ]);

        res.json({ success: true, trend });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== TEACHER ANALYTICS ====================

/**
 * @route   GET /api/analytics/teacher/class-performance
 * @desc    Get performance analytics for all teacher's classes
 * @access  Teacher
 */
router.get('/teacher/class-performance', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const subjects = await Subject.find({ teacherId: req.user._id });

        const classStats = await Promise.all(subjects.map(async (subject) => {
            // Attendance stats
            const attendanceStats = await Attendance.aggregate([
                { $match: { subjectId: subject._id } },
                { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } },
            ]);
            const avgAttendance = attendanceStats.length > 0
                ? Math.round((attendanceStats[0].present / attendanceStats[0].total) * 100)
                : 0;

            // Student count
            const studentCount = await User.countDocuments({ role: 'student', semester: subject.semester });

            // At-risk count
            const atRiskStudents = await Attendance.aggregate([
                { $match: { subjectId: subject._id } },
                { $group: { _id: '$studentId', total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } },
                { $addFields: { percentage: { $multiply: [{ $divide: ['$present', '$total'] }, 100] } } },
                { $match: { percentage: { $lt: 75 } } },
                { $count: 'count' }
            ]);

            // Assignment stats
            const assignments = await Assignment.find({ subjectId: subject._id });
            const assignmentIds = assignments.map(a => a._id);
            const submissionStats = await Submission.aggregate([
                { $match: { assignmentId: { $in: assignmentIds } } },
                { $group: { _id: null, total: { $sum: 1 }, graded: { $sum: { $cond: [{ $ne: ['$marks', null] }, 1, 0] } } } }
            ]);

            return {
                subjectId: subject._id,
                subjectCode: subject.subjectCode,
                subjectName: subject.subjectName,
                semester: subject.semester,
                studentCount,
                avgAttendance,
                atRiskCount: atRiskStudents.length > 0 ? atRiskStudents[0].count : 0,
                assignmentCount: assignments.length,
                submissionCount: submissionStats.length > 0 ? submissionStats[0].total : 0,
                pendingGrades: submissionStats.length > 0 ? submissionStats[0].total - submissionStats[0].graded : 0
            };
        }));

        res.json({ success: true, classes: classStats });
    } catch (error) {
        console.error('Class performance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/analytics/teacher/submission-stats
 * @desc    Get assignment submission analytics
 * @access  Teacher
 */
router.get('/teacher/submission-stats', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const assignments = await Assignment.find({ createdBy: req.user._id }).populate('subjectId', 'subjectCode semester');

        const stats = await Promise.all(assignments.map(async (assignment) => {
            const studentCount = await User.countDocuments({ role: 'student', semester: assignment.subjectId.semester });
            const submissions = await Submission.find({ assignmentId: assignment._id });

            const onTime = submissions.filter(s => new Date(s.submittedAt) <= new Date(assignment.dueDate)).length;
            const late = submissions.length - onTime;
            const graded = submissions.filter(s => s.marks !== null).length;
            const avgGrade = graded > 0
                ? Math.round(submissions.filter(s => s.marks !== null).reduce((sum, s) => sum + s.marks, 0) / graded)
                : null;

            return {
                assignmentId: assignment._id,
                title: assignment.title,
                subjectCode: assignment.subjectId.subjectCode,
                dueDate: assignment.dueDate,
                totalStudents: studentCount,
                submitted: submissions.length,
                pending: studentCount - submissions.length,
                onTime,
                late,
                graded,
                avgGrade,
                submissionRate: Math.round((submissions.length / studentCount) * 100)
            };
        }));

        res.json({ success: true, assignments: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/analytics/teacher/attendance-heatmap
 * @desc    Get attendance heatmap data (day-wise patterns)
 * @access  Teacher
 */
router.get('/teacher/attendance-heatmap', [authMiddleware, isTeacher], async (req, res) => {
    try {
        const subjects = await Subject.find({ teacherId: req.user._id });
        const subjectIds = subjects.map(s => s._id);

        const heatmap = await Attendance.aggregate([
            { $match: { subjectId: { $in: subjectIds } } },
            {
                $group: {
                    _id: { dayOfWeek: { $dayOfWeek: '$date' }, week: { $week: '$date' } },
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
                }
            },
            { $addFields: { percentage: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] } } },
            { $sort: { '_id.week': 1, '_id.dayOfWeek': 1 } }
        ]);

        // Transform to chart-friendly format
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const formattedData = days.map((day, index) => ({
            name: day,
            series: heatmap.filter(h => h._id.dayOfWeek === index + 1).map(h => ({
                name: `Week ${h._id.week}`,
                value: h.percentage
            }))
        }));

        res.json({ success: true, heatmap: formattedData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== ADMIN ANALYTICS ====================

/**
 * @route   GET /api/analytics/admin/overview
 * @desc    Get institution-wide overview
 * @access  Admin
 */
router.get('/admin/overview', [authMiddleware, isAdmin], async (req, res) => {
    try {
        // Counts
        const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
        const bcaStudents = await User.countDocuments({ role: 'student', stream: 'BCA', isActive: true });
        const bbaStudents = await User.countDocuments({ role: 'student', stream: 'BBA', isActive: true });
        const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
        const totalSubjects = await Subject.countDocuments();
        const totalAssignments = await Assignment.countDocuments();

        // Overall attendance
        const attendanceStats = await Attendance.aggregate([
            { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } }
        ]);
        const overallAttendance = attendanceStats.length > 0
            ? Math.round((attendanceStats[0].present / attendanceStats[0].total) * 100)
            : 0;

        // At-risk students (overall)
        const atRiskStudents = await Attendance.aggregate([
            { $group: { _id: '$studentId', total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } },
            { $addFields: { percentage: { $multiply: [{ $divide: ['$present', '$total'] }, 100] } } },
            { $match: { percentage: { $lt: 75 } } },
            { $count: 'count' }
        ]);

        // Submission stats
        const submissionStats = await Submission.aggregate([
            { $group: { _id: null, total: { $sum: 1 }, graded: { $sum: { $cond: [{ $ne: ['$marks', null] }, 1, 0] } } } }
        ]);

        // Semester-wise student distribution
        const semesterDistribution = await User.aggregate([
            { $match: { role: 'student' } },
            { $group: { _id: '$semester', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            stats: {
                totalStudents,
                bcaStudents,
                bbaStudents,
                totalTeachers,
                totalSubjects,
                totalAssignments,
                overallAttendance,
                atRiskStudents: atRiskStudents.length > 0 ? atRiskStudents[0].count : 0,
                totalSubmissions: submissionStats.length > 0 ? submissionStats[0].total : 0,
                pendingGrades: submissionStats.length > 0 ? submissionStats[0].total - submissionStats[0].graded : 0
            },
            semesterDistribution: semesterDistribution.map(s => ({ name: `Sem ${s._id}`, value: s.count }))
        });
    } catch (error) {
        console.error('Admin overview error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/analytics/admin/department/:dept
 * @desc    Get department-level analytics
 * @access  Admin
 */
router.get('/admin/department/:dept', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const department = req.params.dept;

        const students = await User.find({ role: 'student', department });
        const teachers = await User.find({ role: 'teacher', department });
        const studentIds = students.map(s => s._id);

        // Department attendance
        const attendanceStats = await Attendance.aggregate([
            { $match: { studentId: { $in: studentIds } } },
            { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } }
        ]);

        res.json({
            success: true,
            department,
            stats: {
                studentCount: students.length,
                teacherCount: teachers.length,
                avgAttendance: attendanceStats.length > 0
                    ? Math.round((attendanceStats[0].present / attendanceStats[0].total) * 100)
                    : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/analytics/admin/at-risk-summary
 * @desc    Get all at-risk students summary
 * @access  Admin
 */
router.get('/admin/at-risk-summary', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const atRiskStudents = await Attendance.aggregate([
            {
                $group: {
                    _id: '$studentId',
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
                }
            },
            { $addFields: { percentage: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] } } },
            { $match: { percentage: { $lt: 75 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'student' } },
            { $unwind: '$student' },
            {
                $project: {
                    studentId: '$_id',
                    name: '$student.name',
                    email: '$student.email',
                    semester: '$student.semester',
                    department: '$student.department',
                    attendance: '$percentage'
                }
            },
            { $sort: { attendance: 1 } }
        ]);

        // Group by semester
        const bySemester = {};
        atRiskStudents.forEach(s => {
            const sem = s.semester || 'Unknown';
            if (!bySemester[sem]) bySemester[sem] = [];
            bySemester[sem].push(s);
        });

        res.json({
            success: true,
            total: atRiskStudents.length,
            students: atRiskStudents,
            bySemester: Object.entries(bySemester).map(([sem, students]) => ({ semester: sem, count: students.length, students }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/analytics/admin/teacher-stats
 * @desc    Get teacher performance metrics
 * @access  Admin
 */
router.get('/admin/teacher-stats', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' });

        const stats = await Promise.all(teachers.map(async (teacher) => {
            const subjects = await Subject.find({ teacherId: teacher._id });
            const subjectIds = subjects.map(s => s._id);

            // Classes conducted
            const classesConducted = await Attendance.distinct('date', { subjectId: { $in: subjectIds } });

            // Assignments created
            const assignments = await Assignment.countDocuments({ createdBy: teacher._id });

            // Pending reviews
            const pendingReviews = await Submission.countDocuments({
                assignmentId: { $in: await Assignment.find({ createdBy: teacher._id }).distinct('_id') },
                marks: null
            });

            return {
                teacherId: teacher._id,
                name: teacher.name,
                email: teacher.email,
                department: teacher.department,
                subjectCount: subjects.length,
                classesConducted: classesConducted.length,
                assignmentsCreated: assignments,
                pendingReviews
            };
        }));

        res.json({ success: true, teachers: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
