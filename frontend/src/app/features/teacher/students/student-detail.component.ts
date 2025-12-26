import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-student-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="page-container">
      <div class="page-header">
        <a routerLink="/teacher/students" class="back-link">← Back to Students</a>
        <h1>📊 Student Details</h1>
      </div>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading student data...</p>
      </div>

      <div *ngIf="error" class="error-state card">
        <h3>⚠️ Error Loading Data</h3>
        <p>{{ error }}</p>
        <a routerLink="/teacher/students" class="btn">Return to Students List</a>
      </div>

      <div *ngIf="student && !loading && !error" class="content">
        <!-- Student Profile Card -->
        <div class="profile-card card">
          <div class="profile-avatar">{{ getInitials(student.name) }}</div>
          <div class="profile-info">
            <h2>{{ student.name }}</h2>
            <p class="roll-number">Roll No: {{ student.rollNumber }}</p>
            <p class="email">{{ student.email }}</p>
          </div>
          <div class="status-indicator" [class.at-risk]="isAtRisk" [class.warning]="isWarning" [class.safe]="isSafe">
            {{ overallStatus }}
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-value">{{ analytics?.subjectCount || 0 }}</div>
            <div class="stat-label">Subjects Enrolled</div>
          </div>
          <div class="stat-card" [class.danger]="overallAttendance < 75" [class.warning]="overallAttendance >= 65 && overallAttendance < 75" [class.success]="overallAttendance >= 75">
            <div class="stat-icon">📅</div>
            <div class="stat-value">{{ overallAttendance }}%</div>
            <div class="stat-label">Overall Attendance</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-value">{{ analytics?.avgMarks | number:'1.1-1' || 'N/A' }}</div>
            <div class="stat-label">Average Marks</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-value">{{ analytics?.submissionsCount || 0 }}</div>
            <div class="stat-label">Assignments Submitted</div>
          </div>
        </div>

        <!-- Subject-wise Attendance -->
        <div class="section card">
          <h3>📅 Subject-wise Attendance</h3>
          <div *ngIf="analytics?.attendance?.length" class="subject-list">
            <div *ngFor="let att of analytics.attendance" class="subject-item">
              <div class="subject-header">
                <span class="subject-name">{{ att.subjectName || att.subject?.subjectName }}</span>
                <span class="subject-code">({{ att.subjectCode || att.subject?.subjectCode }})</span>
              </div>
              <div class="progress-row">
                <div class="progress-bar">
                  <div class="progress-fill" 
                       [style.width.%]="att.percentage" 
                       [class.danger]="att.percentage < 65"
                       [class.warning]="att.percentage >= 65 && att.percentage < 75"
                       [class.safe]="att.percentage >= 75">
                  </div>
                </div>
                <span class="percentage">{{ att.percentage | number:'1.0-0' }}%</span>
                <span class="classes-info">({{ att.present || att.presentCount }}/{{ att.total || att.totalClasses }})</span>
              </div>
              <div *ngIf="att.percentage < 75" class="risk-warning">
                ⚠️ Below required attendance
              </div>
            </div>
          </div>
          <p *ngIf="!analytics?.attendance?.length" class="empty-message">No attendance records found.</p>
        </div>

        <!-- Marks Section -->
        <div class="section card">
          <h3>📝 Marks Overview</h3>
          <div *ngIf="analytics?.marks?.length" class="marks-table">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Exam Type</th>
                  <th>Marks</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let mark of analytics.marks">
                  <td>{{ mark.subjectName || mark.subject?.subjectName }}</td>
                  <td>{{ mark.examType }}</td>
                  <td>{{ mark.marksObtained }} / {{ mark.maxMarks }}</td>
                  <td>
                    <span class="performance-badge" 
                          [class.excellent]="(mark.marksObtained/mark.maxMarks)*100 >= 80"
                          [class.good]="(mark.marksObtained/mark.maxMarks)*100 >= 60 && (mark.marksObtained/mark.maxMarks)*100 < 80"
                          [class.poor]="(mark.marksObtained/mark.maxMarks)*100 < 60">
                      {{ ((mark.marksObtained/mark.maxMarks)*100) | number:'1.0-0' }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p *ngIf="!analytics?.marks?.length" class="empty-message">No marks recorded yet.</p>
        </div>

        <!-- Recent Submissions -->
        <div class="section card">
          <h3>📋 Recent Submissions</h3>
          <div *ngIf="analytics?.submissions?.length" class="submissions-list">
            <div *ngFor="let sub of analytics.submissions" class="submission-item">
              <div class="submission-info">
                <span class="assignment-title">{{ sub.assignmentTitle || sub.assignment?.title }}</span>
                <span class="submission-date">Submitted: {{ sub.submittedAt | date:'short' }}</span>
              </div>
              <div class="submission-status">
                <span *ngIf="sub.grade" class="grade-badge">Grade: {{ sub.grade }}/{{ sub.maxGrade || 100 }}</span>
                <span *ngIf="!sub.grade" class="pending-badge">Pending Review</span>
              </div>
            </div>
          </div>
          <p *ngIf="!analytics?.submissions?.length" class="empty-message">No assignment submissions yet.</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: #f1f5f9; min-height: 100vh; }
    .page-header { margin-bottom: 1.5rem; }
    .back-link { color: #6366f1; text-decoration: none; font-size: 0.875rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #1e293b; margin: 0.5rem 0 0; }
    .card { background: white; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

    .loading-state { text-align: center; padding: 3rem; color: #64748b; }
    .spinner { width: 40px; height: 40px; margin: 0 auto 1rem; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-state { text-align: center; padding: 2rem; }
    .error-state h3 { color: #dc2626; margin-bottom: 0.5rem; }

    .profile-card { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
    .profile-avatar { width: 80px; height: 80px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; }
    .profile-info h2 { margin: 0 0 0.25rem; color: #1e293b; }
    .roll-number { font-weight: 600; color: #475569; margin: 0; }
    .email { color: #64748b; margin: 0.25rem 0 0; font-size: 0.875rem; }
    .status-indicator { margin-left: auto; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600; font-size: 0.875rem; }
    .status-indicator.at-risk { background: #fee2e2; color: #991b1b; }
    .status-indicator.warning { background: #fef3c7; color: #92400e; }
    .status-indicator.safe { background: #d1fae5; color: #065f46; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: white; border-radius: 12px; padding: 1.25rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-bottom: 3px solid #e2e8f0; }
    .stat-card.success { border-bottom-color: #10b981; }
    .stat-card.warning { border-bottom-color: #f59e0b; }
    .stat-card.danger { border-bottom-color: #ef4444; }
    .stat-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }

    .section h3 { margin: 0 0 1rem; color: #1e293b; font-size: 1.1rem; }

    .subject-list { display: flex; flex-direction: column; gap: 1rem; }
    .subject-item { padding: 1rem; background: #f8fafc; border-radius: 10px; }
    .subject-header { margin-bottom: 0.5rem; }
    .subject-name { font-weight: 600; color: #1e293b; }
    .subject-code { color: #64748b; font-size: 0.875rem; margin-left: 0.25rem; }

    .progress-row { display: flex; align-items: center; gap: 0.75rem; }
    .progress-bar { flex: 1; height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 5px; transition: width 0.3s; }
    .progress-fill.safe { background: linear-gradient(90deg, #10b981, #34d399); }
    .progress-fill.warning { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .progress-fill.danger { background: linear-gradient(90deg, #ef4444, #f87171); }
    .percentage { font-weight: 700; min-width: 45px; }
    .classes-info { color: #64748b; font-size: 0.875rem; }
    .risk-warning { color: #dc2626; font-size: 0.75rem; margin-top: 0.5rem; }

    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; color: #64748b; font-size: 0.75rem; text-transform: uppercase; }
    .performance-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem; }
    .performance-badge.excellent { background: #d1fae5; color: #065f46; }
    .performance-badge.good { background: #fef3c7; color: #92400e; }
    .performance-badge.poor { background: #fee2e2; color: #991b1b; }

    .submissions-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .submission-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 8px; }
    .assignment-title { font-weight: 600; color: #1e293b; }
    .submission-date { font-size: 0.75rem; color: #64748b; display: block; margin-top: 0.25rem; }
    .grade-badge { background: #d1fae5; color: #065f46; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem; }
    .pending-badge { background: #fef3c7; color: #92400e; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem; }

    .empty-message { text-align: center; color: #94a3b8; padding: 1.5rem; }
    .btn { display: inline-block; padding: 0.75rem 1.5rem; background: #6366f1; color: white; border-radius: 8px; text-decoration: none; font-weight: 500; }

    @media (max-width: 768px) { 
      .stats-grid { grid-template-columns: repeat(2, 1fr); } 
      .profile-card { flex-direction: column; text-align: center; }
      .status-indicator { margin-left: 0; }
    }
  `]
})
export class StudentDetailComponent implements OnInit {
    student: any = null;
    analytics: any = null;
    loading = true;
    error: string | null = null;

    constructor(private route: ActivatedRoute, private apiService: ApiService) { }

    ngOnInit(): void {
        const studentId = this.route.snapshot.paramMap.get('id');
        if (studentId) {
            this.loadStudentData(studentId);
        } else {
            this.error = 'Student ID not found';
            this.loading = false;
        }
    }

    loadStudentData(studentId: string): void {
        this.apiService.getStudentAnalytics(studentId).subscribe({
            next: (res: any) => {
                this.student = res.student;
                this.analytics = res;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading student data:', err);
                this.error = err.error?.message || 'Failed to load student data. Please try again.';
                this.loading = false;
            }
        });
    }

    getInitials(name: string): string {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    get overallAttendance(): number {
        if (!this.analytics?.attendance?.length) return 0;
        const total = this.analytics.attendance.reduce((sum: number, a: any) => {
            return sum + (a.percentage || 0);
        }, 0);
        return Math.round(total / this.analytics.attendance.length);
    }

    get isAtRisk(): boolean {
        return this.overallAttendance < 65;
    }

    get isWarning(): boolean {
        return this.overallAttendance >= 65 && this.overallAttendance < 75;
    }

    get isSafe(): boolean {
        return this.overallAttendance >= 75;
    }

    get overallStatus(): string {
        if (this.isAtRisk) return '⚠️ At Risk';
        if (this.isWarning) return '⚡ Warning';
        return '✅ Safe';
    }
}
