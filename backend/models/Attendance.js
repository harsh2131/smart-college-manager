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
    status: {
        type: String,
        enum: ['present', 'absent'],
        required: true
    }
}, { timestamps: true });

// Unique: one record per student per subject per date
attendanceSchema.index(
    { studentId: 1, subjectId: 1, date: 1 },
    { unique: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
