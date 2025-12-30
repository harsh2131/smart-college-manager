import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <div class="header-left">
          <h1>Welcome, {{ user?.name?.split(' ')[0] || 'HOD' }}! 🎓</h1>
          <p>Here's your institution overview</p>
        </div>
        <div class="header-right">
          <span class="academic-year">AY: {{ currentAcademicYear }}</span>
        </div>
      </header>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading dashboard...</p>
      </div>

      <div *ngIf="!loading" class="content">
        <!-- Quick Stats -->
        <section class="stats-grid">
          <div class="stat-card blue">
            <div class="stat-icon">👨‍🎓</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalStudents }}</span>
              <span class="stat-label">Total Students</span>
            </div>
            <div class="stat-breakdown">
              <span>BCA: {{ stats.bcaStudents || 0 }}</span>
              <span>BBA: {{ stats.bbaStudents || 0 }}</span>
            </div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon">👨‍🏫</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalTeachers }}</span>
              <span class="stat-label">Teachers</span>
            </div>
          </div>
          <div class="stat-card purple">
            <div class="stat-icon">📚</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalSubjects }}</span>
              <span class="stat-label">Subjects</span>
            </div>
          </div>
          <div class="stat-card orange">
            <div class="stat-icon">📅</div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.overallAttendance }}%</span>
              <span class="stat-label">Avg Attendance</span>
            </div>
          </div>
        </section>

        <!-- Fee Collection Overview -->
        <section class="card">
          <div class="card-header">
            <h3>💰 Fee Collection Overview</h3>
            <a routerLink="/admin/payments" class="view-all">View All →</a>
          </div>
          <div class="fee-stats">
            <div class="fee-stat collected">
              <span class="fee-value">₹{{ formatCurrency(feeStats.totalCollected) }}</span>
              <span class="fee-label">Total Collected</span>
            </div>
            <div class="fee-stat pending">
              <span class="fee-value">{{ feeStats.pendingCount }}</span>
              <span class="fee-label">Pending Payments</span>
            </div>
            <div class="fee-stat">
              <span class="fee-value">{{ feeStats.bcaCount }}</span>
              <span class="fee-label">BCA Paid</span>
            </div>
            <div class="fee-stat">
              <span class="fee-value">{{ feeStats.bbaCount }}</span>
              <span class="fee-label">BBA Paid</span>
            </div>
          </div>
        </section>

        <div class="two-column">
          <!-- At-Risk Students -->
          <section class="card">
            <div class="card-header">
              <h3>⚠️ At-Risk Students</h3>
              <span class="badge danger">{{ atRiskStudents.length }}</span>
            </div>
            <div class="at-risk-list" *ngIf="atRiskStudents.length">
              <div *ngFor="let s of atRiskStudents.slice(0, 5)" class="at-risk-item">
                <div class="student-info">
                  <strong>{{ s.name }}</strong>
                  <span>{{ s.stream }} - Sem {{ s.semester }}</span>
                </div>
                <span class="attendance-badge danger">{{ s.attendance }}%</span>
              </div>
            </div>
            <p *ngIf="!atRiskStudents.length" class="empty">✅ No at-risk students!</p>
          </section>

          <!-- Quick Actions -->
          <section class="card">
            <h3>⚡ Quick Actions</h3>
            <div class="quick-actions">
              <a routerLink="/admin/fees" class="action-btn">
                <span class="action-icon">💰</span>
                <span>Create Fee Structure</span>
              </a>
              <a routerLink="/admin/exams" class="action-btn">
                <span class="action-icon">📅</span>
                <span>Create Exam Session</span>
              </a>
              <a routerLink="/admin/results" class="action-btn">
                <span class="action-icon">📝</span>
                <span>Publish Results</span>
              </a>
              <a routerLink="/admin/students" class="action-btn">
                <span class="action-icon">👨‍🎓</span>
                <span>Manage Students</span>
              </a>
            </div>
          </section>
        </div>

        <!-- Recent Payments -->
        <section class="card">
          <div class="card-header">
            <h3>💳 Recent Payments</h3>
            <a routerLink="/admin/payments" class="view-all">View All →</a>
          </div>
          <table class="data-table" *ngIf="recentPayments.length">
            <thead>
              <tr>
                <th>Student</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of recentPayments.slice(0, 5)">
                <td>
                  <strong>{{ p.studentId?.name }}</strong>
                  <small>{{ p.studentId?.rollNumber }}</small>
                </td>
                <td>₹{{ p.amount }}</td>
                <td><span class="method-badge">{{ p.paymentMethod }}</span></td>
                <td>{{ formatDate(p.paymentDate) }}</td>
                <td><span class="status-badge" [class.completed]="p.status === 'completed'">{{ p.status }}</span></td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="!recentPayments.length" class="empty">No recent payments</p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 2rem; min-height: 100vh; background: #f8fafc; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header-left h1 { font-size: 1.75rem; color: #1e293b; margin: 0 0 0.25rem; }
    .header-left p { color: #64748b; margin: 0; }
    .academic-year { background: #e0e7ff; color: #4338ca; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; }

    .loading { text-align: center; padding: 4rem; color: #64748b; }
    .spinner { width: 48px; height: 48px; margin: 0 auto 1rem; border: 4px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 2rem; }
    .stat-card { background: white; border-radius: 16px; padding: 1.25rem; display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #e2e8f0; }
    .stat-card.blue { border-left-color: #3b82f6; }
    .stat-card.green { border-left-color: #10b981; }
    .stat-card.purple { border-left-color: #8b5cf6; }
    .stat-card.orange { border-left-color: #f59e0b; }
    .stat-icon { font-size: 2rem; }
    .stat-info { flex: 1; }
    .stat-value { display: block; font-size: 1.75rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
    .stat-breakdown { width: 100%; display: flex; gap: 1rem; font-size: 0.75rem; color: #64748b; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e2e8f0; }

    .card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .card h3 { margin: 0; font-size: 1.1rem; color: #1e293b; }
    .view-all { color: #6366f1; font-size: 0.875rem; text-decoration: none; }
    .badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge.danger { background: #fee2e2; color: #dc2626; }

    .fee-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .fee-stat { text-align: center; padding: 1rem; background: #f8fafc; border-radius: 8px; }
    .fee-stat.collected { background: #d1fae5; }
    .fee-stat.pending { background: #fef3c7; }
    .fee-value { display: block; font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    .fee-label { font-size: 0.75rem; color: #64748b; }

    .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

    .at-risk-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .at-risk-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #fef2f2; border-radius: 8px; }
    .student-info strong { display: block; font-size: 0.875rem; }
    .student-info span { font-size: 0.75rem; color: #64748b; }
    .attendance-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .attendance-badge.danger { background: #fee2e2; color: #dc2626; }

    .quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .action-btn { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #1e293b; transition: all 0.2s; }
    .action-btn:hover { background: #e0e7ff; }
    .action-icon { font-size: 1.5rem; }

    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .data-table th { background: #f8fafc; font-weight: 600; color: #64748b; font-size: 0.7rem; text-transform: uppercase; }
    .data-table small { display: block; color: #94a3b8; font-size: 0.75rem; }
    .method-badge { background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; text-transform: uppercase; }
    .status-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; background: #fef3c7; color: #92400e; }
    .status-badge.completed { background: #d1fae5; color: #065f46; }

    .empty { text-align: center; color: #94a3b8; padding: 1.5rem; }

    @media (max-width: 1024px) { 
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .fee-stats { grid-template-columns: repeat(2, 1fr); }
      .two-column { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminDashboardComponent implements OnInit {
  user: any = null;
  loading = true;
  stats: any = {};
  feeStats: any = {};
  atRiskStudents: any[] = [];
  recentPayments: any[] = [];
  currentAcademicYear = this.getAcademicYear();

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.apiService.getAdminOverview().subscribe({
      next: (res) => { this.stats = res.stats || {}; this.loading = false; },
      error: () => this.loading = false
    });
    this.apiService.getAdminAtRiskSummary().subscribe({
      next: (res) => { this.atRiskStudents = res.students || []; }
    });
    this.apiService.getPaymentSummary(this.currentAcademicYear).subscribe({
      next: (res) => { this.feeStats = res.summary || {}; }
    });
    this.apiService.getAllPayments({ limit: 5 }).subscribe({
      next: (res) => { this.recentPayments = res.payments || []; }
    });
  }

  getAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    if (month >= 5) return `${year}-${(year + 1).toString().slice(-2)}`;
    return `${year - 1}-${year.toString().slice(-2)}`;
  }

  formatCurrency(amount: number): string { return amount ? amount.toLocaleString('en-IN') : '0'; }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
