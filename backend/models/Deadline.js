const mongoose = require('mongoose');

const deadlineSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    type: {
        type: String,
        enum: ['assignment', 'exam', 'practical', 'project', 'quiz', 'presentation', 'other'],
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    dueTime: {
        type: String,
        default: '23:59'
    },
    attachments: [{
        filename: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    marksWeightage: {
        type: Number,
        default: 0
    },
    appliesTo: {
        semester: Number,
        division: String,
        department: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
deadlineSchema.index({ dueDate: 1 });
deadlineSchema.index({ subjectId: 1, dueDate: 1 });
deadlineSchema.index({ 'appliesTo.semester': 1, 'appliesTo.division': 1 });

// Virtual for status (computed, not stored)
deadlineSchema.virtual('status').get(function () {
    const now = new Date();
    const due = new Date(this.dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'missed';
    if (diffDays === 0) return 'due-today';
    if (diffDays <= 3) return 'urgent';
    return 'upcoming';
});

deadlineSchema.set('toJSON', { virtuals: true });
deadlineSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Deadline', deadlineSchema);
