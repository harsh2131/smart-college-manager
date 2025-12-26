const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    feeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fee',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ['online', 'cash', 'cheque', 'upi', 'bank_transfer'],
        default: 'online'
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    razorpayOrderId: {
        type: String,
        sparse: true
    },
    razorpayPaymentId: {
        type: String,
        sparse: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    receiptNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    remarks: {
        type: String,
        trim: true
    },
    academicYear: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Generate receipt number before save
paymentSchema.pre('save', function (next) {
    if (!this.receiptNumber && this.status === 'completed') {
        const year = new Date().getFullYear().toString().slice(-2);
        const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        this.receiptNumber = `RCP${year}${random}`;
    }
    if (!this.transactionId) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        this.transactionId = `TXN${timestamp}${random}`.toUpperCase();
    }
    next();
});

// Index for faster queries
paymentSchema.index({ studentId: 1, status: 1 });
paymentSchema.index({ feeId: 1 });
paymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
