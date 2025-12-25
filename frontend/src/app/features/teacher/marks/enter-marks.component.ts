import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-enter-marks', standalone: true, imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="page-container">
      <a routerLink="/teacher/dashboard" class="back-link">← Back</a>
      <h1>📝 Enter Marks</h1>
      <div class="card">
        <div class="form-row">
          <div class="form-group"><label>Subject</label><select class="input" [(ngModel)]="selectedSubject" (change)="loadStudents()"><option value="">-- Select --</option><option *ngFor="let s of subjects" [value]="s._id">{{ s.subjectCode }}</option></select></div>
          <div class="form-group"><label>Type</label><select class="input" [(ngModel)]="testType"><option value="unit-test">Unit Test</option><option value="assignment">Assignment</option><option value="quiz">Quiz</option></select></div>
          <div class="form-group"><label>Test Name</label><input class="input" [(ngModel)]="testName" placeholder="Unit Test 1"></div>
          <div class="form-group"><label>Max Marks</label><input type="number" class="input" [(ngModel)]="maxMarks" min="1"></div>
        </div>
        <div *ngIf="students.length" class="marks-section">
          <table class="data-table"><thead><tr><th>Roll</th><th>Name</th><th>Marks</th></tr></thead>
            <tbody><tr *ngFor="let s of students; let i = index"><td>{{ s.rollNumber }}</td><td>{{ s.name }}</td><td><input type="number" class="input" style="width:80px" [(ngModel)]="marks[i]" [max]="maxMarks" min="0"></td></tr></tbody>
          </table>
          <button class="btn btn-primary" (click)="submit()">Submit Marks</button>
        </div>
      </div>
    </div>`,
    styles: [`.page-container{max-width:900px;margin:0 auto;padding:2rem;background:#f8fafc;min-height:100vh}.back-link{color:#6366f1;text-decoration:none;display:inline-block;margin-bottom:1rem}h1{color:#1e293b;margin-bottom:1.5rem}.card{background:white;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.1)}.form-row{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1rem}.form-group label{display:block;margin-bottom:0.5rem;font-weight:500}.input{width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:8px;box-sizing:border-box}.marks-section{border-top:1px solid #e2e8f0;padding-top:1rem;margin-top:1rem}.data-table{width:100%;border-collapse:collapse;margin-bottom:1rem}.data-table th,.data-table td{padding:0.75rem;text-align:left;border-bottom:1px solid #e2e8f0}.data-table th{background:#f8fafc}.btn{padding:0.75rem 1.5rem;border:none;border-radius:8px;font-weight:600;cursor:pointer}.btn-primary{background:#6366f1;color:white}`]
})
export class EnterMarksComponent implements OnInit {
    subjects: any[] = []; students: any[] = []; marks: number[] = []; selectedSubject = ''; testType = 'unit-test'; testName = ''; maxMarks = 20;
    constructor(private api: ApiService) { }
    ngOnInit() { this.api.getMySubjects().subscribe({ next: (r: any) => this.subjects = r.subjects || [] }); }
    loadStudents() { if (!this.selectedSubject) return; this.api.getSubjectStudents(this.selectedSubject).subscribe({ next: (r: any) => { this.students = r.students || []; this.marks = this.students.map(() => 0); } }); }
    submit() { const data = { subjectId: this.selectedSubject, category: 'internal', testType: this.testType, testName: this.testName, maxMarks: this.maxMarks, date: new Date().toISOString(), marksData: this.students.map((s, i) => ({ studentId: s._id, marksObtained: this.marks[i] })) }; this.api.enterMarks(data).subscribe({ next: () => { alert('Marks entered!'); this.students = []; this.selectedSubject = ''; this.testName = ''; }, error: (e: any) => alert(e.error?.message || 'Error') }); }
}
