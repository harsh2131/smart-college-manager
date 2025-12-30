require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Notification = require('../models/Notification');
const Fee = require('../models/Fee');

const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college_manager');
    console.log('📦 Connected to MongoDB');
};

const seedDatabase = async () => {
    try {
        await connectDB();

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Subject.deleteMany({}),
            Attendance.deleteMany({}),
            Assignment.deleteMany({}),
            Submission.deleteMany({}),
            Notification.deleteMany({}),
            Fee.deleteMany({})
        ]);
        console.log('🗑️  Cleared existing data');

        // Drop any stale indexes that might cause issues
        try {
            await mongoose.connection.collection('users').dropIndex('userId_1');
            console.log('🔧 Dropped stale userId index');
        } catch (e) {
            // Index might not exist, which is fine
        }

        // ============================================
        // CREATE HOD (Head of Department)
        // ============================================
        const admin = await User.create({
            name: 'Dr. Rajesh Patel',
            email: 'admin@college.edu',
            password: 'admin123',
            role: 'admin',
            department: 'CSE'
        });
        console.log('👑 Created HOD:', admin.email);

        // ============================================
        // CREATE TEACHERS
        // ============================================
        const teachersData = [
            { name: 'Prof. Sharma', email: 'sharma@college.edu', department: 'CSE' },
            { name: 'Prof. Verma', email: 'verma@college.edu', department: 'CSE' },
            { name: 'Prof. Gupta', email: 'gupta@college.edu', department: 'CSE' }
        ];

        const teachers = [];
        for (const data of teachersData) {
            const teacher = await User.create({
                ...data,
                password: 'password123',
                role: 'teacher'
            });
            teachers.push(teacher);
        }
        console.log(`👨‍🏫 Created ${teachers.length} teachers`);

        // ============================================
        // CREATE STUDENTS (Different semesters)
        // ============================================
        const studentData = [
            // BCA Semester 5 Students
            { name: 'Rahul Kumar', email: 'rahul@college.edu', semester: 5, rollNumber: 'BCA501', stream: 'BCA', division: 'A' },
            { name: 'Priya Patel', email: 'priya@college.edu', semester: 5, rollNumber: 'BCA502', stream: 'BCA', division: 'A' },
            { name: 'Amit Singh', email: 'amit@college.edu', semester: 5, rollNumber: 'BCA503', stream: 'BCA', division: 'A' },
            { name: 'Sneha Gupta', email: 'sneha@college.edu', semester: 5, rollNumber: 'BCA504', stream: 'BCA', division: 'B' },
            { name: 'Vikram Reddy', email: 'vikram@college.edu', semester: 5, rollNumber: 'BCA505', stream: 'BCA', division: 'B' },
            { name: 'Kavya Nair', email: 'kavya@college.edu', semester: 5, rollNumber: 'BCA506', stream: 'BCA', division: 'B' },
            { name: 'Arjun Mehta', email: 'arjun@college.edu', semester: 5, rollNumber: 'BCA507', stream: 'BCA', division: 'A' },
            { name: 'Ishita Sharma', email: 'ishita@college.edu', semester: 5, rollNumber: 'BCA508', stream: 'BCA', division: 'A' },
            // BCA Semester 3 Students
            { name: 'Ravi Teja', email: 'ravi@college.edu', semester: 3, rollNumber: 'BCA301', stream: 'BCA', division: 'A' },
            { name: 'Divya Prakash', email: 'divya@college.edu', semester: 3, rollNumber: 'BCA302', stream: 'BCA', division: 'A' },
            // BBA Semester 5 Students
            { name: 'Suresh Kumar', email: 'suresh@college.edu', semester: 5, rollNumber: 'BBA501', stream: 'BBA', division: 'A' },
            { name: 'Meera Joshi', email: 'meera@college.edu', semester: 5, rollNumber: 'BBA502', stream: 'BBA', division: 'A' }
        ];

        const students = [];
        for (const data of studentData) {
            const student = await User.create({
                ...data,
                password: 'password123',
                role: 'student',
                department: data.stream === 'BCA' ? 'CSE' : 'Management',
                admissionYear: new Date().getFullYear() - Math.floor(data.semester / 2)
            });
            students.push(student);
        }
        console.log(`👨‍🎓 Created ${students.length} students (BCA: ${students.filter(s => s.stream === 'BCA').length}, BBA: ${students.filter(s => s.stream === 'BBA').length})`);

        const sem5Students = students.filter(s => s.semester === 5);
        const sem3Students = students.filter(s => s.semester === 3);

        // ============================================
        // CREATE SUBJECTS
        // ============================================
        const subjects = await Subject.insertMany([
            // Semester 5 Subjects
            { subjectCode: 'CS501', subjectName: 'Data Structures & Algorithms', teacherId: teachers[0]._id, semester: 5 },
            { subjectCode: 'CS502', subjectName: 'Database Management Systems', teacherId: teachers[0]._id, semester: 5 },
            { subjectCode: 'CS503', subjectName: 'Operating Systems', teacherId: teachers[1]._id, semester: 5 },
            { subjectCode: 'CS504', subjectName: 'Computer Networks', teacherId: teachers[1]._id, semester: 5 },
            { subjectCode: 'CS505', subjectName: 'Software Engineering', teacherId: teachers[2]._id, semester: 5 },
            // Semester 3 Subjects
            { subjectCode: 'CS301', subjectName: 'Object Oriented Programming', teacherId: teachers[0]._id, semester: 3 },
            { subjectCode: 'CS302', subjectName: 'Discrete Mathematics', teacherId: teachers[2]._id, semester: 3 },
            { subjectCode: 'CS303', subjectName: 'Digital Logic Design', teacherId: teachers[1]._id, semester: 3 }
        ]);
        console.log(`📚 Created ${subjects.length} subjects`);

        const sem5Subjects = subjects.filter(s => s.semester === 5);
        const sem3Subjects = subjects.filter(s => s.semester === 3);

        // ============================================
        // CREATE ATTENDANCE RECORDS (Last 30 days)
        // ============================================
        const attendanceRecords = [];

        // Different attendance patterns for different students
        const attendancePatterns = {
            good: 0.90,      // 90% attendance
            average: 0.75,   // 75% attendance (borderline)
            poor: 0.60,      // 60% attendance (at risk)
            veryPoor: 0.45   // 45% attendance (critical)
        };

        // Assign patterns to students
        const studentPatterns = [
            attendancePatterns.good,      // Rahul - good
            attendancePatterns.good,      // Priya - good
            attendancePatterns.average,   // Amit - average
            attendancePatterns.average,   // Sneha - average
            attendancePatterns.poor,      // Vikram - poor
            attendancePatterns.veryPoor,  // Kavya - very poor
            attendancePatterns.good,      // Arjun - good
            attendancePatterns.poor       // Ishita - poor
        ];

        // Create attendance for Semester 5 students (last 30 days)
        for (let day = 1; day <= 30; day++) {
            const date = new Date();
            date.setDate(date.getDate() - (30 - day));
            date.setHours(0, 0, 0, 0);

            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            sem5Students.forEach((student, idx) => {
                const pattern = studentPatterns[idx] || attendancePatterns.average;

                sem5Subjects.forEach(subject => {
                    const isPresent = Math.random() < pattern;
                    attendanceRecords.push({
                        studentId: student._id,
                        subjectId: subject._id,
                        date: new Date(date),
                        status: isPresent ? 'present' : 'absent'
                    });
                });
            });
        }

        // Create attendance for Semester 3 students (last 30 days)
        for (let day = 1; day <= 30; day++) {
            const date = new Date();
            date.setDate(date.getDate() - (30 - day));
            date.setHours(0, 0, 0, 0);

            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            sem3Students.forEach((student, idx) => {
                const pattern = idx < 2 ? attendancePatterns.good : attendancePatterns.average;

                sem3Subjects.forEach(subject => {
                    const isPresent = Math.random() < pattern;
                    attendanceRecords.push({
                        studentId: student._id,
                        subjectId: subject._id,
                        date: new Date(date),
                        status: isPresent ? 'present' : 'absent'
                    });
                });
            });
        }

        await Attendance.insertMany(attendanceRecords);
        console.log(`📋 Created ${attendanceRecords.length} attendance records`);

        // ============================================
        // CREATE ASSIGNMENTS
        // ============================================
        const now = new Date();
        const assignments = await Assignment.insertMany([
            // Semester 5 Assignments
            {
                subjectId: sem5Subjects[0]._id, // DSA
                title: 'Binary Search Tree Implementation',
                description: 'Implement a complete BST with insert, delete, search, and traversal operations. Include time complexity analysis.',
                dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                createdBy: teachers[0]._id
            },
            {
                subjectId: sem5Subjects[0]._id, // DSA
                title: 'Graph Algorithms Project',
                description: 'Implement BFS, DFS, Dijkstra\'s and Bellman-Ford algorithms. Provide visualization.',
                dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                createdBy: teachers[0]._id
            },
            {
                subjectId: sem5Subjects[1]._id, // DBMS
                title: 'ER Diagram Design',
                description: 'Design a comprehensive ER diagram for a library management system with at least 8 entities.',
                dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                createdBy: teachers[0]._id
            },
            {
                subjectId: sem5Subjects[1]._id, // DBMS
                title: 'SQL Query Assignment',
                description: 'Write 20 complex SQL queries including joins, subqueries, and aggregations.',
                dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
                createdBy: teachers[0]._id
            },
            {
                subjectId: sem5Subjects[2]._id, // OS
                title: 'Process Scheduling Simulation',
                description: 'Simulate FCFS, SJF, Priority, and Round Robin scheduling algorithms.',
                dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
                createdBy: teachers[1]._id
            },
            {
                subjectId: sem5Subjects[3]._id, // CN
                title: 'Socket Programming Lab',
                description: 'Implement a client-server chat application using TCP sockets.',
                dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now (urgent!)
                createdBy: teachers[1]._id
            },
            {
                subjectId: sem5Subjects[4]._id, // SE
                title: 'Requirements Analysis Document',
                description: 'Create a complete SRS document for a given project scenario.',
                dueDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
                createdBy: teachers[2]._id
            },
            // Past due assignment (for testing overdue)
            {
                subjectId: sem5Subjects[0]._id, // DSA
                title: 'Sorting Algorithms Comparison',
                description: 'Compare time complexity of various sorting algorithms with empirical analysis.',
                dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (overdue)
                createdBy: teachers[0]._id
            },
            // Semester 3 Assignments
            {
                subjectId: sem3Subjects[0]._id, // OOP
                title: 'Java OOP Project',
                description: 'Create a banking system using Java with all OOP concepts.',
                dueDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
                createdBy: teachers[0]._id
            },
            {
                subjectId: sem3Subjects[1]._id, // Discrete Math
                title: 'Graph Theory Problems',
                description: 'Solve 15 problems on graph theory including proofs.',
                dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
                createdBy: teachers[2]._id
            }
        ]);
        console.log(`📄 Created ${assignments.length} assignments`);

        // ============================================
        // CREATE SUBMISSIONS
        // ============================================
        const submissionData = [
            // BST Implementation submissions
            { assignmentId: assignments[0]._id, studentId: sem5Students[0]._id, marks: 45, feedback: 'Excellent implementation! Great code quality.' },
            { assignmentId: assignments[0]._id, studentId: sem5Students[1]._id, marks: 42, feedback: 'Good work, minor improvements needed in delete operation.' },
            { assignmentId: assignments[0]._id, studentId: sem5Students[2]._id, marks: 38, feedback: 'Correct logic but code optimization needed.' },
            { assignmentId: assignments[0]._id, studentId: sem5Students[3]._id, marks: null, feedback: '' }, // Not graded yet

            // ER Diagram submissions
            { assignmentId: assignments[2]._id, studentId: sem5Students[0]._id, marks: 28, feedback: 'Well designed ER diagram with proper relationships.' },
            { assignmentId: assignments[2]._id, studentId: sem5Students[1]._id, marks: 25, feedback: 'Good effort, some normalization issues.' },

            // SQL Query submissions
            { assignmentId: assignments[3]._id, studentId: sem5Students[0]._id, marks: 48, feedback: 'Perfect queries!' },
            { assignmentId: assignments[3]._id, studentId: sem5Students[2]._id, marks: null, feedback: '' }, // Not graded

            // Sorting Algorithms (past due but submitted)
            { assignmentId: assignments[7]._id, studentId: sem5Students[0]._id, marks: 40, feedback: 'Good analysis and comparison.' },
            { assignmentId: assignments[7]._id, studentId: sem5Students[1]._id, marks: 35, feedback: 'Submitted late but decent work.' },
            { assignmentId: assignments[7]._id, studentId: sem5Students[4]._id, marks: 30, feedback: 'Incomplete analysis.' },

            // Semester 3 submissions
            { assignmentId: assignments[8]._id, studentId: sem3Students[0]._id, marks: 44, feedback: 'Excellent OOP implementation!' },
            { assignmentId: assignments[8]._id, studentId: sem3Students[1]._id, marks: null, feedback: '' }
        ];

        const submissions = [];
        for (const sub of submissionData) {
            submissions.push({
                ...sub,
                fileUrl: `/uploads/submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`,
                originalName: `assignment_submission.pdf`,
                fileSize: Math.floor(Math.random() * 500000) + 100000,
                fileType: 'application/pdf',
                submittedAt: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000)
            });
        }
        await Submission.insertMany(submissions);
        console.log(`📤 Created ${submissions.length} submissions`);

        // ============================================
        // CREATE NOTIFICATIONS
        // ============================================
        const notifications = [];

        // Deadline notifications for all sem5 students
        sem5Students.forEach(student => {
            notifications.push({
                userId: student._id,
                message: 'Reminder: Socket Programming Lab due tomorrow!',
                type: 'deadline',
                isRead: false
            });
        });

        // Attendance warnings for low attendance students
        [sem5Students[4], sem5Students[5], sem5Students[7]].forEach(student => {
            notifications.push({
                userId: student._id,
                message: '⚠️ Your attendance is below 75%. Please improve to maintain eligibility.',
                type: 'attendance',
                isRead: false
            });
        });

        // Grade notifications
        [sem5Students[0], sem5Students[1]].forEach(student => {
            notifications.push({
                userId: student._id,
                message: '📝 Your submission for "Binary Search Tree Implementation" has been graded.',
                type: 'announcement',
                isRead: Math.random() > 0.5
            });
        });

        // General announcements
        students.forEach(student => {
            notifications.push({
                userId: student._id,
                message: '📢 Mid-semester exams scheduled from January 15th. Check your timetable.',
                type: 'announcement',
                isRead: Math.random() > 0.3
            });
        });

        // Critical announcement for students with very low attendance
        notifications.push({
            userId: sem5Students[5]._id, // Kavya with very poor attendance
            message: '🚨 CRITICAL: Your attendance is below 50%. Please meet the HOD immediately.',
            type: 'attendance',
            isRead: false
        });

        await Notification.insertMany(notifications);
        console.log(`🔔 Created ${notifications.length} notifications`);

        // ============================================
        // CREATE FEE STRUCTURES
        // ============================================
        const currentYear = new Date().getFullYear();
        const academicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

        const feeStructures = await Fee.insertMany([
            // BCA Fee Structures
            {
                stream: 'BCA',
                semester: 1,
                academicYear,
                feeBreakdown: {
                    tuitionFee: 25000,
                    examFee: 2000,
                    libraryFee: 1500,
                    labFee: 3000,
                    otherFee: 1000
                },
                totalAmount: 32500,
                dueDate: new Date(currentYear, 6, 15), // July 15
                description: 'BCA Semester 1 Fee - Includes admission charges'
            },
            {
                stream: 'BCA',
                semester: 3,
                academicYear,
                feeBreakdown: {
                    tuitionFee: 22000,
                    examFee: 2000,
                    libraryFee: 1500,
                    labFee: 3500,
                    otherFee: 500
                },
                totalAmount: 29500,
                dueDate: new Date(currentYear, 6, 15),
                description: 'BCA Semester 3 Fee'
            },
            {
                stream: 'BCA',
                semester: 5,
                academicYear,
                feeBreakdown: {
                    tuitionFee: 22000,
                    examFee: 2500,
                    libraryFee: 1500,
                    labFee: 4000,
                    otherFee: 500
                },
                totalAmount: 30500,
                dueDate: new Date(currentYear, 6, 15),
                description: 'BCA Semester 5 Fee - Includes project lab charges'
            },
            // BBA Fee Structures
            {
                stream: 'BBA',
                semester: 1,
                academicYear,
                feeBreakdown: {
                    tuitionFee: 28000,
                    examFee: 2000,
                    libraryFee: 1500,
                    labFee: 1000,
                    otherFee: 1500
                },
                totalAmount: 34000,
                dueDate: new Date(currentYear, 6, 15),
                description: 'BBA Semester 1 Fee - Includes admission charges'
            },
            {
                stream: 'BBA',
                semester: 3,
                academicYear,
                feeBreakdown: {
                    tuitionFee: 25000,
                    examFee: 2000,
                    libraryFee: 1500,
                    labFee: 1000,
                    otherFee: 500
                },
                totalAmount: 30000,
                dueDate: new Date(currentYear, 6, 15),
                description: 'BBA Semester 3 Fee'
            },
            {
                stream: 'BBA',
                semester: 5,
                academicYear,
                feeBreakdown: {
                    tuitionFee: 25000,
                    examFee: 2500,
                    libraryFee: 1500,
                    labFee: 1500,
                    otherFee: 1000
                },
                totalAmount: 31500,
                dueDate: new Date(currentYear, 6, 15),
                description: 'BBA Semester 5 Fee - Includes internship charges'
            }
        ]);
        console.log(`💰 Created ${feeStructures.length} fee structures`);

        // ============================================
        // SUMMARY
        // ============================================
        console.log('\n' + '='.repeat(60));
        console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log('\n📌 LOGIN CREDENTIALS:\n');
        console.log('   👑 HOD (Head of Department):');
        console.log('      Email: admin@college.edu');
        console.log('      Password: admin123');
        console.log('\n   👨‍🏫 TEACHERS:');
        console.log('      Email: sharma@college.edu | Password: password123');
        console.log('      Email: verma@college.edu  | Password: password123');
        console.log('      Email: gupta@college.edu  | Password: password123');
        console.log('\n   👨‍🎓 STUDENTS (Semester 5):');
        console.log('      Email: rahul@college.edu  | Password: password123 (Good attendance)');
        console.log('      Email: priya@college.edu  | Password: password123 (Good attendance)');
        console.log('      Email: amit@college.edu   | Password: password123 (Average attendance)');
        console.log('      Email: vikram@college.edu | Password: password123 (Poor attendance)');
        console.log('      Email: kavya@college.edu  | Password: password123 (Very poor attendance)');
        console.log('\n   👨‍🎓 STUDENTS (Semester 3):');
        console.log('      Email: ravi@college.edu   | Password: password123');
        console.log('      Email: divya@college.edu  | Password: password123');
        console.log('\n📊 DATA SUMMARY:');
        console.log(`   • ${teachers.length} Teachers`);
        console.log(`   • ${students.length} Students`);
        console.log(`   • ${subjects.length} Subjects`);
        console.log(`   • ${attendanceRecords.length} Attendance Records`);
        console.log(`   • ${assignments.length} Assignments`);
        console.log(`   • ${submissions.length} Submissions`);
        console.log(`   • ${notifications.length} Notifications`);
        console.log(`   • ${feeStructures.length} Fee Structures`);
        console.log('\n' + '='.repeat(60));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
