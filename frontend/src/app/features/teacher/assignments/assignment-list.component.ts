import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-assignment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <a routerLink="/teacher/dashboard" class="back-link">← Dashboard</a>
          <h1>📄 Assignment Management</h1>
        </div>
        <button (click)="showForm = !showForm" class="btn btn-primary">{{ showForm ? '✕ Close' : '+ Create Assignment' }}</button>
      </div>

      <!-- Create Form -->
      <div *ngIf="showForm" class="card form-card">
        <h3>{{ editMode ? 'Edit' : 'Create New' }} Assignment</h3>
        <form (ngSubmit)="saveAssignment()">
          <div class="form-row">
            <div class="form-group">
              <label>Subject *</label>
              <select class="input" [(ngModel)]="form.subjectId" name="subject" required>
                <option value="">-- Select Subject --</option>
                <option *ngFor="let s of subjects" [value]="s._id">{{ s.subjectCode }} - {{ s.subjectName }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Title *</label>
              <input class="input" [(ngModel)]="form.title" name="title" placeholder="Assignment title" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Deadline *</label>
              <input type="datetime-local" class="input" [(ngModel)]="form.dueDate" name="dueDate" required>
            </div>
            <div class="form-group">
              <label>Type *</label>
              <select class="input" [(ngModel)]="form.type" name="type" required>
                <option value="home">🏠 Home Assignment</option>
                <option value="class">📚 Class Assignment</option>
                <option value="documentation">📄 Documentation</option>
                <option value="ppt">📊 PPT/Presentation</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea class="input" [(ngModel)]="form.description" name="desc" rows="3" placeholder="Assignment description and requirements..."></textarea>
          </div>
          <div class="form-group">
            <label>Instructions</label>
            <textarea class="input" [(ngModel)]="form.instructions" name="instructions" rows="2" placeholder="Submission guidelines..."></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="resetForm()">Cancel</button>
            <button type="submit" class="btn btn-primary">{{ editMode ? 'Update' : 'Create' }} Assignment</button>
          </div>
        </form>
      </div>

      <!-- Filters -->
      <div class="filters">
        <select class="input" [(ngModel)]="filterSubject" (change)="loadAssignments()">
          <option value="">All Subjects</option>
          <option *ngFor="let s of subjects" [value]="s._id">{{ s.subjectCode }}</option>
        </select>
        <select class="input" [(ngModel)]="filterStatus" (change)="loadAssignments()">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <!-- Assignment List -->
      <div class="assignments-grid">
        <div *ngFor="let a of assignments" class="assignment-card" [class.closed]="getStatus(a) === 'closed'" [class.urgent]="getStatus(a) === 'urgent'">
          <div class="assignment-header">
            <span class="subject-badge">{{ a.subjectId?.subjectCode }}</span>
            <span class="type-badge" [class]="'type-' + (a.type || 'home')">{{ getTypeLabel(a.type) }}</span>
            <span class="status-badge" [class]="getStatus(a)">{{ getStatus(a) }}</span>
          </div>
          <h3>{{ a.title }}</h3>
          <p class="description">{{ a.description || 'No description' }}</p>
          <div class="assignment-meta">
            <div class="meta-item"><span class="label">Deadline:</span><span [class.urgent]="isUrgent(a.dueDate)">{{ formatDeadline(a.dueDate) }}</span></div>
          </div>
          <div class="submission-stats">
            <div class="stat"><span class="stat-value">{{ a.submissions?.total || 0 }}</span><span class="stat-label">Submitted</span></div>
            <div class="stat"><span class="stat-value">{{ a.submissions?.graded || 0 }}</span><span class="stat-label">Graded</span></div>
            <div class="stat"><span class="stat-value">{{ (a.submissions?.total || 0) - (a.submissions?.graded || 0) }}</span><span class="stat-label">Pending</span></div>
          </div>
          <div class="assignment-actions">
            <a [routerLink]="['/teacher/assignments', a._id, 'grade']" class="btn btn-sm btn-primary">Review Submissions</a>
            <button (click)="editAssignment(a)" class="btn btn-sm btn-secondary">Edit</button>
            <button (click)="deleteAssignment(a._id)" class="btn btn-sm btn-danger">Delete</button>
          </div>
        </div>
        <p *ngIf="!assignments.length" class="empty-state">No assignments found. Create one!</p>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: #f1f5f9; min-height: 100vh; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .back-link { color: #6366f1; text-decoration: none; font-size: 0.875rem; }
    h1 { color: #1e293b; margin: 0.5rem 0 0; }
    .card { background: white; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h3 { margin: 0 0 1rem; color: #1e293b; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .form-group { margin-bottom: 0.5rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; }
    .input { width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem; box-sizing: border-box; transition: border-color 0.2s; }
    .input:focus { outline: none; border-color: #6366f1; }
    textarea.input { resize: vertical; }
    .form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem; }
    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-block; }
    .btn-primary { background: #6366f1; color: white; }
    .btn-primary:hover { background: #4f46e5; }
    .btn-secondary { background: #f1f5f9; color: #1e293b; }
    .btn-danger { background: #fee2e2; color: #991b1b; }
    .btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }
    .filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .filters .input { max-width: 200px; }
    .assignments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
    .assignment-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #6366f1; }
    .assignment-card.closed { opacity: 0.7; border-left-color: #94a3b8; }
    .assignment-card.urgent { border-left-color: #f59e0b; background: #fffbeb; }
    .assignment-header { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
    .subject-badge { background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .type-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
    .type-badge.type-home { background: #dbeafe; color: #1d4ed8; }
    .type-badge.type-class { background: #fce7f3; color: #be185d; }
    .type-badge.type-documentation { background: #d1fae5; color: #065f46; }
    .type-badge.type-ppt { background: #fed7aa; color: #c2410c; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize; }
    .status-badge.open { background: #d1fae5; color: #065f46; }
    .status-badge.closed { background: #e2e8f0; color: #64748b; }
    .status-badge.urgent { background: #fef3c7; color: #92400e; }
    .status-badge.due-soon { background: #fef3c7; color: #92400e; }
    .assignment-card h3 { font-size: 1.125rem; margin-bottom: 0.5rem; }
    .description { color: #64748b; font-size: 0.875rem; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .assignment-meta { display: flex; gap: 1.5rem; margin-bottom: 1rem; font-size: 0.875rem; }
    .meta-item .label { color: #64748b; margin-right: 0.25rem; }
    .meta-item .urgent { color: #ef4444; font-weight: 600; }
    .submission-stats { display: flex; gap: 1rem; padding: 1rem; background: #f8fafc; border-radius: 10px; margin-bottom: 1rem; }
    .stat { flex: 1; text-align: center; }
    .stat-value { display: block; font-size: 1.25rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: 0.75rem; color: #64748b; }
    .assignment-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .empty-state { grid-column: 1 / -1; text-align: center; color: #64748b; padding: 3rem; background: white; border-radius: 16px; }
    @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } .filters { flex-direction: column; } .filters .input { max-width: none; } }
  `]
})
export class AssignmentListComponent implements OnInit {
  subjects: any[] = [];
  assignments: any[] = [];
  showForm = false;
  editMode = false;
  editId = '';
  filterSubject = '';
  filterStatus = '';
  form = { subjectId: '', title: '', dueDate: '', type: 'home', description: '', instructions: '' };

  constructor(private apiService: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.apiService.getMySubjects().subscribe({ next: (res: any) => this.subjects = res.subjects || [] });
    this.loadAssignments();
  }

  loadAssignments(): void {
    const params: any = {};
    if (this.filterSubject) params.subjectId = this.filterSubject;
    if (this.filterStatus) params.status = this.filterStatus;
    this.apiService.getAssignments(params).subscribe({ next: (res: any) => this.assignments = res.assignments || [] });
  }

  saveAssignment(): void {
    const data = { ...this.form, dueDate: new Date(this.form.dueDate).toISOString() };
    const request = this.editMode ? this.apiService.updateAssignment(this.editId, data) : this.apiService.createAssignment(data);
    request.subscribe({
      next: () => { this.loadAssignments(); this.resetForm(); },
      error: (err: any) => alert(err.error?.message || 'Error saving assignment')
    });
  }

  editAssignment(a: any): void {
    this.editMode = true;
    this.editId = a._id;
    this.form = { subjectId: a.subjectId?._id || a.subjectId, title: a.title, dueDate: new Date(a.dueDate).toISOString().slice(0, 16), type: a.type || 'home', description: a.description || '', instructions: a.instructions || '' };
    this.showForm = true;
  }

  deleteAssignment(id: string): void {
    if (confirm('Delete this assignment?')) {
      this.apiService.deleteAssignment(id).subscribe({ next: () => this.loadAssignments() });
    }
  }

  resetForm(): void {
    this.form = { subjectId: '', title: '', dueDate: '', type: 'home', description: '', instructions: '' };
    this.showForm = false;
    this.editMode = false;
    this.editId = '';
  }

  getStatus(a: any): string { return a.status || (new Date(a.dueDate) < new Date() ? 'closed' : 'open'); }
  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = { 'home': '🏠 Home', 'class': '📚 Class', 'documentation': '📄 Docs', 'ppt': '📊 PPT' };
    return labels[type] || '🏠 Home';
  }
  isUrgent(date: string): boolean { const d = new Date(date).getTime() - Date.now(); return d > 0 && d < 3 * 24 * 60 * 60 * 1000; }
  formatDeadline(date: string): string { return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
}
