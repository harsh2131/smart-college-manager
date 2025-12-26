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
    <div class="dashboard">
      <aside class="sidebar">
        <div class="sidebar-header"><h2>🎓 College Manager</h2><p>Student Portal</p></div>
        <nav class="sidebar-nav">
          <a routerLink="/student/dashboard" class="nav-item active">📊 Dashboard</a>
          <a routerLink="/student/assignments" class="nav-item">📝 Assignments</a>
          <a routerLink="/student/fees" class="nav-item">💰 Fees</a>
          <a routerLink="/student/results" class="nav-item">📋 Results</a>
          <a routerLink="/student/hallticket" class="nav-item">🎫 Hall Ticket</a>
          <a routerLink="/student/analytics" class="nav-item">📈 Analytics</a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info"><span>{{ user?.name }}</span><small>{{ user?.rollNumber }} | Sem {{ user?.semester }}</small></div>
          <button (click)="logout()" class="btn-logout">Logout</button>
        </div>
      </aside>
      
      <main class="main-content">
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
      </main>
    </div>
  `,
  styles: [`
    .dashboard { display: flex; min-height: 100vh; background: #f8fafc; }
    .sidebar { width: 260px; background: linear-gradient(180deg, #059669 0%, #047857 100%); color: white; position: fixed; height: 100vh; display: flex; flex-direction: column; z-index: 100; }
    .sidebar-header { padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .sidebar-header h2 { font-size: 1.25rem; margin: 0 0 0.25rem; }
    .sidebar-header p { font-size: 0.875rem; opacity: 0.7; margin: 0; }
    .sidebar-nav { flex: 1; padding: 1rem 0; }
    .nav-item { display: block; padding: 0.875rem 1.5rem; color: rgba(255,255,255,0.7); text-decoration: none; transition: all 0.2s; }
    .nav-item.active, .nav-item:hover { background: rgba(255,255,255,0.1); color: white; }
    .sidebar-footer { padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
    .user-info span { display: block; font-weight: 500; }
    .user-info small { opacity: 0.7; }
    .btn-logout { width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 6px; cursor: pointer; margin-top: 0.5rem; transition: background 0.2s; }
    .btn-logout:hover { background: rgba(255,255,255,0.2); }
    
    .main-content { margin-left: 260px; flex: 1; padding: 2rem; }
    
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .header-left h1 { font-size: 1.75rem; color: #1e293b; margin: 0 0 0.25rem; }
    .header-left p { color: #64748b; margin: 0; }
    .header-right { display: flex; align-items: center; gap: 1rem; }
    
    /* Notification Bell */
    .notification-wrapper { position: relative; }
    .notification-bell { background: white; border: none; font-size: 1.5rem; padding: 0.75rem; border-radius: 12px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1); position: relative; transition: transform 0.2s; }
    .notification-bell:hover { transform: scale(1.05); }
    .notification-badge { position: absolute; top: 4px; right: 4px; background: #ef4444; color: white; font-size: 0.65rem; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-weight: 600; }
    .notification-dropdown { position: absolute; right: 0; top: 100%; margin-top: 0.5rem; width: 320px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); overflow: hidden; z-index: 1000; }
    .notification-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #e2e8f0; }
    .notification-header h4 { margin: 0; font-size: 1rem; }
    .mark-all-btn { background: none; border: none; color: #6366f1; font-size: 0.75rem; cursor: pointer; }
    .notification-list { max-height: 300px; overflow-y: auto; }
    .notification-item { display: flex; gap: 0.75rem; padding: 1rem; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.2s; }
    .notification-item:hover { background: #f8fafc; }
    .notification-item.unread { background: #eef2ff; }
    .notification-icon { font-size: 1.25rem; }
    .notification-content p { margin: 0 0 0.25rem; font-size: 0.875rem; color: #334155; }
    .notification-content small { color: #94a3b8; font-size: 0.75rem; }
    .empty-notifications { text-align: center; padding: 1.5rem; color: #94a3b8; }
    
    /* Profile Section */
    .profile-section { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .profile-card { display: flex; align-items: center; gap: 1.25rem; background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 1.5rem; border-radius: 16px; color: white; flex: 1; min-width: 300px; }
    .profile-avatar { width: 72px; height: 72px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; }
    .profile-info h2 { margin: 0 0 0.5rem; font-size: 1.25rem; }
    .profile-details { display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.875rem; opacity: 0.9; }
    .stream-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-weight: 600; font-size: 0.75rem; }
    .stream-badge.bca { background: #dbeafe; color: #1d4ed8; }
    .stream-badge.bba { background: #fce7f3; color: #be185d; }
    
    .quick-stats { display: flex; gap: 1rem; flex-wrap: wrap; flex: 1; }
    .quick-stat { display: flex; align-items: center; gap: 0.75rem; background: white; padding: 1rem 1.25rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); flex: 1; min-width: 140px; transition: transform 0.2s; text-decoration: none; color: inherit; }
    .quick-stat.action:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .quick-stat.success { border-left: 4px solid #10b981; }
    .quick-stat.warning { border-left: 4px solid #f59e0b; }
    .quick-stat.danger { border-left: 4px solid #ef4444; }
    .stat-icon { font-size: 1.5rem; }
    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.125rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: 0.75rem; color: #64748b; }
    
    .card { background: white; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .card h3 { margin: 0 0 1rem; font-size: 1.125rem; color: #1e293b; }
    
    /* Fee Summary Alert */
    .fee-summary { padding: 0; overflow: hidden; }
    .fee-alert { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); }
    .fee-alert.overdue { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); }
    .fee-alert-content { display: flex; align-items: center; gap: 1rem; }
    .alert-icon { font-size: 2rem; }
    .alert-text h4 { margin: 0 0 0.25rem; color: #92400e; }
    .fee-alert.overdue .alert-text h4 { color: #991b1b; }
    .alert-text p { margin: 0; font-size: 0.875rem; color: #78350f; }
    .fee-alert.overdue .alert-text p { color: #7f1d1d; }
    .alert-text small { color: #a16207; }
    .btn-pay { background: #1e293b; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; transition: background 0.2s; }
    .btn-pay:hover { background: #0f172a; }
    
    /* Overall Progress Section */
    .overall-progress { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
    .progress-info { flex: 1; min-width: 200px; }
    .progress-description { color: #64748b; font-size: 0.875rem; margin: 0.5rem 0 0; }
    .circular-progress-container { position: relative; width: 140px; height: 140px; }
    .circular-progress { width: 100%; height: 100%; transform: rotate(-90deg); }
    .progress-bg { fill: none; stroke: #e2e8f0; stroke-width: 10; }
    .progress-bar { fill: none; stroke-width: 10; stroke-linecap: round; transition: stroke-dashoffset 0.5s ease; }
    .progress-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
    .percentage-value { font-size: 1.75rem; font-weight: 700; display: block; }
    .progress-label { font-size: 0.75rem; color: #64748b; }
    
    .eligibility-bar { position: relative; width: 100%; max-width: 300px; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: visible; margin-top: 0.5rem; }
    .eligibility-fill { height: 100%; border-radius: 6px; transition: width 0.5s; }
    .eligibility-fill.safe { background: linear-gradient(90deg, #10b981, #34d399); }
    .eligibility-fill.warning { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .eligibility-fill.danger { background: linear-gradient(90deg, #ef4444, #f87171); }
    .eligibility-threshold { position: absolute; top: -8px; height: calc(100% + 16px); }
    .threshold-line { display: block; width: 2px; height: 100%; background: #1e293b; }
    .threshold-label { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); font-size: 0.625rem; color: #64748b; white-space: nowrap; margin-top: 4px; }
    
    /* Subject Attendance Grid */
    .attendance-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .attendance-card { padding: 1.25rem; border-radius: 12px; border: 2px solid #e2e8f0; background: white; transition: transform 0.2s, box-shadow 0.2s; }
    .attendance-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .attendance-card.safe { border-color: #10b981; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); }
    .attendance-card.warning { border-color: #f59e0b; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); }
    .attendance-card.danger { border-color: #ef4444; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); }
    .subject-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .subject-code { font-weight: 700; color: #6366f1; font-size: 1rem; }
    .subject-status { font-size: 0.875rem; }
    .subject-name { font-size: 0.75rem; color: #64748b; margin-bottom: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .subject-progress { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .mini-progress-bar { flex: 1; height: 8px; background: rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden; }
    .mini-progress-fill { height: 100%; border-radius: 4px; }
    .mini-progress-fill.safe { background: #10b981; }
    .mini-progress-fill.warning { background: #f59e0b; }
    .mini-progress-fill.danger { background: #ef4444; }
    .percentage { font-weight: 700; font-size: 1.25rem; color: #1e293b; }
    .classes-info { font-size: 0.75rem; color: #64748b; }
    .classes-needed { font-size: 0.7rem; color: #dc2626; margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: rgba(220,38,38,0.1); border-radius: 4px; }
    
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    
    /* Deadlines */
    .deadlines-list, .submissions-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .deadline-item, .submission-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 10px; transition: background 0.2s; }
    .deadline-item:hover, .submission-item:hover { background: #f1f5f9; }
    .deadline-item.urgent { background: #fef2f2; }
    .deadline-item.soon { background: #fffbeb; }
    .deadline-icon, .submission-icon { font-size: 1.25rem; }
    .deadline-content, .submission-content { flex: 1; }
    .deadline-content strong, .submission-content strong { display: block; font-size: 0.875rem; color: #1e293b; }
    .deadline-subject, .submission-date { font-size: 0.75rem; color: #64748b; }
    .days-badge { font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.5rem; background: #e2e8f0; border-radius: 4px; color: #475569; }
    .days-badge.urgent { background: #fee2e2; color: #dc2626; }
    .grade-badge { font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.5rem; background: #d1fae5; color: #065f46; border-radius: 4px; }
    .pending-badge { font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.5rem; background: #fef3c7; color: #92400e; border-radius: 4px; }
    
    /* Notifications Preview */
    .notifications-preview { display: flex; flex-direction: column; gap: 0.5rem; }
    .notification-preview-item { display: flex; gap: 0.75rem; padding: 0.75rem; background: #f8fafc; border-radius: 8px; }
    .notification-preview-item.unread { background: #eef2ff; }
    .notification-text p { margin: 0; font-size: 0.875rem; color: #334155; }
    .notification-text small { color: #94a3b8; }
    
    .empty { text-align: center; color: #94a3b8; padding: 1.5rem; font-size: 0.875rem; }
    
    @media (max-width: 768px) { 
      .sidebar { display: none; } 
      .main-content { margin-left: 0; padding: 1rem; } 
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
        if (res.marksSummary) {
          this.marks = res.marksSummary;
        }
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

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  markRead(notification: any): void {
    if (!notification.isRead) {
      this.apiService.markNotificationRead(notification._id).subscribe({
        next: () => {
          notification.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      });
    }
  }

  markAllRead(): void {
    this.apiService.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.unreadCount = 0;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}
