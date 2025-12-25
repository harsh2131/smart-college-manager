import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-teacher-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="dashboard">
      <aside class="sidebar">
        <div class="sidebar-header"><h2>🎓 College Manager</h2><p>Teacher Portal</p></div>
        <nav class="sidebar-nav">
          <a routerLink="/teacher/dashboard" class="nav-item active">📊 Dashboard</a>
          <a routerLink="/teacher/subjects" class="nav-item">📚 Subjects</a>
          <a routerLink="/teacher/attendance" class="nav-item">📋 Mark Attendance</a>
          <a routerLink="/teacher/marks" class="nav-item">📝 Enter Marks</a>
          <a routerLink="/teacher/deadlines" class="nav-item">⏰ Deadlines</a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info"><span>{{ user?.name }}</span><small>{{ user?.email }}</small></div>
          <button (click)="logout()" class="btn-logout">Logout</button>
        </div>
      </aside>
      
      <main class="main-content">
        <header class="page-header"><h1>Welcome, {{ user?.name }}!</h1><p>Teacher Dashboard - Manage your classes</p></header>
        
        <div class="stats-grid">
          <div class="stat-card"><div class="icon" style="background:#dbeafe">📚</div><div class="stat-info"><div class="value">{{ subjects.length }}</div><div class="label">Subjects</div></div></div>
          <div class="stat-card"><div class="icon" style="background:#dcfce7">👥</div><div class="stat-info"><div class="value">{{ totalStudents }}</div><div class="label">Students</div></div></div>
          <div class="stat-card"><div class="icon" style="background:#fef3c7">⚠️</div><div class="stat-info"><div class="value">{{ atRiskCount }}</div><div class="label">At-Risk</div></div></div>
          <div class="stat-card"><div class="icon" style="background:#fce7f3">📅</div><div class="stat-info"><div class="value">{{ deadlines }}</div><div class="label">Deadlines</div></div></div>
        </div>
        
        <div class="content-grid">
          <div class="card">
            <h3>📚 My Subjects</h3>
            <div *ngFor="let s of subjects" class="subject-item">
              <div><strong>{{ s.subjectCode }}</strong> - {{ s.subjectName }}</div>
              <div class="stats">{{ s.enrolledStudents?.length || 0 }} students | {{ s.lecturesConducted }}/{{ s.totalPlannedLectures }}</div>
            </div>
            <p *ngIf="!subjects.length" class="empty">No subjects. Create one!</p>
            <a routerLink="/teacher/subjects" class="btn btn-primary mt-1">Manage Subjects</a>
          </div>
          <div class="card">
            <h3>⚡ Quick Actions</h3>
            <div class="actions">
              <a routerLink="/teacher/attendance" class="action-btn">📋 Mark Attendance</a>
              <a routerLink="/teacher/marks" class="action-btn">📝 Enter Marks</a>
              <a routerLink="/teacher/deadlines" class="action-btn">⏰ Deadlines</a>
              <a routerLink="/teacher/subjects" class="action-btn">➕ Add Subject</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
    styles: [`
    .dashboard { display: flex; min-height: 100vh; background: #f8fafc; }
    .sidebar { width: 260px; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); color: white; position: fixed; height: 100vh; display: flex; flex-direction: column; }
    .sidebar-header { padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .sidebar-header h2 { font-size: 1.25rem; margin: 0 0 0.25rem; }
    .sidebar-header p { font-size: 0.875rem; opacity: 0.7; margin: 0; }
    .sidebar-nav { flex: 1; padding: 1rem 0; }
    .nav-item { display: block; padding: 0.875rem 1.5rem; color: rgba(255,255,255,0.7); text-decoration: none; }
    .nav-item:hover, .nav-item.active { background: rgba(255,255,255,0.1); color: white; }
    .sidebar-footer { padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
    .user-info span { display: block; font-weight: 500; }
    .user-info small { opacity: 0.7; }
    .btn-logout { width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 6px; cursor: pointer; margin-top: 0.5rem; }
    .main-content { margin-left: 260px; flex: 1; padding: 2rem; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { font-size: 1.75rem; color: #1e293b; margin: 0 0 0.25rem; }
    .page-header p { color: #64748b; margin: 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: white; border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-card .icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .stat-info .value { font-size: 1.75rem; font-weight: 700; color: #1e293b; }
    .stat-info .label { font-size: 0.875rem; color: #64748b; }
    .content-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.5rem; }
    .card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card h3 { margin: 0 0 1rem; font-size: 1.125rem; }
    .subject-item { padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 0.5rem; }
    .subject-item strong { color: #6366f1; }
    .subject-item .stats { font-size: 0.875rem; color: #64748b; }
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .action-btn { display: block; padding: 1rem; background: #f8fafc; border-radius: 8px; text-align: center; text-decoration: none; color: #1e293b; transition: all 0.2s; }
    .action-btn:hover { background: #6366f1; color: white; }
    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
    .btn-primary { background: #6366f1; color: white; }
    .mt-1 { margin-top: 1rem; }
    .empty { color: #64748b; text-align: center; padding: 1rem; }
    @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .content-grid { grid-template-columns: 1fr; } }
    @media (max-width: 768px) { .sidebar { display: none; } .main-content { margin-left: 0; } }
  `]
})
export class TeacherDashboardComponent implements OnInit {
    user: User | null = null;
    subjects: any[] = [];
    totalStudents = 0;
    atRiskCount = 0;
    deadlines = 0;

    constructor(private authService: AuthService, private apiService: ApiService) { }

    ngOnInit(): void {
        this.user = this.authService.getCurrentUser();
        this.apiService.getMySubjects().subscribe({
            next: (res: any) => {
                this.subjects = res.subjects || [];
                this.totalStudents = this.subjects.reduce((s: number, x: any) => s + (x.enrolledStudents?.length || 0), 0);
            }
        });
        this.apiService.getUpcomingDeadlines().subscribe({ next: (res: any) => this.deadlines = res.deadlines?.length || 0 });
        this.apiService.getAllAtRisk().subscribe({ next: (res: any) => this.atRiskCount = res.count || 0 });
    }

    logout(): void { this.authService.logout(); window.location.href = '/login'; }
}
