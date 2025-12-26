import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-mark-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div><a routerLink="/teacher/dashboard" class="back-link">← Dashboard</a><h1>📋 Mark Attendance</h1></div>
      </div>

      <div class="controls card">
        <div class="control-row">
          <div class="form-group">
            <label>Subject</label>
            <select class="input" [(ngModel)]="selectedSubject" (change)="loadStudents()">
              <option value="">-- Select Subject --</option>
              <option *ngFor="let s of subjects" [value]="s._id">{{ s.subjectCode }} - {{ s.subjectName }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" class="input" [(ngModel)]="attendanceDate">
          </div>
          <div class="form-group">
            <label>Lecture #</label>
            <input type="number" class="input" [(ngModel)]="lectureNumber" min="1">
          </div>
        </div>
      </div>

      <div *ngIf="students.length" class="card">
        <div class="toolbar">
          <div class="quick-actions">
            <button class="btn btn-outline" (click)="markAll('present')">✓ All Present</button>
            <button class="btn btn-outline" (click)="markAll('absent')">✗ All Absent</button>
            <button class="btn btn-outline" (click)="markAll('late')">⏰ All Late</button>
          </div>
          <div class="summary-bar">
            <span class="summary-item present">P: {{ countStatus('present') }}</span>
            <span class="summary-item absent">A: {{ countStatus('absent') }}</span>
            <span class="summary-item late">L: {{ countStatus('late') }}</span>
            <span class="summary-item total">Total: {{ students.length }}</span>
          </div>
        </div>

        <div class="students-grid">
          <div *ngFor="let student of students; let i = index" class="student-card" [class.present]="attendance[i] === 'present'" [class.absent]="attendance[i] === 'absent'" [class.late]="attendance[i] === 'late'">
            <div class="student-info">
              <div class="student-avatar" [class.present]="attendance[i] === 'present'" [class.absent]="attendance[i] === 'absent'" [class.late]="attendance[i] === 'late'">{{ student.name?.charAt(0) }}</div>
              <div>
                <div class="student-name">{{ student.name }}</div>
                <div class="student-roll">{{ student.rollNumber }}</div>
              </div>
            </div>
            <div class="status-buttons">
              <button [class.active]="attendance[i] === 'present'" (click)="attendance[i] = 'present'" class="status-btn present" title="Present">✓</button>
              <button [class.active]="attendance[i] === 'absent'" (click)="attendance[i] = 'absent'" class="status-btn absent" title="Absent">✗</button>
              <button [class.active]="attendance[i] === 'late'" (click)="attendance[i] = 'late'" class="status-btn late" title="Late">L</button>
            </div>
          </div>
        </div>

        <div class="submit-bar">
          <div class="percentage-preview">
            Attendance Rate: <strong>{{ getAttendanceRate() }}%</strong>
          </div>
          <button class="btn btn-primary btn-lg" (click)="submitAttendance()" [disabled]="submitting">
            {{ submitting ? 'Submitting...' : 'Submit Attendance' }}
          </button>
        </div>
      </div>

      <div *ngIf="!students.length && selectedSubject" class="empty-state card">
        <p>No students enrolled in this subject</p>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: #f1f5f9; min-height: 100vh; }
    .page-header { margin-bottom: 1.5rem; }
    .back-link { color: #6366f1; text-decoration: none; font-size: 0.875rem; }
    h1 { color: #1e293b; margin: 0.5rem 0 0; }
    .card { background: white; border-radius: 16px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .control-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; }
    .input { width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem; box-sizing: border-box; }
    .input:focus { outline: none; border-color: #6366f1; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .quick-actions { display: flex; gap: 0.5rem; }
    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: #6366f1; color: white; }
    .btn-outline { background: white; border: 2px solid #e2e8f0; color: #374151; }
    .btn-outline:hover { border-color: #6366f1; color: #6366f1; }
    .btn-lg { padding: 1rem 2rem; font-size: 1rem; }
    .summary-bar { display: flex; gap: 1rem; }
    .summary-item { padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem; }
    .summary-item.present { background: #d1fae5; color: #065f46; }
    .summary-item.absent { background: #fee2e2; color: #991b1b; }
    .summary-item.late { background: #fef3c7; color: #92400e; }
    .summary-item.total { background: #f1f5f9; color: #64748b; }
    .students-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .student-card { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 2px solid #e2e8f0; border-radius: 12px; transition: all 0.2s; }
    .student-card.present { border-color: #10b981; background: #ecfdf5; }
    .student-card.absent { border-color: #ef4444; background: #fef2f2; }
    .student-card.late { border-color: #f59e0b; background: #fffbeb; }
    .student-info { display: flex; align-items: center; gap: 0.75rem; }
    .student-avatar { width: 40px; height: 40px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #64748b; }
    .student-avatar.present { background: #10b981; color: white; }
    .student-avatar.absent { background: #ef4444; color: white; }
    .student-avatar.late { background: #f59e0b; color: white; }
    .student-name { font-weight: 600; color: #1e293b; }
    .student-roll { font-size: 0.875rem; color: #64748b; }
    .status-buttons { display: flex; gap: 0.5rem; }
    .status-btn { width: 40px; height: 40px; border: 2px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; font-weight: 700; font-size: 1rem; transition: all 0.2s; }
    .status-btn.present { color: #10b981; }
    .status-btn.absent { color: #ef4444; }
    .status-btn.late { color: #f59e0b; }
    .status-btn.active.present { background: #10b981; color: white; border-color: #10b981; }
    .status-btn.active.absent { background: #ef4444; color: white; border-color: #ef4444; }
    .status-btn.active.late { background: #f59e0b; color: white; border-color: #f59e0b; }
    .submit-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; }
    .percentage-preview { font-size: 1.125rem; color: #64748b; }
    .percentage-preview strong { color: #1e293b; font-size: 1.5rem; }
    .empty-state { text-align: center; color: #64748b; padding: 3rem; }
    @media (max-width: 768px) { .control-row { grid-template-columns: 1fr; } .toolbar { flex-direction: column; align-items: stretch; } .submit-bar { flex-direction: column; gap: 1rem; } }
  `]
})
export class MarkAttendanceComponent implements OnInit {
  subjects: any[] = [];
  students: any[] = [];
  selectedSubject = '';
  attendanceDate = new Date().toISOString().split('T')[0];
  lectureNumber = 1;
  attendance: string[] = [];
  submitting = false;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.apiService.getMySubjects().subscribe({ next: (res: any) => this.subjects = res.subjects || [] });
  }

  loadStudents(): void {
    if (!this.selectedSubject) { this.students = []; return; }
    this.apiService.getSubjectStudents(this.selectedSubject).subscribe({
      next: (res: any) => {
        this.students = res.students || [];
        this.attendance = this.students.map(() => 'present');
        const subject = this.subjects.find(s => s._id === this.selectedSubject);
        this.lectureNumber = (subject?.lecturesConducted || 0) + 1;
      }
    });
  }

  markAll(status: string): void { this.attendance = this.students.map(() => status); }
  countStatus(status: string): number { return this.attendance.filter(a => a === status).length; }
  getAttendanceRate(): number {
    const present = this.countStatus('present') + this.countStatus('late');
    return this.students.length > 0 ? Math.round((present / this.students.length) * 100) : 0;
  }

  submitAttendance(): void {
    this.submitting = true;
    const data = {
      subjectId: this.selectedSubject,
      date: this.attendanceDate,
      lectureNumber: this.lectureNumber,
      attendanceData: this.students.map((s, i) => ({ studentId: s._id, status: this.attendance[i] }))
    };
    this.apiService.markAttendance(data).subscribe({
      next: () => { this.submitting = false; alert('Attendance marked successfully!'); this.students = []; this.selectedSubject = ''; },
      error: (err: any) => { this.submitting = false; alert(err.error?.message || 'Error marking attendance'); }
    });
  }
}
