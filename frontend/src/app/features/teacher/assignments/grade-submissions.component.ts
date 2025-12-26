import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-grade-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header">
        <a routerLink="/teacher/assignments" class="back-link">← Back to Assignments</a>
        <h1>📝 Grade Submissions</h1>
      </div>

      <div *ngIf="assignment" class="assignment-info card">
        <div class="info-grid">
          <div><span class="label">Assignment:</span><strong>{{ assignment.title }}</strong></div>
          <div><span class="label">Subject:</span><span>{{ assignment.subjectId?.subjectCode }}</span></div>
          <div><span class="label">Deadline:</span><span [class.overdue]="isPastDeadline()">{{ formatDate(assignment.deadline) }}</span></div>
          <div><span class="label">Total Marks:</span><span>{{ assignment.totalMarks }}</span></div>
        </div>
      </div>

      <div class="stats-bar card">
        <div class="stat"><span class="stat-value">{{ stats.total }}</span><span class="stat-label">Total</span></div>
        <div class="stat pending"><span class="stat-value">{{ stats.pending }}</span><span class="stat-label">Pending</span></div>
        <div class="stat graded"><span class="stat-value">{{ stats.graded }}</span><span class="stat-label">Graded</span></div>
        <div class="stat late"><span class="stat-value">{{ stats.late }}</span><span class="stat-label">Late</span></div>
      </div>

      <div class="submissions-list">
        <div *ngFor="let s of submissions" class="submission-card" [class.graded]="s.status === 'graded'" [class.late]="s.isLate">
          <div class="student-info">
            <div class="student-avatar">{{ s.studentId?.name?.charAt(0) }}</div>
            <div>
              <div class="student-name">{{ s.studentId?.name }}</div>
              <div class="student-roll">{{ s.studentId?.rollNumber }} • {{ s.studentId?.division }}</div>
            </div>
            <span *ngIf="s.isLate" class="late-badge">Late</span>
          </div>
          
          <div class="submission-details">
            <div class="meta"><span class="label">Submitted:</span> {{ formatSubmitDate(s.submittedAt) }}</div>
            <a [href]="s.fileUrl" target="_blank" class="file-link">📎 {{ s.originalName || 'View Submission' }}</a>
          </div>

          <div *ngIf="s.status === 'graded'" class="graded-info">
            <div class="grade-display">{{ s.marks }} / {{ assignment?.totalMarks }}</div>
            <div class="feedback">{{ s.feedback || 'No feedback' }}</div>
          </div>

          <div *ngIf="s.status !== 'graded'" class="grade-form">
            <div class="form-row">
              <input type="number" class="input marks-input" [(ngModel)]="gradeData[s._id].marks" [max]="assignment?.totalMarks" min="0" placeholder="Marks">
              <span class="max-marks">/ {{ assignment?.totalMarks }}</span>
            </div>
            <textarea class="input feedback-input" [(ngModel)]="gradeData[s._id].feedback" placeholder="Feedback (optional)" rows="2"></textarea>
            <button class="btn btn-primary" (click)="gradeSubmission(s._id)">Submit Grade</button>
          </div>

          <div *ngIf="s.status === 'graded'" class="edit-grade">
            <button class="btn btn-sm btn-secondary" (click)="s.status = 'pending'; initGradeData(s)">Edit Grade</button>
          </div>
        </div>

        <p *ngIf="!submissions.length" class="empty-state">No submissions yet</p>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 2rem; background: #f1f5f9; min-height: 100vh; }
    .page-header { margin-bottom: 1.5rem; }
    .back-link { color: #6366f1; text-decoration: none; font-size: 0.875rem; }
    h1 { color: #1e293b; margin: 0.5rem 0 0; }
    .card { background: white; border-radius: 16px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .info-grid .label { color: #64748b; font-size: 0.875rem; display: block; margin-bottom: 0.25rem; }
    .overdue { color: #ef4444; }
    .stats-bar { display: flex; gap: 2rem; }
    .stat { flex: 1; text-align: center; padding: 1rem; background: #f8fafc; border-radius: 10px; }
    .stat.pending { background: #fef3c7; }
    .stat.graded { background: #d1fae5; }
    .stat.late { background: #fee2e2; }
    .stat-value { display: block; font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: 0.875rem; color: #64748b; }
    .submissions-list { display: flex; flex-direction: column; gap: 1rem; }
    .submission-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #f59e0b; }
    .submission-card.graded { border-left-color: #10b981; }
    .submission-card.late { border-left-color: #ef4444; }
    .student-info { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .student-avatar { width: 48px; height: 48px; background: #e0e7ff; color: #4338ca; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.25rem; }
    .student-name { font-weight: 600; color: #1e293b; }
    .student-roll { font-size: 0.875rem; color: #64748b; }
    .late-badge { background: #fee2e2; color: #991b1b; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; margin-left: auto; }
    .submission-details { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f8fafc; border-radius: 10px; margin-bottom: 1rem; }
    .meta .label { color: #64748b; }
    .file-link { color: #6366f1; text-decoration: none; font-weight: 500; }
    .graded-info { text-align: center; padding: 1rem; background: #ecfdf5; border-radius: 10px; }
    .grade-display { font-size: 2rem; font-weight: 700; color: #10b981; }
    .feedback { color: #64748b; margin-top: 0.5rem; font-style: italic; }
    .grade-form { display: flex; flex-direction: column; gap: 0.75rem; }
    .form-row { display: flex; align-items: center; gap: 0.5rem; }
    .input { padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem; box-sizing: border-box; }
    .input:focus { outline: none; border-color: #6366f1; }
    .marks-input { width: 100px; text-align: center; font-size: 1.25rem; font-weight: 600; }
    .max-marks { color: #64748b; font-size: 1.25rem; }
    .feedback-input { width: 100%; resize: vertical; }
    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #10b981; color: white; }
    .btn-secondary { background: #f1f5f9; color: #1e293b; }
    .btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }
    .edit-grade { text-align: right; }
    .empty-state { text-align: center; color: #64748b; padding: 3rem; background: white; border-radius: 16px; }
    @media (max-width: 768px) { .info-grid { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class GradeSubmissionsComponent implements OnInit {
  assignmentId = '';
  assignment: any = null;
  submissions: any[] = [];
  stats = { total: 0, pending: 0, graded: 0, late: 0 };
  gradeData: { [key: string]: { marks: number; feedback: string } } = {};

  constructor(private apiService: ApiService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.assignmentId = this.route.snapshot.paramMap.get('id') || '';
    this.loadData();
  }

  loadData(): void {
    this.apiService.getAssignment(this.assignmentId).subscribe({
      next: (res: any) => {
        this.assignment = res.assignment;
      }
    });
    this.apiService.getSubmissions(this.assignmentId).subscribe({
      next: (res: any) => {
        this.submissions = res.submissions || [];
        this.submissions.forEach((s: any) => {
          s.status = s.marks != null ? 'graded' : 'pending';
          s.isLate = this.assignment?.dueDate && new Date(s.submittedAt) > new Date(this.assignment.dueDate);
          this.initGradeData(s);
        });
        // Calculate stats
        this.stats = {
          total: this.submissions.length,
          graded: this.submissions.filter((s: any) => s.marks != null).length,
          pending: this.submissions.filter((s: any) => s.marks == null).length,
          late: this.submissions.filter((s: any) => s.isLate).length
        };
      }
    });
  }

  initGradeData(s: any): void {
    this.gradeData[s._id] = { marks: s.marks || 0, feedback: s.feedback || '' };
  }

  gradeSubmission(id: string): void {
    const data = this.gradeData[id];
    this.apiService.gradeSubmission(id, data).subscribe({
      next: () => this.loadData(),
      error: (err: any) => alert(err.error?.message || 'Error grading')
    });
  }

  isPastDeadline(): boolean { return new Date(this.assignment?.deadline) < new Date(); }
  formatDate(date: string): string { return new Date(date).toLocaleString(); }
  formatSubmitDate(date: string): string { return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
}
