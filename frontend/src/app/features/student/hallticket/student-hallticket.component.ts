import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-hallticket',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <aside class="sidebar">
        <div class="sidebar-header"><h2>🎓 College Manager</h2><p>Student Portal</p></div>
        <nav class="sidebar-nav">
          <a routerLink="/student/dashboard" class="nav-item">📊 Dashboard</a>
          <a routerLink="/student/assignments" class="nav-item">📝 Assignments</a>
          <a routerLink="/student/fees" class="nav-item">💰 Fees</a>
          <a routerLink="/student/results" class="nav-item">📋 Results</a>
          <a routerLink="/student/hallticket" class="nav-item active">🎫 Hall Ticket</a>
          <a routerLink="/student/analytics" class="nav-item">📈 Analytics</a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info"><span>{{ student?.name || user?.name }}</span><small>{{ student?.rollNumber || user?.rollNumber }} | Sem {{ student?.semester || user?.semester }}</small></div>
          <button (click)="logout()" class="btn-logout">Logout</button>
        </div>
      </aside>

      <main class="main-content">
        <header class="page-header">
          <div>
            <h1>🎫 Hall Ticket</h1>
            <p>View and download your exam hall ticket</p>
          </div>
        </header>

        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Loading hall ticket...</p>
        </div>

        <div *ngIf="!loading && !hallTicket && !error" class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>No Active Exam Session</h3>
          <p>Hall tickets will be available before exams begin.</p>
          <p class="info-text">Please check back later or contact the examination cell for more information.</p>
        </div>

        <div *ngIf="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Not Eligible</h3>
          <p>{{ errorMessage }}</p>
          <div class="reason" *ngIf="ineligibleReason">
            <strong>Reason:</strong> {{ getReasonText(ineligibleReason) }}
          </div>
          <p class="help-text">Please contact the administration to resolve this issue.</p>
        </div>

        <div *ngIf="hallTicket && !error" class="content">
          <!-- Hall Ticket Preview -->
          <div class="hallticket-card" id="hallticket">
            <div class="college-header">
              <h2>🎓 Smart College</h2>
              <p>University Affiliated | Established 1990</p>
            </div>

            <div class="ticket-title">
              <h3>EXAMINATION HALL TICKET</h3>
              <span class="exam-name">{{ examSession?.name }}</span>
              <span class="stream-badge" [class.bca]="student?.stream === 'BCA'" [class.bba]="student?.stream === 'BBA'">{{ student?.stream }}</span>
            </div>

            <div class="student-section">
              <div class="photo-placeholder">
                <span *ngIf="!student?.photo">{{ student?.name?.charAt(0) || '?' }}</span>
                <img *ngIf="student?.photo" [src]="student.photo" alt="Student Photo">
              </div>
              <div class="student-details">
                <table>
                  <tr><td>Hall Ticket No:</td><td><strong>{{ hallTicket.hallTicketNumber }}</strong></td></tr>
                  <tr><td>Name:</td><td><strong>{{ student?.name }}</strong></td></tr>
                  <tr><td>Roll Number:</td><td>{{ student?.rollNumber }}</td></tr>
                  <tr><td>Stream:</td><td>{{ student?.stream }}</td></tr>
                  <tr><td>Semester:</td><td>{{ student?.semester }}</td></tr>
                  <tr><td>Academic Year:</td><td>{{ examSession?.academicYear }}</td></tr>
                </table>
              </div>
              <div class="qr-section">
                <div class="qr-placeholder">
                  <span>QR</span>
                </div>
                <small>Scan to verify</small>
              </div>
            </div>

            <div class="exam-schedule">
              <h4>📅 Examination Schedule</h4>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Time</th>
                    <th>Venue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let exam of examSession?.examDates">
                    <td>{{ formatDate(exam.date) }}</td>
                    <td>{{ exam.subjectName }}</td>
                    <td>{{ exam.subjectCode }}</td>
                    <td>{{ exam.time }}</td>
                    <td>{{ exam.venue }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="instructions">
              <h4>📋 Important Instructions</h4>
              <ul>
                <li *ngFor="let inst of examSession?.instructions">{{ inst }}</li>
              </ul>
            </div>

            <div class="footer-section">
              <div class="signature">
                <div class="sig-line"></div>
                <span>Controller of Examination</span>
              </div>
              <div class="signature">
                <div class="sig-line"></div>
                <span>Student Signature</span>
              </div>
            </div>
          </div>

          <div class="actions">
            <button class="btn btn-primary" (click)="downloadHallTicket()">
              📥 Download PDF
            </button>
            <button class="btn btn-secondary" (click)="printHallTicket()">
              🖨️ Print
            </button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .page-container { display: flex; min-height: 100vh; background: #f8fafc; }
    
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
    .btn-logout { width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 6px; cursor: pointer; margin-top: 0.5rem; }
    .btn-logout:hover { background: rgba(255,255,255,0.2); }

    .main-content { margin-left: 260px; flex: 1; padding: 2rem; max-width: 900px; }
    
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { margin: 0 0 0.25rem; color: #1e293b; font-size: 1.75rem; }
    .page-header p { margin: 0; color: #64748b; }

    .loading { text-align: center; padding: 4rem; color: #64748b; }
    .spinner { width: 48px; height: 48px; margin: 0 auto 1rem; border: 4px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state, .error-state { text-align: center; padding: 4rem; background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .empty-icon, .error-icon { font-size: 4rem; margin-bottom: 1rem; }
    .empty-state h3, .error-state h3 { margin: 0 0 0.5rem; color: #1e293b; }
    .empty-state p, .error-state p { margin: 0; color: #64748b; }
    .info-text { margin-top: 1rem !important; font-size: 0.875rem; }
    .error-state { border: 2px solid #fee2e2; background: #fef2f2; }
    .reason { margin-top: 1rem; padding: 1rem; background: #fee2e2; border-radius: 8px; color: #dc2626; }
    .help-text { margin-top: 1rem !important; font-size: 0.875rem; color: #64748b; }

    .hallticket-card { background: white; border: 2px solid #1e293b; padding: 2rem; margin-bottom: 1.5rem; border-radius: 8px; }
    .college-header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 1rem; margin-bottom: 1rem; }
    .college-header h2 { margin: 0; font-size: 1.5rem; }
    .college-header p { margin: 0.25rem 0 0; color: #64748b; font-size: 0.875rem; }

    .ticket-title { text-align: center; margin-bottom: 1.5rem; }
    .ticket-title h3 { margin: 0; font-size: 1.25rem; text-decoration: underline; }
    .exam-name { display: inline-block; margin-top: 0.5rem; background: #1e293b; color: white; padding: 0.25rem 1rem; border-radius: 4px; font-size: 0.875rem; }
    .stream-badge { display: inline-block; margin-left: 0.5rem; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .stream-badge.bca { background: #dbeafe; color: #1d4ed8; }
    .stream-badge.bba { background: #fce7f3; color: #be185d; }

    .student-section { display: grid; grid-template-columns: 100px 1fr 80px; gap: 1.5rem; margin-bottom: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: 8px; }
    .photo-placeholder { width: 100px; height: 120px; border: 2px solid #1e293b; display: flex; align-items: center; justify-content: center; font-size: 2rem; background: linear-gradient(135deg, #059669, #047857); color: white; font-weight: 700; border-radius: 4px; }
    .photo-placeholder img { width: 100%; height: 100%; object-fit: cover; border-radius: 2px; }
    .student-details table { width: 100%; font-size: 0.875rem; }
    .student-details td { padding: 0.25rem 0.5rem; }
    .student-details td:first-child { color: #64748b; width: 120px; }
    .qr-section { text-align: center; }
    .qr-placeholder { width: 80px; height: 80px; border: 2px solid #1e293b; display: flex; align-items: center; justify-content: center; font-weight: bold; background: white; border-radius: 4px; }
    .qr-section small { display: block; margin-top: 0.25rem; color: #64748b; font-size: 0.7rem; }

    .exam-schedule { margin-bottom: 1.5rem; }
    .exam-schedule h4 { margin: 0 0 0.75rem; font-size: 1rem; }
    .exam-schedule table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .exam-schedule th, .exam-schedule td { padding: 0.75rem; border: 1px solid #e2e8f0; text-align: left; }
    .exam-schedule th { background: #1e293b; color: white; font-size: 0.75rem; }
    .exam-schedule tr:nth-child(even) { background: #f8fafc; }

    .instructions { margin-bottom: 1.5rem; padding: 1rem; background: #fef3c7; border-radius: 8px; }
    .instructions h4 { margin: 0 0 0.5rem; font-size: 0.875rem; color: #92400e; }
    .instructions ul { margin: 0; padding-left: 1.25rem; font-size: 0.75rem; color: #78350f; }
    .instructions li { margin-bottom: 0.25rem; }

    .footer-section { display: flex; justify-content: space-between; padding-top: 2rem; }
    .signature { text-align: center; }
    .sig-line { width: 150px; height: 1px; background: #1e293b; margin-bottom: 0.5rem; }
    .signature span { font-size: 0.75rem; color: #64748b; }

    .actions { display: flex; gap: 1rem; justify-content: center; }
    .btn { padding: 0.875rem 2rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 1rem; }
    .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); }
    .btn-secondary { background: #e2e8f0; color: #475569; }
    .btn-secondary:hover { background: #cbd5e1; }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main-content { margin-left: 0; padding: 1rem; }
      .student-section { grid-template-columns: 1fr; text-align: center; }
      .photo-placeholder { margin: 0 auto; }
    }

    @media print {
      .sidebar, .page-header, .actions { display: none !important; }
      .main-content { margin-left: 0; padding: 0; }
      .hallticket-card { border: 2px solid black; box-shadow: none; }
    }
  `]
})
export class StudentHallticketComponent implements OnInit {
  loading = true;
  error = false;
  errorMessage = '';
  ineligibleReason = '';
  hallTicket: any = null;
  examSession: any = null;
  student: any = null;
  user: any = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadHallTicket();
  }

  loadHallTicket(): void {
    this.apiService.getMyHallTicket().subscribe({
      next: (res) => {
        this.hallTicket = res.hallTicket;
        this.examSession = res.hallTicket?.examSessionId;
        this.student = res.hallTicket?.studentId;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 403) {
          this.error = true;
          this.errorMessage = err.error?.message || 'You are not eligible for this exam.';
          this.ineligibleReason = err.error?.reason || '';
          this.hallTicket = err.error?.hallTicket;
        }
      }
    });
  }

  getReasonText(reason: string): string {
    switch (reason) {
      case 'fees_pending': return 'Fee payment is pending. Please clear your dues.';
      case 'attendance_shortage': return 'Your attendance is below 75%.';
      case 'disciplinary': return 'Disciplinary action pending.';
      default: return reason;
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  downloadHallTicket(): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the hall ticket');
      return;
    }

    const examScheduleRows = this.examSession?.examDates?.map((exam: any) => `
            <tr>
                <td>${this.formatDate(exam.date)}</td>
                <td>${exam.subjectName}</td>
                <td>${exam.subjectCode}</td>
                <td>${exam.time}</td>
                <td>${exam.venue}</td>
            </tr>
        `).join('') || '';

    const instructions = this.examSession?.instructions?.map((inst: string) => `<li>${inst}</li>`).join('') || '';

    const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Hall Ticket - ${this.hallTicket.hallTicketNumber}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; }
                    .hall-ticket { border: 2px solid #000; padding: 20px; max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
                    .header h1 { font-size: 24px; margin-bottom: 5px; }
                    .header p { color: #666; font-size: 12px; }
                    .title { text-align: center; margin-bottom: 20px; }
                    .title h2 { font-size: 18px; text-decoration: underline; margin-bottom: 10px; }
                    .exam-badge { background: #1e293b; color: white; padding: 5px 15px; display: inline-block; border-radius: 4px; font-size: 12px; }
                    .student-info { display: flex; gap: 20px; margin-bottom: 20px; padding: 15px; background: #f5f5f5; }
                    .photo { width: 100px; height: 120px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: bold; background: #059669; color: white; }
                    .details { flex: 1; }
                    .details table { width: 100%; font-size: 14px; }
                    .details td { padding: 5px; }
                    .details td:first-child { color: #666; width: 130px; }
                    .schedule { margin-bottom: 20px; }
                    .schedule h3 { font-size: 14px; margin-bottom: 10px; }
                    .schedule table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    .schedule th, .schedule td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .schedule th { background: #1e293b; color: white; }
                    .instructions { background: #fef3c7; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                    .instructions h3 { font-size: 14px; color: #92400e; margin-bottom: 10px; }
                    .instructions ul { margin-left: 20px; font-size: 11px; color: #78350f; }
                    .instructions li { margin-bottom: 3px; }
                    .signatures { display: flex; justify-content: space-between; padding-top: 30px; }
                    .sig-box { text-align: center; }
                    .sig-line { width: 150px; border-top: 1px solid #000; margin-bottom: 5px; }
                    .sig-box span { font-size: 11px; color: #666; }
                </style>
            </head>
            <body>
                <div class="hall-ticket">
                    <div class="header">
                        <h1>🎓 Smart College</h1>
                        <p>University Affiliated | Established 1990</p>
                    </div>
                    <div class="title">
                        <h2>EXAMINATION HALL TICKET</h2>
                        <span class="exam-badge">${this.examSession?.name} | ${this.student?.stream}</span>
                    </div>
                    <div class="student-info">
                        <div class="photo">${this.student?.name?.charAt(0) || '?'}</div>
                        <div class="details">
                            <table>
                                <tr><td>Hall Ticket No:</td><td><strong>${this.hallTicket.hallTicketNumber}</strong></td></tr>
                                <tr><td>Name:</td><td><strong>${this.student?.name}</strong></td></tr>
                                <tr><td>Roll Number:</td><td>${this.student?.rollNumber}</td></tr>
                                <tr><td>Stream:</td><td>${this.student?.stream}</td></tr>
                                <tr><td>Semester:</td><td>${this.student?.semester}</td></tr>
                                <tr><td>Academic Year:</td><td>${this.examSession?.academicYear}</td></tr>
                            </table>
                        </div>
                    </div>
                    <div class="schedule">
                        <h3>📅 Examination Schedule</h3>
                        <table>
                            <thead>
                                <tr><th>Date</th><th>Subject</th><th>Code</th><th>Time</th><th>Venue</th></tr>
                            </thead>
                            <tbody>${examScheduleRows}</tbody>
                        </table>
                    </div>
                    <div class="instructions">
                        <h3>📋 Important Instructions</h3>
                        <ul>${instructions}</ul>
                    </div>
                    <div class="signatures">
                        <div class="sig-box"><div class="sig-line"></div><span>Controller of Examination</span></div>
                        <div class="sig-box"><div class="sig-line"></div><span>Student Signature</span></div>
                    </div>
                </div>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;

    printWindow.document.write(content);
    printWindow.document.close();
  }

  printHallTicket(): void {
    window.print();
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}
