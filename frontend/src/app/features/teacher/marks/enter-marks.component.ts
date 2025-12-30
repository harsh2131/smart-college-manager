import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-enter-marks',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <h1>📝 Enter Marks</h1>
        <p>Record student marks for tests and assignments</p>
      </header>
      
      <div class="card">
        <div class="form-row">
          <div class="form-group">
            <label>Subject</label>
            <select class="input" [(ngModel)]="selectedSubject" (change)="loadStudents()">
              <option value="">-- Select Subject --</option>
              <option *ngFor="let s of subjects" [value]="s._id">{{ s.subjectCode }} - {{ s.subjectName }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Type</label>
            <select class="input" [(ngModel)]="testType">
              <option value="unit-test">Unit Test</option>
              <option value="assignment">Assignment</option>
              <option value="quiz">Quiz</option>
            </select>
          </div>
          <div class="form-group">
            <label>Test Name</label>
            <input class="input" [(ngModel)]="testName" placeholder="e.g., Unit Test 1">
          </div>
          <div class="form-group">
            <label>Max Marks</label>
            <input type="number" class="input" [(ngModel)]="maxMarks" min="1">
          </div>
        </div>
        
        <div *ngIf="students.length" class="marks-section">
          <h3>Student Marks</h3>
          <table class="data-table">
            <thead>
              <tr><th>Roll No.</th><th>Name</th><th>Marks (out of {{ maxMarks }})</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of students; let i = index">
                <td>{{ s.rollNumber || s.userId }}</td>
                <td>{{ s.name }}</td>
                <td><input type="number" class="input marks-input" [(ngModel)]="marks[i]" [max]="maxMarks" min="0"></td>
              </tr>
            </tbody>
          </table>
          <div class="form-actions">
            <button class="btn btn-primary" (click)="submit()" [disabled]="!testName">Submit Marks</button>
          </div>
        </div>
        
        <p *ngIf="selectedSubject && !students.length" class="empty-state">No students found for this subject</p>
        <p *ngIf="!selectedSubject" class="empty-state">Select a subject to view students</p>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 2rem; min-height: 100vh; }
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; color: #1e293b; margin: 0 0 0.25rem; }
    .page-header p { color: #64748b; margin: 0; }
    
    .card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .form-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; }
    .input { width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; box-sizing: border-box; }
    .input:focus { outline: none; border-color: #6366f1; }
    
    .marks-section { border-top: 1px solid #e2e8f0; padding-top: 1.5rem; margin-top: 1rem; }
    .marks-section h3 { margin: 0 0 1rem; font-size: 1.1rem; color: #1e293b; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
    .data-table th, .data-table td { padding: 0.875rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .data-table th { background: #f8fafc; font-weight: 600; color: #64748b; }
    .marks-input { width: 100px; text-align: center; }
    
    .form-actions { display: flex; justify-content: flex-end; }
    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #6366f1; color: white; }
    .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
    
    .empty-state { text-align: center; color: #64748b; padding: 2rem; margin: 0; }
    
    @media (max-width: 1024px) { .form-row { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
  `]
})
export class EnterMarksComponent implements OnInit {
  subjects: any[] = [];
  students: any[] = [];
  marks: number[] = [];
  selectedSubject = '';
  testType = 'unit-test';
  testName = '';
  maxMarks = 20;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getMySubjects().subscribe({ next: (r: any) => this.subjects = r.subjects || [] });
  }

  loadStudents() {
    if (!this.selectedSubject) { this.students = []; return; }
    this.api.getSubjectStudents(this.selectedSubject).subscribe({
      next: (r: any) => { this.students = r.students || []; this.marks = this.students.map(() => 0); }
    });
  }

  submit() {
    const data = {
      subjectId: this.selectedSubject, category: 'internal', testType: this.testType,
      testName: this.testName, maxMarks: this.maxMarks, date: new Date().toISOString(),
      marksData: this.students.map((s, i) => ({ studentId: s._id, marksObtained: this.marks[i] }))
    };
    this.api.enterMarks(data).subscribe({
      next: () => { alert('Marks entered successfully!'); this.students = []; this.selectedSubject = ''; this.testName = ''; },
      error: (e: any) => alert(e.error?.message || 'Error')
    });
  }
}
