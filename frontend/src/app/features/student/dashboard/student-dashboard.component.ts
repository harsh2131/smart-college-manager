import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-student-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="dashboard">
      <aside class="sidebar">
        <div class="sidebar-header"><h2>🎓 College Manager</h2><p>Student Portal</p></div>
        <nav class="sidebar-nav"><a routerLink="/student/dashboard" class="nav-item active">📊 Dashboard</a></nav>
        <div class="sidebar-footer">
          <div class="user-info"><span>{{ user?.name }}</span><small>{{ user?.rollNumber }} | Sem {{ user?.semester }}</small></div>
          <button (click)="logout()" class="btn-logout">Logout</button>
        </div>
      </aside>
      
      <main class="main-content">
        <header class="page-header"><h1>Welcome, {{ user?.name }}!</h1><p>Your academic dashboard</p></header>
        
        <section class="card">
          <h3>📊 Attendance Overview</h3>
          <div class="attendance-grid">
            <div *ngFor="let item of attendance" class="attendance-card" [class.safe]="item.percentage >= 75" [class.warning]="item.percentage >= 65 && item.percentage < 75" [class.danger]="item.percentage < 65">
              <div class="subject-code">{{ item.subjectCode }}</div>
              <div class="percentage">{{ item.percentage }}%</div>
              <div class="details">{{ item.present }}/{{ item.total }}</div>
            </div>
            <p *ngIf="!attendance.length" class="empty">No attendance data yet.</p>
          </div>
        </section>

        <div class="content-grid">
          <section class="card">
            <h3>⏰ Upcoming Deadlines</h3>
            <div *ngFor="let d of upcomingDeadlines" class="deadline-item">
              <strong>{{ d.title }}</strong>
              <span>{{ d.subjectId?.subjectCode }} - {{ formatDate(d.dueDate) }}</span>
            </div>
            <p *ngIf="!upcomingDeadlines.length" class="empty">No upcoming deadlines 🎉</p>
          </section>
          
          <section class="card">
            <h3>📝 Marks Overview</h3>
            <div *ngFor="let m of marks" class="marks-item">
              <strong>{{ m.subjectCode }}</strong>
              <span>{{ m.totalObtained }}/{{ m.totalMax }} ({{ m.percentage }}%)</span>
            </div>
            <p *ngIf="!marks.length" class="empty">No marks yet.</p>
          </section>
        </div>
      </main>
    </div>
  `,
    styles: [`
    .dashboard { display: flex; min-height: 100vh; background: #f8fafc; }
    .sidebar { width: 260px; background: linear-gradient(180deg, #059669 0%, #047857 100%); color: white; position: fixed; height: 100vh; display: flex; flex-direction: column; }
    .sidebar-header { padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .sidebar-header h2 { font-size: 1.25rem; margin: 0 0 0.25rem; }
    .sidebar-header p { font-size: 0.875rem; opacity: 0.7; margin: 0; }
    .sidebar-nav { flex: 1; padding: 1rem 0; }
    .nav-item { display: block; padding: 0.875rem 1.5rem; color: rgba(255,255,255,0.7); text-decoration: none; }
    .nav-item.active { background: rgba(255,255,255,0.1); color: white; }
    .sidebar-footer { padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
    .user-info span { display: block; font-weight: 500; }
    .user-info small { opacity: 0.7; }
    .btn-logout { width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 6px; cursor: pointer; margin-top: 0.5rem; }
    .main-content { margin-left: 260px; flex: 1; padding: 2rem; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { font-size: 1.75rem; color: #1e293b; margin: 0 0 0.25rem; }
    .page-header p { color: #64748b; margin: 0; }
    .card { background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card h3 { margin: 0 0 1rem; font-size: 1.125rem; }
    .attendance-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; }
    .attendance-card { padding: 1rem; border-radius: 10px; border: 2px solid #e2e8f0; text-align: center; }
    .attendance-card.safe { border-color: #10b981; background: #ecfdf5; }
    .attendance-card.warning { border-color: #f59e0b; background: #fffbeb; }
    .attendance-card.danger { border-color: #ef4444; background: #fef2f2; }
    .subject-code { font-weight: 700; color: #6366f1; }
    .percentage { font-size: 1.75rem; font-weight: 700; margin: 0.5rem 0; }
    .details { font-size: 0.875rem; color: #64748b; }
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .deadline-item, .marks-item { padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 0.5rem; }
    .deadline-item strong, .marks-item strong { display: block; }
    .deadline-item span, .marks-item span { font-size: 0.875rem; color: #64748b; }
    .empty { text-align: center; color: #64748b; padding: 1rem; }
    @media (max-width: 768px) { .sidebar { display: none; } .main-content { margin-left: 0; } .content-grid { grid-template-columns: 1fr; } }
  `]
})
export class StudentDashboardComponent implements OnInit {
    user: User | null = null;
    attendance: any[] = [];
    marks: any[] = [];
    upcomingDeadlines: any[] = [];

    constructor(private authService: AuthService, private apiService: ApiService) { }

    ngOnInit(): void {
        this.user = this.authService.getCurrentUser();
        if (this.user) {
            this.apiService.getStudentAnalytics(this.user._id).subscribe({
                next: (res: any) => { this.attendance = res.attendanceSummary || []; this.marks = res.marksSummary || []; this.upcomingDeadlines = res.upcomingDeadlines || []; }
            });
        }
    }

    formatDate(date: string): string {
        const d = new Date(date);
        const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return diff === 0 ? 'Due Today' : diff === 1 ? 'Tomorrow' : diff < 0 ? 'Overdue' : `${diff} days`;
    }

    logout(): void { this.authService.logout(); window.location.href = '/login'; }
}
