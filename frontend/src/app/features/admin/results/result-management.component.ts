import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-result-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <h1>📝 Result Management</h1>
        <p>Upload and publish student results</p>
      </header>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card blue">
          <span class="label">Total Results</span>
          <span class="value">{{ summary.total || 0 }}</span>
        </div>
        <div class="summary-card green">
          <span class="label">Published</span>
          <span class="value">{{ summary.published || 0 }}</span>
        </div>
        <div class="summary-card orange">
          <span class="label">Unpublished</span>
          <span class="value">{{ summary.unpublished || 0 }}</span>
        </div>
        <div class="summary-card purple">
          <span class="label">Pass Rate</span>
          <span class="value">{{ summary.passPercentage || 0 }}%</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <select [(ngModel)]="filterSemester" (change)="loadResults()">
          <option value="">All Semesters</option>
          <option *ngFor="let s of [1,2,3,4,5,6]" [value]="s">Semester {{ s }}</option>
        </select>
        <select [(ngModel)]="filterStream" (change)="loadResults()">
          <option value="">All Streams</option>
          <option value="BCA">BCA</option>
          <option value="BBA">BBA</option>
        </select>
        <select [(ngModel)]="filterPublished" (change)="loadResults()">
          <option value="">All Status</option>
          <option value="true">Published</option>
          <option value="false">Unpublished</option>
        </select>
        <button class="btn btn-primary" (click)="publishSelectedResults()" [disabled]="!selectedResults.length">
          📢 Publish Selected ({{ selectedResults.length }})
        </button>
      </div>

      <!-- Results Table -->
      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th><input type="checkbox" (change)="toggleAll($event)"></th>
              <th>Student</th>
              <th>Stream/Sem</th>
              <th>SGPA</th>
              <th>%</th>
              <th>Status</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of results" [class.unpublished]="!r.isPublished">
              <td><input type="checkbox" [checked]="isSelected(r)" (change)="toggleSelect(r)"></td>
              <td>
                <strong>{{ r.studentId?.name }}</strong>
                <small>{{ r.studentId?.rollNumber }}</small>
              </td>
              <td>{{ r.studentId?.stream }} - Sem {{ r.semester }}</td>
              <td><strong>{{ r.sgpa }}</strong></td>
              <td>{{ r.percentage }}%</td>
              <td>
                <span class="status-badge" [class.pass]="r.overallStatus === 'pass'" [class.fail]="r.overallStatus === 'fail'" [class.atkt]="r.overallStatus === 'atkt'">
                  {{ r.overallStatus }}
                </span>
              </td>
              <td>
                <span class="publish-badge" [class.published]="r.isPublished">
                  {{ r.isPublished ? '✓ Yes' : '✗ No' }}
                </span>
              </td>
              <td>
                <button class="btn-small" (click)="viewDetails(r)">👁️</button>
                <button class="btn-small primary" *ngIf="!r.isPublished" (click)="publishResult(r)">📢</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!results.length" class="empty">No results found. Results are created when marks are entered.</p>
      </div>

      <!-- Stream-wise Summary -->
      <div class="stream-summary" *ngIf="summary.streamWise">
        <div class="stream-card">
          <h4>BCA Results</h4>
          <div class="stream-stats">
            <span>Total: {{ summary.streamWise?.BCA?.total || 0 }}</span>
            <span>Passed: {{ summary.streamWise?.BCA?.passed || 0 }}</span>
          </div>
        </div>
        <div class="stream-card">
          <h4>BBA Results</h4>
          <div class="stream-stats">
            <span>Total: {{ summary.streamWise?.BBA?.total || 0 }}</span>
            <span>Passed: {{ summary.streamWise?.BBA?.passed || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-container { padding: 2rem; margin-left: 260px; }
    .page-header h1 { margin: 0 0 0.25rem; }
    .page-header p { margin: 0 0 2rem; color: #64748b; }

    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .summary-card { background: white; padding: 1.25rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .summary-card .label { display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
    .summary-card .value { font-size: 1.75rem; font-weight: 700; color: #1e293b; }
    .summary-card.blue { border-left: 4px solid #3b82f6; }
    .summary-card.green { border-left: 4px solid #10b981; }
    .summary-card.orange { border-left: 4px solid #f59e0b; }
    .summary-card.purple { border-left: 4px solid #8b5cf6; }

    .filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; align-items: center; }
    .filters select { padding: 0.5rem 1rem; border: 2px solid #e2e8f0; border-radius: 8px; }
    .btn { padding: 0.5rem 1rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #6366f1; color: white; }
    .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }

    .card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem; }

    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .data-table th { background: #f8fafc; font-weight: 600; color: #64748b; font-size: 0.7rem; text-transform: uppercase; }
    .data-table tr.unpublished { background: #fffbeb; }
    .data-table small { display: block; color: #94a3b8; }

    .status-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
    .status-badge.pass { background: #d1fae5; color: #065f46; }
    .status-badge.fail { background: #fee2e2; color: #dc2626; }
    .status-badge.atkt { background: #fef3c7; color: #92400e; }

    .publish-badge { font-size: 0.75rem; }
    .publish-badge.published { color: #10b981; }

    .btn-small { padding: 0.25rem 0.5rem; border: none; background: #e2e8f0; border-radius: 4px; cursor: pointer; margin-right: 0.25rem; }
    .btn-small.primary { background: #6366f1; color: white; }

    .stream-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .stream-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stream-card h4 { margin: 0 0 0.5rem; }
    .stream-stats { display: flex; gap: 1rem; color: #64748b; font-size: 0.875rem; }

    .empty { text-align: center; color: #94a3b8; padding: 2rem; }
  `]
})
export class ResultManagementComponent implements OnInit {
    results: any[] = [];
    summary: any = {};
    selectedResults: any[] = [];
    filterSemester = '';
    filterStream = '';
    filterPublished = '';

    constructor(private apiService: ApiService) { }

    ngOnInit(): void {
        this.loadResults();
        this.loadSummary();
    }

    loadResults(): void {
        const params: any = {};
        if (this.filterStream) params.stream = this.filterStream;
        if (this.filterPublished) params.published = this.filterPublished;

        const sem = this.filterSemester ? parseInt(this.filterSemester) : 1;
        this.apiService.getResultsBySemester(sem, params).subscribe({
            next: (res) => this.results = res.results || []
        });
    }

    loadSummary(): void {
        this.apiService.getResultSummary().subscribe({
            next: (res) => this.summary = res.summary || {}
        });
    }

    isSelected(result: any): boolean {
        return this.selectedResults.some(r => r._id === result._id);
    }

    toggleSelect(result: any): void {
        if (this.isSelected(result)) {
            this.selectedResults = this.selectedResults.filter(r => r._id !== result._id);
        } else {
            this.selectedResults.push(result);
        }
    }

    toggleAll(event: any): void {
        if (event.target.checked) {
            this.selectedResults = this.results.filter(r => !r.isPublished);
        } else {
            this.selectedResults = [];
        }
    }

    publishResult(result: any): void {
        this.apiService.publishResult(result._id).subscribe({
            next: () => {
                result.isPublished = true;
                this.loadSummary();
            }
        });
    }

    publishSelectedResults(): void {
        if (confirm(`Publish ${this.selectedResults.length} results?`)) {
            this.selectedResults.forEach(r => {
                this.apiService.publishResult(r._id).subscribe({
                    next: () => r.isPublished = true
                });
            });
            this.selectedResults = [];
            this.loadSummary();
        }
    }

    viewDetails(result: any): void {
        const subjects = result.subjects.map((s: any) => `${s.subjectName}: ${s.totalMarks} (${s.grade})`).join('\n');
        alert(`Result Details\n\nStudent: ${result.studentId?.name}\nSGPA: ${result.sgpa}\nStatus: ${result.overallStatus}\n\nSubjects:\n${subjects}`);
    }
}
