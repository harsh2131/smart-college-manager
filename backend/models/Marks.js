const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    category: {
        type: String,
        enum: ['internal', 'practical', 'external'],
        required: true
    },
    testType: {
        type: String,
        enum: ['assignment', 'quiz', 'unit-test', 'mid-term', 'lab', 'viva', 'project', 'final'],
        required: true
    },
    testName: {
        type: String,
        required: true,
        trim: true
    },
    marksObtained: {
        type: Number,
        required: true,
        min: 0
    },
    maxMarks: {
        type: Number,
        required: true,
        min: 1
    },
    date: {
        type: Date,
        required: true
    },
    remarks: {
        type: String,
        trim: true
    },
    enteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Prevent duplicate marks entries
marksSchema.index(
    { studentId: 1, subjectId: 1, testType: 1, testName: 1 },
    { unique: true }
);

// Query optimization
marksSchema.index({ subjectId: 1, testType: 1 });

// Validation: marks cannot exceed max
marksSchema.pre('save', function (next) {
    if (this.marksObtained > this.maxMarks) {
        return next(new Error('Marks obtained cannot exceed maximum marks'));
    }
    next();
});

module.exports = mongoose.model('Marks', marksSchema);
