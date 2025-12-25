import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-deadline-list', standalone: true, imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="page-container">
      <a routerLink="/teacher/dashboard" class="back-link">← Back</a>
      <h1>⏰ Deadlines</h1>
      <div class="card">
        <h3>Create Deadline</h3>
        <form (ngSubmit)="create()">
          <div class="form-row">
            <div class="form-group"><label>Subject</label><select class="input" [(ngModel)]="form.subjectId" name="sub" required><option value="">--</option><option *ngFor="let s of subjects" [value]="s._id">{{ s.subjectCode }}</option></select></div>
            <div class="form-group"><label>Title</label><input class="input" [(ngModel)]="form.title" name="t" required></div>
            <div class="form-group"><label>Type</label><select class="input" [(ngModel)]="form.type" name="ty"><option value="assignment">Assignment</option><option value="exam">Exam</option><option value="project">Project</option></select></div>
            <div class="form-group"><label>Due Date</label><input type="date" class="input" [(ngModel)]="form.dueDate" name="d" required></div>
          </div>
          <button type="submit" class="btn btn-primary">Create</button>
        </form>
      </div>
      <div class="card">
        <h3>All Deadlines</h3>
        <div class="deadline-grid">
          <div *ngFor="let d of deadlines" class="deadline-card">
            <span class="type">{{ d.type }}</span>
            <h4>{{ d.title }}</h4>
            <p>{{ d.subjectId?.subjectCode }} | {{ formatDate(d.dueDate) }}</p>
          </div>
        </div>
        <p *ngIf="!deadlines.length" class="empty">No deadlines yet.</p>
      </div>
    </div>`,
    styles: [`.page-container{max-width:1000px;margin:0 auto;padding:2rem;background:#f8fafc;min-height:100vh}.back-link{color:#6366f1;text-decoration:none;display:inline-block;margin-bottom:1rem}h1{color:#1e293b;margin-bottom:1.5rem}.card{background:white;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.1)}.card h3{margin:0 0 1rem}.form-row{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1rem}.form-group label{display:block;margin-bottom:0.5rem;font-weight:500}.input{width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:8px;box-sizing:border-box}.btn{padding:0.75rem 1.5rem;border:none;border-radius:8px;font-weight:600;cursor:pointer}.btn-primary{background:#6366f1;color:white}.deadline-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem}.deadline-card{border:1px solid #e2e8f0;border-radius:10px;padding:1rem}.deadline-card .type{background:#e2e8f0;padding:0.25rem 0.5rem;border-radius:4px;font-size:0.75rem;text-transform:uppercase}.deadline-card h4{margin:0.5rem 0}.deadline-card p{font-size:0.875rem;color:#64748b;margin:0}.empty{text-align:center;color:#64748b;padding:2rem}`]
})
export class DeadlineListComponent implements OnInit {
    subjects: any[] = []; deadlines: any[] = []; form = { subjectId: '', title: '', type: 'assignment', dueDate: '' };
    constructor(private api: ApiService) { }
    ngOnInit() { this.api.getMySubjects().subscribe({ next: (r: any) => this.subjects = r.subjects || [] }); this.load(); }
    load() { this.api.getDeadlines().subscribe({ next: (r: any) => this.deadlines = r.deadlines || [] }); }
    create() { this.api.createDeadline(this.form).subscribe({ next: () => { this.load(); this.form = { subjectId: '', title: '', type: 'assignment', dueDate: '' }; }, error: (e: any) => alert(e.error?.message || 'Error') }); }
    formatDate(d: string) { return new Date(d).toLocaleDateString(); }
}
