import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ApiService } from '../../core/services/api.service';

@Component({
    selector: 'app-teacher-analytics',
    standalone: true,
    imports: [CommonModule, RouterLink, BaseChartDirective],
    template: `
    <div class="analytics-container">
      <header class="page-header">
        <div>
          <a routerLink="/teacher/dashboard" class="back-link">← Back to Dashboard</a>
          <h1>📊 Class Analytics</h1>
          <p>Monitor your classes performance</p>
        </div>
      </header>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading analytics...</p>
      </div>

      <div *ngIf="!loading" class="content">
        <!-- Class Performance Cards -->
        <div class="section-header">
          <h2>📚 Your Classes</h2>
        </div>
        <div class="classes-grid">
          <div *ngFor="let c of classData" class="class-card">
            <div class="class-header">
              <span class="class-code">{{ c.subjectCode }}</span>
              <span class="semester-badge">Sem {{ c.semester }}</span>
            </div>
            <h4>{{ c.subjectName }}</h4>
            <div class="class-stats">
              <div class="stat">
                <span class="value">{{ c.studentCount }}</span>
                <span class="label">Students</span>
              </div>
              <div class="stat">
                <span class="value" [class.danger]="c.avgAttendance < 75" [class.safe]="c.avgAttendance >= 75">{{ c.avgAttendance }}%</span>
                <span class="label">Avg Attendance</span>
              </div>
              <div class="stat">
                <span class="value danger">{{ c.atRiskCount }}</span>
                <span class="label">At Risk</span>
              </div>
            </div>
            <div class="class-actions">
              <span class="info">{{ c.assignmentCount }} assignments • {{ c.pendingGrades }} pending</span>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
          <!-- Attendance Comparison Bar Chart -->
          <div class="chart-card">
            <h3>📅 Class Attendance Comparison</h3>
            <div class="chart-wrapper" *ngIf="attendanceChartData.labels?.length">
              <canvas baseChart
                [data]="attendanceChartData"
                [type]="'bar'"
                [options]="barChartOptions">
              </canvas>
            </div>
            <p *ngIf="!attendanceChartData.labels?.length" class="empty">No data available</p>
          </div>

          <!-- At-Risk Distribution Pie Chart -->
          <div class="chart-card">
            <h3>⚠️ At-Risk Distribution</h3>
            <div class="chart-wrapper" *ngIf="atRiskChartData.labels?.length">
              <canvas baseChart
                [data]="atRiskChartData"
                [type]="'pie'"
                [options]="pieChartOptions">
              </canvas>
            </div>
            <p *ngIf="!atRiskChartData.labels?.length" class="empty">No at-risk students 🎉</p>
          </div>
        </div>

        <!-- Submission Stats Table -->
        <div class="card full-width">
          <h3>📝 Assignment Submission Stats</h3>
          <table class="data-table" *ngIf="submissionStats.length">
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Subject</th>
                <th>Due Date</th>
                <th>Submitted</th>
                <th>Pending</th>
                <th>On-Time</th>
                <th>Late</th>
                <th>Avg Grade</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of submissionStats">
                <td><strong>{{ s.title }}</strong></td>
                <td>{{ s.subjectCode }}</td>
                <td>{{ s.dueDate | date:'shortDate' }}</td>
                <td>{{ s.submitted }}</td>
                <td><span [class.danger]="s.pending > 0">{{ s.pending }}</span></td>
                <td class="safe">{{ s.onTime }}</td>
                <td class="warning">{{ s.late }}</td>
                <td>{{ s.avgGrade || 'N/A' }}</td>
                <td>
                  <div class="progress-mini">
                    <div class="progress-fill" [style.width.%]="s.submissionRate" [class.safe]="s.submissionRate >= 80" [class.warning]="s.submissionRate >= 50 && s.submissionRate < 80" [class.danger]="s.submissionRate < 50"></div>
                  </div>
                  {{ s.submissionRate }}%
                </td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="!submissionStats.length" class="empty">No assignments created yet</p>
        </div>

        <!-- Attendance Heatmap -->
        <div class="chart-card full-width" *ngIf="heatmapData.labels?.length">
          <h3>🗓️ Weekly Attendance Pattern</h3>
          <div class="chart-wrapper large">
            <canvas baseChart
              [data]="heatmapData"
              [type]="'bar'"
              [options]="stackedBarOptions">
            </canvas>
          </div>
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

    .section-header { margin-bottom: 1rem; }
    .section-header h2 { color: #1e293b; font-size: 1.25rem; margin: 0; }

    .classes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .class-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .class-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .class-code { font-weight: 700; color: #6366f1; font-size: 0.875rem; }
    .semester-badge { background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .class-card h4 { margin: 0 0 1rem; color: #1e293b; font-size: 1rem; }
    .class-stats { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .class-stats .stat { text-align: center; flex: 1; }
    .class-stats .value { display: block; font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    .class-stats .value.safe { color: #10b981; }
    .class-stats .value.danger { color: #ef4444; }
    .class-stats .label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; }
    .class-actions .info { font-size: 0.75rem; color: #94a3b8; }

    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .chart-card, .card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .chart-card h3, .card h3 { margin: 0 0 1rem; color: #1e293b; font-size: 1.1rem; }
    .chart-wrapper { height: 280px; position: relative; }
    .chart-wrapper.large { height: 250px; }
    .full-width { grid-column: 1 / -1; margin-bottom: 1.5rem; }

    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; }
    .data-table th { background: #f8fafc; font-weight: 600; color: #64748b; font-size: 0.7rem; text-transform: uppercase; }
    .safe { color: #10b981; }
    .warning { color: #f59e0b; }
    .danger { color: #ef4444; }

    .progress-mini { width: 60px; height: 6px; background: #e2e8f0; border-radius: 3px; display: inline-block; margin-right: 0.5rem; vertical-align: middle; }
    .progress-fill { height: 100%; border-radius: 3px; }
    .progress-fill.safe { background: #10b981; }
    .progress-fill.warning { background: #f59e0b; }
    .progress-fill.danger { background: #ef4444; }

    .empty { text-align: center; color: #94a3b8; padding: 2rem; }

    @media (max-width: 1024px) { .charts-row { grid-template-columns: 1fr; } }
  `]
})
export class TeacherAnalyticsComponent implements OnInit {
    loading = true;
    classData: any[] = [];
    submissionStats: any[] = [];

    attendanceChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
    atRiskChartData: ChartConfiguration<'pie'>['data'] = { labels: [], datasets: [] };
    heatmapData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

    barChartOptions: ChartConfiguration<'bar'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 100 }, x: { grid: { display: false } } }
    };

    pieChartOptions: ChartConfiguration<'pie'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
    };

    stackedBarOptions: ChartConfiguration<'bar'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { x: { stacked: true }, y: { stacked: true, max: 100 } }
    };

    constructor(private apiService: ApiService) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        // Load class performance
        this.apiService.getTeacherClassPerformance().subscribe({
            next: (res) => {
                this.classData = res.classes || [];
                this.prepareClassCharts();
                this.loading = false;
            },
            error: () => this.loading = false
        });

        // Load submission stats
        this.apiService.getTeacherSubmissionStats().subscribe({
            next: (res) => this.submissionStats = res.assignments || []
        });

        // Load heatmap
        this.apiService.getTeacherAttendanceHeatmap().subscribe({
            next: (res) => {
                if (res.heatmap?.length) {
                    const days = res.heatmap.filter((d: any) => d.series?.length);
                    if (days.length) {
                        this.heatmapData = {
                            labels: days.map((d: any) => d.name),
                            datasets: [{
                                label: 'Attendance %',
                                data: days.map((d: any) => d.series[0]?.value || 0),
                                backgroundColor: '#6366f1'
                            }]
                        };
                    }
                }
            }
        });
    }

    prepareClassCharts(): void {
        if (this.classData.length) {
            // Attendance comparison
            this.attendanceChartData = {
                labels: this.classData.map(c => c.subjectCode),
                datasets: [{
                    data: this.classData.map(c => c.avgAttendance),
                    backgroundColor: this.classData.map(c =>
                        c.avgAttendance >= 75 ? '#10b981' : c.avgAttendance >= 60 ? '#f59e0b' : '#ef4444'
                    ),
                    borderRadius: 8
                }]
            };

            // At-risk distribution
            const totalAtRisk = this.classData.reduce((sum, c) => sum + c.atRiskCount, 0);
            if (totalAtRisk > 0) {
                this.atRiskChartData = {
                    labels: this.classData.map(c => c.subjectCode),
                    datasets: [{
                        data: this.classData.map(c => c.atRiskCount),
                        backgroundColor: ['#ef4444', '#f59e0b', '#eab308', '#f97316', '#dc2626']
                    }]
                };
            }
        }
    }
}
