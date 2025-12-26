const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true // "Summer 2025", "Winter 2024"
    },
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
        required: true // "2024-25"
    },
    examType: {
        type: String,
        enum: ['regular', 'supplementary', 'improvement'],
        default: 'regular'
    },
    examDates: [{
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
        },
        subjectName: {
            type: String,
            required: true
        },
        subjectCode: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        time: {
            type: String,
            default: '10:00 AM - 01:00 PM'
        },
        venue: {
            type: String,
            default: 'Main Examination Hall'
        }
    }],
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    hallTicketEnabled: {
        type: Boolean,
        default: false
    },
    hallTicketEnabledAt: {
        type: Date
    },
    instructions: {
        type: [String],
        default: [
            'Carry your hall ticket and college ID card.',
            'Report 30 minutes before exam time.',
            'Electronic devices are not allowed.',
            'Use only blue/black pen for writing.',
            'Follow all COVID-19 guidelines if applicable.'
        ]
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Set start and end dates from exam dates
examSessionSchema.pre('save', function (next) {
    if (this.examDates && this.examDates.length > 0) {
        const dates = this.examDates.map(e => new Date(e.date)).sort((a, b) => a - b);
        this.startDate = dates[0];
        this.endDate = dates[dates.length - 1];
    }
    if (this.hallTicketEnabled && !this.hallTicketEnabledAt) {
        this.hallTicketEnabledAt = new Date();
    }
    next();
});

// Index for faster queries
examSessionSchema.index({ stream: 1, semester: 1, academicYear: 1 });
examSessionSchema.index({ isActive: 1, hallTicketEnabled: 1 });

module.exports = mongoose.model('ExamSession', examSessionSchema);
