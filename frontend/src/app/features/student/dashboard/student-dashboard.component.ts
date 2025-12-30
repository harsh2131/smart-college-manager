import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { SocketService } from '../../../core/services/socket.service';
import { ThemeToggleComponent } from '../../../core/components/theme-toggle.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ThemeToggleComponent],
  template: `
    <div class="page">
      <header class="page-header">
        <div class="header-left">
          <h1>Welcome, {{ (user?.name?.split(' '))?.[0] || 'Student' }}! 👋</h1>
          <p>Your academic dashboard</p>
        </div>
        <div class="header-right">
          <app-theme-toggle></app-theme-toggle>
          <div class="notification-wrapper">
            <button class="notification-bell" (click)="toggleNotifications()">
              🔔
              <span *ngIf="unreadCount > 0" class="notification-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </button>
            <div class="notification-dropdown" *ngIf="showNotifications">
              <div class="notification-header">
                <h4>Notifications</h4>
                <button *ngIf="unreadCount > 0" (click)="markAllRead()" class="mark-all-btn">Mark all read</button>
              </div>
              <div class="notification-list">
                <div *ngFor="let n of notifications" class="notification-item" [class.unread]="!n.isRead" (click)="markRead(n)">
                  <span class="notification-icon">{{ getNotificationIcon(n.type) }}</span>
                  <div class="notification-content">
                    <p>{{ n.message }}</p>
                    <small>{{ formatTimeAgo(n.createdAt) }}</small>
                  </div>
                </div>
                <p *ngIf="!notifications.length" class="empty-notifications">No notifications yet 📭</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Student Profile Card -->
      <section class="profile-section">
        <div class="profile-card">
          <div class="profile-avatar">{{ user?.name?.charAt(0) || 'S' }}</div>
          <div class="profile-info">
            <h2>{{ user?.name }}</h2>
            <div class="profile-details">
              <span class="stream-badge" [class.bca]="user?.stream === 'BCA'" [class.bba]="user?.stream === 'BBA'">{{ user?.stream || 'N/A' }}</span>
              <span>Roll No: <strong>{{ user?.rollNumber }}</strong></span>
              <span>Semester: <strong>{{ user?.semester }}</strong></span>
              <span>Division: <strong>{{ user?.division || 'N/A' }}</strong></span>
            </div>
          </div>
        </div>
        <div class="quick-stats">
          <div class="quick-stat" [class.success]="overallAttendance >= 75" [class.warning]="overallAttendance >= 65 && overallAttendance < 75" [class.danger]="overallAttendance < 65">
            <span class="stat-icon">📊</span>
            <div class="stat-content">
              <span class="stat-value">{{ overallAttendance }}%</span>
              <span class="stat-label">Attendance</span>
            </div>
          </div>
          <div class="quick-stat" [class.success]="feeStatus.pending === 0" [class.warning]="feeStatus.pending > 0 && !feeStatus.isOverdue" [class.danger]="feeStatus.isOverdue">
            <span class="stat-icon">💰</span>
            <div class="stat-content">
              <span class="stat-value">{{ feeStatus.pending === 0 ? 'Paid' : '₹' + formatCurrency(feeStatus.pending) }}</span>
              <span class="stat-label">{{ feeStatus.pending === 0 ? 'All Fees Paid' : (feeStatus.isOverdue ? 'Overdue!' : 'Pending') }}</span>
            </div>
          </div>
          <div class="quick-stat" [class.warning]="upcomingDeadlines.length > 0">
            <span class="stat-icon">📝</span>
            <div class="stat-content">
              <span class="stat-value">{{ upcomingDeadlines.length }}</span>
              <span class="stat-label">Due Assignments</span>
            </div>
          </div>
          <a routerLink="/student/fees" class="quick-stat action" *ngIf="feeStatus.pending > 0">
            <span class="stat-icon">💳</span>
            <div class="stat-content">
              <span class="stat-value">Pay Now</span>
              <span class="stat-label">Clear Dues</span>
            </div>
          </a>
        </div>
      </section>

      <!-- Overall Attendance Progress -->
      <section class="overall-progress card">
        <div class="progress-info">
          <h3>📊 Overall Attendance</h3>
          <p class="progress-description">75% attendance required for eligibility</p>
        </div>
        <div class="circular-progress-container">
          <svg class="circular-progress" viewBox="0 0 120 120">
            <circle class="progress-bg" cx="60" cy="60" r="52"/>
            <circle class="progress-bar" cx="60" cy="60" r="52"
              [attr.stroke]="getProgressColor(overallAttendance)"
              [style.strokeDasharray]="circumference"
              [style.strokeDashoffset]="getStrokeDashoffset(overallAttendance)"/>
          </svg>
          <div class="progress-text">
            <span class="percentage-value" [style.color]="getProgressColor(overallAttendance)">{{ overallAttendance }}%</span>
            <span class="progress-label">{{ overallAttendance >= 75 ? 'Eligible ✓' : 'At Risk ⚠️' }}</span>
          </div>
        </div>
        <div class="eligibility-bar">
          <div class="eligibility-fill" [style.width.%]="Math.min(overallAttendance, 100)" [class.safe]="overallAttendance >= 75" [class.warning]="overallAttendance >= 65 && overallAttendance < 75" [class.danger]="overallAttendance < 65"></div>
          <div class="eligibility-threshold" style="left: 75%">
            <span class="threshold-line"></span>
            <span class="threshold-label">75%</span>
          </div>
        </div>
      </section>

      <!-- Subject-wise Attendance -->
      <section class="card">
        <h3>📚 Subject-wise Attendance</h3>
        <div class="attendance-grid">
          <div *ngFor="let item of attendance" class="attendance-card" [class.safe]="item.percentage >= 75" [class.warning]="item.percentage >= 65 && item.percentage < 75" [class.danger]="item.percentage < 65">
            <div class="subject-header">
              <span class="subject-code">{{ item.subjectCode }}</span>
              <span class="subject-status" [class.safe]="item.percentage >= 75" [class.warning]="item.percentage >= 65 && item.percentage < 75" [class.danger]="item.percentage < 65">
                {{ item.percentage >= 75 ? '✓' : item.percentage >= 65 ? '⚡' : '⚠️' }}
              </span>
            </div>
            <div class="subject-name">{{ item.subjectName }}</div>
            <div class="subject-progress">
              <div class="mini-progress-bar">
                <div class="mini-progress-fill" [style.width.%]="item.percentage" [class.safe]="item.percentage >= 75" [class.warning]="item.percentage >= 65 && item.percentage < 75" [class.danger]="item.percentage < 65"></div>
              </div>
              <span class="percentage">{{ item.percentage }}%</span>
            </div>
            <div class="classes-info">{{ item.presentDays || item.present }}/{{ item.totalClasses || item.total }} classes</div>
            <div *ngIf="item.percentage < 75" class="classes-needed">
              Need {{ getClassesNeeded(item) }} more to reach 75%
            </div>
          </div>
          <p *ngIf="!attendance.length" class="empty">No attendance data yet.</p>
        </div>
      </section>

      <div class="content-grid">
        <!-- Upcoming Deadlines & Assignments -->
        <section class="card">
          <h3>⏰ Upcoming Deadlines</h3>
          <div class="deadlines-list">
            <div *ngFor="let d of upcomingDeadlines" class="deadline-item" [class.urgent]="getDaysRemaining(d.dueDate) <= 1" [class.soon]="getDaysRemaining(d.dueDate) > 1 && getDaysRemaining(d.dueDate) <= 3">
              <div class="deadline-icon">{{ getDaysRemaining(d.dueDate) <= 1 ? '🔴' : getDaysRemaining(d.dueDate) <= 3 ? '🟡' : '🟢' }}</div>
              <div class="deadline-content">
                <strong>{{ d.title }}</strong>
                <span class="deadline-subject">{{ d.subjectId?.subjectCode }}</span>
              </div>
              <div class="deadline-time">
                <span class="days-badge" [class.urgent]="getDaysRemaining(d.dueDate) <= 1">{{ formatDate(d.dueDate) }}</span>
              </div>
            </div>
            <p *ngIf="!upcomingDeadlines.length" class="empty">No upcoming deadlines 🎉</p>
          </div>
        </section>
        
        <!-- Recent Submissions -->
        <section class="card">
          <h3>📝 Recent Submissions</h3>
          <div class="submissions-list">
            <div *ngFor="let s of recentSubmissions" class="submission-item">
              <div class="submission-icon">📄</div>
              <div class="submission-content">
                <strong>{{ s.assignmentId?.title || 'Assignment' }}</strong>
                <span class="submission-date">Submitted {{ formatTimeAgo(s.submittedAt) }}</span>
              </div>
              <div class="submission-grade">
                <span *ngIf="s.marks !== null && s.marks !== undefined" class="grade-badge">{{ s.marks }}/{{ s.assignmentId?.totalMarks || 100 }}</span>
                <span *ngIf="s.marks === null || s.marks === undefined" class="pending-badge">Pending</span>
              </div>
            </div>
            <p *ngIf="!recentSubmissions.length" class="empty">No submissions yet.</p>
          </div>
        </section>
      </div>

      <!-- Fee Status Summary -->
      <section class="card fee-summary" *ngIf="feeStatus.pending > 0">
        <div class="fee-alert" [class.overdue]="feeStatus.isOverdue">
          <div class="fee-alert-content">
            <span class="alert-icon">{{ feeStatus.isOverdue ? '⚠️' : '💰' }}</span>
            <div class="alert-text">
              <h4>{{ feeStatus.isOverdue ? 'Fee Payment Overdue!' : 'Fee Payment Pending' }}</h4>
              <p>You have ₹{{ formatCurrency(feeStatus.pending) }} pending for {{ user?.stream }} Semester {{ user?.semester }}</p>
              <small *ngIf="feeStatus.dueDate">Due Date: {{ formatDueDate(feeStatus.dueDate) }}</small>
            </div>
          </div>
          <a routerLink="/student/fees" class="btn-pay">Pay Now →</a>
        </div>
      </section>

      <!-- Recent Notifications -->
      <section class="card" *ngIf="notifications.length">
        <h3>🔔 Recent Notifications</h3>
        <div class="notifications-preview">
          <div *ngFor="let n of notifications.slice(0, 3)" class="notification-preview-item" [class.unread]="!n.isRead">
            <span class="notification-icon">{{ getNotificationIcon(n.type) }}</span>
            <div class="notification-text">
              <p>{{ n.message }}</p>
              <small>{{ formatTimeAgo(n.createdAt) }}</small>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { padding: 1.5rem; min-height: 100vh; background: #f9fafb; }
    
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
    .header-left h1 { font-size: 1.5rem; color: #111827; margin: 0 0 0.25rem; }
    .header-left p { color: #6b7280; margin: 0; font-size: 0.875rem; }
    .header-right { display: flex; align-items: center; gap: 0.75rem; }
    
    /* Notification Bell */
    .notification-wrapper { position: relative; }
    .notification-bell { background: white; border: 1px solid #e5e7eb; font-size: 1.25rem; padding: 0.625rem; border-radius: 6px; cursor: pointer; position: relative; }
    .notification-badge { position: absolute; top: 2px; right: 2px; background: #dc2626; color: white; font-size: 0.625rem; min-width: 16px; height: 16px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; }
    .notification-dropdown { position: absolute; right: 0; top: 100%; margin-top: 0.375rem; width: 300px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; overflow: hidden; z-index: 1000; }
    .notification-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
    .notification-header h4 { margin: 0; font-size: 0.875rem; }
    .mark-all-btn { background: none; border: none; color: #2563eb; font-size: 0.75rem; cursor: pointer; }
    .notification-list { max-height: 280px; overflow-y: auto; }
    .notification-item { display: flex; gap: 0.625rem; padding: 0.75rem; border-bottom: 1px solid #f3f4f6; cursor: pointer; }
    .notification-item:hover { background: #f9fafb; }
    .notification-item.unread { background: #eff6ff; }
    .notification-icon { font-size: 1rem; }
    .notification-content p { margin: 0 0 0.125rem; font-size: 0.8125rem; color: #374151; }
    .notification-content small { color: #9ca3af; font-size: 0.75rem; }
    .empty-notifications { text-align: center; padding: 1.25rem; color: #9ca3af; font-size: 0.875rem; }
    
    /* Profile Section */
    .profile-section { display: flex; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .profile-card { display: flex; align-items: center; gap: 1rem; background: #047857; padding: 1.25rem; border-radius: 8px; color: white; flex: 1; min-width: 280px; }
    .profile-avatar { width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 600; }
    .profile-info h2 { margin: 0 0 0.375rem; font-size: 1.125rem; }
    .profile-details { display: flex; flex-wrap: wrap; gap: 0.625rem; font-size: 0.8125rem; opacity: 0.9; }
    .stream-badge { padding: 0.125rem 0.5rem; border-radius: 4px; font-weight: 500; font-size: 0.6875rem; }
    .stream-badge.bca { background: #dbeafe; color: #1e40af; }
    .stream-badge.bba { background: #fce7f3; color: #be185d; }
    
    .quick-stats { display: flex; gap: 0.75rem; flex-wrap: wrap; flex: 1; }
    .quick-stat { display: flex; align-items: center; gap: 0.625rem; background: white; padding: 0.875rem 1rem; border-radius: 6px; border: 1px solid #e5e7eb; flex: 1; min-width: 130px; text-decoration: none; color: inherit; }
    .quick-stat.success { border-left: 3px solid #16a34a; }
    .quick-stat.warning { border-left: 3px solid #d97706; }
    .quick-stat.danger { border-left: 3px solid #dc2626; }
    .stat-icon { font-size: 1.25rem; }
    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 1rem; font-weight: 600; color: #111827; }
    .stat-label { font-size: 0.6875rem; color: #6b7280; }
    
    .card { background: white; border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; border: 1px solid #e5e7eb; }
    .card h3 { margin: 0 0 0.875rem; font-size: 1rem; color: #111827; }
    
    /* Fee Summary Alert */
    .fee-summary { padding: 0; overflow: hidden; }
    .fee-alert { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; background: #fef3c7; }
    .fee-alert.overdue { background: #fee2e2; }
    .fee-alert-content { display: flex; align-items: center; gap: 0.75rem; }
    .alert-icon { font-size: 1.5rem; }
    .alert-text h4 { margin: 0 0 0.125rem; color: #92400e; font-size: 0.9375rem; }
    .fee-alert.overdue .alert-text h4 { color: #b91c1c; }
    .alert-text p { margin: 0; font-size: 0.8125rem; color: #78350f; }
    .fee-alert.overdue .alert-text p { color: #7f1d1d; }
    .alert-text small { color: #a16207; font-size: 0.75rem; }
    .btn-pay { background: #111827; color: white; padding: 0.625rem 1.25rem; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 0.875rem; }
    
    /* Overall Progress Section */
    .overall-progress { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
    .progress-info { flex: 1; min-width: 180px; }
    .progress-description { color: #6b7280; font-size: 0.8125rem; margin: 0.375rem 0 0; }
    .circular-progress-container { position: relative; width: 120px; height: 120px; }
    .circular-progress { width: 100%; height: 100%; transform: rotate(-90deg); }
    .progress-bg { fill: none; stroke: #e5e7eb; stroke-width: 10; }
    .progress-bar { fill: none; stroke-width: 10; stroke-linecap: round; transition: stroke-dashoffset 0.3s ease; }
    .progress-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
    .percentage-value { font-size: 1.5rem; font-weight: 600; display: block; }
    .progress-label { font-size: 0.6875rem; color: #6b7280; }
    
    .eligibility-bar { position: relative; width: 100%; max-width: 280px; height: 10px; background: #e5e7eb; border-radius: 5px; overflow: visible; margin-top: 0.375rem; }
    .eligibility-fill { height: 100%; border-radius: 5px; transition: width 0.3s; }
    .eligibility-fill.safe { background: #16a34a; }
    .eligibility-fill.warning { background: #d97706; }
    .eligibility-fill.danger { background: #dc2626; }
    .eligibility-threshold { position: absolute; top: -6px; height: calc(100% + 12px); }
    .threshold-line { display: block; width: 2px; height: 100%; background: #111827; }
    .threshold-label { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); font-size: 0.5625rem; color: #6b7280; white-space: nowrap; margin-top: 3px; }
    
    /* Subject Attendance Grid */
    .attendance-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; }
    .attendance-card { padding: 1rem; border-radius: 6px; border: 1px solid #e5e7eb; background: white; }
    .attendance-card.safe { border-color: #16a34a; background: #f0fdf4; }
    .attendance-card.warning { border-color: #d97706; background: #fffbeb; }
    .attendance-card.danger { border-color: #dc2626; background: #fef2f2; }
    .subject-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.375rem; }
    .subject-code { font-weight: 600; color: #2563eb; font-size: 0.875rem; }
    .subject-status { font-size: 0.75rem; }
    .subject-name { font-size: 0.6875rem; color: #6b7280; margin-bottom: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .subject-progress { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.375rem; }
    .mini-progress-bar { flex: 1; height: 6px; background: rgba(0,0,0,0.08); border-radius: 3px; overflow: hidden; }
    .mini-progress-fill { height: 100%; border-radius: 3px; }
    .mini-progress-fill.safe { background: #16a34a; }
    .mini-progress-fill.warning { background: #d97706; }
    .mini-progress-fill.danger { background: #dc2626; }
    .percentage { font-weight: 600; font-size: 1rem; color: #111827; }
    .classes-info { font-size: 0.6875rem; color: #6b7280; }
    .classes-needed { font-size: 0.625rem; color: #dc2626; margin-top: 0.375rem; padding: 0.25rem 0.375rem; background: rgba(220,38,38,0.1); border-radius: 3px; }
    
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    
    /* Deadlines */
    .deadlines-list, .submissions-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .deadline-item, .submission-item { display: flex; align-items: center; gap: 0.625rem; padding: 0.625rem 0.875rem; background: #f9fafb; border-radius: 6px; }
    .deadline-item.urgent { background: #fef2f2; }
    .deadline-item.soon { background: #fffbeb; }
    .deadline-icon, .submission-icon { font-size: 1rem; }
    .deadline-content, .submission-content { flex: 1; }
    .deadline-content strong, .submission-content strong { display: block; font-size: 0.8125rem; color: #111827; }
    .deadline-subject, .submission-date { font-size: 0.6875rem; color: #6b7280; }
    .days-badge { font-size: 0.6875rem; font-weight: 500; padding: 0.25rem 0.375rem; background: #e5e7eb; border-radius: 3px; color: #374151; }
    .days-badge.urgent { background: #fee2e2; color: #dc2626; }
    .grade-badge { font-size: 0.6875rem; font-weight: 500; padding: 0.25rem 0.375rem; background: #dcfce7; color: #166534; border-radius: 3px; }
    .pending-badge { font-size: 0.6875rem; font-weight: 500; padding: 0.25rem 0.375rem; background: #fef3c7; color: #92400e; border-radius: 3px; }
    
    /* Notifications Preview */
    .notifications-preview { display: flex; flex-direction: column; gap: 0.375rem; }
    .notification-preview-item { display: flex; gap: 0.625rem; padding: 0.625rem; background: #f9fafb; border-radius: 6px; }
    .notification-preview-item.unread { background: #eff6ff; }
    .notification-text p { margin: 0; font-size: 0.8125rem; color: #374151; }
    .notification-text small { color: #9ca3af; font-size: 0.6875rem; }
    
    .empty { text-align: center; color: #9ca3af; padding: 1.25rem; font-size: 0.8125rem; }
    
    @media (max-width: 768px) { 
      .page { padding: 1rem; }
      .content-grid { grid-template-columns: 1fr; } 
      .overall-progress { flex-direction: column; text-align: center; }
      .eligibility-bar { margin: 0 auto; }
      .attendance-grid { grid-template-columns: 1fr; }
      .profile-section { flex-direction: column; }
      .quick-stats { flex-direction: column; }
    }
  `]
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  user: User | null = null;
  attendance: any[] = [];
  marks: any[] = [];
  upcomingDeadlines: any[] = [];
  recentSubmissions: any[] = [];
  notifications: any[] = [];
  unreadCount = 0;
  showNotifications = false;
  Math = Math;
  circumference = 2 * Math.PI * 52;
  feeStatus = { pending: 0, isOverdue: false, dueDate: '' };

  private socketSub?: Subscription;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private socketService: SocketService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadDashboardData();
    this.loadNotifications();
    this.loadFeeStatus();
    this.subscribeToRealTimeNotifications();
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
  }

  subscribeToRealTimeNotifications(): void {
    this.socketSub = this.socketService.notifications$.subscribe(notification => {
      if (notification) {
        this.notifications.unshift(notification);
        this.unreadCount++;
        this.showToast(notification.message, notification.type);
      }
    });
  }

  showToast(message: string, type: string): void {
    const container = document.querySelector('.toast-container') || this.createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${this.getNotificationIcon(type)}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  createToastContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  loadDashboardData(): void {
    this.apiService.getStudentDashboard().subscribe({
      next: (res: any) => {
        this.attendance = res.attendanceSummary || [];
        this.upcomingDeadlines = res.upcomingDeadlines || [];
        this.recentSubmissions = res.recentSubmissions || [];
        if (res.marksSummary) this.marks = res.marksSummary;
      },
      error: (err) => console.error('Dashboard load error:', err)
    });
  }

  loadFeeStatus(): void {
    this.apiService.getMyFees().subscribe({
      next: (res: any) => {
        this.feeStatus.pending = res.totalPending || 0;
        const fees = res.fees || [];
        const unpaidFee = fees.find((f: any) => !f.isPaid);
        if (unpaidFee && unpaidFee.dueDate) {
          this.feeStatus.dueDate = unpaidFee.dueDate;
          this.feeStatus.isOverdue = new Date(unpaidFee.dueDate) < new Date();
        }
      },
      error: (err) => console.error('Fee status error:', err)
    });
  }

  loadNotifications(): void {
    this.apiService.getNotifications().subscribe({
      next: (res: any) => {
        this.notifications = res.notifications || [];
        this.unreadCount = res.unreadCount || 0;
      },
      error: (err) => console.error('Notifications error:', err)
    });
  }

  get overallAttendance(): number {
    if (!this.attendance.length) return 0;
    const total = this.attendance.reduce((sum, a) => sum + (a.percentage || 0), 0);
    return Math.round(total / this.attendance.length);
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 75) return '#10b981';
    if (percentage >= 65) return '#f59e0b';
    return '#ef4444';
  }

  getStrokeDashoffset(percentage: number): number {
    return this.circumference - (percentage / 100) * this.circumference;
  }

  getClassesNeeded(item: any): number {
    const present = item.presentDays || item.present || 0;
    const total = item.totalClasses || item.total || 0;
    const needed = Math.ceil((0.75 * total - present) / 0.25);
    return Math.max(0, needed);
  }

  getDaysRemaining(date: string): number {
    const d = new Date(date);
    const now = new Date();
    return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  formatDate(date: string): string {
    const diff = this.getDaysRemaining(date);
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
  }

  formatDueDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatTimeAgo(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    if (!amount) return '0';
    return amount.toLocaleString('en-IN');
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'deadline': return '⏰';
      case 'grade': return '📝';
      case 'attendance': return '📅';
      case 'announcement': return '📢';
      case 'fee': return '💰';
      default: return '🔔';
    }
  }

  toggleNotifications(): void { this.showNotifications = !this.showNotifications; }

  markRead(notification: any): void {
    if (!notification.isRead) {
      this.apiService.markNotificationRead(notification._id).subscribe({
        next: () => { notification.isRead = true; this.unreadCount = Math.max(0, this.unreadCount - 1); }
      });
    }
  }

  markAllRead(): void {
    this.apiService.markAllNotificationsRead().subscribe({
      next: () => { this.notifications.forEach(n => n.isRead = true); this.unreadCount = 0; }
    });
  }
}
