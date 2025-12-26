import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-student-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1>👨‍🎓 Student Management</h1>
          <p>Manage all students</p>
        </div>
        <button class="btn btn-primary" (click)="showForm = true">+ Add Student</button>
      </header>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card blue">
          <span class="label">Total Students</span>
          <span class="value">{{ students.length }}</span>
        </div>
        <div class="summary-card purple">
          <span class="label">BCA</span>
          <span class="value">{{ getStreamCount('BCA') }}</span>
        </div>
        <div class="summary-card pink">
          <span class="label">BBA</span>
          <span class="value">{{ getStreamCount('BBA') }}</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <input type="text" [(ngModel)]="searchTerm" placeholder="Search by name, roll no, email..." (input)="filterStudents()">
        <select [(ngModel)]="filterStream" (change)="filterStudents()">
          <option value="">All Streams</option>
          <option value="BCA">BCA</option>
          <option value="BBA">BBA</option>
        </select>
        <select [(ngModel)]="filterSemester" (change)="filterStudents()">
          <option value="">All Semesters</option>
          <option *ngFor="let s of [1,2,3,4,5,6]" [value]="s">Semester {{ s }}</option>
        </select>
      </div>

      <!-- Student Form Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="resetForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editingStudent ? 'Edit' : 'Add' }} Student</h3>
          <form (ngSubmit)="saveStudent()">
            <div class="form-row">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" [(ngModel)]="studentForm.name" name="name" required>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" [(ngModel)]="studentForm.email" name="email" required>
              </div>
            </div>
            <div class="form-row" *ngIf="!editingStudent">
              <div class="form-group">
                <label>Password</label>
                <input type="password" [(ngModel)]="studentForm.password" name="password" required>
              </div>
              <div class="form-group">
                <label>Roll Number</label>
                <input type="text" [(ngModel)]="studentForm.rollNumber" name="rollNumber">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Stream</label>
                <select [(ngModel)]="studentForm.stream" name="stream" required>
                  <option value="BCA">BCA</option>
                  <option value="BBA">BBA</option>
                </select>
              </div>
              <div class="form-group">
                <label>Semester</label>
                <select [(ngModel)]="studentForm.semester" name="semester" required>
                  <option *ngFor="let s of [1,2,3,4,5,6]" [value]="s">Semester {{ s }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Division</label>
                <input type="text" [(ngModel)]="studentForm.division" name="division" placeholder="A, B, C...">
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="tel" [(ngModel)]="studentForm.phone" name="phone">
              </div>
            </div>
            <div class="form-group">
              <label>Address</label>
              <input type="text" [(ngModel)]="studentForm.address" name="address">
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="resetForm()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Students Table -->
      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Name</th>
              <th>Email</th>
              <th>Stream</th>
              <th>Semester</th>
              <th>Division</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of filteredStudents">
              <td><strong>{{ s.rollNumber || '-' }}</strong></td>
              <td>{{ s.name }}</td>
              <td>{{ s.email }}</td>
              <td><span class="stream-badge" [class.bca]="s.stream === 'BCA'" [class.bba]="s.stream === 'BBA'">{{ s.stream }}</span></td>
              <td>{{ s.semester }}</td>
              <td>{{ s.division || '-' }}</td>
              <td><span class="status-badge" [class.active]="s.isActive">{{ s.isActive ? 'Active' : 'Inactive' }}</span></td>
              <td>
                <button class="btn-icon" (click)="editStudent(s)">✏️</button>
                <button class="btn-icon danger" (click)="toggleStatus(s)">{{ s.isActive ? '🚫' : '✓' }}</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!filteredStudents.length" class="empty">No students found</p>
      </div>
    </div>
  `,
    styles: [`
    .page-container { padding: 2rem; margin-left: 260px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-header h1 { margin: 0 0 0.25rem; }
    .page-header p { margin: 0; color: #64748b; }

    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .summary-card { background: white; padding: 1.25rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .summary-card .label { display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
    .summary-card .value { font-size: 1.75rem; font-weight: 700; color: #1e293b; }
    .summary-card.blue { border-left: 4px solid #3b82f6; }
    .summary-card.purple { border-left: 4px solid #8b5cf6; }
    .summary-card.pink { border-left: 4px solid #ec4899; }

    .filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .filters input, .filters select { padding: 0.5rem 1rem; border: 2px solid #e2e8f0; border-radius: 8px; }
    .filters input { flex: 1; }

    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; padding: 2rem; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
    .modal h3 { margin: 0 0 1.5rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; font-size: 0.875rem; }
    .form-group input, .form-group select { width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; }
    .form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem; }

    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #6366f1; color: white; }
    .btn-secondary { background: #e2e8f0; color: #475569; }

    .card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .data-table th { background: #f8fafc; font-weight: 600; color: #64748b; font-size: 0.7rem; text-transform: uppercase; }

    .stream-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
    .stream-badge.bca { background: #dbeafe; color: #1d4ed8; }
    .stream-badge.bba { background: #fce7f3; color: #be185d; }
    .status-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; background: #fee2e2; color: #dc2626; }
    .status-badge.active { background: #d1fae5; color: #065f46; }

    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.25rem; }
    .empty { text-align: center; color: #94a3b8; padding: 2rem; }
  `]
})
export class StudentManagementComponent implements OnInit {
    students: any[] = [];
    filteredStudents: any[] = [];
    showForm = false;
    saving = false;
    editingStudent: any = null;
    searchTerm = '';
    filterStream = '';
    filterSemester = '';

    studentForm = {
        name: '',
        email: '',
        password: '',
        rollNumber: '',
        stream: 'BCA',
        semester: 1,
        division: '',
        phone: '',
        address: '',
        department: 'CSE',
        role: 'student'
    };

    constructor(private apiService: ApiService) { }

    ngOnInit(): void {
        this.loadStudents();
    }

    loadStudents(): void {
        this.apiService.getStudents().subscribe({
            next: (res) => {
                this.students = res.users || [];
                this.filterStudents();
            }
        });
    }

    filterStudents(): void {
        this.filteredStudents = this.students.filter(s => {
            const matchSearch = !this.searchTerm ||
                s.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                s.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                s.rollNumber?.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchStream = !this.filterStream || s.stream === this.filterStream;
            const matchSemester = !this.filterSemester || s.semester === parseInt(this.filterSemester);
            return matchSearch && matchStream && matchSemester;
        });
    }

    saveStudent(): void {
        this.saving = true;
        const request = this.editingStudent
            ? this.apiService.updateUser(this.editingStudent._id, this.studentForm)
            : this.apiService.createUser(this.studentForm);

        request.subscribe({
            next: () => {
                this.saving = false;
                this.resetForm();
                this.loadStudents();
            },
            error: (err) => {
                this.saving = false;
                alert(err.error?.message || 'Failed to save student');
            }
        });
    }

    editStudent(student: any): void {
        this.editingStudent = student;
        this.studentForm = { ...student, password: '' };
        this.showForm = true;
    }

    toggleStatus(student: any): void {
        const action = student.isActive ? 'deactivate' : 'activate';
        if (confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${student.name}?`)) {
            this.apiService.updateUser(student._id, { isActive: !student.isActive }).subscribe({
                next: () => this.loadStudents()
            });
        }
    }

    resetForm(): void {
        this.showForm = false;
        this.editingStudent = null;
        this.studentForm = { name: '', email: '', password: '', rollNumber: '', stream: 'BCA', semester: 1, division: '', phone: '', address: '', department: 'CSE', role: 'student' };
    }

    getStreamCount(stream: string): number {
        return this.students.filter(s => s.stream === stream).length;
    }
}
