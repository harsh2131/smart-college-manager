import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-fee-management',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1>💰 Fee Management</h1>
          <p>Create and manage fee structures</p>
        </div>
        <button class="btn btn-primary" (click)="showForm = true">+ Create Fee Structure</button>
      </header>

      <!-- Create Form Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="showForm = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editingFee ? 'Edit' : 'Create' }} Fee Structure</h3>
          <form (ngSubmit)="saveFee()">
            <div class="form-row">
              <div class="form-group">
                <label>Stream</label>
                <select [(ngModel)]="feeForm.stream" name="stream" required>
                  <option value="">Select Stream</option>
                  <option value="BCA">BCA</option>
                  <option value="BBA">BBA</option>
                </select>
              </div>
              <div class="form-group">
                <label>Semester</label>
                <select [(ngModel)]="feeForm.semester" name="semester" required>
                  <option *ngFor="let s of [1,2,3,4,5,6]" [value]="s">Semester {{ s }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Academic Year</label>
                <input type="text" [(ngModel)]="feeForm.academicYear" name="academicYear" placeholder="2024-25" required>
              </div>
              <div class="form-group">
                <label>Due Date</label>
                <input type="date" [(ngModel)]="feeForm.dueDate" name="dueDate">
              </div>
            </div>
            <h4>Fee Breakdown</h4>
            <div class="form-row">
              <div class="form-group">
                <label>Tuition Fee (₹)</label>
                <input type="number" [(ngModel)]="feeForm.feeBreakdown.tuitionFee" name="tuitionFee">
              </div>
              <div class="form-group">
                <label>Exam Fee (₹)</label>
                <input type="number" [(ngModel)]="feeForm.feeBreakdown.examFee" name="examFee">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Library Fee (₹)</label>
                <input type="number" [(ngModel)]="feeForm.feeBreakdown.libraryFee" name="libraryFee">
              </div>
              <div class="form-group">
                <label>Lab Fee (₹)</label>
                <input type="number" [(ngModel)]="feeForm.feeBreakdown.labFee" name="labFee">
              </div>
            </div>
            <div class="form-group">
              <label>Other Fee (₹)</label>
              <input type="number" [(ngModel)]="feeForm.feeBreakdown.otherFee" name="otherFee">
            </div>
            <div class="total-preview">
              Total: ₹{{ calculateTotal() }}
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="resetForm()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Fee List -->
      <div class="content">
        <div class="filters">
          <select [(ngModel)]="filterStream" (change)="loadFees()">
            <option value="">All Streams</option>
            <option value="BCA">BCA</option>
            <option value="BBA">BBA</option>
          </select>
          <select [(ngModel)]="filterSemester" (change)="loadFees()">
            <option value="">All Semesters</option>
            <option *ngFor="let s of [1,2,3,4,5,6]" [value]="s">Semester {{ s }}</option>
          </select>
        </div>

        <div class="fee-grid">
          <div *ngFor="let fee of fees" class="fee-card">
            <div class="fee-header">
              <span class="stream-badge" [class.bca]="fee.stream === 'BCA'" [class.bba]="fee.stream === 'BBA'">{{ fee.stream }}</span>
              <span class="semester">Semester {{ fee.semester }}</span>
            </div>
            <div class="fee-body">
              <div class="fee-amount">₹{{ formatCurrency(fee.totalAmount) }}</div>
              <div class="academic-year">{{ fee.academicYear }}</div>
            </div>
            <div class="fee-breakdown">
              <div class="breakdown-item"><span>Tuition</span><span>₹{{ fee.feeBreakdown?.tuitionFee || 0 }}</span></div>
              <div class="breakdown-item"><span>Exam</span><span>₹{{ fee.feeBreakdown?.examFee || 0 }}</span></div>
              <div class="breakdown-item"><span>Library</span><span>₹{{ fee.feeBreakdown?.libraryFee || 0 }}</span></div>
              <div class="breakdown-item"><span>Lab</span><span>₹{{ fee.feeBreakdown?.labFee || 0 }}</span></div>
            </div>
            <div class="fee-footer">
              <span class="due-date" *ngIf="fee.dueDate">Due: {{ formatDate(fee.dueDate) }}</span>
              <div class="actions">
                <button class="btn-icon" (click)="editFee(fee)">✏️</button>
                <button class="btn-icon danger" (click)="deleteFee(fee)">🗑️</button>
              </div>
            </div>
          </div>
        </div>

        <p *ngIf="!fees.length && !loading" class="empty">No fee structures found. Create one to get started.</p>
      </div>
    </div>
  `,
    styles: [`
    .page-container { padding: 2rem; margin-left: 260px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-header h1 { margin: 0 0 0.25rem; }
    .page-header p { margin: 0; color: #64748b; }

    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; padding: 2rem; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
    .modal h3 { margin: 0 0 1.5rem; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; font-size: 0.875rem; }
    .form-group input, .form-group select { width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem; }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #6366f1; }
    .modal h4 { margin: 1rem 0 0.75rem; font-size: 0.875rem; color: #64748b; }
    .total-preview { text-align: center; font-size: 1.5rem; font-weight: 700; padding: 1rem; background: #f0fdf4; border-radius: 8px; color: #16a34a; margin: 1rem 0; }
    .form-actions { display: flex; gap: 1rem; justify-content: flex-end; }

    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #6366f1; color: white; }
    .btn-secondary { background: #e2e8f0; color: #475569; }

    .filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .filters select { padding: 0.5rem 1rem; border: 2px solid #e2e8f0; border-radius: 8px; }

    .fee-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .fee-card { background: white; border-radius: 16px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .fee-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .stream-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .stream-badge.bca { background: #dbeafe; color: #1d4ed8; }
    .stream-badge.bba { background: #fce7f3; color: #be185d; }
    .semester { color: #64748b; font-size: 0.875rem; }
    .fee-body { text-align: center; padding: 1rem 0; border-bottom: 1px solid #e2e8f0; }
    .fee-amount { font-size: 2rem; font-weight: 700; color: #1e293b; }
    .academic-year { color: #64748b; font-size: 0.875rem; }
    .fee-breakdown { padding: 1rem 0; }
    .breakdown-item { display: flex; justify-content: space-between; font-size: 0.875rem; color: #64748b; padding: 0.25rem 0; }
    .fee-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
    .due-date { font-size: 0.75rem; color: #f59e0b; }
    .actions { display: flex; gap: 0.5rem; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.25rem; }

    .empty { text-align: center; color: #94a3b8; padding: 2rem; }
  `]
})
export class FeeManagementComponent implements OnInit {
    fees: any[] = [];
    loading = true;
    saving = false;
    showForm = false;
    editingFee: any = null;
    filterStream = '';
    filterSemester = '';

    feeForm = {
        stream: '',
        semester: 1,
        academicYear: this.getAcademicYear(),
        dueDate: '',
        feeBreakdown: {
            tuitionFee: 25000,
            examFee: 2000,
            libraryFee: 1000,
            labFee: 3000,
            otherFee: 0
        }
    };

    constructor(private apiService: ApiService) { }

    ngOnInit(): void {
        this.loadFees();
    }

    loadFees(): void {
        const params: any = {};
        if (this.filterStream) params.stream = this.filterStream;
        if (this.filterSemester) params.semester = this.filterSemester;

        this.apiService.getFees(params).subscribe({
            next: (res) => {
                this.fees = res.fees || [];
                this.loading = false;
            }
        });
    }

    saveFee(): void {
        this.saving = true;
        const data = { ...this.feeForm, totalAmount: this.calculateTotal() };

        const request = this.editingFee
            ? this.apiService.updateFee(this.editingFee._id, data)
            : this.apiService.createFee(data);

        request.subscribe({
            next: () => {
                this.saving = false;
                this.resetForm();
                this.loadFees();
            },
            error: (err) => {
                this.saving = false;
                alert(err.error?.message || 'Failed to save fee structure');
            }
        });
    }

    editFee(fee: any): void {
        this.editingFee = fee;
        this.feeForm = {
            stream: fee.stream,
            semester: fee.semester,
            academicYear: fee.academicYear,
            dueDate: fee.dueDate ? fee.dueDate.split('T')[0] : '',
            feeBreakdown: { ...fee.feeBreakdown }
        };
        this.showForm = true;
    }

    deleteFee(fee: any): void {
        if (confirm(`Delete fee structure for ${fee.stream} Semester ${fee.semester}?`)) {
            this.apiService.deleteFee(fee._id).subscribe({
                next: () => this.loadFees()
            });
        }
    }

    resetForm(): void {
        this.showForm = false;
        this.editingFee = null;
        this.feeForm = {
            stream: '',
            semester: 1,
            academicYear: this.getAcademicYear(),
            dueDate: '',
            feeBreakdown: { tuitionFee: 25000, examFee: 2000, libraryFee: 1000, labFee: 3000, otherFee: 0 }
        };
    }

    calculateTotal(): number {
        const b = this.feeForm.feeBreakdown;
        return (b.tuitionFee || 0) + (b.examFee || 0) + (b.libraryFee || 0) + (b.labFee || 0) + (b.otherFee || 0);
    }

    getAcademicYear(): string {
        const now = new Date();
        const year = now.getFullYear();
        return now.getMonth() >= 5 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
    }

    formatCurrency(amount: number): string {
        return (amount || 0).toLocaleString('en-IN');
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
}
