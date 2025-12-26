import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-results',
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
          <a routerLink="/student/results" class="nav-item active">📋 Results</a>
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
          <div>
            <h1>📋 My Results</h1>
            <p>View your semester results and CGPA</p>
          </div>
          <div class="stream-badge" [class.bca]="user?.stream === 'BCA'" [class.bba]="user?.stream === 'BBA'">{{ user?.stream }}</div>
        </header>

        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Loading results...</p>
        </div>

        <div *ngIf="!loading" class="content">
          <!-- CGPA Card -->
          <div class="cgpa-card" *ngIf="results.length">
            <div class="cgpa-main">
              <div class="cgpa-circle">
                <span class="cgpa-value">{{ cgpa }}</span>
                <span class="cgpa-label">CGPA</span>
              </div>
            </div>
            <div class="cgpa-stats">
              <div class="stat-item">
                <span class="stat-value">{{ results.length }}</span>
                <span class="stat-label">Semesters</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ getTotalCredits() }}</span>
                <span class="stat-label">Total Credits</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ getOverallPercentage() }}%</span>
                <span class="stat-label">Overall %</span>
              </div>
            </div>
          </div>

          <!-- Result Cards -->
          <div class="results-list">
            <div *ngFor="let result of results" class="result-card" [class.pass]="result.overallStatus === 'pass'" [class.fail]="result.overallStatus === 'fail'" [class.atkt]="result.overallStatus === 'atkt'">
              <div class="result-header">
                <div class="header-left">
                  <h3>Semester {{ result.semester }}</h3>
                  <span class="academic-year">{{ result.academicYear }}</span>
                </div>
                <div class="header-right">
                  <span class="status-badge" [class.pass]="result.overallStatus === 'pass'" [class.fail]="result.overallStatus === 'fail'" [class.atkt]="result.overallStatus === 'atkt'">
                    {{ result.overallStatus === 'pass' ? '✓ Passed' : result.overallStatus === 'atkt' ? '⚠️ ATKT' : '✗ Failed' }}
                  </span>
                  <div class="sgpa-display">
                    <span class="sgpa-value">{{ result.sgpa }}</span>
                    <span class="sgpa-label">SGPA</span>
                  </div>
                </div>
              </div>

              <table class="subjects-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Credits</th>
                    <th>Internal</th>
                    <th>External</th>
                    <th>Total</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let sub of result.subjects" [class.failed]="sub.status === 'fail'">
                    <td>{{ sub.subjectName }}</td>
                    <td>{{ sub.subjectCode }}</td>
                    <td>{{ sub.credits }}</td>
                    <td>{{ sub.internalMarks }}/40</td>
                    <td>{{ sub.externalMarks }}/60</td>
                    <td><strong>{{ sub.totalMarks }}/100</strong></td>
                    <td>
                      <span class="grade" [class.fail]="sub.grade === 'F'" [class.excellent]="sub.grade === 'A+' || sub.grade === 'A'">{{ sub.grade }}</span>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="5"><strong>Total</strong></td>
                    <td><strong>{{ getTotalMarks(result) }}/{{ result.subjects.length * 100 }}</strong></td>
                    <td><strong>{{ result.percentage }}%</strong></td>
                  </tr>
                </tfoot>
              </table>

              <div class="result-footer">
                <div class="footer-stats">
                  <span class="credits-info">Credits: {{ result.earnedCredits }}/{{ result.totalCredits }}</span>
                  <span *ngIf="result.atktSubjects > 0" class="atkt-info">ATKT Subjects: {{ result.atktSubjects }}</span>
                </div>
                <button class="btn btn-download" (click)="downloadMarksheet(result)">
                  📄 Download Marksheet
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="!results.length" class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>No Results Available</h3>
            <p>Your semester results will appear here once they are published by the administration.</p>
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

    .main-content { margin-left: 260px; flex: 1; padding: 2rem; }
    
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-header h1 { margin: 0 0 0.25rem; color: #1e293b; font-size: 1.75rem; }
    .page-header p { margin: 0; color: #64748b; }
    .stream-badge { padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600; font-size: 0.875rem; }
    .stream-badge.bca { background: #dbeafe; color: #1d4ed8; }
    .stream-badge.bba { background: #fce7f3; color: #be185d; }

    .loading { text-align: center; padding: 4rem; color: #64748b; }
    .spinner { width: 48px; height: 48px; margin: 0 auto 1rem; border: 4px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* CGPA Card */
    .cgpa-card { display: flex; align-items: center; gap: 3rem; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 2rem; border-radius: 16px; margin-bottom: 2rem; }
    .cgpa-circle { width: 120px; height: 120px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 4px solid rgba(255,255,255,0.3); }
    .cgpa-value { font-size: 2.5rem; font-weight: 700; }
    .cgpa-label { font-size: 0.75rem; opacity: 0.9; }
    .cgpa-stats { display: flex; gap: 3rem; }
    .stat-item { text-align: center; }
    .stat-value { display: block; font-size: 1.75rem; font-weight: 700; }
    .stat-label { font-size: 0.75rem; opacity: 0.9; }

    /* Result Cards */
    .results-list { display: flex; flex-direction: column; gap: 1.5rem; }
    .result-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #e2e8f0; overflow: hidden; }
    .result-card.pass { border-left-color: #10b981; }
    .result-card.fail { border-left-color: #ef4444; }
    .result-card.atkt { border-left-color: #f59e0b; }

    .result-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0; }
    .header-left h3 { margin: 0 0 0.25rem; color: #1e293b; }
    .academic-year { background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
    .header-right { display: flex; align-items: center; gap: 1rem; }
    .sgpa-display { text-align: center; background: #f8fafc; padding: 0.5rem 1rem; border-radius: 8px; }
    .sgpa-value { display: block; font-size: 1.25rem; font-weight: 700; color: #059669; }
    .sgpa-label { font-size: 0.625rem; color: #64748b; text-transform: uppercase; }

    .status-badge { padding: 0.375rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.pass { background: #d1fae5; color: #065f46; }
    .status-badge.fail { background: #fee2e2; color: #dc2626; }
    .status-badge.atkt { background: #fef3c7; color: #92400e; }

    .subjects-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.875rem; }
    .subjects-table th, .subjects-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .subjects-table th { background: #f8fafc; font-weight: 600; color: #64748b; font-size: 0.7rem; text-transform: uppercase; }
    .subjects-table tr.failed { background: #fef2f2; }
    .subjects-table tfoot td { background: #f8fafc; font-weight: 600; }

    .grade { display: inline-block; width: 36px; height: 36px; line-height: 36px; text-align: center; border-radius: 50%; background: #d1fae5; color: #065f46; font-weight: 600; font-size: 0.875rem; }
    .grade.fail { background: #fee2e2; color: #dc2626; }
    .grade.excellent { background: #10b981; color: white; }

    .result-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
    .footer-stats { display: flex; gap: 1.5rem; }
    .credits-info { color: #64748b; font-size: 0.875rem; }
    .atkt-info { color: #f59e0b; font-size: 0.875rem; font-weight: 500; }

    .btn-download { padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-download:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); }

    .empty-state { text-align: center; padding: 4rem; background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
    .empty-state h3 { margin: 0 0 0.5rem; color: #1e293b; }
    .empty-state p { margin: 0; color: #64748b; }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main-content { margin-left: 0; padding: 1rem; }
      .cgpa-card { flex-direction: column; text-align: center; }
      .cgpa-stats { gap: 2rem; }
      .subjects-table { font-size: 0.75rem; }
      .subjects-table th, .subjects-table td { padding: 0.5rem; }
      .result-footer { flex-direction: column; gap: 1rem; }
    }
  `]
})
export class StudentResultsComponent implements OnInit {
  loading = true;
  results: any[] = [];
  cgpa = 0;
  user: any = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadResults();
  }

  loadResults(): void {
    this.apiService.getMyResults().subscribe({
      next: (res) => {
        this.results = res.results || [];
        this.cgpa = res.cgpa || 0;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  getTotalMarks(result: any): number {
    return result.subjects.reduce((sum: number, s: any) => sum + s.totalMarks, 0);
  }

  getTotalCredits(): number {
    return this.results.reduce((sum, r) => sum + r.earnedCredits, 0);
  }

  getOverallPercentage(): number {
    if (!this.results.length) return 0;
    const total = this.results.reduce((sum, r) => sum + r.percentage, 0);
    return Math.round(total / this.results.length);
  }

  downloadMarksheet(result: any): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the marksheet');
      return;
    }

    const subjectRows = result.subjects.map((sub: any) => `
            <tr class="${sub.status === 'fail' ? 'failed' : ''}">
                <td>${sub.subjectCode}</td>
                <td>${sub.subjectName}</td>
                <td style="text-align:center">${sub.credits}</td>
                <td style="text-align:center">${sub.internalMarks}</td>
                <td style="text-align:center">${sub.externalMarks}</td>
                <td style="text-align:center"><strong>${sub.totalMarks}</strong></td>
                <td style="text-align:center"><strong>${sub.grade}</strong></td>
                <td style="text-align:center">${sub.gradePoints}</td>
                <td style="text-align:center">${sub.status === 'pass' ? '✓' : '✗'}</td>
            </tr>
        `).join('');

    const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Marksheet - Semester ${result.semester}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 30px; background: white; }
                    .marksheet { max-width: 800px; margin: 0 auto; border: 2px solid #1e293b; padding: 30px; }
                    .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 20px; margin-bottom: 20px; }
                    .header h1 { font-size: 24px; margin-bottom: 5px; }
                    .header p { color: #666; font-size: 12px; }
                    .title { text-align: center; margin-bottom: 25px; }
                    .title h2 { font-size: 18px; text-decoration: underline; margin-bottom: 10px; }
                    .badges { display: flex; justify-content: center; gap: 10px; }
                    .badge { padding: 5px 15px; border-radius: 4px; font-size: 12px; font-weight: 600; }
                    .badge.semester { background: #1e293b; color: white; }
                    .badge.stream { background: ${this.user?.stream === 'BCA' ? '#dbeafe' : '#fce7f3'}; color: ${this.user?.stream === 'BCA' ? '#1d4ed8' : '#be185d'}; }
                    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 25px; padding: 15px; background: #f8fafc; border-radius: 8px; }
                    .info-row { display: flex; font-size: 13px; }
                    .info-label { color: #666; width: 120px; }
                    .info-value { font-weight: 600; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px 8px; text-align: left; font-size: 12px; }
                    th { background: #1e293b; color: white; font-weight: 600; }
                    tr.failed { background: #fef2f2; }
                    tfoot td { background: #f8fafc; font-weight: 600; }
                    .result-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
                    .summary-box { text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px; }
                    .summary-value { font-size: 24px; font-weight: 700; color: #059669; }
                    .summary-label { font-size: 11px; color: #666; text-transform: uppercase; }
                    .status-box { padding: 15px; text-align: center; border-radius: 8px; margin-bottom: 25px; }
                    .status-box.pass { background: #d1fae5; color: #065f46; }
                    .status-box.fail { background: #fee2e2; color: #dc2626; }
                    .status-box.atkt { background: #fef3c7; color: #92400e; }
                    .status-text { font-size: 18px; font-weight: 700; }
                    .signatures { display: flex; justify-content: space-between; padding-top: 40px; margin-top: 20px; }
                    .sig-box { text-align: center; }
                    .sig-line { width: 150px; border-top: 1px solid #1e293b; margin-bottom: 5px; }
                    .sig-box span { font-size: 11px; color: #666; }
                    .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #666; }
                </style>
            </head>
            <body>
                <div class="marksheet">
                    <div class="header">
                        <h1>🎓 Smart College</h1>
                        <p>University Affiliated | Established 1990</p>
                    </div>
                    <div class="title">
                        <h2>STATEMENT OF MARKS</h2>
                        <div class="badges">
                            <span class="badge semester">Semester ${result.semester}</span>
                            <span class="badge stream">${this.user?.stream}</span>
                            <span class="badge semester">${result.academicYear}</span>
                        </div>
                    </div>
                    <div class="student-info">
                        <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${this.user?.name}</span></div>
                        <div class="info-row"><span class="info-label">Roll Number:</span><span class="info-value">${this.user?.rollNumber}</span></div>
                        <div class="info-row"><span class="info-label">Stream:</span><span class="info-value">${this.user?.stream}</span></div>
                        <div class="info-row"><span class="info-label">Semester:</span><span class="info-value">${result.semester}</span></div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Subject</th>
                                <th>Credits</th>
                                <th>Internal (40)</th>
                                <th>External (60)</th>
                                <th>Total (100)</th>
                                <th>Grade</th>
                                <th>GP</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>${subjectRows}</tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2"><strong>Grand Total</strong></td>
                                <td style="text-align:center"><strong>${result.totalCredits}</strong></td>
                                <td colspan="2"></td>
                                <td style="text-align:center"><strong>${this.getTotalMarks(result)}/${result.subjects.length * 100}</strong></td>
                                <td colspan="2" style="text-align:center"><strong>${result.percentage}%</strong></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                    <div class="result-summary">
                        <div class="summary-box"><div class="summary-value">${result.sgpa}</div><div class="summary-label">SGPA</div></div>
                        <div class="summary-box"><div class="summary-value">${result.percentage}%</div><div class="summary-label">Percentage</div></div>
                        <div class="summary-box"><div class="summary-value">${result.earnedCredits}/${result.totalCredits}</div><div class="summary-label">Credits Earned</div></div>
                        <div class="summary-box"><div class="summary-value">${result.atktSubjects}</div><div class="summary-label">Backlogs</div></div>
                    </div>
                    <div class="status-box ${result.overallStatus}">
                        <div class="status-text">${result.overallStatus === 'pass' ? '✓ PASSED' : result.overallStatus === 'atkt' ? '⚠️ ALLOWED TO KEEP TERM (ATKT)' : '✗ FAILED'}</div>
                    </div>
                    <div class="signatures">
                        <div class="sig-box"><div class="sig-line"></div><span>Controller of Examination</span></div>
                        <div class="sig-box"><div class="sig-line"></div><span>Principal</span></div>
                    </div>
                    <div class="footer">
                        This is a computer-generated marksheet. For official use, please obtain a hard copy from the examination cell.
                    </div>
                </div>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;

    printWindow.document.write(content);
    printWindow.document.close();
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}
