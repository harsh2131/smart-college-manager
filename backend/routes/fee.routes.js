const express = require('express');
const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

const router = express.Router();

// ==================== ADMIN ROUTES ====================

/**
 * @route   POST /api/fees
 * @desc    Create fee structure
 * @access  Admin
 */
router.post('/', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const { stream, semester, academicYear, feeBreakdown, dueDate, description } = req.body;

        // Check if fee structure already exists
        const existing = await Fee.findOne({ stream, semester, academicYear });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Fee structure already exists for this stream, semester and academic year'
            });
        }

        const fee = await Fee.create({
            stream,
            semester,
            academicYear,
            feeBreakdown,
            dueDate,
            description
        });

        res.status(201).json({ success: true, fee, message: 'Fee structure created successfully' });
    } catch (error) {
        console.error('Create fee error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/fees
 * @desc    Get all fee structures
 * @access  Admin
 */
router.get('/', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const { stream, semester, academicYear, isActive } = req.query;

        const filter = {};
        if (stream) filter.stream = stream;
        if (semester) filter.semester = parseInt(semester);
        if (academicYear) filter.academicYear = academicYear;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const fees = await Fee.find(filter).sort({ stream: 1, semester: 1 });

        res.json({ success: true, fees, count: fees.length });
    } catch (error) {
        console.error('Get fees error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/fees/:id
 * @desc    Get fee structure by ID
 * @access  Admin
 */
router.get('/:id', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.id);
        if (!fee) {
            return res.status(404).json({ success: false, message: 'Fee structure not found' });
        }
        res.json({ success: true, fee });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/fees/:id
 * @desc    Update fee structure
 * @access  Admin
 */
router.put('/:id', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const fee = await Fee.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!fee) {
            return res.status(404).json({ success: false, message: 'Fee structure not found' });
        }

        res.json({ success: true, fee, message: 'Fee structure updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   DELETE /api/fees/:id
 * @desc    Delete fee structure
 * @access  Admin
 */
router.delete('/:id', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const fee = await Fee.findByIdAndDelete(req.params.id);
        if (!fee) {
            return res.status(404).json({ success: false, message: 'Fee structure not found' });
        }
        res.json({ success: true, message: 'Fee structure deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   GET /api/fees/admin/summary
 * @desc    Get fee collection summary
 * @access  Admin
 */
router.get('/admin/summary', [authMiddleware, isAdmin], async (req, res) => {
    try {
        const { academicYear } = req.query;

        const filter = academicYear ? { academicYear } : {};

        // Get all fees
        const fees = await Fee.find(filter);

        // Get payments
        const paymentFilter = academicYear ? { academicYear } : {};
        const payments = await Payment.find({ ...paymentFilter, status: 'completed' });

        const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalStudents = await User.countDocuments({ role: 'student', isActive: true });

        // Calculate pending
        const paidStudentIds = [...new Set(payments.map(p => p.studentId.toString()))];
        const pendingCount = totalStudents - paidStudentIds.length;

        res.json({
            success: true,
            summary: {
                totalFeeStructures: fees.length,
                totalStudents,
                paidStudents: paidStudentIds.length,
                pendingStudents: pendingCount,
                totalCollected,
                streamWise: {
                    BCA: fees.filter(f => f.stream === 'BCA').length,
                    BBA: fees.filter(f => f.stream === 'BBA').length
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== STUDENT ROUTES ====================

/**
 * @route   GET /api/fees/student/my-fees
 * @desc    Get student's applicable fees
 * @access  Student
 */
router.get('/student/my-fees', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const student = await User.findById(req.user._id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Get fee structure for student's stream and semester
        const fees = await Fee.find({
            stream: student.stream,
            semester: student.semester,
            isActive: true
        }).sort({ createdAt: -1 });

        // Get payment history
        const payments = await Payment.find({
            studentId: req.user._id,
            status: 'completed'
        }).populate('feeId');

        const paidFeeIds = payments.map(p => p.feeId?._id?.toString());

        // Mark fees as paid/unpaid
        const feeDetails = fees.map(fee => ({
            ...fee.toObject(),
            isPaid: paidFeeIds.includes(fee._id.toString()),
            payment: payments.find(p => p.feeId?._id?.toString() === fee._id.toString())
        }));

        res.json({
            success: true,
            student: {
                name: student.name,
                rollNumber: student.rollNumber,
                stream: student.stream,
                semester: student.semester
            },
            fees: feeDetails,
            totalPending: feeDetails.filter(f => !f.isPaid).reduce((sum, f) => sum + f.totalAmount, 0)
        });
    } catch (error) {
        console.error('Get student fees error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
