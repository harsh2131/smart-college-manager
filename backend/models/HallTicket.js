const mongoose = require('mongoose');
const crypto = require('crypto');

const hallTicketSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    examSessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExamSession',
        required: true
    },
    hallTicketNumber: {
        type: String,
        unique: true,
        required: true
    },
    qrCode: {
        type: String // QR code data for verification
    },
    isEligible: {
        type: Boolean,
        default: true
    },
    ineligibleReason: {
        type: String,
        enum: ['fees_pending', 'attendance_shortage', 'disciplinary', 'other'],
    },
    ineligibleRemarks: {
        type: String
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    lastDownloadedAt: {
        type: Date
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Generate hall ticket number and QR code before save
hallTicketSchema.pre('save', async function (next) {
    if (!this.hallTicketNumber) {
        const year = new Date().getFullYear().toString().slice(-2);
        const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        this.hallTicketNumber = `HT${year}${random}`;
    }

    if (!this.qrCode) {
        // Generate QR code data - contains verification info
        const verificationData = {
            ht: this.hallTicketNumber,
            sid: this.studentId.toString().slice(-8),
            eid: this.examSessionId.toString().slice(-8),
            ts: Date.now()
        };
        // Create a hash for verification
        const hash = crypto.createHash('sha256')
            .update(JSON.stringify(verificationData))
            .digest('hex')
            .slice(0, 16);
        this.qrCode = `${this.hallTicketNumber}|${hash}`;
    }

    next();
});

// Static method to verify QR code
hallTicketSchema.statics.verifyQR = async function (qrData) {
    if (!qrData || !qrData.includes('|')) {
        return { valid: false, message: 'Invalid QR code format' };
    }

    const [hallTicketNumber] = qrData.split('|');
    const ticket = await this.findOne({ hallTicketNumber })
        .populate('studentId', 'name rollNumber stream semester photo')
        .populate('examSessionId', 'name stream semester examType examDates');

    if (!ticket) {
        return { valid: false, message: 'Hall ticket not found' };
    }

    if (ticket.qrCode !== qrData) {
        return { valid: false, message: 'QR code mismatch' };
    }

    return {
        valid: true,
        hallTicket: ticket,
        message: 'Verified successfully'
    };
};

// Index for faster queries
hallTicketSchema.index({ studentId: 1, examSessionId: 1 }, { unique: true });
hallTicketSchema.index({ hallTicketNumber: 1 });

module.exports = mongoose.model('HallTicket', hallTicketSchema);
