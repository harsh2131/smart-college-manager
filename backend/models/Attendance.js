const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        required: true
    },
    lectureNumber: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused'],
        required: true
    },
    topic: {
        type: String,
        trim: true
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Audit fields for edits
    lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastEditedAt: Date,
    editReason: String
}, {
    timestamps: true
});

// CRITICAL: Prevent duplicate attendance entries
attendanceSchema.index(
    { studentId: 1, subjectId: 1, date: 1, lectureNumber: 1 },
    { unique: true }
);

// Query optimization indexes
attendanceSchema.index({ subjectId: 1, date: 1 });
attendanceSchema.index({ studentId: 1, subjectId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
