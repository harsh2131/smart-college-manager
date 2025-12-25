const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
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
    unit: {
        type: Number,
        min: 1,
        max: 10
    },
    topic: {
        type: String,
        trim: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        enum: ['pdf', 'ppt', 'doc', 'video', 'link', 'other'],
        required: true
    },
    fileSize: {
        type: Number
    },
    tags: [{
        type: String,
        trim: true
    }],
    isPYQ: {
        type: Boolean,
        default: false
    },
    year: {
        type: Number
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
resourceSchema.index({ subjectId: 1, unit: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ isPYQ: 1, subjectId: 1, year: -1 });

module.exports = mongoose.model('Resource', resourceSchema);
