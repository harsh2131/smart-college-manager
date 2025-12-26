import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ApiService } from '../../core/services/api.service';

@Component({
    selector: 'app-admin-analytics',
    standalone: true,
    imports: [CommonModule, RouterLink, BaseChartDirective],
    template: `
    <div class="analytics-container">
      <header class="page-header">
        <h1>🏛️ HOD Dashboard</h1>
        <p>Department overview and academic performance analytics</p>
      </header>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading analytics...</p>
      </div>

      <div *ngIf="!loading && stats" class="content">
        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card blue">
            <div class="kpi-icon">👨‍🎓</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ stats.totalStudents }}</div>
              <div class="kpi-label">Total Students</div>
            </div>
          </div>
          <div class="kpi-card green">
            <div class="kpi-icon">👨‍🏫</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ stats.totalTeachers }}</div>
              <div class="kpi-label">Teachers</div>
            </div>
          </div>
          <div class="kpi-card purple">
            <div class="kpi-icon">📚</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ stats.totalSubjects }}</div>
              <div class="kpi-label">Subjects</div>
            </div>
          </div>
          <div class="kpi-card orange">
            <div class="kpi-icon">📝</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ stats.totalAssignments }}</div>
              <div class="kpi-label">Assignments</div>
            </div>
          </div>
          <div class="kpi-card" [class.safe]="stats.overallAttendance >= 75" [class.danger]="stats.overallAttendance < 75">
            <div class="kpi-icon">📅</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ stats.overallAttendance }}%</div>
              <div class="kpi-label">Overall Attendance</div>
            </div>
          </div>
          <div class="kpi-card danger">
            <div class="kpi-icon">⚠️</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ stats.atRiskStudents }}</div>
              <div class="kpi-label">At-Risk Students</div>
            </div>
          </div>
          <div class="kpi-card teal">
            <div class="kpi-icon">✅</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ stats.totalSubmissions }}</div>
              <div class="kpi-label">Submissions</div>
            </div>
          </div>
          <div class="kpi-card yellow">
            <div class="kpi-icon">⏳</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ stats.pendingGrades }}</div>
              <div class="kpi-label">Pending Grades</div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
          <!-- Semester Distribution Bar Chart -->
          <div class="chart-card">
            <h3>📊 Students by Semester</h3>
            <div class="chart-wrapper" *ngIf="semesterChartData.labels?.length">
              <canvas baseChart
                [data]="semesterChartData"
                [type]="'bar'"
                [options]="barChartOptions">
              </canvas>
            </div>
            <p *ngIf="!semesterChartData.labels?.length" class="empty">No data</p>
          </div>

          <!-- At-Risk by Semester Pie Chart -->
          <div class="chart-card">
            <h3>⚠️ At-Risk by Semester</h3>
            <div class="chart-wrapper" *ngIf="atRiskChartData.labels?.length">
              <canvas baseChart
                [data]="atRiskChartData"
                [type]="'doughnut'"
                [options]="pieChartOptions">
              </canvas>
            </div>
            <p *ngIf="!atRiskChartData.labels?.length" class="empty">No at-risk students 🎉</p>
          </div>
        </div>

        <!-- Teacher Performance Table -->
        <div class="card full-width">
          <h3>👨‍🏫 Teacher Performance</h3>
          <table class="data-table" *ngIf="teacherStats.length">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Department</th>
                <th>Subjects</th>
                <th>Classes Conducted</th>
                <th>Assignments</th>
                <th>Pending Reviews</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of teacherStats">
                <td>
                  <strong>{{ t.name }}</strong>
                  <small class="email">{{ t.email }}</small>
                </td>
                <td>{{ t.department }}</td>
                <td>{{ t.subjectCount }}</td>
                <td>{{ t.classesConducted }}</td>
                <td>{{ t.assignmentsCreated }}</td>
                <td>
                  <span [class.danger]="t.pendingReviews > 5" [class.warning]="t.pendingReviews > 0 && t.pendingReviews <= 5">
                    {{ t.pendingReviews }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="!teacherStats.length" class="empty">No teacher data</p>
        </div>

        <!-- At-Risk Students Table -->
        <div class="card full-width">
          <h3>⚠️ At-Risk Students (Below 75% Attendance)</h3>
          <div class="at-risk-summary" *ngIf="atRiskStudents.length">
            <div class="summary-cards">
              <div *ngFor="let sem of atRiskBySemester" class="sem-card">
                <span class="sem-count">{{ sem.count }}</span>
                <span class="sem-label">Semester {{ sem.semester }}</span>
              </div>
            </div>
          </div>
          <table class="data-table" *ngIf="atRiskStudents.length">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Semester</th>
                <th>Department</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of atRiskStudents.slice(0, 20)">
                <td><strong>{{ s.name }}</strong></td>
                <td>{{ s.email }}</td>
                <td>{{ s.semester }}</td>
                <td>{{ s.department }}</td>
                <td>
                  <span class="attendance-badge danger">{{ s.attendance }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
          <p class="showing-info" *ngIf="atRiskStudents.length > 20">Showing 20 of {{ atRiskStudents.length }} students</p>
          <p *ngIf="!atRiskStudents.length" class="empty success">✅ No at-risk students!</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .analytics-container { max-width: 1400px; margin: 0 auto; padding: 2rem; background: #f8fafc; min-height: 100vh; }
    .page-header { margin-bottom: 2rem; }
    h1 { color: #1e293b; margin: 0 0 0.25rem; }
    .page-header p { color: #64748b; margin: 0; }

    .loading { text-align: center; padding: 4rem; color: #64748b; }
    .spinner { width: 48px; height: 48px; margin: 0 auto 1rem; border: 4px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 2rem; }
    .kpi-card { background: white; border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #e2e8f0; }
    .kpi-card.blue { border-left-color: #3b82f6; }
    .kpi-card.green { border-left-color: #10b981; }
    .kpi-card.purple { border-left-color: #8b5cf6; }
    .kpi-card.orange { border-left-color: #f59e0b; }
    .kpi-card.teal { border-left-color: #14b8a6; }
    .kpi-card.yellow { border-left-color: #eab308; }
    .kpi-card.danger { border-left-color: #ef4444; }
    .kpi-card.safe { border-left-color: #10b981; }
    .kpi-icon { font-size: 2rem; }
    .kpi-value { font-size: 1.75rem; font-weight: 700; color: #1e293b; }
    .kpi-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .chart-card, .card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .chart-card h3, .card h3 { margin: 0 0 1rem; color: #1e293b; font-size: 1.1rem; }
    .chart-wrapper { height: 280px; position: relative; }
    .full-width { margin-bottom: 1.5rem; }

    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.875rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .data-table th { background: #f8fafc; font-weight: 600; color: #64748b; font-size: 0.7rem; text-transform: uppercase; }
    .data-table small.email { display: block; color: #94a3b8; font-size: 0.75rem; }
    .danger { color: #ef4444; }
    .warning { color: #f59e0b; }

    .at-risk-summary { margin-bottom: 1rem; }
    .summary-cards { display: flex; gap: 1rem; flex-wrap: wrap; }
    .sem-card { background: #fef2f2; border: 1px solid #fecaca; padding: 0.75rem 1rem; border-radius: 8px; text-align: center; }
    .sem-count { display: block; font-size: 1.5rem; font-weight: 700; color: #dc2626; }
    .sem-label { font-size: 0.75rem; color: #991b1b; }

    .attendance-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem; }
    .attendance-badge.danger { background: #fee2e2; color: #991b1b; }

    .empty { text-align: center; color: #94a3b8; padding: 2rem; }
    .empty.success { color: #10b981; }
    .showing-info { text-align: center; color: #64748b; font-size: 0.875rem; margin-top: 1rem; }

    @media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } .charts-row { grid-template-columns: 1fr; } }
    @media (max-width: 640px) { .kpi-grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminAnalyticsComponent implements OnInit {
    loading = true;
    stats: any = null;
    semesterDistribution: any[] = [];
    atRiskStudents: any[] = [];
    atRiskBySemester: any[] = [];
    teacherStats: any[] = [];

    semesterChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
    atRiskChartData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };

    barChartOptions: ChartConfiguration<'bar'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
    };

    pieChartOptions: ChartConfiguration<'doughnut'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
    };

    constructor(private apiService: ApiService) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        // Load overview
        this.apiService.getAdminOverview().subscribe({
            next: (res) => {
                this.stats = res.stats;
                this.semesterDistribution = res.semesterDistribution || [];
                this.prepareCharts();
                this.loading = false;
            },
            error: () => this.loading = false
        });

        // Load at-risk summary
        this.apiService.getAdminAtRiskSummary().subscribe({
            next: (res) => {
                this.atRiskStudents = res.students || [];
                this.atRiskBySemester = res.bySemester || [];
                this.prepareAtRiskChart();
            }
        });

        // Load teacher stats
        this.apiService.getAdminTeacherStats().subscribe({
            next: (res) => this.teacherStats = res.teachers || []
        });
    }

    prepareCharts(): void {
        if (this.semesterDistribution.length) {
            this.semesterChartData = {
                labels: this.semesterDistribution.map(s => s.name),
                datasets: [{
                    data: this.semesterDistribution.map(s => s.value),
                    backgroundColor: ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff', '#faf5ff'],
                    borderRadius: 8
                }]
            };
        }
    }

    prepareAtRiskChart(): void {
        if (this.atRiskBySemester.length) {
            this.atRiskChartData = {
                labels: this.atRiskBySemester.map(s => `Sem ${s.semester}`),
                datasets: [{
                    data: this.atRiskBySemester.map(s => s.count),
                    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#f59e0b', '#dc2626', '#c2410c'],
                    borderWidth: 0
                }]
            };
        }
    }
}
