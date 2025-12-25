import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-subject-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="page-container">
      <a routerLink="/teacher/dashboard" class="back-link">← Back to Dashboard</a>
      <h1>📚 Subject Management</h1>
      
      <div class="card">
        <h3>Create New Subject</h3>
        <form (ngSubmit)="createSubject()">
          <div class="form-row">
            <div class="form-group"><label>Subject Code</label><input class="input" [(ngModel)]="form.subjectCode" name="code" required></div>
            <div class="form-group"><label>Subject Name</label><input class="input" [(ngModel)]="form.subjectName" name="name" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Semester</label><input type="number" class="input" [(ngModel)]="form.semester" name="semester" min="1" max="8" required></div>
            <div class="form-group"><label>Department</label><input class="input" [(ngModel)]="form.department" name="dept" required></div>
          </div>
          <button type="submit" class="btn btn-primary">Create Subject</button>
        </form>
      </div>
      
      <div class="card">
        <h3>My Subjects</h3>
        <table class="data-table">
          <thead><tr><th>Code</th><th>Name</th><th>Sem</th><th>Students</th><th>Lectures</th></tr></thead>
          <tbody>
            <tr *ngFor="let s of subjects"><td><strong>{{ s.subjectCode }}</strong></td><td>{{ s.subjectName }}</td><td>{{ s.semester }}</td><td>{{ s.enrolledStudents?.length || 0 }}</td><td>{{ s.lecturesConducted }}/{{ s.totalPlannedLectures }}</td></tr>
          </tbody>
        </table>
        <p *ngIf="!subjects.length" class="empty">No subjects created yet.</p>
      </div>
    </div>
  `,
    styles: [`
    .page-container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: #f8fafc; min-height: 100vh; }
    .back-link { color: #6366f1; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    h1 { color: #1e293b; margin-bottom: 1.5rem; }
    .card { background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .card h3 { margin: 0 0 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .form-group { margin-bottom: 0; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .input { width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; box-sizing: border-box; }
    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #6366f1; color: white; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .data-table th { background: #f8fafc; font-weight: 600; color: #64748b; }
    .empty { text-align: center; color: #64748b; padding: 2rem; }
  `]
})
export class SubjectListComponent implements OnInit {
    subjects: any[] = [];
    form = { subjectCode: '', subjectName: '', semester: 5, department: 'CSE', minAttendancePercent: 75, totalPlannedLectures: 60 };

    constructor(private apiService: ApiService) { }
    ngOnInit(): void { this.loadSubjects(); }
    loadSubjects(): void { this.apiService.getMySubjects().subscribe({ next: (res: any) => this.subjects = res.subjects || [] }); }
    createSubject(): void {
        this.apiService.createSubject(this.form).subscribe({ next: () => { this.loadSubjects(); this.form = { subjectCode: '', subjectName: '', semester: 5, department: 'CSE', minAttendancePercent: 75, totalPlannedLectures: 60 }; }, error: (err: any) => alert(err.error?.message || 'Error') });
    }
}
