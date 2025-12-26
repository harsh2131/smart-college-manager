const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college-manager')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Models
const User = require('./models/User');
const Subject = require('./models/Subject');
const Fee = require('./models/Fee');
const ExamSession = require('./models/ExamSession');
const HallTicket = require('./models/HallTicket');
const Result = require('./models/Result');
const Attendance = require('./models/Attendance');

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...\n');

        // Clear existing data
        await User.deleteMany({});
        await Subject.deleteMany({});
        await Fee.deleteMany({});
        await ExamSession.deleteMany({});
        await HallTicket.deleteMany({});
        await Result.deleteMany({});
        await Attendance.deleteMany({});
        console.log('🗑️  Cleared existing data\n');

        const hashedPassword = await bcrypt.hash('password123', 12);

        // ==================== ADMIN ====================
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@college.com',
            password: hashedPassword,
            role: 'admin',
            department: 'Administration',
            isActive: true
        });
        console.log('👑 Created Admin: admin@college.com / password123');

        // ==================== BCA TEACHERS ====================
        const bcaHOD = await User.create({
            name: 'Dr. Rajesh Kumar',
            email: 'rajesh.hod@college.com',
            password: hashedPassword,
            role: 'teacher',
            department: 'CSE',
            stream: 'BCA',
            isHOD: true,
            phone: '9876543210',
            isActive: true
        });

        const bcaTeacher1 = await User.create({
            name: 'Prof. Priya Sharma',
            email: 'priya.bca@college.com',
            password: hashedPassword,
            role: 'teacher',
            department: 'CSE',
            stream: 'BCA',
            phone: '9876543211',
            isActive: true
        });

        const bcaTeacher2 = await User.create({
            name: 'Prof. Amit Patel',
            email: 'amit.bca@college.com',
            password: hashedPassword,
            role: 'teacher',
            department: 'CSE',
            stream: 'BCA',
            phone: '9876543212',
            isActive: true
        });

        console.log('👨‍🏫 Created BCA Teachers (3) - HOD: rajesh.hod@college.com');

        // ==================== BBA TEACHERS ====================
        const bbaHOD = await User.create({
            name: 'Dr. Sunita Mehta',
            email: 'sunita.hod@college.com',
            password: hashedPassword,
            role: 'teacher',
            department: 'BBA',
            stream: 'BBA',
            isHOD: true,
            phone: '9876543220',
            isActive: true
        });

        const bbaTeacher1 = await User.create({
            name: 'Prof. Vikram Singh',
            email: 'vikram.bba@college.com',
            password: hashedPassword,
            role: 'teacher',
            department: 'BBA',
            stream: 'BBA',
            phone: '9876543221',
            isActive: true
        });

        console.log('👨‍🏫 Created BBA Teachers (2) - HOD: sunita.hod@college.com');

        // ==================== BCA SUBJECTS ====================
        const bcaSubjects = await Subject.insertMany([
            { subjectCode: 'BCA101', subjectName: 'Programming in C', teacherId: bcaTeacher1._id, semester: 1, credits: 4 },
            { subjectCode: 'BCA102', subjectName: 'Mathematics I', teacherId: bcaTeacher2._id, semester: 1, credits: 4 },
            { subjectCode: 'BCA103', subjectName: 'Digital Electronics', teacherId: bcaHOD._id, semester: 1, credits: 3 },
            { subjectCode: 'BCA104', subjectName: 'English Communication', teacherId: bcaTeacher1._id, semester: 1, credits: 2 },
            { subjectCode: 'BCA201', subjectName: 'Data Structures', teacherId: bcaTeacher2._id, semester: 2, credits: 4 },
            { subjectCode: 'BCA202', subjectName: 'DBMS', teacherId: bcaHOD._id, semester: 2, credits: 4 },
            { subjectCode: 'BCA301', subjectName: 'Web Development', teacherId: bcaTeacher1._id, semester: 3, credits: 4 },
            { subjectCode: 'BCA302', subjectName: 'Java Programming', teacherId: bcaTeacher2._id, semester: 3, credits: 4 },
        ]);
        console.log('📚 Created BCA Subjects (8)');

        // ==================== BBA SUBJECTS ====================
        const bbaSubjects = await Subject.insertMany([
            { subjectCode: 'BBA101', subjectName: 'Principles of Management', teacherId: bbaHOD._id, semester: 1, credits: 4 },
            { subjectCode: 'BBA102', subjectName: 'Business Economics', teacherId: bbaTeacher1._id, semester: 1, credits: 4 },
            { subjectCode: 'BBA103', subjectName: 'Financial Accounting', teacherId: bbaHOD._id, semester: 1, credits: 3 },
            { subjectCode: 'BBA104', subjectName: 'Business Communication', teacherId: bbaTeacher1._id, semester: 1, credits: 2 },
            { subjectCode: 'BBA201', subjectName: 'Marketing Management', teacherId: bbaHOD._id, semester: 2, credits: 4 },
            { subjectCode: 'BBA202', subjectName: 'Human Resource Management', teacherId: bbaTeacher1._id, semester: 2, credits: 4 },
            { subjectCode: 'BBA301', subjectName: 'Business Law', teacherId: bbaHOD._id, semester: 3, credits: 4 },
            { subjectCode: 'BBA302', subjectName: 'Operations Management', teacherId: bbaTeacher1._id, semester: 3, credits: 4 },
        ]);
        console.log('📚 Created BBA Subjects (8)');

        // ==================== BCA STUDENTS ====================
        const bcaStudents = [];
        const bcaNames = [
            'Harsh Barvaliya', 'Ravi Patel', 'Neha Shah', 'Karan Mehta', 'Pooja Joshi',
            'Raj Kumar', 'Priya Desai', 'Vikas Sharma', 'Anita Gupta', 'Sanjay Singh'
        ];

        for (let i = 0; i < bcaNames.length; i++) {
            const student = await User.create({
                name: bcaNames[i],
                email: `bca.student${i + 1}@college.com`,
                password: hashedPassword,
                role: 'student',
                department: 'CSE',
                stream: 'BCA',
                semester: (i % 3) + 1,
                division: i < 5 ? 'A' : 'B',
                rollNumber: `BCA2024${String(i + 1).padStart(3, '0')}`,
                admissionYear: 2024,
                phone: `98765432${30 + i}`,
                isActive: true
            });
            bcaStudents.push(student);
        }
        console.log('🎓 Created BCA Students (10)');
        console.log('   Sample: bca.student1@college.com / password123 (Harsh Barvaliya - Sem 1)');

        // ==================== BBA STUDENTS ====================
        const bbaStudents = [];
        const bbaNames = [
            'Rahul Agarwal', 'Sneha Kapoor', 'Arjun Reddy', 'Kavita Nair', 'Deepak Verma',
            'Swati Jain', 'Mohit Yadav', 'Ritika Saxena', 'Varun Malhotra', 'Nisha Chauhan'
        ];

        for (let i = 0; i < bbaNames.length; i++) {
            const student = await User.create({
                name: bbaNames[i],
                email: `bba.student${i + 1}@college.com`,
                password: hashedPassword,
                role: 'student',
                department: 'BBA',
                stream: 'BBA',
                semester: (i % 3) + 1,
                division: i < 5 ? 'A' : 'B',
                rollNumber: `BBA2024${String(i + 1).padStart(3, '0')}`,
                admissionYear: 2024,
                phone: `98765432${50 + i}`,
                isActive: true
            });
            bbaStudents.push(student);
        }
        console.log('🎓 Created BBA Students (10)');
        console.log('   Sample: bba.student1@college.com / password123 (Rahul Agarwal - Sem 1)');

        // ==================== FEE STRUCTURES ====================
        const bcaFees = await Fee.insertMany([
            {
                stream: 'BCA', semester: 1, academicYear: '2024-25',
                feeBreakdown: { tuitionFee: 25000, examFee: 2000, libraryFee: 1000, labFee: 3000, otherFee: 500 },
                totalAmount: 31500, dueDate: new Date('2025-01-15'), isActive: true
            },
            {
                stream: 'BCA', semester: 2, academicYear: '2024-25',
                feeBreakdown: { tuitionFee: 25000, examFee: 2000, libraryFee: 1000, labFee: 3000, otherFee: 500 },
                totalAmount: 31500, dueDate: new Date('2025-06-15'), isActive: true
            },
            {
                stream: 'BCA', semester: 3, academicYear: '2024-25',
                feeBreakdown: { tuitionFee: 27000, examFee: 2500, libraryFee: 1000, labFee: 3500, otherFee: 500 },
                totalAmount: 34500, dueDate: new Date('2025-01-15'), isActive: true
            }
        ]);

        const bbaFees = await Fee.insertMany([
            {
                stream: 'BBA', semester: 1, academicYear: '2024-25',
                feeBreakdown: { tuitionFee: 22000, examFee: 2000, libraryFee: 1000, labFee: 0, otherFee: 500 },
                totalAmount: 25500, dueDate: new Date('2025-01-15'), isActive: true
            },
            {
                stream: 'BBA', semester: 2, academicYear: '2024-25',
                feeBreakdown: { tuitionFee: 22000, examFee: 2000, libraryFee: 1000, labFee: 0, otherFee: 500 },
                totalAmount: 25500, dueDate: new Date('2025-06-15'), isActive: true
            },
            {
                stream: 'BBA', semester: 3, academicYear: '2024-25',
                feeBreakdown: { tuitionFee: 24000, examFee: 2500, libraryFee: 1000, labFee: 0, otherFee: 500 },
                totalAmount: 28000, dueDate: new Date('2025-01-15'), isActive: true
            }
        ]);
        console.log('💰 Created Fee Structures (BCA: 3, BBA: 3)');

        // ==================== EXAM SESSIONS ====================
        const bcaExamSession = await ExamSession.create({
            name: 'Winter 2024',
            stream: 'BCA',
            semester: 1,
            academicYear: '2024-25',
            examType: 'regular',
            examDates: [
                { subjectName: 'Programming in C', subjectCode: 'BCA101', date: new Date('2025-01-10'), time: '10:00 AM - 01:00 PM', venue: 'Hall A' },
                { subjectName: 'Mathematics I', subjectCode: 'BCA102', date: new Date('2025-01-12'), time: '10:00 AM - 01:00 PM', venue: 'Hall A' },
                { subjectName: 'Digital Electronics', subjectCode: 'BCA103', date: new Date('2025-01-14'), time: '10:00 AM - 01:00 PM', venue: 'Hall A' },
                { subjectName: 'English Communication', subjectCode: 'BCA104', date: new Date('2025-01-16'), time: '10:00 AM - 12:00 PM', venue: 'Hall A' }
            ],
            hallTicketEnabled: true,
            isActive: true
        });

        const bbaExamSession = await ExamSession.create({
            name: 'Winter 2024',
            stream: 'BBA',
            semester: 1,
            academicYear: '2024-25',
            examType: 'regular',
            examDates: [
                { subjectName: 'Principles of Management', subjectCode: 'BBA101', date: new Date('2025-01-11'), time: '10:00 AM - 01:00 PM', venue: 'Hall B' },
                { subjectName: 'Business Economics', subjectCode: 'BBA102', date: new Date('2025-01-13'), time: '10:00 AM - 01:00 PM', venue: 'Hall B' },
                { subjectName: 'Financial Accounting', subjectCode: 'BBA103', date: new Date('2025-01-15'), time: '10:00 AM - 01:00 PM', venue: 'Hall B' },
                { subjectName: 'Business Communication', subjectCode: 'BBA104', date: new Date('2025-01-17'), time: '10:00 AM - 12:00 PM', venue: 'Hall B' }
            ],
            hallTicketEnabled: true,
            isActive: true
        });
        console.log('📅 Created Exam Sessions (BCA + BBA - Winter 2024)');

        // ==================== HALL TICKETS (for Sem 1 students) ====================
        const sem1BcaStudents = bcaStudents.filter(s => s.semester === 1);
        let htCount = 1;
        for (const student of sem1BcaStudents) {
            await HallTicket.create({
                studentId: student._id,
                examSessionId: bcaExamSession._id,
                hallTicketNumber: `HT25BCA${String(htCount++).padStart(4, '0')}`,
                isEligible: true
            });
        }

        const sem1BbaStudents = bbaStudents.filter(s => s.semester === 1);
        htCount = 1;
        for (const student of sem1BbaStudents) {
            await HallTicket.create({
                studentId: student._id,
                examSessionId: bbaExamSession._id,
                hallTicketNumber: `HT25BBA${String(htCount++).padStart(4, '0')}`,
                isEligible: true
            });
        }
        console.log('🎫 Created Hall Tickets for Semester 1 students');

        // ==================== SAMPLE RESULTS (for a few students) ====================
        // Publish results for Sem 2 students (completed Sem 1)
        const sem2BcaStudents = bcaStudents.filter(s => s.semester === 2);
        for (const student of sem2BcaStudents) {
            await Result.create({
                studentId: student._id,
                semester: 1,
                academicYear: '2023-24',
                subjects: [
                    { subjectName: 'Programming in C', subjectCode: 'BCA101', credits: 4, internalMarks: 32, externalMarks: 45 },
                    { subjectName: 'Mathematics I', subjectCode: 'BCA102', credits: 4, internalMarks: 28, externalMarks: 40 },
                    { subjectName: 'Digital Electronics', subjectCode: 'BCA103', credits: 3, internalMarks: 30, externalMarks: 42 },
                    { subjectName: 'English Communication', subjectCode: 'BCA104', credits: 2, internalMarks: 35, externalMarks: 50 }
                ],
                isPublished: true,
                publishedAt: new Date()
            });
        }

        const sem2BbaStudents = bbaStudents.filter(s => s.semester === 2);
        for (const student of sem2BbaStudents) {
            await Result.create({
                studentId: student._id,
                semester: 1,
                academicYear: '2023-24',
                subjects: [
                    { subjectName: 'Principles of Management', subjectCode: 'BBA101', credits: 4, internalMarks: 30, externalMarks: 48 },
                    { subjectName: 'Business Economics', subjectCode: 'BBA102', credits: 4, internalMarks: 28, externalMarks: 42 },
                    { subjectName: 'Financial Accounting', subjectCode: 'BBA103', credits: 3, internalMarks: 32, externalMarks: 45 },
                    { subjectName: 'Business Communication', subjectCode: 'BBA104', credits: 2, internalMarks: 36, externalMarks: 52 }
                ],
                isPublished: true,
                publishedAt: new Date()
            });
        }
        console.log('📊 Created Published Results for Semester 2 students (their Sem 1 results)');

        // ==================== ATTENDANCE DATA ====================
        const today = new Date();
        const dates = [];
        for (let i = 0; i < 20; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            dates.push(d);
        }

        // Create attendance for first 5 BCA students
        for (const student of bcaStudents.slice(0, 5)) {
            const studentSubjects = bcaSubjects.filter(s => s.semester === student.semester);
            for (const subject of studentSubjects) {
                for (const date of dates.slice(0, 10)) { // Last 10 days
                    const isPresent = Math.random() > 0.2; // 80% attendance rate
                    await Attendance.create({
                        studentId: student._id,
                        subjectId: subject._id,
                        date: date,
                        status: isPresent ? 'present' : 'absent'
                    });
                }
            }
        }

        // Create attendance for first 5 BBA students
        for (const student of bbaStudents.slice(0, 5)) {
            const studentSubjects = bbaSubjects.filter(s => s.semester === student.semester);
            for (const subject of studentSubjects) {
                for (const date of dates.slice(0, 10)) {
                    const isPresent = Math.random() > 0.2;
                    await Attendance.create({
                        studentId: student._id,
                        subjectId: subject._id,
                        date: date,
                        status: isPresent ? 'present' : 'absent'
                    });
                }
            }
        }
        console.log('📅 Created Attendance Records');

        console.log('\n✅ Database seeding completed!\n');
        console.log('=====================================');
        console.log('          LOGIN CREDENTIALS          ');
        console.log('=====================================');
        console.log('🔐 Admin:     admin@college.com / password123');
        console.log('');
        console.log('📘 BCA HOD:   rajesh.hod@college.com / password123');
        console.log('📘 BCA Teacher: priya.bca@college.com / password123');
        console.log('📘 BCA Student: bca.student1@college.com / password123');
        console.log('');
        console.log('📕 BBA HOD:   sunita.hod@college.com / password123');
        console.log('📕 BBA Teacher: vikram.bba@college.com / password123');
        console.log('📕 BBA Student: bba.student1@college.com / password123');
        console.log('=====================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedDatabase();
