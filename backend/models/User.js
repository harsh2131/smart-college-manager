const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        required: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    // Teacher-specific fields
    designation: {
        type: String,
        enum: ['Assistant Professor', 'Associate Professor', 'Professor', 'HOD', null]
    },
    subjectsTeaching: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
    // Student-specific fields
    semester: {
        type: Number,
        min: 1,
        max: 8
    },
    division: {
        type: String,
        trim: true
    },
    rollNumber: {
        type: String,
        trim: true
    },
    enrolledSubjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ role: 1, department: 1 });
userSchema.index({ role: 1, semester: 1, division: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (exclude sensitive fields)
userSchema.methods.toPublicJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
