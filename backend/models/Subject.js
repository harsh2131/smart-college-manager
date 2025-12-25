const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    subjectCode: {
        type: String,
        required: [true, 'Subject code is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    subjectName: {
        type: String,
        required: [true, 'Subject name is required'],
        trim: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    divisions: [{
        type: String,
        enum: ['A', 'B', 'C', 'D']
    }],
    credits: {
        type: Number,
        default: 4
    },
    // Attendance configuration
    totalPlannedLectures: {
        type: Number,
        default: 60
    },
    lecturesConducted: {
        type: Number,
        default: 0
    },
    minAttendancePercent: {
        type: Number,
        default: 75,
        min: 0,
        max: 100
    },
    // Marks configuration
    marksDistribution: {
        internal: { type: Number, default: 30 },
        practical: { type: Number, default: 20 },
        external: { type: Number, default: 50 }
    },
    // Ownership
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teachers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
subjectSchema.index({ department: 1, semester: 1 });
subjectSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
