const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    subjects: [{
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
        credits: {
            type: Number,
            default: 4
        },
        internalMarks: {
            type: Number,
            default: 0,
            min: 0,
            max: 40 // Internal max 40
        },
        externalMarks: {
            type: Number,
            default: 0,
            min: 0,
            max: 60 // External max 60
        },
        totalMarks: {
            type: Number,
            default: 0
        },
        maxMarks: {
            type: Number,
            default: 100
        },
        grade: {
            type: String,
            enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'AB'], // AB = Absent
            default: 'F'
        },
        gradePoints: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['pass', 'fail', 'absent'],
            default: 'fail'
        }
    }],
    totalCredits: {
        type: Number,
        default: 0
    },
    earnedCredits: {
        type: Number,
        default: 0
    },
    sgpa: {
        type: Number,
        default: 0
    },
    cgpa: {
        type: Number,
        default: 0
    },
    percentage: {
        type: Number,
        default: 0
    },
    overallStatus: {
        type: String,
        enum: ['pass', 'fail', 'atkt'], // ATKT = Allowed to Keep Term
        default: 'fail'
    },
    atktSubjects: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    remarks: {
        type: String
    }
}, { timestamps: true });

// Calculate grades and SGPA before save
resultSchema.pre('save', function (next) {
    let totalCredits = 0;
    let earnedCredits = 0;
    let totalGradePoints = 0;
    let totalMarksObtained = 0;
    let totalMaxMarks = 0;
    let failedCount = 0;

    this.subjects.forEach(subject => {
        // Calculate total marks
        subject.totalMarks = subject.internalMarks + subject.externalMarks;
        totalMarksObtained += subject.totalMarks;
        totalMaxMarks += subject.maxMarks;
        totalCredits += subject.credits;

        // Calculate grade based on percentage
        const percentage = (subject.totalMarks / subject.maxMarks) * 100;

        if (percentage >= 90) {
            subject.grade = 'A+';
            subject.gradePoints = 10;
        } else if (percentage >= 80) {
            subject.grade = 'A';
            subject.gradePoints = 9;
        } else if (percentage >= 70) {
            subject.grade = 'B+';
            subject.gradePoints = 8;
        } else if (percentage >= 60) {
            subject.grade = 'B';
            subject.gradePoints = 7;
        } else if (percentage >= 50) {
            subject.grade = 'C+';
            subject.gradePoints = 6;
        } else if (percentage >= 45) {
            subject.grade = 'C';
            subject.gradePoints = 5;
        } else if (percentage >= 40) {
            subject.grade = 'D';
            subject.gradePoints = 4;
        } else {
            subject.grade = 'F';
            subject.gradePoints = 0;
        }

        // Determine pass/fail
        if (percentage >= 40) {
            subject.status = 'pass';
            earnedCredits += subject.credits;
            totalGradePoints += subject.gradePoints * subject.credits;
        } else {
            subject.status = 'fail';
            failedCount++;
        }
    });

    this.totalCredits = totalCredits;
    this.earnedCredits = earnedCredits;
    this.percentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100 * 100) / 100 : 0;
    this.sgpa = totalCredits > 0 ? Math.round((totalGradePoints / totalCredits) * 100) / 100 : 0;
    this.atktSubjects = failedCount;

    // Determine overall status
    if (failedCount === 0) {
        this.overallStatus = 'pass';
    } else if (failedCount <= 2) {
        this.overallStatus = 'atkt';
    } else {
        this.overallStatus = 'fail';
    }

    next();
});

// Index for faster queries
resultSchema.index({ studentId: 1, semester: 1, academicYear: 1 }, { unique: true });
resultSchema.index({ isPublished: 1, semester: 1 });

module.exports = mongoose.model('Result', resultSchema);
