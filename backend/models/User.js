const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true,
        sparse: true
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
        trim: true
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
        default: 'student'
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    // Stream field - required for students, optional for teachers
    stream: {
        type: String,
        enum: ['BCA', 'BBA', 'Both'],
        required: function () { return this.role === 'student'; }
    },
    // HOD flag for teachers
    isHOD: {
        type: Boolean,
        default: false
    },
    semester: {
        type: Number,
        min: 1,
        max: 6
    },
    division: {
        type: String,
        trim: true
    },
    rollNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    admissionYear: {
        type: Number
    },
    photo: {
        type: String // URL to student photo
    },
    // Common fields
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Hide sensitive data
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

// Public JSON for API responses
userSchema.methods.toPublicJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', userSchema);
