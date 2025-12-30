const express = require('express');
const Payment = require('../models/Payment');
const Fee = require('../models/Fee');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

const router = express.Router();

// ==================== STUDENT ROUTES ====================

/**
 * @route   POST /api/payments
 * @desc    Initiate payment (mock payment for now)
 * @access  Student
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Only students can make payments' });
        }

        const { feeId, paymentMethod = 'online' } = req.body;

        // Validate fee
        const fee = await Fee.findById(feeId);
        if (!fee) {
            return res.status(404).json({ success: false, message: 'Fee structure not found' });
        }

        // Check if already paid
        const existingPayment = await Payment.findOne({
            studentId: req.user._id,
            feeId,
            status: 'completed'
        });

        if (existingPayment) {
            return res.status(400).json({
                success: false,
                message: 'Fee already paid',
                payment: existingPayment
            });
        }

        // Create payment record (mock payment - auto complete)
        const payment = await Payment.create({
            studentId: req.user._id,
            feeId,
            amount: fee.totalAmount,
            paymentMethod,
            status: 'completed', // Mock: auto-complete
            academicYear: fee.academicYear
        });

        res.status(201).json({
            success: true,
            message: 'Payment successful',
            payment
        });
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ success: false, message: 'Payment failed' });
    }
});

/**
 * @route   GET /api/payments/history
 * @desc    Get student's payment history
 * @access  Student
 */
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const filter = { studentId: req.user._id };

        if (req.user.role === 'admin') {
            delete filter.studentId;
        }

        const payments = await Payment.find(filter)
            .populate('feeId', 'stream semester academicYear feeBreakdown totalAmount')
            .populate('studentId', 'name rollNumber stream semester')
            .sort({ paymentDate: -1 });

        res.json({ success: true, payments, count: payments.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/payments/receipt/:id
 * @desc    Get payment receipt data
 * @access  Student (own) / Admin
 */
router.get('/receipt/:id', authMiddleware, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('feeId')
            .populate('studentId', 'name rollNumber stream semester email phone address');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Check access
        if (req.user.role !== 'admin' && payment.studentId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, payment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== ADMIN ROUTES ====================

/**
 * @route   GET /api/payments/admin/all
 * @desc    Get all payments
 * @access  Admin
 */
router.get('/admin/all', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const { status, stream, academicYear, page = 1, limit = 50 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (academicYear) filter.academicYear = academicYear;

        let payments = await Payment.find(filter)
            .populate('feeId', 'stream semester academicYear totalAmount')
            .populate('studentId', 'name rollNumber stream semester email')
            .sort({ paymentDate: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Filter by stream if specified
        if (stream) {
            payments = payments.filter(p => p.studentId?.stream === stream);
        }

        const total = await Payment.countDocuments(filter);

        res.json({
            success: true,
            payments,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/payments/:id/status
 * @desc    Update payment status (for manual payments)
 * @access  Admin
 */
router.put('/:id/status', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const { status, remarks } = req.body;

        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            { status, remarks },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        res.json({ success: true, payment, message: 'Payment status updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   POST /api/payments/admin/manual
 * @desc    Record manual payment (cash/cheque)
 * @access  Admin
 */
router.post('/admin/manual', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const { studentId, feeId, paymentMethod, remarks } = req.body;

        const student = await User.findById(studentId);
        const fee = await Fee.findById(feeId);

        if (!student || !fee) {
            return res.status(404).json({ success: false, message: 'Student or Fee not found' });
        }

        // Check if already paid
        const existing = await Payment.findOne({
            studentId,
            feeId,
            status: 'completed'
        });

        if (existing) {
            return res.status(400).json({ success: false, message: 'Fee already paid' });
        }

        const payment = await Payment.create({
            studentId,
            feeId,
            amount: fee.totalAmount,
            paymentMethod: paymentMethod || 'cash',
            status: 'completed',
            academicYear: fee.academicYear,
            remarks
        });

        res.status(201).json({ success: true, payment, message: 'Payment recorded successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/payments/admin/summary
 * @desc    Get payment collection summary
 * @access  Admin
 */
router.get('/admin/summary', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const { academicYear } = req.query;

        const filter = { status: 'completed' };
        if (academicYear) filter.academicYear = academicYear;

        const payments = await Payment.find(filter).populate('studentId', 'stream');

        const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
        const bcaPayments = payments.filter(p => p.studentId?.stream === 'BCA');
        const bbaPayments = payments.filter(p => p.studentId?.stream === 'BBA');

        // Get pending students
        const allStudents = await User.find({ role: 'student', isActive: true });
        const paidStudentIds = [...new Set(payments.map(p => p.studentId?._id?.toString()))];
        const pendingStudents = allStudents.filter(s => !paidStudentIds.includes(s._id.toString()));

        res.json({
            success: true,
            summary: {
                totalCollected,
                totalPayments: payments.length,
                bcaCollection: bcaPayments.reduce((sum, p) => sum + p.amount, 0),
                bbaCollection: bbaPayments.reduce((sum, p) => sum + p.amount, 0),
                bcaCount: bcaPayments.length,
                bbaCount: bbaPayments.length,
                pendingCount: pendingStudents.length,
                pendingStudents: pendingStudents.slice(0, 10).map(s => ({
                    _id: s._id,
                    name: s.name,
                    rollNumber: s.rollNumber,
                    stream: s.stream,
                    semester: s.semester
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   DELETE /api/payments/:id
 * @desc    Delete payment record
 * @access  Admin
 */
router.delete('/:id', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        await payment.deleteOne();
        res.json({ success: true, message: 'Payment record deleted' });
    } catch (error) {
        console.error('Delete payment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
