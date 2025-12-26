const express = require('express');
const ExamSession = require('../models/ExamSession');
const HallTicket = require('../models/HallTicket');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

const router = express.Router();

// ==================== EXAM SESSION ROUTES (Admin) ====================

/**
 * @route   POST /api/exam-sessions
 * @desc    Create exam session
 * @access  Admin
 */
router.post('/exam-sessions', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const session = await ExamSession.create(req.body);
        res.status(201).json({ success: true, session, message: 'Exam session created successfully' });
    } catch (error) {
        console.error('Create exam session error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/exam-sessions
 * @desc    Get all exam sessions
 * @access  All authenticated
 */
router.get('/exam-sessions', authMiddleware, async (req, res) => {
    try {
        const { stream, semester, isActive } = req.query;

        const filter = {};
        if (stream) filter.stream = stream;
        if (semester) filter.semester = parseInt(semester);
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        // For students, only show their stream/semester
        if (req.user.role === 'student') {
            const student = await User.findById(req.user._id);
            filter.stream = student.stream;
            filter.semester = student.semester;
            filter.isActive = true;
        }

        const sessions = await ExamSession.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, sessions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/exam-sessions/:id
 * @desc    Get exam session by ID
 * @access  All authenticated
 */
router.get('/exam-sessions/:id', authMiddleware, async (req, res) => {
    try {
        const session = await ExamSession.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Exam session not found' });
        }
        res.json({ success: true, session });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/exam-sessions/:id
 * @desc    Update exam session
 * @access  Admin
 */
router.put('/exam-sessions/:id', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const session = await ExamSession.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!session) {
            return res.status(404).json({ success: false, message: 'Exam session not found' });
        }

        res.json({ success: true, session, message: 'Exam session updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/exam-sessions/:id/enable-hallticket
 * @desc    Enable hall ticket for session
 * @access  Admin
 */
router.put('/exam-sessions/:id/enable-hallticket', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const { enable = true } = req.body;

        const session = await ExamSession.findByIdAndUpdate(
            req.params.id,
            {
                hallTicketEnabled: enable,
                hallTicketEnabledAt: enable ? new Date() : null
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ success: false, message: 'Exam session not found' });
        }

        // If enabling, generate hall tickets for eligible students
        if (enable) {
            const students = await User.find({
                role: 'student',
                stream: session.stream,
                semester: session.semester,
                isActive: true
            });

            let generated = 0;
            for (const student of students) {
                // Check if hall ticket already exists
                const existing = await HallTicket.findOne({
                    studentId: student._id,
                    examSessionId: session._id
                });

                if (!existing) {
                    // Check eligibility (fees paid, attendance >= 75%)
                    const isEligible = await checkStudentEligibility(student._id);

                    await HallTicket.create({
                        studentId: student._id,
                        examSessionId: session._id,
                        isEligible: isEligible.eligible,
                        ineligibleReason: isEligible.reason
                    });
                    generated++;
                }
            }

            res.json({
                success: true,
                session,
                message: `Hall tickets ${enable ? 'enabled' : 'disabled'}. Generated ${generated} new tickets.`
            });
        } else {
            res.json({ success: true, session, message: 'Hall tickets disabled' });
        }
    } catch (error) {
        console.error('Enable hall ticket error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Helper function to check student eligibility
async function checkStudentEligibility(studentId) {
    // Check fee payment
    const pendingFees = await Payment.find({
        studentId,
        status: { $ne: 'completed' }
    });

    if (pendingFees.length > 0) {
        return { eligible: false, reason: 'fees_pending' };
    }

    // Check attendance (simplified - check overall)
    const attendance = await Attendance.aggregate([
        { $match: { studentId: studentId } },
        { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } }
    ]);

    if (attendance.length > 0) {
        const percentage = (attendance[0].present / attendance[0].total) * 100;
        if (percentage < 75) {
            return { eligible: false, reason: 'attendance_shortage' };
        }
    }

    return { eligible: true, reason: null };
}

// ==================== HALL TICKET ROUTES ====================

/**
 * @route   GET /api/halltickets
 * @desc    Get student's hall ticket
 * @access  Student
 */
router.get('/halltickets', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const student = await User.findById(req.user._id);

        // Find active exam session for student
        const session = await ExamSession.findOne({
            stream: student.stream,
            semester: student.semester,
            isActive: true,
            hallTicketEnabled: true
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'No active exam session or hall tickets not yet released'
            });
        }

        const hallTicket = await HallTicket.findOne({
            studentId: req.user._id,
            examSessionId: session._id
        }).populate('studentId', 'name rollNumber stream semester email phone photo')
            .populate('examSessionId');

        if (!hallTicket) {
            return res.status(404).json({ success: false, message: 'Hall ticket not found' });
        }

        if (!hallTicket.isEligible) {
            return res.status(403).json({
                success: false,
                message: 'You are not eligible to appear for exams',
                reason: hallTicket.ineligibleReason,
                hallTicket
            });
        }

        res.json({ success: true, hallTicket });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/halltickets/download
 * @desc    Get hall ticket data for PDF generation
 * @access  Student
 */
router.get('/halltickets/download', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const student = await User.findById(req.user._id);

        const session = await ExamSession.findOne({
            stream: student.stream,
            semester: student.semester,
            isActive: true,
            hallTicketEnabled: true
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'No active exam session' });
        }

        const hallTicket = await HallTicket.findOneAndUpdate(
            { studentId: req.user._id, examSessionId: session._id, isEligible: true },
            { $inc: { downloadCount: 1 }, lastDownloadedAt: new Date() },
            { new: true }
        ).populate('studentId', 'name rollNumber stream semester email phone address photo admissionYear')
            .populate('examSessionId');

        if (!hallTicket) {
            return res.status(404).json({ success: false, message: 'Eligible hall ticket not found' });
        }

        res.json({ success: true, hallTicket });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/halltickets/verify/:qr
 * @desc    Verify hall ticket QR code
 * @access  Public
 */
router.get('/halltickets/verify/:qr', async (req, res) => {
    try {
        const qrData = decodeURIComponent(req.params.qr);
        const verification = await HallTicket.verifyQR(qrData);
        res.json(verification);
    } catch (error) {
        res.status(500).json({ valid: false, message: 'Verification failed' });
    }
});

/**
 * @route   GET /api/halltickets/admin/all
 * @desc    Get all hall tickets for a session
 * @access  Admin
 */
router.get('/halltickets/admin/all', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const { sessionId, eligible } = req.query;

        const filter = {};
        if (sessionId) filter.examSessionId = sessionId;
        if (eligible !== undefined) filter.isEligible = eligible === 'true';

        const tickets = await HallTicket.find(filter)
            .populate('studentId', 'name rollNumber stream semester email')
            .populate('examSessionId', 'name stream semester')
            .sort({ createdAt: -1 });

        res.json({ success: true, tickets, count: tickets.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/halltickets/:id/eligibility
 * @desc    Update student eligibility
 * @access  Admin
 */
router.put('/halltickets/:id/eligibility', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const { isEligible, ineligibleReason, ineligibleRemarks } = req.body;

        const ticket = await HallTicket.findByIdAndUpdate(
            req.params.id,
            { isEligible, ineligibleReason, ineligibleRemarks },
            { new: true }
        );

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Hall ticket not found' });
        }

        res.json({ success: true, ticket, message: 'Eligibility updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
