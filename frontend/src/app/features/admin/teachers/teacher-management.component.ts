import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-teacher-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1>👨‍🏫 Teacher Management</h1>
          <p>Manage faculty members and assign streams</p>
        </div>
        <button class="btn btn-primary" (click)="showForm = true">+ Add Teacher</button>
      </header>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card blue">
          <span class="label">Total Teachers</span>
          <span class="value">{{ teachers.length }}</span>
        </div>
        <div class="summary-card purple">
          <span class="label">BCA Faculty</span>
          <span class="value">{{ getStreamCount('BCA') }}</span>
        </div>
        <div class="summary-card pink">
          <span class="label">BBA Faculty</span>
          <span class="value">{{ getStreamCount('BBA') }}</span>
        </div>
        <div class="summary-card green">
          <span class="label">HODs</span>
          <span class="value">{{ getHODCount() }}</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <input type="text" [(ngModel)]="searchTerm" placeholder="Search by name or email..." (input)="filterTeachers()">
        <select [(ngModel)]="filterStream" (change)="filterTeachers()">
          <option value="">All Streams</option>
          <option value="BCA">BCA Only</option>
          <option value="BBA">BBA Only</option>
          <option value="Both">Both Streams</option>
        </select>
      </div>

      <!-- Teacher Form Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="resetForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editingTeacher ? 'Edit' : 'Add' }} Teacher</h3>
          <form (ngSubmit)="saveTeacher()">
            <div class="form-row">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" [(ngModel)]="teacherForm.name" name="name" required>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" [(ngModel)]="teacherForm.email" name="email" required>
              </div>
            </div>
            <div class="form-row" *ngIf="!editingTeacher">
              <div class="form-group">
                <label>Password</label>
                <input type="password" [(ngModel)]="teacherForm.password" name="password" required>
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="tel" [(ngModel)]="teacherForm.phone" name="phone">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Assigned Stream</label>
                <select [(ngModel)]="teacherForm.stream" name="stream" required>
                  <option value="BCA">BCA Only</option>
                  <option value="BBA">BBA Only</option>
                  <option value="Both">Both Streams</option>
                </select>
                <small>Teachers can only manage students from assigned streams</small>
              </div>
              <div class="form-group">
                <label>Department</label>
                <select [(ngModel)]="teacherForm.department" name="department">
                  <option value="CSE">Computer Science</option>
                  <option value="BBA">Business Administration</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="teacherForm.isHOD" name="isHOD">
                <span>Designate as HOD (Head of Department)</span>
              </label>
              <small *ngIf="teacherForm.isHOD">This teacher will have additional privileges for their stream</small>
            </div>
            <div class="form-group" *ngIf="editingTeacher">
              <label>Change Role</label>
              <select [(ngModel)]="teacherForm.role" name="role">
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="resetForm()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Teachers Grid -->
      <div class="teachers-grid">
        <div *ngFor="let t of filteredTeachers" class="teacher-card" [class.inactive]="!t.isActive" [class.hod]="t.isHOD">
          <div class="teacher-avatar" [class.hod]="t.isHOD">{{ getInitials(t.name) }}</div>
          <div class="teacher-info">
            <h3>
              {{ t.name }}
              <span *ngIf="t.isHOD" class="hod-badge">HOD</span>
            </h3>
            <p>{{ t.email }}</p>
            <div class="teacher-badges">
              <span class="stream-badge" [class.bca]="t.stream === 'BCA'" [class.bba]="t.stream === 'BBA'" [class.both]="t.stream === 'Both'">
                {{ t.stream || 'Not Assigned' }}
              </span>
              <span class="dept-badge">{{ t.department }}</span>
            </div>
          </div>
          <div class="teacher-actions">
            <button class="btn-icon" (click)="editTeacher(t)" title="Edit">✏️</button>
            <button class="btn-icon" [class.danger]="t.isActive" (click)="toggleStatus(t)" title="{{ t.isActive ? 'Deactivate' : 'Activate' }}">
              {{ t.isActive ? '🚫' : '✓' }}
            </button>
          </div>
          <div class="status-indicator" [class.active]="t.isActive">
            {{ t.isActive ? 'Active' : 'Inactive' }}
          </div>
        </div>
      </div>

      <p *ngIf="!filteredTeachers.length" class="empty">No teachers found. Add one to get started.</p>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; margin-left: 260px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-header h1 { margin: 0 0 0.25rem; }
    .page-header p { margin: 0; color: #64748b; }

    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .summary-card { background: white; padding: 1.25rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .summary-card .label { display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
    .summary-card .value { font-size: 1.75rem; font-weight: 700; color: #1e293b; }
    .summary-card.blue { border-left: 4px solid #3b82f6; }
    .summary-card.purple { border-left: 4px solid #8b5cf6; }
    .summary-card.pink { border-left: 4px solid #ec4899; }
    .summary-card.green { border-left: 4px solid #10b981; }

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
    .form-group small { display: block; margin-top: 0.25rem; color: #64748b; font-size: 0.75rem; }
    .checkbox-group { background: #f8fafc; padding: 1rem; border-radius: 8px; }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
    .checkbox-label input { width: auto; }
    .checkbox-label span { font-weight: 500; }
    .form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; }

    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #6366f1; color: white; }
    .btn-secondary { background: #e2e8f0; color: #475569; }

    .teachers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
    .teacher-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: grid; grid-template-columns: auto 1fr auto; gap: 1rem; align-items: center; position: relative; border-left: 4px solid #e2e8f0; }
    .teacher-card.inactive { opacity: 0.6; }
    .teacher-card.hod { border-left-color: #10b981; }

    .teacher-avatar { width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; }
    .teacher-avatar.hod { background: linear-gradient(135deg, #10b981, #059669); }
    .teacher-info h3 { margin: 0 0 0.25rem; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .teacher-info p { margin: 0 0 0.5rem; color: #64748b; font-size: 0.875rem; }
    .teacher-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    
    .stream-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
    .stream-badge.bca { background: #dbeafe; color: #1d4ed8; }
    .stream-badge.bba { background: #fce7f3; color: #be185d; }
    .stream-badge.both { background: #dcfce7; color: #16a34a; }
    .dept-badge { background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; }
    .hod-badge { background: #d1fae5; color: #065f46; padding: 0.125rem 0.5rem; border-radius: 4px; font-size: 0.625rem; font-weight: 700; }

    .teacher-actions { display: flex; gap: 0.5rem; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.5rem; border-radius: 8px; }
    .btn-icon:hover { background: #f1f5f9; }
    .btn-icon.danger:hover { background: #fee2e2; }

    .status-indicator { position: absolute; top: 0.75rem; right: 0.75rem; font-size: 0.7rem; padding: 0.25rem 0.5rem; border-radius: 4px; background: #fee2e2; color: #dc2626; }
    .status-indicator.active { background: #d1fae5; color: #065f46; }

    .empty { text-align: center; color: #94a3b8; padding: 2rem; background: white; border-radius: 16px; }
  `]
})
export class TeacherManagementComponent implements OnInit {
  teachers: any[] = [];
  filteredTeachers: any[] = [];
  showForm = false;
  saving = false;
  editingTeacher: any = null;
  searchTerm = '';
  filterStream = '';

  teacherForm = {
    name: '',
    email: '',
    password: '',
    department: 'CSE',
    stream: 'BCA',
    isHOD: false,
    phone: '',
    role: 'teacher'
  };

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadTeachers();
  }

  loadTeachers(): void {
    this.apiService.getTeachers().subscribe({
      next: (res) => {
        this.teachers = res.users || [];
        this.filterTeachers();
      }
    });
  }

  filterTeachers(): void {
    this.filteredTeachers = this.teachers.filter(t => {
      const matchSearch = !this.searchTerm ||
        t.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStream = !this.filterStream || t.stream === this.filterStream || t.stream === 'Both';
      return matchSearch && matchStream;
    });
  }

  saveTeacher(): void {
    this.saving = true;
    const request = this.editingTeacher
      ? this.apiService.updateUser(this.editingTeacher._id, this.teacherForm)
      : this.apiService.createUser(this.teacherForm);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.resetForm();
        this.loadTeachers();
      },
      error: (err) => {
        this.saving = false;
        alert(err.error?.message || 'Failed to save teacher');
      }
    });
  }

  editTeacher(teacher: any): void {
    this.editingTeacher = teacher;
    this.teacherForm = { ...teacher, password: '' };
    this.showForm = true;
  }

  toggleStatus(teacher: any): void {
    const action = teacher.isActive ? 'deactivate' : 'activate';
    if (confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${teacher.name}?`)) {
      this.apiService.updateUser(teacher._id, { isActive: !teacher.isActive }).subscribe({
        next: () => this.loadTeachers()
      });
    }
  }

  resetForm(): void {
    this.showForm = false;
    this.editingTeacher = null;
    this.teacherForm = { name: '', email: '', password: '', department: 'CSE', stream: 'BCA', isHOD: false, phone: '', role: 'teacher' };
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getStreamCount(stream: string): number {
    return this.teachers.filter(t => t.stream === stream || t.stream === 'Both').length;
  }

  getHODCount(): number {
    return this.teachers.filter(t => t.isHOD).length;
  }
}
