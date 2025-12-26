import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-student-assignments',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    template: `
    <div class="page-container">
      <aside class="sidebar">
        <div class="sidebar-header"><h2>🎓 College Manager</h2><p>Student Portal</p></div>
        <nav class="sidebar-nav">
          <a routerLink="/student/dashboard" class="nav-item">📊 Dashboard</a>
          <a routerLink="/student/assignments" class="nav-item active">📝 Assignments</a>
          <a routerLink="/student/fees" class="nav-item">💰 Fees</a>
          <a routerLink="/student/results" class="nav-item">📋 Results</a>
          <a routerLink="/student/hallticket" class="nav-item">🎫 Hall Ticket</a>
          <a routerLink="/student/analytics" class="nav-item">📈 Analytics</a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info"><span>{{ user?.name }}</span><small>{{ user?.rollNumber }} | Sem {{ user?.semester }}</small></div>
          <button (click)="logout()" class="btn-logout">Logout</button>
        </div>
      </aside>

      <main class="main-content">
        <header class="page-header">
          <div>
            <h1>📝 My Assignments</h1>
            <p>View and submit your assignments</p>
          </div>
          <div class="filters">
            <select [(ngModel)]="filterStatus" (change)="applyFilter()">
              <option value="all">All Assignments</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </header>

        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-icon">📚</span>
            <div class="stat-info">
              <span class="stat-value">{{ assignments.length }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
          <div class="stat-card pending">
            <span class="stat-icon">⏳</span>
            <div class="stat-info">
              <span class="stat-value">{{ getPendingCount() }}</span>
              <span class="stat-label">Pending</span>
            </div>
          </div>
          <div class="stat-card submitted">
            <span class="stat-icon">✅</span>
            <div class="stat-info">
              <span class="stat-value">{{ getSubmittedCount() }}</span>
              <span class="stat-label">Submitted</span>
            </div>
          </div>
          <div class="stat-card overdue">
            <span class="stat-icon">⚠️</span>
            <div class="stat-info">
              <span class="stat-value">{{ getOverdueCount() }}</span>
              <span class="stat-label">Overdue</span>
            </div>
          </div>
        </div>

        <div class="assignments-list" *ngIf="!loading">
          <div *ngFor="let a of filteredAssignments" class="assignment-card" 
               [class.submitted]="a.isSubmitted" 
               [class.overdue]="isOverdue(a) && !a.isSubmitted">
            <div class="assignment-header">
              <div class="assignment-info">
                <span class="subject-badge">{{ a.subjectId?.subjectCode }}</span>
                <span class="type-badge" [class]="'type-' + (a.type || 'home')">{{ getTypeLabel(a.type) }}</span>
                <h3>{{ a.title }}</h3>
              </div>
              <div class="status-badge" [class.submitted]="a.isSubmitted" [class.pending]="!a.isSubmitted && !isOverdue(a)" [class.overdue]="isOverdue(a) && !a.isSubmitted">
                {{ a.isSubmitted ? '✓ Submitted' : (isOverdue(a) ? '⚠️ Overdue' : '⏳ Pending') }}
              </div>
            </div>
            
            <p class="description" *ngIf="a.description">{{ a.description }}</p>
            
            <div class="assignment-meta">
              <span class="due-date" [class.urgent]="getDaysRemaining(a.dueDate) <= 1 && !a.isSubmitted">
                📅 Due: {{ formatDate(a.dueDate) }}
                <span *ngIf="!a.isSubmitted && !isOverdue(a)" class="days-left">({{ getDaysRemaining(a.dueDate) }} days left)</span>
              </span>
              <span class="teacher">👨‍🏫 {{ a.createdBy?.name || 'Teacher' }}</span>
            </div>

            <div class="submission-section" *ngIf="a.isSubmitted">
              <div class="submission-info">
                <span>📄 {{ a.submission?.originalName || 'File Submitted' }}</span>
                <span class="submission-date">Submitted {{ formatTimeAgo(a.submission?.submittedAt) }}</span>
                <span *ngIf="a.submission?.marks !== null && a.submission?.marks !== undefined" class="marks-badge">
                  Marks: {{ a.submission.marks }}
                </span>
                <span *ngIf="a.submission?.marks === null || a.submission?.marks === undefined" class="grading-pending">
                  Grading Pending
                </span>
              </div>
            </div>

            <div class="upload-section" *ngIf="!a.isSubmitted">
              <div class="upload-area" (click)="fileInput.click()" (dragover)="onDragOver($event)" (drop)="onDrop($event, a)">
                <input #fileInput type="file" hidden (change)="onFileSelect($event, a)" accept=".pdf,.doc,.docx,.zip,.rar">
                <span class="upload-icon">📁</span>
                <p>Click or drag file to upload</p>
                <small>PDF, DOC, DOCX, ZIP (max 10MB)</small>
              </div>
              <div *ngIf="uploading && uploadingFor === a._id" class="uploading">
                <div class="upload-progress">
                  <div class="progress-bar" [style.width.%]="uploadProgress"></div>
                </div>
                <span>Uploading... {{ uploadProgress }}%</span>
              </div>
            </div>
          </div>

          <div *ngIf="!filteredAssignments.length" class="empty-state">
            <span class="empty-icon">📭</span>
            <h3>No assignments found</h3>
            <p>{{ filterStatus === 'all' ? 'No assignments available for your semester yet.' : 'No ' + filterStatus + ' assignments.' }}</p>
          </div>
        </div>

        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Loading assignments...</p>
        </div>
      </main>
    </div>

    <!-- Toast Notification -->
    <div class="toast" *ngIf="toast.show" [class.success]="toast.type === 'success'" [class.error]="toast.type === 'error'">
      {{ toast.message }}
    </div>
  `,
    styles: [`
    .page-container { display: flex; min-height: 100vh; background: #f8fafc; }
    
    .sidebar { width: 260px; background: linear-gradient(180deg, #059669 0%, #047857 100%); color: white; position: fixed; height: 100vh; display: flex; flex-direction: column; z-index: 100; }
    .sidebar-header { padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .sidebar-header h2 { font-size: 1.25rem; margin: 0 0 0.25rem; }
    .sidebar-header p { font-size: 0.875rem; opacity: 0.7; margin: 0; }
    .sidebar-nav { flex: 1; padding: 1rem 0; }
    .nav-item { display: block; padding: 0.875rem 1.5rem; color: rgba(255,255,255,0.7); text-decoration: none; transition: all 0.2s; }
    .nav-item.active, .nav-item:hover { background: rgba(255,255,255,0.1); color: white; }
    .sidebar-footer { padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
    .user-info span { display: block; font-weight: 500; }
    .user-info small { opacity: 0.7; }
    .btn-logout { width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 6px; cursor: pointer; margin-top: 0.5rem; }
    .btn-logout:hover { background: rgba(255,255,255,0.2); }

    .main-content { margin-left: 260px; flex: 1; padding: 2rem; }
    
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-header h1 { font-size: 1.75rem; color: #1e293b; margin: 0 0 0.25rem; }
    .page-header p { color: #64748b; margin: 0; }
    .filters select { padding: 0.5rem 1rem; border: 2px solid #e2e8f0; border-radius: 8px; background: white; }

    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .stat-icon { font-size: 2rem; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; display: block; }
    .stat-label { font-size: 0.875rem; color: #64748b; }
    .stat-card.pending { border-left: 4px solid #f59e0b; }
    .stat-card.submitted { border-left: 4px solid #10b981; }
    .stat-card.overdue { border-left: 4px solid #ef4444; }

    .assignments-list { display: flex; flex-direction: column; gap: 1rem; }
    
    .assignment-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 2px solid transparent; transition: all 0.2s; }
    .assignment-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .assignment-card.submitted { border-color: #d1fae5; background: linear-gradient(135deg, #f0fdf4 0%, white 100%); }
    .assignment-card.overdue { border-color: #fee2e2; background: linear-gradient(135deg, #fef2f2 0%, white 100%); }

    .assignment-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
    .assignment-info { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .subject-badge { padding: 0.25rem 0.75rem; background: #6366f1; color: white; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .type-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
    .type-badge.type-home { background: #dbeafe; color: #1d4ed8; }
    .type-badge.type-class { background: #fce7f3; color: #be185d; }
    .type-badge.type-documentation { background: #d1fae5; color: #065f46; }
    .type-badge.type-ppt { background: #fed7aa; color: #c2410c; }
    .assignment-info h3 { margin: 0; font-size: 1.125rem; color: #1e293b; }

    .status-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.submitted { background: #d1fae5; color: #065f46; }
    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.overdue { background: #fee2e2; color: #991b1b; }

    .description { color: #64748b; font-size: 0.875rem; margin: 0 0 1rem; line-height: 1.5; }

    .assignment-meta { display: flex; gap: 1.5rem; font-size: 0.875rem; color: #64748b; flex-wrap: wrap; }
    .due-date.urgent { color: #dc2626; font-weight: 600; }
    .days-left { color: #f59e0b; }

    .submission-section { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
    .submission-info { display: flex; align-items: center; gap: 1rem; font-size: 0.875rem; color: #64748b; flex-wrap: wrap; }
    .submission-date { color: #94a3b8; }
    .marks-badge { padding: 0.25rem 0.5rem; background: #d1fae5; color: #065f46; border-radius: 4px; font-weight: 600; }
    .grading-pending { padding: 0.25rem 0.5rem; background: #fef3c7; color: #92400e; border-radius: 4px; font-size: 0.75rem; }

    .upload-section { margin-top: 1rem; }
    .upload-area { border: 2px dashed #e2e8f0; border-radius: 12px; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.2s; }
    .upload-area:hover { border-color: #6366f1; background: #f8fafc; }
    .upload-icon { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
    .upload-area p { margin: 0; color: #475569; font-weight: 500; }
    .upload-area small { color: #94a3b8; }

    .uploading { margin-top: 1rem; text-align: center; }
    .upload-progress { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; }
    .progress-bar { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); transition: width 0.3s; }

    .empty-state { text-align: center; padding: 4rem 2rem; background: white; border-radius: 16px; }
    .empty-icon { font-size: 4rem; display: block; margin-bottom: 1rem; }
    .empty-state h3 { color: #1e293b; margin: 0 0 0.5rem; }
    .empty-state p { color: #64748b; margin: 0; }

    .loading { text-align: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .toast { position: fixed; bottom: 2rem; right: 2rem; padding: 1rem 1.5rem; border-radius: 12px; color: white; font-weight: 500; z-index: 1000; animation: slideIn 0.3s ease; }
    .toast.success { background: #10b981; }
    .toast.error { background: #ef4444; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main-content { margin-left: 0; padding: 1rem; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .assignment-meta { flex-direction: column; gap: 0.5rem; }
    }
  `]
})
export class StudentAssignmentsComponent implements OnInit {
    user: any = null;
    assignments: any[] = [];
    filteredAssignments: any[] = [];
    loading = true;
    filterStatus = 'all';
    uploading = false;
    uploadProgress = 0;
    uploadingFor = '';
    toast = { show: false, message: '', type: 'success' };

    constructor(
        private apiService: ApiService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.user = this.authService.getCurrentUser();
        this.loadAssignments();
    }

    loadAssignments(): void {
        this.loading = true;
        this.apiService.getAssignments().subscribe({
            next: (res) => {
                const assignments = res.assignments || [];
                // Get user's submissions
                if (this.user?._id) {
                    this.apiService.getStudentSubmissions(this.user._id).subscribe({
                        next: (subRes) => {
                            const submissions = subRes.submissions || [];
                            // Mark assignments as submitted
                            this.assignments = assignments.map((a: any) => {
                                const submission = submissions.find((s: any) => s.assignmentId?._id === a._id);
                                return { ...a, isSubmitted: !!submission, submission };
                            });
                            this.applyFilter();
                            this.loading = false;
                        },
                        error: () => {
                            this.assignments = assignments.map((a: any) => ({ ...a, isSubmitted: false }));
                            this.applyFilter();
                            this.loading = false;
                        }
                    });
                } else {
                    this.assignments = assignments.map((a: any) => ({ ...a, isSubmitted: false }));
                    this.applyFilter();
                    this.loading = false;
                }
            },
            error: (err) => {
                console.error('Load assignments error:', err);
                this.loading = false;
                this.showToast('Failed to load assignments', 'error');
            }
        });
    }

    applyFilter(): void {
        switch (this.filterStatus) {
            case 'pending':
                this.filteredAssignments = this.assignments.filter(a => !a.isSubmitted && !this.isOverdue(a));
                break;
            case 'submitted':
                this.filteredAssignments = this.assignments.filter(a => a.isSubmitted);
                break;
            case 'overdue':
                this.filteredAssignments = this.assignments.filter(a => this.isOverdue(a) && !a.isSubmitted);
                break;
            default:
                this.filteredAssignments = [...this.assignments];
        }
    }

    getPendingCount(): number {
        return this.assignments.filter(a => !a.isSubmitted && !this.isOverdue(a)).length;
    }

    getSubmittedCount(): number {
        return this.assignments.filter(a => a.isSubmitted).length;
    }

    getOverdueCount(): number {
        return this.assignments.filter(a => this.isOverdue(a) && !a.isSubmitted).length;
    }

    isOverdue(assignment: any): boolean {
        return new Date(assignment.dueDate) < new Date();
    }

    getDaysRemaining(date: string): number {
        const d = new Date(date);
        const now = new Date();
        return Math.max(0, Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    formatTimeAgo(date: string): string {
        if (!date) return '';
        const d = new Date(date);
        const now = new Date();
        const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }

    getTypeLabel(type: string): string {
        const labels: { [key: string]: string } = {
            'home': '🏠 Home',
            'class': '📚 Class',
            'documentation': '📄 Docs',
            'ppt': '📊 PPT'
        };
        return labels[type] || '🏠 Home';
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    onDrop(event: DragEvent, assignment: any): void {
        event.preventDefault();
        event.stopPropagation();
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.uploadFile(files[0], assignment);
        }
    }

    onFileSelect(event: any, assignment: any): void {
        const file = event.target.files[0];
        if (file) {
            this.uploadFile(file, assignment);
        }
    }

    uploadFile(file: File, assignment: any): void {
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            this.showToast('File size must be less than 10MB', 'error');
            return;
        }

        // Validate file type
        const allowedTypes = ['.pdf', '.doc', '.docx', '.zip', '.rar'];
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedTypes.includes(ext)) {
            this.showToast('Invalid file type. Allowed: PDF, DOC, DOCX, ZIP, RAR', 'error');
            return;
        }

        this.uploading = true;
        this.uploadingFor = assignment._id;
        this.uploadProgress = 0;

        // First upload the file
        const formData = new FormData();
        formData.append('file', file);

        // Simulate progress
        const progressInterval = setInterval(() => {
            if (this.uploadProgress < 90) {
                this.uploadProgress += 10;
            }
        }, 200);

        this.apiService.uploadFile(formData).subscribe({
            next: (uploadRes) => {
                clearInterval(progressInterval);
                this.uploadProgress = 100;

                // Now submit the assignment
                const submissionData = {
                    assignmentId: assignment._id,
                    fileUrl: uploadRes.file?.url || uploadRes.fileUrl || uploadRes.url,
                    originalName: file.name,
                    fileSize: file.size,
                    fileType: file.type
                };

                this.apiService.submitAssignment(submissionData).subscribe({
                    next: (subRes) => {
                        this.uploading = false;
                        this.uploadingFor = '';
                        this.showToast('Assignment submitted successfully! 🎉', 'success');
                        // Update the assignment status locally
                        assignment.isSubmitted = true;
                        assignment.submission = subRes.submission;
                        this.applyFilter();
                    },
                    error: (err) => {
                        this.uploading = false;
                        this.uploadingFor = '';
                        this.showToast(err.error?.message || 'Failed to submit assignment', 'error');
                    }
                });
            },
            error: (err) => {
                clearInterval(progressInterval);
                this.uploading = false;
                this.uploadingFor = '';
                this.showToast('Failed to upload file', 'error');
            }
        });
    }

    showToast(message: string, type: 'success' | 'error'): void {
        this.toast = { show: true, message, type };
        setTimeout(() => {
            this.toast.show = false;
        }, 4000);
    }

    logout(): void {
        this.authService.logout();
        window.location.href = '/login';
    }
}
