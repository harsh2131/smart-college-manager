import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { ThemeToggleComponent } from '../../../core/components/theme-toggle.component';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ThemeToggleComponent],
  template: `
    <div class="dashboard">
      <aside class="sidebar">
        <div class="sidebar-header"><h2>🎓 College Manager</h2><p>Teacher Portal</p></div>
        <nav class="sidebar-nav">
          <a routerLink="/teacher/dashboard" class="nav-item active">📊 Dashboard</a>
          <a routerLink="/teacher/subjects" class="nav-item">📚 Subjects</a>
          <a routerLink="/teacher/attendance" class="nav-item">📋 Attendance</a>
          <a routerLink="/teacher/marks" class="nav-item">📝 Marks</a>
          <a routerLink="/teacher/assignments" class="nav-item">📄 Assignments</a>
          <a routerLink="/teacher/students" class="nav-item">👥 Students</a>
          <a routerLink="/teacher/analytics" class="nav-item">📈 Analytics</a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info"><span>{{ user?.name }}</span><small>{{ user?.email }}</small></div>
          <button (click)="logout()" class="btn-logout">Logout</button>
        </div>
      </aside>
      
      <main class="main-content">
        <header class="page-header">
          <div class="header-left">
            <h1>Welcome, {{ user?.name }}!</h1>
            <p>{{ today | date:'fullDate' }}</p>
          </div>
          <div class="header-right">
            <app-theme-toggle></app-theme-toggle>
          </div>
        </header>
        
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card blue">
            <div class="stat-icon">👥</div>
            <div class="stat-info"><div class="stat-value">{{ stats.totalStudents }}</div><div class="stat-label">Total Students</div></div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon">📊</div>
            <div class="stat-info"><div class="stat-value">{{ stats.attendanceToday !== null ? stats.attendanceToday + '%' : 'N/A' }}</div><div class="stat-label">Attendance Today</div></div>
          </div>
          <div class="stat-card orange">
            <div class="stat-icon">📋</div>
            <div class="stat-info"><div class="stat-value">{{ stats.pendingReviews }}</div><div class="stat-label">Pending Reviews</div></div>
          </div>
          <div class="stat-card red">
            <div class="stat-icon">⚠️</div>
            <div class="stat-info"><div class="stat-value">{{ stats.atRiskStudents }}</div><div class="stat-label">At-Risk Students</div></div>
          </div>
        </div>

        <div class="content-grid">
          <!-- Quick Actions -->
          <div class="card">
            <h3>⚡ Quick Actions</h3>
            <div class="actions-grid">
              <a routerLink="/teacher/attendance" class="action-card">
                <span class="action-icon">📋</span>
                <span class="action-text">Mark Attendance</span>
              </a>
              <a routerLink="/teacher/assignments" class="action-card">
                <span class="action-icon">📄</span>
                <span class="action-text">Create Assignment</span>
              </a>
              <a routerLink="/teacher/marks" class="action-card">
                <span class="action-icon">📝</span>
                <span class="action-text">Enter Marks</span>
              </a>
              <a routerLink="/teacher/students" class="action-card">
                <span class="action-icon">👥</span>
                <span class="action-text">View Students</span>
              </a>
            </div>
          </div>

          <!-- Subjects -->
          <div class="card">
            <h3>📚 My Subjects</h3>
            <div class="subjects-list">
              <div *ngFor="let s of subjects" class="subject-item">
                <div class="subject-info">
                  <strong>{{ s.subjectCode }}</strong>
                  <span>{{ s.subjectName }}</span>
                </div>
                <div class="subject-stats">
                  <span class="badge">{{ s.studentsCount }} students</span>
                  <span class="badge secondary">{{ s.lecturesConducted }} lectures</span>
                </div>
              </div>
              <p *ngIf="!subjects.length" class="empty-state">No subjects yet</p>
            </div>
          </div>
        </div>

        <div class="content-grid">
          <!-- Pending Reviews -->
          <div class="card">
            <div class="card-header">
              <h3>📋 Pending Reviews</h3>
              <a routerLink="/teacher/assignments" class="link">View All →</a>
            </div>
            <div class="pending-list">
              <div *ngFor="let a of pendingAssignments" class="pending-item">
                <div class="pending-info">
                  <strong>{{ a.title }}</strong>
                  <span>{{ a.subjectId?.subjectCode }} • {{ a.pendingCount }} pending</span>
                </div>
                <a [routerLink]="['/teacher/assignments', a._id]" class="btn btn-sm">Review</a>
              </div>
              <p *ngIf="!pendingAssignments.length" class="empty-state">No pending reviews 🎉</p>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>⏰ Upcoming Deadlines</h3>
              <a routerLink="/teacher/assignments" class="link">View All →</a>
            </div>
            <div class="deadlines-list">
              <div *ngFor="let d of upcomingDeadlines" class="deadline-item" [class.urgent]="isUrgent(d.dueDate)">
                <div class="deadline-info">
                  <strong>{{ d.title }}</strong>
                  <span>{{ d.subjectId?.subjectCode }}</span>
                </div>
                <div class="deadline-date">{{ formatDate(d.dueDate) }}</div>
              </div>
              <p *ngIf="!upcomingDeadlines.length" class="empty-state">No upcoming deadlines</p>
            </div>
          </div>
        </div>

        <!-- At-Risk Students Alert -->
        <div *ngIf="stats.atRiskStudents > 0" class="alert-card">
          <div class="alert-icon">⚠️</div>
          <div class="alert-content">
            <strong>{{ stats.atRiskStudents }} students</strong> have attendance below 75%
          </div>
          <a routerLink="/teacher/students" [queryParams]="{filter: 'at-risk'}" class="btn btn-warning">View List</a>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard { display: flex; min-height: 100vh; background: #f1f5f9; }
    .sidebar { width: 280px; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); color: white; position: fixed; height: 100vh; display: flex; flex-direction: column; }
    .sidebar-header { padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .sidebar-header h2 { font-size: 1.25rem; margin: 0 0 0.25rem; }
    .sidebar-header p { font-size: 0.875rem; opacity: 0.7; margin: 0; }
    .sidebar-nav { flex: 1; padding: 1rem 0; }
    .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1.5rem; color: rgba(255,255,255,0.7); text-decoration: none; transition: all 0.2s; border-left: 3px solid transparent; }
    .nav-item:hover, .nav-item.active { background: rgba(255,255,255,0.1); color: white; border-left-color: #6366f1; }
    .sidebar-footer { padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
    .user-info span { display: block; font-weight: 500; }
    .user-info small { opacity: 0.7; }
    .btn-logout { width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 6px; cursor: pointer; margin-top: 0.5rem; transition: background 0.2s; }
    .btn-logout:hover { background: rgba(255,255,255,0.2); }
    
    .main-content { margin-left: 280px; flex: 1; padding: 2rem; background: var(--bg-primary, #f1f5f9); }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .header-left h1 { font-size: 1.75rem; color: var(--text-primary, #1e293b); margin: 0 0 0.25rem; }
    .header-left p { color: var(--text-tertiary, #64748b); margin: 0; }
    .header-right { display: flex; align-items: center; gap: 0.75rem; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: white; border-radius: 16px; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid; }
    .stat-card.blue { border-left-color: #3b82f6; }
    .stat-card.green { border-left-color: #10b981; }
    .stat-card.orange { border-left-color: #f59e0b; }
    .stat-card.red { border-left-color: #ef4444; }
    .stat-icon { font-size: 2rem; }
    .stat-value { font-size: 2rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: 0.875rem; color: #64748b; }
    
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card h3 { margin: 0 0 1rem; font-size: 1.125rem; color: #1e293b; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .card-header h3 { margin: 0; }
    .link { color: #6366f1; text-decoration: none; font-size: 0.875rem; font-weight: 500; }
    
    .actions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .action-card { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1.25rem; background: #f8fafc; border-radius: 12px; text-decoration: none; color: #1e293b; transition: all 0.2s; }
    .action-card:hover { background: #6366f1; color: white; transform: translateY(-2px); }
    .action-icon { font-size: 1.5rem; }
    .action-text { font-weight: 500; font-size: 0.875rem; }
    
    .subjects-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .subject-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f8fafc; border-radius: 10px; }
    .subject-info strong { display: block; color: #6366f1; }
    .subject-info span { font-size: 0.875rem; color: #64748b; }
    .subject-stats { display: flex; gap: 0.5rem; }
    .badge { padding: 0.25rem 0.75rem; background: #e0e7ff; color: #4338ca; border-radius: 20px; font-size: 0.75rem; font-weight: 500; }
    .badge.secondary { background: #f1f5f9; color: #64748b; }
    
    .pending-list, .deadlines-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .pending-item, .deadline-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f8fafc; border-radius: 10px; }
    .pending-info strong, .deadline-info strong { display: block; margin-bottom: 0.25rem; }
    .pending-info span, .deadline-info span { font-size: 0.875rem; color: #64748b; }
    .deadline-date { font-weight: 600; color: #64748b; font-size: 0.875rem; }
    .deadline-item.urgent { background: #fef2f2; }
    .deadline-item.urgent .deadline-date { color: #ef4444; }
    
    .btn { padding: 0.5rem 1rem; background: #6366f1; color: white; border: none; border-radius: 8px; font-weight: 500; text-decoration: none; cursor: pointer; font-size: 0.875rem; }
    .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; }
    .btn-warning { background: #f59e0b; }
    
    .alert-card { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; margin-top: 1rem; }
    .alert-icon { font-size: 1.5rem; }
    .alert-content { flex: 1; color: #991b1b; }
    
    .empty-state { text-align: center; color: #64748b; padding: 1.5rem; margin: 0; }
    
    @media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 1024px) { .content-grid { grid-template-columns: 1fr; } }
    @media (max-width: 768px) { .sidebar { display: none; } .main-content { margin-left: 0; } .stats-grid { grid-template-columns: 1fr; } }
  `]
})
export class TeacherDashboardComponent implements OnInit {
  user: User | null = null;
  today = new Date();
  stats = { totalStudents: 0, totalSubjects: 0, attendanceToday: null as number | null, pendingReviews: 0, atRiskStudents: 0, lateSubmissions: 0 };
  subjects: any[] = [];
  pendingAssignments: any[] = [];
  upcomingDeadlines: any[] = [];

  constructor(private authService: AuthService, private apiService: ApiService) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.apiService.getTeacherDashboard().subscribe({
      next: (res: any) => {
        this.stats = res.stats;
        this.subjects = res.subjects || [];
        this.upcomingDeadlines = res.upcomingDeadlines || [];
      },
      error: (err) => console.error('Dashboard error:', err)
    });

    this.apiService.getPendingReviews().subscribe({
      next: (res: any) => { this.pendingAssignments = res.assignments || []; },
      error: () => { }
    });
  }

  isUrgent(date: string): boolean {
    const d = new Date(date).getTime() - Date.now();
    return d > 0 && d < 3 * 24 * 60 * 60 * 1000;
  }

  formatDate(date: string): string {
    const d = new Date(date);
    const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return 'Overdue';
    return `${diff} days`;
  }

  logout(): void { this.authService.logout(); window.location.href = '/login'; }
}
