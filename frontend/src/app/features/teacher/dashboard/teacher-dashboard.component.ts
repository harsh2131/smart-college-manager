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
    <div class="page">
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
    </div>
  `,
  styles: [`
    .page { padding: 1.5rem; background: var(--bg-primary, #f9fafb); min-height: 100vh; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .header-left h1 { font-size: 1.5rem; color: var(--text-primary, #111827); margin: 0 0 0.25rem; }
    .header-left p { color: var(--text-tertiary, #6b7280); margin: 0; font-size: 0.875rem; }
    .header-right { display: flex; align-items: center; gap: 0.5rem; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: white; border-radius: 8px; padding: 1.25rem; display: flex; align-items: center; gap: 0.75rem; border: 1px solid #e5e7eb; border-left: 3px solid; }
    .stat-card.blue { border-left-color: #2563eb; }
    .stat-card.green { border-left-color: #16a34a; }
    .stat-card.orange { border-left-color: #d97706; }
    .stat-card.red { border-left-color: #dc2626; }
    .stat-icon { font-size: 1.5rem; }
    .stat-value { font-size: 1.5rem; font-weight: 600; color: #111827; }
    .stat-label { font-size: 0.8125rem; color: #6b7280; }
    
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .card { background: white; border-radius: 8px; padding: 1.25rem; border: 1px solid #e5e7eb; }
    .card h3 { margin: 0 0 1rem; font-size: 1rem; color: #111827; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .card-header h3 { margin: 0; }
    .link { color: #2563eb; text-decoration: none; font-size: 0.8125rem; font-weight: 500; }
    
    .actions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
    .action-card { display: flex; flex-direction: column; align-items: center; gap: 0.375rem; padding: 1rem; background: #f9fafb; border-radius: 6px; text-decoration: none; color: #111827; transition: background 0.15s; border: 1px solid #e5e7eb; }
    .action-card:hover { background: #2563eb; color: white; border-color: #2563eb; }
    .action-icon { font-size: 1.25rem; }
    .action-text { font-weight: 500; font-size: 0.8125rem; }
    
    .subjects-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .subject-item { display: flex; justify-content: space-between; align-items: center; padding: 0.875rem; background: #f9fafb; border-radius: 6px; }
    .subject-info strong { display: block; color: #2563eb; font-size: 0.875rem; }
    .subject-info span { font-size: 0.8125rem; color: #6b7280; }
    .subject-stats { display: flex; gap: 0.375rem; }
    .badge { padding: 0.25rem 0.5rem; background: #dbeafe; color: #1e40af; border-radius: 4px; font-size: 0.6875rem; font-weight: 500; }
    .badge.secondary { background: #f3f4f6; color: #6b7280; }
    
    .pending-list, .deadlines-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .pending-item, .deadline-item { display: flex; justify-content: space-between; align-items: center; padding: 0.875rem; background: #f9fafb; border-radius: 6px; }
    .pending-info strong, .deadline-info strong { display: block; margin-bottom: 0.125rem; font-size: 0.875rem; }
    .pending-info span, .deadline-info span { font-size: 0.8125rem; color: #6b7280; }
    .deadline-date { font-weight: 500; color: #6b7280; font-size: 0.8125rem; }
    .deadline-item.urgent { background: #fef2f2; }
    .deadline-item.urgent .deadline-date { color: #dc2626; }
    
    .btn { padding: 0.5rem 0.875rem; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 500; text-decoration: none; cursor: pointer; font-size: 0.8125rem; }
    .btn-sm { padding: 0.375rem 0.625rem; font-size: 0.75rem; }
    .btn-warning { background: #d97706; }
    
    .alert-card { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; margin-top: 0.75rem; }
    .alert-icon { font-size: 1.25rem; }
    .alert-content { flex: 1; color: #b91c1c; font-size: 0.875rem; }
    
    .empty-state { text-align: center; color: #6b7280; padding: 1.25rem; margin: 0; font-size: 0.875rem; }
    
    @media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 1024px) { .content-grid { grid-template-columns: 1fr; } }
    @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr; } }
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
}
