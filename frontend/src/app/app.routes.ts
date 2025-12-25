import { Routes } from '@angular/router';
import { teacherGuard, studentGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
    { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
    {
        path: 'teacher',
        canActivate: [teacherGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./features/teacher/dashboard/teacher-dashboard.component').then(m => m.TeacherDashboardComponent) },
            { path: 'subjects', loadComponent: () => import('./features/teacher/subjects/subject-list.component').then(m => m.SubjectListComponent) },
            { path: 'attendance', loadComponent: () => import('./features/teacher/attendance/mark-attendance.component').then(m => m.MarkAttendanceComponent) },
            { path: 'marks', loadComponent: () => import('./features/teacher/marks/enter-marks.component').then(m => m.EnterMarksComponent) },
            { path: 'deadlines', loadComponent: () => import('./features/teacher/deadlines/deadline-list.component').then(m => m.DeadlineListComponent) }
        ]
    },
    {
        path: 'student',
        canActivate: [studentGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./features/student/dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent) }
        ]
    },
    { path: '**', redirectTo: '/login' }
];
