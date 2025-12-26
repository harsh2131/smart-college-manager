import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
    selector: 'app-payment-overview',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <h1>💳 Payment Overview</h1>
        <p>Track all fee payments</p>
      </header>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card green">
          <span class="label">Total Collected</span>
          <span class="value">₹{{ formatCurrency(summary.totalCollected) }}</span>
        </div>
        <div class="summary-card blue">
          <span class="label">BCA Payments</span>
          <span class="value">{{ summary.bcaCount || 0 }}</span>
        </div>
        <div class="summary-card purple">
          <span class="label">BBA Payments</span>
          <span class="value">{{ summary.bbaCount || 0 }}</span>
        </div>
        <div class="summary-card orange">
          <span class="label">Pending</span>
          <span class="value">{{ summary.pendingCount || 0 }}</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <select [(ngModel)]="filterStatus" (change)="loadPayments()">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select [(ngModel)]="filterStream" (change)="loadPayments()">
          <option value="">All Streams</option>
          <option value="BCA">BCA</option>
          <option value="BBA">BBA</option>
        </select>
      </div>

      <!-- Payments Table -->
      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Receipt No</th>
              <th>Student</th>
              <th>Stream/Sem</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of payments">
              <td><strong>{{ p.receiptNumber || '-' }}</strong></td>
              <td>
                <div class="student-cell">
                  <strong>{{ p.studentId?.name }}</strong>
                  <small>{{ p.studentId?.rollNumber }}</small>
                </div>
              </td>
              <td>{{ p.studentId?.stream }} - {{ p.studentId?.semester }}</td>
              <td>₹{{ formatCurrency(p.amount) }}</td>
              <td><span class="method-badge">{{ p.paymentMethod }}</span></td>
              <td>{{ formatDate(p.paymentDate) }}</td>
              <td>
                <span class="status-badge" [class.completed]="p.status === 'completed'" [class.pending]="p.status === 'pending'" [class.failed]="p.status === 'failed'">
                  {{ p.status }}
                </span>
              </td>
              <td>
                <button class="btn-small" (click)="viewReceipt(p)">📄</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!payments.length" class="empty">No payments found</p>
      </div>

      <!-- Pending Students -->
      <div class="card" *ngIf="summary.pendingStudents?.length">
        <h3>⚠️ Students with Pending Fees</h3>
        <div class="pending-list">
          <div *ngFor="let s of summary.pendingStudents" class="pending-item">
            <div>
              <strong>{{ s.name }}</strong>
              <small>{{ s.rollNumber }} | {{ s.stream }} - Sem {{ s.semester }}</small>
            </div>
            <button class="btn-small primary" (click)="recordManualPayment(s)">Record Payment</button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-container { padding: 2rem; margin-left: 260px; }
    .page-header h1 { margin: 0 0 0.25rem; }
    .page-header p { margin: 0 0 2rem; color: #64748b; }

    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .summary-card { background: white; padding: 1.25rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .summary-card .label { display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
    .summary-card .value { font-size: 1.75rem; font-weight: 700; color: #1e293b; }
    .summary-card.green { border-left: 4px solid #10b981; }
    .summary-card.blue { border-left: 4px solid #3b82f6; }
    .summary-card.purple { border-left: 4px solid #8b5cf6; }
    .summary-card.orange { border-left: 4px solid #f59e0b; }

    .filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .filters select { padding: 0.5rem 1rem; border: 2px solid #e2e8f0; border-radius: 8px; }

    .card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem; }
    .card h3 { margin: 0 0 1rem; }

    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .data-table th { background: #f8fafc; font-weight: 600; color: #64748b; font-size: 0.7rem; text-transform: uppercase; }
    .student-cell strong { display: block; }
    .student-cell small { color: #94a3b8; }

    .method-badge { background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; text-transform: uppercase; }
    .status-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
    .status-badge.completed { background: #d1fae5; color: #065f46; }
    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.failed { background: #fee2e2; color: #dc2626; }

    .btn-small { padding: 0.25rem 0.5rem; border: none; background: #e2e8f0; border-radius: 4px; cursor: pointer; }
    .btn-small.primary { background: #6366f1; color: white; }

    .pending-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .pending-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #fef3c7; border-radius: 8px; }
    .pending-item small { display: block; color: #78350f; }

    .empty { text-align: center; color: #94a3b8; padding: 2rem; }
  `]
})
export class PaymentOverviewComponent implements OnInit {
    payments: any[] = [];
    summary: any = {};
    filterStatus = '';
    filterStream = '';

    constructor(private apiService: ApiService) { }

    ngOnInit(): void {
        this.loadPayments();
        this.loadSummary();
    }

    loadPayments(): void {
        const params: any = {};
        if (this.filterStatus) params.status = this.filterStatus;
        if (this.filterStream) params.stream = this.filterStream;

        this.apiService.getAllPayments(params).subscribe({
            next: (res) => this.payments = res.payments || []
        });
    }

    loadSummary(): void {
        this.apiService.getPaymentSummary().subscribe({
            next: (res) => this.summary = res.summary || {}
        });
    }

    viewReceipt(payment: any): void {
        alert(`Receipt: ${payment.receiptNumber}\nAmount: ₹${payment.amount}\nTransaction ID: ${payment.transactionId}`);
    }

    recordManualPayment(student: any): void {
        if (confirm(`Record manual payment for ${student.name}?`)) {
            // Would need fee selection - simplified for now
            alert('Manual payment recording would open a dialog to select fee and payment method.');
        }
    }

    formatCurrency(amount: number): string {
        return (amount || 0).toLocaleString('en-IN');
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
}
