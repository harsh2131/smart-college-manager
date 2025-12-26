import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { AuthService, User } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
    selector: 'app-student-analytics',
    standalone: true,
    imports: [CommonModule, RouterLink, BaseChartDirective],
    template: `
    <div class="analytics-container">
      <header class="page-header">
        <div>
          <a routerLink="/student/dashboard" class="back-link">← Back to Dashboard</a>
          <h1>📊 My Analytics</h1>
          <p>Track your academic performance</p>
        </div>
      </header>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading analytics...</p>
      </div>

      <div *ngIf="!loading && data" class="content">
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-value" [class.danger]="data.attendance?.overall < 75" [class.warning]="data.attendance?.overall >= 65 && data.attendance?.overall < 75" [class.safe]="data.attendance?.overall >= 75">
              {{ data.attendance?.overall || 0 }}%
            </div>
            <div class="stat-label">Overall Attendance</div>
            <div class="stat-status" *ngIf="data.attendance?.atRisk">⚠️ Below 75% threshold</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-value">{{ data.assignments?.completionRate || 0 }}%</div>
            <div class="stat-label">Assignment Completion</div>
            <div class="stat-sub">{{ data.assignments?.submitted || 0 }}/{{ data.assignments?.total || 0 }} submitted</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏰</div>
            <div class="stat-value">{{ data.assignments?.onTimeRate || 0 }}%</div>
            <div class="stat-label">On-Time Submissions</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">{{ data.assignments?.avgGrade || 'N/A' }}{{ data.assignments?.avgGrade ? '%' : '' }}</div>
            <div class="stat-label">Average Grade</div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
          <!-- Attendance by Subject Bar Chart -->
          <div class="chart-card">
            <h3>📚 Attendance by Subject</h3>
            <div class="chart-wrapper" *ngIf="attendanceChartData.labels?.length">
              <canvas baseChart
                [data]="attendanceChartData"
                [type]="'bar'"
                [options]="barChartOptions">
              </canvas>
            </div>
            <p *ngIf="!attendanceChartData.labels?.length" class="empty">No attendance data</p>
          </div>

          <!-- Assignment Status Pie Chart -->
          <div class="chart-card">
            <h3>📋 Assignment Status</h3>
            <div class="chart-wrapper" *ngIf="assignmentChartData.labels?.length">
              <canvas baseChart
                [data]="assignmentChartData"
                [type]="'doughnut'"
                [options]="pieChartOptions">
              </canvas>
            </div>
            <p *ngIf="!assignmentChartData.labels?.length" class="empty">No assignments yet</p>
          </div>
        </div>

        <!-- Attendance Trend Line Chart -->
        <div class="chart-card full-width" *ngIf="trendData.labels?.length">
          <h3>📈 Attendance Trend (Last 8 Weeks)</h3>
          <div class="chart-wrapper large">
            <canvas baseChart
              [data]="trendData"
              [type]="'line'"
              [options]="lineChartOptions">
            </canvas>
          </div>
        </div>

        <!-- Subject Details Table -->
        <div class="card full-width">
          <h3>📑 Subject-wise Breakdown</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Classes</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Attendance %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of data.attendance?.bySubject || []" [class.at-risk]="s.percentage < 75">
                <td><strong>{{ s.subjectCode }}</strong><br><small>{{ s.subjectName }}</small></td>
                <td>{{ s.totalClasses }}</td>
                <td>{{ s.present }}</td>
                <td>{{ s.absent }}</td>
                <td>
                  <div class="progress-mini">
                    <div class="progress-fill" [style.width.%]="s.percentage" [class.safe]="s.percentage >= 75" [class.warning]="s.percentage >= 65 && s.percentage < 75" [class.danger]="s.percentage < 65"></div>
                  </div>
                  {{ s.percentage }}%
                </td>
                <td>
                  <span class="status-badge" [class.safe]="s.percentage >= 75" [class.warning]="s.percentage >= 65 && s.percentage < 75" [class.danger]="s.percentage < 65">
                    {{ s.percentage >= 75 ? '✓ Safe' : s.percentage >= 65 ? '⚡ Warning' : '⚠️ At Risk' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .analytics-container { max-width: 1400px; margin: 0 auto; padding: 2rem; background: #f8fafc; min-height: 100vh; }
    .page-header { margin-bottom: 2rem; }
    .back-link { color: #6366f1; text-decoration: none; font-size: 0.875rem; }
    h1 { color: #1e293b; margin: 0.5rem 0 0.25rem; }
    .page-header p { color: #64748b; margin: 0; }

    .loading { text-align: center; padding: 4rem; color: #64748b; }
    .spinner { width: 48px; height: 48px; margin: 0 auto 1rem; border: 4px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: white; border-radius: 16px; padding: 1.5rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-icon { font-size: 2rem; margin-bottom: 0.5rem; }
    .stat-value { font-size: 2.5rem; font-weight: 700; color: #1e293b; }
    .stat-value.safe { color: #10b981; }
    .stat-value.warning { color: #f59e0b; }
    .stat-value.danger { color: #ef4444; }
    .stat-label { color: #64748b; font-size: 0.875rem; margin-top: 0.25rem; }
    .stat-sub { color: #94a3b8; font-size: 0.75rem; margin-top: 0.25rem; }
    .stat-status { color: #ef4444; font-size: 0.75rem; margin-top: 0.5rem; font-weight: 500; }

    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .chart-card, .card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .chart-card h3, .card h3 { margin: 0 0 1rem; color: #1e293b; font-size: 1.1rem; }
    .chart-wrapper { height: 280px; position: relative; }
    .chart-wrapper.large { height: 300px; }
    .full-width { grid-column: 1 / -1; margin-bottom: 1.5rem; }

    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .data-table th { background: #f8fafc; font-weight: 600; color: #64748b; font-size: 0.75rem; text-transform: uppercase; }
    .data-table tr.at-risk { background: #fef2f2; }
    .data-table small { color: #94a3b8; }

    .progress-mini { width: 80px; height: 8px; background: #e2e8f0; border-radius: 4px; display: inline-block; margin-right: 0.5rem; vertical-align: middle; }
    .progress-fill { height: 100%; border-radius: 4px; }
    .progress-fill.safe { background: #10b981; }
    .progress-fill.warning { background: #f59e0b; }
    .progress-fill.danger { background: #ef4444; }

    .status-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.safe { background: #d1fae5; color: #065f46; }
    .status-badge.warning { background: #fef3c7; color: #92400e; }
    .status-badge.danger { background: #fee2e2; color: #991b1b; }

    .empty { text-align: center; color: #94a3b8; padding: 2rem; }

    @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .charts-row { grid-template-columns: 1fr; } }
    @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr; } }
  `]
})
export class StudentAnalyticsComponent implements OnInit {
    user: User | null = null;
    data: any = null;
    loading = true;

    // Chart data
    attendanceChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
    assignmentChartData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };
    trendData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };

    barChartOptions: ChartConfiguration<'bar'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } },
            x: { grid: { display: false } }
        }
    };

    pieChartOptions: ChartConfiguration<'doughnut'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
    };

    lineChartOptions: ChartConfiguration<'line'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } }
        }
    };

    constructor(private authService: AuthService, private apiService: ApiService) { }

    ngOnInit(): void {
        this.user = this.authService.getCurrentUser();
        if (this.user) {
            this.loadAnalytics();
        }
    }

    loadAnalytics(): void {
        this.apiService.getStudentPerformance(this.user!._id).subscribe({
            next: (res) => {
                this.data = res;
                this.prepareCharts();
                this.loading = false;
            },
            error: () => this.loading = false
        });

        // Load trend data
        this.apiService.getStudentAttendanceTrend(this.user!._id).subscribe({
            next: (res) => {
                if (res.trend?.length) {
                    this.trendData = {
                        labels: res.trend.map((t: any) => `Week ${t._id.split('-')[1]}`),
                        datasets: [{
                            data: res.trend.map((t: any) => t.percentage),
                            borderColor: '#6366f1',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    };
                }
            }
        });
    }

    prepareCharts(): void {
        // Attendance bar chart
        if (this.data.attendance?.bySubject?.length) {
            const subjects = this.data.attendance.bySubject;
            this.attendanceChartData = {
                labels: subjects.map((s: any) => s.subjectCode),
                datasets: [{
                    data: subjects.map((s: any) => s.percentage),
                    backgroundColor: subjects.map((s: any) =>
                        s.percentage >= 75 ? '#10b981' : s.percentage >= 65 ? '#f59e0b' : '#ef4444'
                    ),
                    borderRadius: 8
                }]
            };
        }

        // Assignment pie chart
        if (this.data.assignments) {
            const { submitted, pending } = this.data.assignments;
            if (submitted > 0 || pending > 0) {
                this.assignmentChartData = {
                    labels: ['Submitted', 'Pending'],
                    datasets: [{
                        data: [submitted, pending],
                        backgroundColor: ['#10b981', '#f59e0b'],
                        borderWidth: 0
                    }]
                };
            }
        }
    }
}
