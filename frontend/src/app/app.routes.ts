import { Routes } from '@angular/router';
import { teacherGuard, studentGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
    { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },

    // ==================== TEACHER ROUTES ====================
    {
        path: 'teacher',
        canActivate: [teacherGuard],
        loadComponent: () => import('./shared/layouts/teacher-layout.component').then(m => m.TeacherLayoutComponent),
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./features/teacher/dashboard/teacher-dashboard.component').then(m => m.TeacherDashboardComponent) },
            { path: 'subjects', loadComponent: () => import('./features/teacher/subjects/subject-list.component').then(m => m.SubjectListComponent) },
            { path: 'attendance', loadComponent: () => import('./features/teacher/attendance/mark-attendance.component').then(m => m.MarkAttendanceComponent) },
            { path: 'marks', loadComponent: () => import('./features/teacher/marks/enter-marks.component').then(m => m.EnterMarksComponent) },
            { path: 'deadlines', loadComponent: () => import('./features/teacher/deadlines/deadline-list.component').then(m => m.DeadlineListComponent) },
            { path: 'assignments', loadComponent: () => import('./features/teacher/assignments/assignment-list.component').then(m => m.AssignmentListComponent) },
            { path: 'assignments/:id/grade', loadComponent: () => import('./features/teacher/assignments/grade-submissions.component').then(m => m.GradeSubmissionsComponent) },
            { path: 'students', loadComponent: () => import('./features/teacher/students/student-list.component').then(m => m.StudentListComponent) },
            { path: 'students/:id', loadComponent: () => import('./features/teacher/students/student-detail.component').then(m => m.StudentDetailComponent) },
            { path: 'analytics', loadComponent: () => import('./features/analytics/teacher-analytics.component').then(m => m.TeacherAnalyticsComponent) }
        ]
    },

    // ==================== STUDENT ROUTES ====================
    {
        path: 'student',
        canActivate: [studentGuard],
        loadComponent: () => import('./shared/layouts/student-layout.component').then(m => m.StudentLayoutComponent),
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./features/student/dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent) },
            { path: 'assignments', loadComponent: () => import('./features/student/assignments/student-assignments.component').then(m => m.StudentAssignmentsComponent) },
            { path: 'fees', loadComponent: () => import('./features/student/fees/student-fees.component').then(m => m.StudentFeesComponent) },
            { path: 'results', loadComponent: () => import('./features/student/results/student-results.component').then(m => m.StudentResultsComponent) },
            { path: 'hallticket', loadComponent: () => import('./features/student/hallticket/student-hallticket.component').then(m => m.StudentHallticketComponent) },
            { path: 'analytics', loadComponent: () => import('./features/analytics/student-analytics.component').then(m => m.StudentAnalyticsComponent) }
        ]
    },

    // ==================== ADMIN/HOD ROUTES ====================
    {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./shared/layouts/admin-layout.component').then(m => m.AdminLayoutComponent),
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
            { path: 'students', loadComponent: () => import('./features/admin/students/student-management.component').then(m => m.StudentManagementComponent) },
            { path: 'teachers', loadComponent: () => import('./features/admin/teachers/teacher-management.component').then(m => m.TeacherManagementComponent) },
            { path: 'fees', loadComponent: () => import('./features/admin/fees/fee-management.component').then(m => m.FeeManagementComponent) },
            { path: 'payments', loadComponent: () => import('./features/admin/payments/payment-overview.component').then(m => m.PaymentOverviewComponent) },
            { path: 'results', loadComponent: () => import('./features/admin/results/result-management.component').then(m => m.ResultManagementComponent) },
            { path: 'exams', loadComponent: () => import('./features/admin/exams/exam-session.component').then(m => m.ExamSessionComponent) },
            { path: 'analytics', loadComponent: () => import('./features/analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent) }
        ]
    },

    { path: '**', redirectTo: '/login' }
];
