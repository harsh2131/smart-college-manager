const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        default: ''
    },
    fileSize: {
        type: Number,
        default: 0
    },
    fileType: {
        type: String,
        default: ''
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    marks: {
        type: Number,
        default: null
    },
    feedback: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Unique: one submission per student per assignment
submissionSchema.index(
    { assignmentId: 1, studentId: 1 },
    { unique: true }
);

module.exports = mongoose.model('Submission', submissionSchema);
