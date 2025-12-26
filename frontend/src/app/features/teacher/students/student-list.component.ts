import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-student-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="page-container">
      <div class="page-header">
        <div><a routerLink="/teacher/dashboard" class="back-link">← Dashboard</a><h1>👥 Student Progress</h1></div>
      </div>

      <div class="filters card">
        <select class="input" [(ngModel)]="selectedSubject" (change)="loadStudents()">
          <option value="">-- Select Subject --</option>
          <option *ngFor="let s of subjects" [value]="s._id">{{ s.subjectCode }} - {{ s.subjectName }}</option>
        </select>
        <div class="filter-badges">
          <button [class.active]="filterRisk === 'all'" (click)="filterRisk = 'all'">All</button>
          <button [class.active]="filterRisk === 'at-risk'" (click)="filterRisk = 'at-risk'">⚠️ At-Risk</button>
          <button [class.active]="filterRisk === 'safe'" (click)="filterRisk = 'safe'">✓ Safe</button>
        </div>
      </div>

      <div *ngIf="analytics" class="stats-grid">
        <div class="stat-card"><div class="stat-value">{{ analytics.totalStudents }}</div><div class="stat-label">Total Students</div></div>
        <div class="stat-card green"><div class="stat-value">{{ analytics.avgAttendance }}%</div><div class="stat-label">Avg Attendance</div></div>
        <div class="stat-card red"><div class="stat-value">{{ analytics.atRiskCount }}</div><div class="stat-label">At-Risk</div></div>
        <div class="stat-card orange"><div class="stat-value">{{ analytics.warningCount }}</div><div class="stat-label">Warning</div></div>
      </div>

      <div class="students-table card">
        <table>
          <thead>
            <tr><th>Roll No</th><th>Name</th><th>Attendance</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of filteredStudents" [class.at-risk]="s.percentage < minRequired" [class.warning]="s.percentage >= minRequired - 10 && s.percentage < minRequired">
              <td><strong>{{ s.rollNumber }}</strong></td>
              <td>{{ s.name }}</td>
              <td>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="s.percentage" [class.danger]="s.percentage < minRequired - 10" [class.warning]="s.percentage >= minRequired - 10 && s.percentage < minRequired" [class.safe]="s.percentage >= minRequired"></div>
                </div>
                <span class="percentage">{{ s.percentage }}%</span>
                <span class="details">({{ s.present }}/{{ s.total }})</span>
              </td>
              <td>
                <span class="status-badge" [class.danger]="s.percentage < minRequired - 10" [class.warning]="s.percentage >= minRequired - 10 && s.percentage < minRequired" [class.safe]="s.percentage >= minRequired">
                  {{ getStatusLabel(s.percentage) }}
                </span>
              </td>
              <td><a [routerLink]="['/teacher/students', s._id]" class="btn btn-sm">View Details</a></td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!filteredStudents.length" class="empty-state">{{ selectedSubject ? 'No students found' : 'Select a subject to view students' }}</p>
      </div>
    </div>
  `,
    styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: #f1f5f9; min-height: 100vh; }
    .page-header { margin-bottom: 1.5rem; }
    .back-link { color: #6366f1; text-decoration: none; font-size: 0.875rem; }
    h1 { color: #1e293b; margin: 0.5rem 0 0; }
    .card { background: white; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .filters { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
    .filters .input { flex: 1; max-width: 300px; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; }
    .filter-badges { display: flex; gap: 0.5rem; }
    .filter-badges button { padding: 0.5rem 1rem; border: 2px solid #e2e8f0; background: white; border-radius: 20px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
    .filter-badges button.active { background: #6366f1; color: white; border-color: #6366f1; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: white; border-radius: 12px; padding: 1.25rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-card.green { border-bottom: 3px solid #10b981; }
    .stat-card.red { border-bottom: 3px solid #ef4444; }
    .stat-card.orange { border-bottom: 3px solid #f59e0b; }
    .stat-value { font-size: 1.75rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: 0.875rem; color: #64748b; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; color: #64748b; font-size: 0.875rem; }
    tr.at-risk { background: #fef2f2; }
    tr.warning { background: #fffbeb; }
    .progress-bar { width: 120px; height: 8px; background: #e2e8f0; border-radius: 4px; display: inline-block; vertical-align: middle; margin-right: 0.5rem; }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
    .progress-fill.safe { background: #10b981; }
    .progress-fill.warning { background: #f59e0b; }
    .progress-fill.danger { background: #ef4444; }
    .percentage { font-weight: 600; }
    .details { color: #64748b; font-size: 0.875rem; margin-left: 0.5rem; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.safe { background: #d1fae5; color: #065f46; }
    .status-badge.warning { background: #fef3c7; color: #92400e; }
    .status-badge.danger { background: #fee2e2; color: #991b1b; }
    .btn { padding: 0.5rem 1rem; background: #6366f1; color: white; border: none; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 0.875rem; }
    .btn-sm { padding: 0.375rem 0.75rem; }
    .empty-state { text-align: center; color: #64748b; padding: 2rem; }
    @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .filters { flex-direction: column; align-items: stretch; } .filters .input { max-width: none; } }
  `]
})
export class StudentListComponent implements OnInit {
    subjects: any[] = [];
    students: any[] = [];
    selectedSubject = '';
    filterRisk = 'all';
    analytics: any = null;
    minRequired = 75;

    constructor(private apiService: ApiService, private route: ActivatedRoute) { }

    ngOnInit(): void {
        this.apiService.getMySubjects().subscribe({ next: (res: any) => this.subjects = res.subjects || [] });
        this.route.queryParams.subscribe(params => {
            if (params['filter'] === 'at-risk') this.filterRisk = 'at-risk';
        });
    }

    loadStudents(): void {
        if (!this.selectedSubject) { this.students = []; this.analytics = null; return; }
        const subject = this.subjects.find(s => s._id === this.selectedSubject);
        this.minRequired = subject?.minAttendancePercent || 75;
        this.apiService.getClassAnalytics(this.selectedSubject).subscribe({
            next: (res: any) => { this.students = res.students || []; this.analytics = res.statistics; }
        });
    }

    get filteredStudents(): any[] {
        if (this.filterRisk === 'all') return this.students;
        if (this.filterRisk === 'at-risk') return this.students.filter(s => s.percentage < this.minRequired);
        return this.students.filter(s => s.percentage >= this.minRequired);
    }

    getStatusLabel(pct: number): string {
        if (pct < this.minRequired - 10) return 'Critical';
        if (pct < this.minRequired) return 'Warning';
        return 'Safe';
    }
}
