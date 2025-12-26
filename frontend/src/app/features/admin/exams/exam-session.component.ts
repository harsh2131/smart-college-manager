import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-exam-session',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1>📅 Exam Sessions</h1>
          <p>Manage exam sessions and hall tickets</p>
        </div>
        <button class="btn btn-primary" (click)="showForm = true">+ Create Session</button>
      </header>

      <!-- Create Form Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="showForm = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editingSession ? 'Edit' : 'Create' }} Exam Session</h3>
          <form (ngSubmit)="saveSession()">
            <div class="form-group">
              <label>Session Name</label>
              <input type="text" [(ngModel)]="sessionForm.name" name="name" placeholder="Summer 2025" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Stream</label>
                <select [(ngModel)]="sessionForm.stream" name="stream" required>
                  <option value="">Select Stream</option>
                  <option value="BCA">BCA</option>
                  <option value="BBA">BBA</option>
                </select>
              </div>
              <div class="form-group">
                <label>Semester</label>
                <select [(ngModel)]="sessionForm.semester" name="semester" required>
                  <option *ngFor="let s of [1,2,3,4,5,6]" [value]="s">Semester {{ s }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Academic Year</label>
                <input type="text" [(ngModel)]="sessionForm.academicYear" name="academicYear" placeholder="2024-25" required>
              </div>
              <div class="form-group">
                <label>Exam Type</label>
                <select [(ngModel)]="sessionForm.examType" name="examType">
                  <option value="regular">Regular</option>
                  <option value="supplementary">Supplementary</option>
                  <option value="improvement">Improvement</option>
                </select>
              </div>
            </div>

            <h4>Exam Schedule</h4>
            <div *ngFor="let exam of sessionForm.examDates; let i = index" class="exam-date-row">
              <input type="text" [(ngModel)]="exam.subjectName" [name]="'subjectName'+i" placeholder="Subject Name">
              <input type="text" [(ngModel)]="exam.subjectCode" [name]="'subjectCode'+i" placeholder="Code">
              <input type="date" [(ngModel)]="exam.date" [name]="'date'+i">
              <input type="text" [(ngModel)]="exam.time" [name]="'time'+i" placeholder="Time">
              <button type="button" class="btn-icon" (click)="removeExamDate(i)">🗑️</button>
            </div>
            <button type="button" class="btn btn-secondary" (click)="addExamDate()">+ Add Subject</button>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="resetForm()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Sessions Grid -->
      <div class="sessions-grid">
        <div *ngFor="let session of sessions" class="session-card" [class.active]="session.isActive" [class.enabled]="session.hallTicketEnabled">
          <div class="session-header">
            <h3>{{ session.name }}</h3>
            <span class="type-badge">{{ session.examType }}</span>
          </div>
          <div class="session-info">
            <span class="stream-badge" [class.bca]="session.stream === 'BCA'" [class.bba]="session.stream === 'BBA'">{{ session.stream }}</span>
            <span>Semester {{ session.semester }}</span>
            <span>{{ session.academicYear }}</span>
          </div>
          <div class="exam-dates" *ngIf="session.examDates?.length">
            <h4>📆 Exam Dates</h4>
            <div *ngFor="let exam of session.examDates.slice(0, 3)" class="exam-item">
              <span>{{ exam.subjectName }}</span>
              <span>{{ formatDate(exam.date) }}</span>
            </div>
            <small *ngIf="session.examDates.length > 3">+{{ session.examDates.length - 3 }} more</small>
          </div>
          <div class="session-footer">
            <div class="hallticket-status">
              <span class="status-label">Hall Tickets:</span>
              <span class="status-value" [class.enabled]="session.hallTicketEnabled">
                {{ session.hallTicketEnabled ? '✓ Enabled' : '✗ Disabled' }}
              </span>
            </div>
            <div class="actions">
              <button class="btn" [class.btn-primary]="!session.hallTicketEnabled" [class.btn-danger]="session.hallTicketEnabled" (click)="toggleHallTicket(session)">
                {{ session.hallTicketEnabled ? 'Disable' : 'Enable' }} Hall Tickets
              </button>
              <button class="btn-icon" (click)="editSession(session)">✏️</button>
            </div>
          </div>
        </div>
      </div>

      <p *ngIf="!sessions.length && !loading" class="empty">No exam sessions found. Create one to get started.</p>
    </div>
  `,
    styles: [`
    .page-container { padding: 2rem; margin-left: 260px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-header h1 { margin: 0 0 0.25rem; }
    .page-header p { margin: 0; color: #64748b; }

    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; padding: 2rem; border-radius: 16px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
    .modal h3 { margin: 0 0 1.5rem; }
    .modal h4 { margin: 1.5rem 0 0.75rem; font-size: 0.875rem; color: #64748b; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; font-size: 0.875rem; }
    .form-group input, .form-group select { width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; }

    .exam-date-row { display: grid; grid-template-columns: 2fr 1fr 1.5fr 1.5fr auto; gap: 0.5rem; margin-bottom: 0.5rem; }
    .exam-date-row input { padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.875rem; }

    .form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; }
    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #6366f1; color: white; }
    .btn-secondary { background: #e2e8f0; color: #475569; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; }

    .sessions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
    .session-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 2px solid #e2e8f0; }
    .session-card.enabled { border-color: #10b981; }
    .session-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .session-header h3 { margin: 0; font-size: 1.1rem; }
    .type-badge { background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; text-transform: uppercase; }

    .session-info { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem; font-size: 0.875rem; color: #64748b; }
    .stream-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .stream-badge.bca { background: #dbeafe; color: #1d4ed8; }
    .stream-badge.bba { background: #fce7f3; color: #be185d; }

    .exam-dates { background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .exam-dates h4 { margin: 0 0 0.5rem; font-size: 0.875rem; }
    .exam-item { display: flex; justify-content: space-between; font-size: 0.8rem; padding: 0.25rem 0; color: #64748b; }

    .session-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
    .hallticket-status { font-size: 0.875rem; }
    .status-label { color: #64748b; }
    .status-value { font-weight: 600; color: #ef4444; }
    .status-value.enabled { color: #10b981; }
    .actions { display: flex; gap: 0.5rem; align-items: center; }

    .empty { text-align: center; color: #94a3b8; padding: 2rem; }
  `]
})
export class ExamSessionComponent implements OnInit {
    sessions: any[] = [];
    loading = true;
    saving = false;
    showForm = false;
    editingSession: any = null;

    sessionForm = {
        name: '',
        stream: '',
        semester: 1,
        academicYear: this.getAcademicYear(),
        examType: 'regular',
        examDates: [{ subjectName: '', subjectCode: '', date: '', time: '10:00 AM - 01:00 PM', venue: 'Main Hall' }]
    };

    constructor(private apiService: ApiService) { }

    ngOnInit(): void {
        this.loadSessions();
    }

    loadSessions(): void {
        this.apiService.getExamSessions().subscribe({
            next: (res) => {
                this.sessions = res.sessions || [];
                this.loading = false;
            }
        });
    }

    saveSession(): void {
        this.saving = true;
        const request = this.editingSession
            ? this.apiService.updateExamSession(this.editingSession._id, this.sessionForm)
            : this.apiService.createExamSession(this.sessionForm);

        request.subscribe({
            next: () => {
                this.saving = false;
                this.resetForm();
                this.loadSessions();
            },
            error: (err) => {
                this.saving = false;
                alert(err.error?.message || 'Failed to save session');
            }
        });
    }

    editSession(session: any): void {
        this.editingSession = session;
        this.sessionForm = {
            name: session.name,
            stream: session.stream,
            semester: session.semester,
            academicYear: session.academicYear,
            examType: session.examType,
            examDates: session.examDates || []
        };
        this.showForm = true;
    }

    toggleHallTicket(session: any): void {
        const enable = !session.hallTicketEnabled;
        this.apiService.enableHallTicket(session._id, enable).subscribe({
            next: (res) => {
                session.hallTicketEnabled = enable;
                alert(res.message);
            },
            error: (err) => alert(err.error?.message || 'Failed to update')
        });
    }

    addExamDate(): void {
        this.sessionForm.examDates.push({ subjectName: '', subjectCode: '', date: '', time: '10:00 AM - 01:00 PM', venue: 'Main Hall' });
    }

    removeExamDate(index: number): void {
        this.sessionForm.examDates.splice(index, 1);
    }

    resetForm(): void {
        this.showForm = false;
        this.editingSession = null;
        this.sessionForm = {
            name: '',
            stream: '',
            semester: 1,
            academicYear: this.getAcademicYear(),
            examType: 'regular',
            examDates: [{ subjectName: '', subjectCode: '', date: '', time: '10:00 AM - 01:00 PM', venue: 'Main Hall' }]
        };
    }

    getAcademicYear(): string {
        const now = new Date();
        const year = now.getFullYear();
        return now.getMonth() >= 5 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    }
}
