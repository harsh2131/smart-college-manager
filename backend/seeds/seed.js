const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Deadline = require('../models/Deadline');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Subject.deleteMany({});
        await Attendance.deleteMany({});
        await Marks.deleteMany({});
        await Deadline.deleteMany({});
        console.log('Cleared existing data');

        // Create teacher
        const teacher = await User.create({
            userId: 'TCH0001',
            name: 'Prof. Sharma',
            email: 'sharma@college.edu',
            password: 'password123',
            role: 'teacher',
            department: 'CSE',
            designation: 'Professor'
        });
        console.log('Created teacher:', teacher.email);

        // Create students
        const students = [];
        for (let i = 1; i <= 10; i++) {
            const student = await User.create({
                userId: `STU${String(i).padStart(4, '0')}`,
                name: `Student ${i}`,
                email: `student${i}@college.edu`,
                password: 'password123',
                role: 'student',
                department: 'CSE',
                semester: 5,
                division: 'A',
                rollNumber: `CS5A${String(i).padStart(3, '0')}`
            });
            students.push(student);
        }
        console.log('Created', students.length, 'students');

        // Create subject
        const subject = await Subject.create({
            subjectCode: 'CS301',
            subjectName: 'Database Management Systems',
            department: 'CSE',
            semester: 5,
            divisions: ['A'],
            totalPlannedLectures: 60,
            lecturesConducted: 20,
            minAttendancePercent: 75,
            marksDistribution: { internal: 30, practical: 20, external: 50 },
            createdBy: teacher._id,
            teachers: [teacher._id],
            enrolledStudents: students.map(s => s._id)
        });
        console.log('Created subject:', subject.subjectCode);

        // Create attendance (20 lectures)
        for (let lec = 1; lec <= 20; lec++) {
            const date = new Date();
            date.setDate(date.getDate() - (20 - lec));

            for (const student of students) {
                const isPresent = Math.random() > 0.2;
                await Attendance.create({
                    studentId: student._id,
                    subjectId: subject._id,
                    date,
                    lectureNumber: lec,
                    status: isPresent ? 'present' : 'absent',
                    markedBy: teacher._id
                });
            }
        }
        console.log('Created attendance records');

        // Create marks
        for (const student of students) {
            await Marks.create({
                studentId: student._id,
                subjectId: subject._id,
                category: 'internal',
                testType: 'unit-test',
                testName: 'Unit Test 1',
                marksObtained: Math.floor(Math.random() * 10) + 10,
                maxMarks: 20,
                date: new Date(),
                enteredBy: teacher._id
            });
        }
        console.log('Created marks');

        // Create deadline
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 5);
        await Deadline.create({
            title: 'DBMS Assignment 1',
            description: 'ER Diagram for Library System',
            subjectId: subject._id,
            type: 'assignment',
            dueDate,
            marksWeightage: 10,
            createdBy: teacher._id
        });
        console.log('Created deadline');

        console.log('\n✅ Seed completed!');
        console.log('Teacher login: sharma@college.edu / password123');
        console.log('Student login: student1@college.edu / password123');

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seedData();
