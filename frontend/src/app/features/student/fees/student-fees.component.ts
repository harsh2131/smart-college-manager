import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-fees',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <aside class="sidebar">
        <div class="sidebar-header"><h2>🎓 College Manager</h2><p>Student Portal</p></div>
        <nav class="sidebar-nav">
          <a routerLink="/student/dashboard" class="nav-item">📊 Dashboard</a>
          <a routerLink="/student/assignments" class="nav-item">📝 Assignments</a>
          <a routerLink="/student/fees" class="nav-item active">💰 Fees</a>
          <a routerLink="/student/results" class="nav-item">📋 Results</a>
          <a routerLink="/student/hallticket" class="nav-item">🎫 Hall Ticket</a>
          <a routerLink="/student/analytics" class="nav-item">📈 Analytics</a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info"><span>{{ studentInfo.name }}</span><small>{{ studentInfo.rollNumber }} | Sem {{ studentInfo.semester }}</small></div>
          <button (click)="logout()" class="btn-logout">Logout</button>
        </div>
      </aside>

      <main class="main-content">
        <header class="page-header">
          <div>
            <h1>💰 Fee Management</h1>
            <p>View and pay your semester fees</p>
          </div>
        </header>

        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Loading fee details...</p>
        </div>

        <div *ngIf="!loading" class="content">
          <!-- Student Info Card -->
          <div class="student-card">
            <div class="student-profile">
              <div class="student-avatar">{{ studentInfo.name?.charAt(0) || 'S' }}</div>
              <div class="student-info">
                <h3>{{ studentInfo.name }}</h3>
                <div class="student-details">
                  <span class="stream-badge" [class.bca]="studentInfo.stream === 'BCA'" [class.bba]="studentInfo.stream === 'BBA'">{{ studentInfo.stream }}</span>
                  <span>Semester {{ studentInfo.semester }}</span>
                  <span>Roll: {{ studentInfo.rollNumber }}</span>
                </div>
              </div>
            </div>
            <div class="payment-summary">
              <div class="summary-item" *ngIf="totalPending > 0">
                <span class="label">Total Pending</span>
                <span class="amount pending">₹{{ formatCurrency(totalPending) }}</span>
              </div>
              <div class="summary-item paid" *ngIf="totalPending === 0">
                <span class="label">Status</span>
                <span class="amount">✅ All Fees Paid</span>
              </div>
            </div>
          </div>

          <!-- Fee Cards -->
          <div class="fees-list">
            <div *ngFor="let fee of fees" class="fee-card" [class.paid]="fee.isPaid" [class.overdue]="isOverdue(fee)">
              <div class="fee-header">
                <div class="fee-title">
                  <h4>{{ fee.stream }} - Semester {{ fee.semester }}</h4>
                  <span class="academic-year">{{ fee.academicYear }}</span>
                </div>
                <div class="fee-status">
                  <span *ngIf="fee.isPaid" class="status-badge paid">✓ Paid</span>
                  <span *ngIf="!fee.isPaid && isOverdue(fee)" class="status-badge overdue">⚠️ Overdue</span>
                  <span *ngIf="!fee.isPaid && !isOverdue(fee)" class="status-badge pending">⏳ Pending</span>
                </div>
              </div>
              
              <div class="fee-breakdown">
                <div class="breakdown-grid">
                  <div class="breakdown-item">
                    <span class="breakdown-label">Tuition Fee</span>
                    <span class="breakdown-value">₹{{ formatCurrency(fee.feeBreakdown?.tuitionFee) }}</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="breakdown-label">Exam Fee</span>
                    <span class="breakdown-value">₹{{ formatCurrency(fee.feeBreakdown?.examFee) }}</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="breakdown-label">Library Fee</span>
                    <span class="breakdown-value">₹{{ formatCurrency(fee.feeBreakdown?.libraryFee) }}</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="breakdown-label">Lab Fee</span>
                    <span class="breakdown-value">₹{{ formatCurrency(fee.feeBreakdown?.labFee) }}</span>
                  </div>
                  <div class="breakdown-item" *ngIf="fee.feeBreakdown?.otherFee">
                    <span class="breakdown-label">Other Fee</span>
                    <span class="breakdown-value">₹{{ formatCurrency(fee.feeBreakdown?.otherFee) }}</span>
                  </div>
                </div>
                <div class="breakdown-total">
                  <span>Total Amount</span>
                  <span class="total-value">₹{{ formatCurrency(fee.totalAmount) }}</span>
                </div>
              </div>

              <!-- Paid Fee Actions -->
              <div *ngIf="fee.isPaid" class="fee-footer paid">
                <div class="payment-info">
                  <div class="receipt-details">
                    <span>Receipt: <strong>{{ fee.payment?.receiptNumber }}</strong></span>
                    <span>Paid on: {{ formatDate(fee.payment?.paymentDate) }}</span>
                    <span>Method: {{ fee.payment?.paymentMethod }}</span>
                  </div>
                </div>
                <button class="btn btn-download" (click)="downloadReceipt(fee)">
                  📄 Download Receipt
                </button>
              </div>

              <!-- Pending Fee Actions -->
              <div *ngIf="!fee.isPaid" class="fee-footer pending">
                <div class="due-info" *ngIf="fee.dueDate">
                  <span class="due-label">Due Date:</span>
                  <span class="due-date" [class.overdue]="isOverdue(fee)">{{ formatDate(fee.dueDate) }}</span>
                  <span *ngIf="isOverdue(fee)" class="overdue-days">{{ getOverdueDays(fee.dueDate) }} days overdue</span>
                </div>
                <button class="btn btn-pay" (click)="payFee(fee)" [disabled]="paying">
                  {{ paying ? 'Processing...' : '💳 Pay Now' }}
                </button>
              </div>
            </div>
          </div>

          <p *ngIf="!fees.length" class="empty">No fee records found for your semester.</p>

          <!-- Payment History -->
          <section class="card" *ngIf="paymentHistory.length">
            <h3>📜 Payment History</h3>
            <div class="history-list">
              <div *ngFor="let p of paymentHistory" class="history-item">
                <div class="history-icon">🧾</div>
                <div class="history-content">
                  <div class="history-main">
                    <strong>{{ p.receiptNumber }}</strong>
                    <span class="history-amount">₹{{ formatCurrency(p.amount) }}</span>
                  </div>
                  <div class="history-meta">
                    <span>{{ p.paymentMethod }}</span>
                    <span>{{ formatDate(p.paymentDate) }}</span>
                    <span class="status-badge" [class.paid]="p.status === 'completed'">{{ p.status }}</span>
                  </div>
                </div>
                <button class="btn-icon" (click)="downloadReceiptById(p)" title="Download Receipt">📥</button>
              </div>
            </div>
          </section>
        </div>
      </main>
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

    .main-content { margin-left: 260px; flex: 1; padding: 2rem; max-width: 900px; }
    
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { margin: 0 0 0.25rem; color: #1e293b; font-size: 1.75rem; }
    .page-header p { margin: 0; color: #64748b; }

    .loading { text-align: center; padding: 4rem; color: #64748b; }
    .spinner { width: 48px; height: 48px; margin: 0 auto 1rem; border: 4px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Student Card */
    .student-card { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #059669, #047857); color: white; padding: 1.5rem; border-radius: 16px; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .student-profile { display: flex; align-items: center; gap: 1rem; }
    .student-avatar { width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; }
    .student-info h3 { margin: 0 0 0.5rem; font-size: 1.25rem; }
    .student-details { display: flex; gap: 0.75rem; font-size: 0.875rem; opacity: 0.9; flex-wrap: wrap; }
    .stream-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-weight: 600; font-size: 0.75rem; }
    .stream-badge.bca { background: #dbeafe; color: #1d4ed8; }
    .stream-badge.bba { background: #fce7f3; color: #be185d; }
    .payment-summary { text-align: right; }
    .summary-item .label { display: block; font-size: 0.75rem; opacity: 0.8; }
    .summary-item .amount { font-size: 1.5rem; font-weight: 700; }
    .summary-item .amount.pending { color: #fde68a; }
    .summary-item.paid .amount { color: #86efac; }

    /* Fee Cards */
    .fees-list { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem; }
    .fee-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 2px solid #e2e8f0; }
    .fee-card.paid { border-color: #10b981; }
    .fee-card.overdue { border-color: #ef4444; }
    
    .fee-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .fee-title h4 { margin: 0 0 0.25rem; color: #1e293b; }
    .academic-year { background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    
    .status-badge { padding: 0.375rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.paid { background: #d1fae5; color: #065f46; }
    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.overdue { background: #fee2e2; color: #991b1b; }

    .fee-breakdown { padding: 1.5rem; }
    .breakdown-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1rem; }
    .breakdown-item { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px dashed #e2e8f0; }
    .breakdown-label { color: #64748b; font-size: 0.875rem; }
    .breakdown-value { font-weight: 500; color: #1e293b; }
    .breakdown-total { display: flex; justify-content: space-between; padding: 1rem; background: #f8fafc; border-radius: 8px; font-weight: 700; color: #1e293b; }
    .total-value { font-size: 1.25rem; color: #059669; }

    .fee-footer { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-top: 1px solid #e2e8f0; flex-wrap: wrap; gap: 1rem; }
    .fee-footer.paid { background: #ecfdf5; }
    .fee-footer.pending { background: #fffbeb; }
    .fee-card.overdue .fee-footer.pending { background: #fef2f2; }
    
    .receipt-details { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; color: #065f46; }
    .receipt-details strong { color: #047857; }
    
    .due-info { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .due-label { color: #92400e; font-size: 0.875rem; }
    .due-date { font-weight: 600; color: #78350f; }
    .due-date.overdue { color: #dc2626; }
    .overdue-days { font-size: 0.75rem; color: #dc2626; background: #fee2e2; padding: 0.25rem 0.5rem; border-radius: 4px; }

    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-pay { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
    .btn-pay:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); }
    .btn-pay:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
    .btn-download { background: #059669; color: white; }
    .btn-download:hover { background: #047857; }
    .btn-icon { background: none; border: none; font-size: 1.25rem; cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: background 0.2s; }
    .btn-icon:hover { background: #e2e8f0; }

    /* Payment History */
    .card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .card h3 { margin: 0 0 1rem; color: #1e293b; }
    .history-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .history-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8fafc; border-radius: 10px; }
    .history-icon { font-size: 1.5rem; }
    .history-content { flex: 1; }
    .history-main { display: flex; justify-content: space-between; margin-bottom: 0.25rem; }
    .history-main strong { color: #1e293b; }
    .history-amount { font-weight: 700; color: #059669; }
    .history-meta { display: flex; gap: 1rem; font-size: 0.75rem; color: #64748b; flex-wrap: wrap; }

    .empty { text-align: center; color: #94a3b8; padding: 2rem; }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main-content { margin-left: 0; padding: 1rem; }
      .student-card { flex-direction: column; text-align: center; }
      .payment-summary { text-align: center; }
      .breakdown-grid { grid-template-columns: 1fr; }
      .fee-footer { flex-direction: column; }
    }
  `]
})
export class StudentFeesComponent implements OnInit {
  loading = true;
  paying = false;
  fees: any[] = [];
  paymentHistory: any[] = [];
  studentInfo: any = {};
  totalPending = 0;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.studentInfo = user || {};
    this.loadFees();
    this.loadPaymentHistory();
  }

  loadFees(): void {
    this.apiService.getMyFees().subscribe({
      next: (res) => {
        this.fees = res.fees || [];
        if (res.student) {
          this.studentInfo = { ...this.studentInfo, ...res.student };
        }
        this.totalPending = res.totalPending || 0;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadPaymentHistory(): void {
    this.apiService.getPaymentHistory().subscribe({
      next: (res) => {
        this.paymentHistory = res.payments || [];
      }
    });
  }

  payFee(fee: any): void {
    if (confirm(`Pay ₹${this.formatCurrency(fee.totalAmount)} for ${fee.stream} Semester ${fee.semester}?`)) {
      this.paying = true;
      this.apiService.makePayment({ feeId: fee._id }).subscribe({
        next: (res) => {
          alert('Payment successful! Receipt: ' + res.payment.receiptNumber);
          this.paying = false;
          this.loadFees();
          this.loadPaymentHistory();
        },
        error: (err) => {
          alert(err.error?.message || 'Payment failed');
          this.paying = false;
        }
      });
    }
  }

  downloadReceipt(fee: any): void {
    this.generateReceiptPDF(fee.payment, fee);
  }

  downloadReceiptById(payment: any): void {
    this.generateReceiptPDF(payment, null);
  }

  generateReceiptPDF(payment: any, fee: any): void {
    // Create a printable receipt
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) {
      alert('Please allow popups to download the receipt');
      return;
    }

    const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Fee Receipt - ${payment.receiptNumber}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #059669; }
                    .header h1 { color: #059669; margin-bottom: 5px; }
                    .header p { color: #64748b; }
                    .receipt-title { text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; color: #1e293b; }
                    .receipt-number { text-align: center; background: #ecfdf5; padding: 10px; border-radius: 8px; margin-bottom: 30px; }
                    .details { margin-bottom: 30px; }
                    .details table { width: 100%; border-collapse: collapse; }
                    .details th, .details td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
                    .details th { color: #64748b; font-weight: 500; width: 40%; }
                    .details td { color: #1e293b; font-weight: 600; }
                    .amount-row td { font-size: 20px; color: #059669; }
                    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
                    .stamp { margin-top: 40px; display: flex; justify-content: space-between; }
                    .stamp-box { text-align: center; }
                    .stamp-box p { margin-top: 60px; border-top: 1px solid #1e293b; padding-top: 5px; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎓 Smart College Manager</h1>
                    <p>Official Fee Receipt</p>
                </div>
                <div class="receipt-title">FEE PAYMENT RECEIPT</div>
                <div class="receipt-number">
                    <strong>Receipt No:</strong> ${payment.receiptNumber}
                </div>
                <div class="details">
                    <table>
                        <tr><th>Student Name</th><td>${this.studentInfo.name || 'N/A'}</td></tr>
                        <tr><th>Roll Number</th><td>${this.studentInfo.rollNumber || 'N/A'}</td></tr>
                        <tr><th>Stream</th><td>${this.studentInfo.stream || 'N/A'}</td></tr>
                        <tr><th>Semester</th><td>${fee?.semester || this.studentInfo.semester || 'N/A'}</td></tr>
                        <tr><th>Academic Year</th><td>${fee?.academicYear || 'N/A'}</td></tr>
                        <tr><th>Payment Date</th><td>${this.formatDate(payment.paymentDate)}</td></tr>
                        <tr><th>Payment Method</th><td>${payment.paymentMethod || 'Online'}</td></tr>
                        <tr><th>Transaction ID</th><td>${payment.transactionId || 'N/A'}</td></tr>
                        <tr class="amount-row"><th>Amount Paid</th><td>₹${this.formatCurrency(payment.amount)}</td></tr>
                    </table>
                </div>
                <div class="stamp">
                    <div class="stamp-box">
                        <p>Student Signature</p>
                    </div>
                    <div class="stamp-box">
                        <p>Authorized Signature</p>
                    </div>
                </div>
                <div class="footer">
                    <p>This is a computer-generated receipt and does not require a physical signature.</p>
                    <p>For any queries, please contact the accounts department.</p>
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

    receiptWindow.document.write(content);
    receiptWindow.document.close();
  }

  isOverdue(fee: any): boolean {
    if (fee.isPaid || !fee.dueDate) return false;
    return new Date(fee.dueDate) < new Date();
  }

  getOverdueDays(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  }

  formatCurrency(amount: number): string {
    if (!amount) return '0';
    return amount.toLocaleString('en-IN');
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}
