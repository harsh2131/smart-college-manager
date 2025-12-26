const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    subjectName: {
        type: String,
        required: [true, 'Subject name is required'],
        trim: true
    },
    subjectCode: {
        type: String,
        required: [true, 'Subject code is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    }
}, { timestamps: true });

// Index for faster queries
subjectSchema.index({ teacherId: 1 });
subjectSchema.index({ semester: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
