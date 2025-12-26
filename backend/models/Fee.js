const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
    stream: {
        type: String,
        enum: ['BCA', 'BBA'],
        required: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 6
    },
    academicYear: {
        type: String,
        required: true // Format: "2024-25"
    },
    feeBreakdown: {
        tuitionFee: { type: Number, default: 0 },
        examFee: { type: Number, default: 0 },
        libraryFee: { type: Number, default: 0 },
        labFee: { type: Number, default: 0 },
        otherFee: { type: Number, default: 0 }
    },
    totalAmount: {
        type: Number,
        required: true
    },
    dueDate: {
        type: Date
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Index for faster queries
feeSchema.index({ stream: 1, semester: 1, academicYear: 1 }, { unique: true });

// Calculate total before save
feeSchema.pre('save', function (next) {
    const breakdown = this.feeBreakdown;
    this.totalAmount = breakdown.tuitionFee + breakdown.examFee +
        breakdown.libraryFee + breakdown.labFee + breakdown.otherFee;
    next();
});

module.exports = mongoose.model('Fee', feeSchema);
