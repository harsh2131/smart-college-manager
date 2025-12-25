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
      <a routerLink="/teacher/dashboard" class="back-link">← Back to Dashboard</a>
      <h1>📋 Mark Attendance</h1>
      
      <div class="card">
        <div class="form-row">
          <div class="form-group">
            <label>Select Subject</label>
            <select class="input" [(ngModel)]="selectedSubject" (change)="loadStudents()">
              <option value="">-- Select --</option>
              <option *ngFor="let s of subjects" [value]="s._id">{{ s.subjectCode }} - {{ s.subjectName }}</option>
            </select>
          </div>
          <div class="form-group"><label>Date</label><input type="date" class="input" [(ngModel)]="attendanceDate"></div>
          <div class="form-group"><label>Lecture #</label><input type="number" class="input" [(ngModel)]="lectureNumber" min="1"></div>
        </div>
        
        <div *ngIf="students.length" class="attendance-section">
          <div class="quick-actions">
            <button class="btn btn-secondary" (click)="markAll('present')">✓ All Present</button>
            <button class="btn btn-secondary" (click)="markAll('absent')">✗ All Absent</button>
          </div>
          <table class="data-table">
            <thead><tr><th>Roll No</th><th>Name</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let student of students; let i = index">
                <td>{{ student.rollNumber || student.userId }}</td>
                <td>{{ student.name }}</td>
                <td>
                  <button [class.active]="attendance[i] === 'present'" (click)="attendance[i] = 'present'" class="btn-status present">P</button>
                  <button [class.active]="attendance[i] === 'absent'" (click)="attendance[i] = 'absent'" class="btn-status absent">A</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="summary">Present: {{ countPresent() }} | Absent: {{ countAbsent() }} | Total: {{ students.length }}</div>
          <button class="btn btn-primary" (click)="submitAttendance()">Submit Attendance</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 2rem; background: #f8fafc; min-height: 100vh; }
    .back-link { color: #6366f1; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    h1 { color: #1e293b; margin-bottom: 1.5rem; }
    .card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .form-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .input { width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; box-sizing: border-box; }
    .attendance-section { border-top: 1px solid #e2e8f0; padding-top: 1.5rem; }
    .quick-actions { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #6366f1; color: white; }
    .btn-secondary { background: #f1f5f9; color: #1e293b; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    .data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .data-table th { background: #f8fafc; }
    .btn-status { width: 40px; height: 40px; border: 2px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-weight: 700; margin-right: 0.5rem; background: white; }
    .btn-status.present { color: #10b981; }
    .btn-status.absent { color: #ef4444; }
    .btn-status.active.present { background: #10b981; color: white; border-color: #10b981; }
    .btn-status.active.absent { background: #ef4444; color: white; border-color: #ef4444; }
    .summary { background: #f8fafc; padding: 1rem; border-radius: 8px; text-align: center; margin-bottom: 1rem; font-weight: 500; }
  `]
})
export class MarkAttendanceComponent implements OnInit {
    subjects: any[] = [];
    students: any[] = [];
    selectedSubject = '';
    attendanceDate = new Date().toISOString().split('T')[0];
    lectureNumber = 1;
    attendance: string[] = [];

    constructor(private apiService: ApiService) { }
    ngOnInit(): void { this.apiService.getMySubjects().subscribe({ next: (res: any) => this.subjects = res.subjects || [] }); }
    loadStudents(): void {
        if (!this.selectedSubject) return;
        this.apiService.getSubjectStudents(this.selectedSubject).subscribe({ next: (res: any) => { this.students = res.students || []; this.attendance = this.students.map(() => 'present'); const s = this.subjects.find((x: any) => x._id === this.selectedSubject); this.lectureNumber = (s?.lecturesConducted || 0) + 1; } });
    }
    markAll(status: string): void { this.attendance = this.students.map(() => status); }
    countPresent(): number { return this.attendance.filter(a => a === 'present').length; }
    countAbsent(): number { return this.attendance.filter(a => a === 'absent').length; }
    submitAttendance(): void {
        const data = { subjectId: this.selectedSubject, date: this.attendanceDate, lectureNumber: this.lectureNumber, attendanceData: this.students.map((s, i) => ({ studentId: s._id, status: this.attendance[i] })) };
        this.apiService.markAttendance(data).subscribe({ next: () => { alert('Attendance marked!'); this.students = []; this.selectedSubject = ''; }, error: (err: any) => alert(err.error?.message || 'Error') });
    }
}
