import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>🎓 College Manager</h1>
          <p>Smart Resource, Attendance & Deadline Manager</p>
        </div>
        
        <form (ngSubmit)="login()" class="auth-form">
          <div class="form-group">
            <label>Email</label>
            <input type="email" class="input" [(ngModel)]="email" name="email" 
                   placeholder="Enter your email" required>
          </div>
          
          <div class="form-group">
            <label>Password</label>
            <input type="password" class="input" [(ngModel)]="password" name="password" 
                   placeholder="Enter your password" required>
          </div>
          
          <div *ngIf="error" class="error-message">{{ error }}</div>
          
          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </form>
        
        <p class="auth-footer">
          Don't have an account? <a routerLink="/register">Register here</a>
        </p>
        
        <div class="demo-credentials">
          <p><strong>Demo Credentials:</strong></p>
          <p>👑 HOD: admin&#64;college.edu / admin123</p>
          <p>👨‍🏫 Teacher: sharma&#64;college.edu / password123</p>
          <p>👨‍🎓 Student: rahul&#64;college.edu / password123</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: #f3f4f6; }
    .auth-card { background: white; border-radius: 8px; padding: 2rem; width: 100%; max-width: 400px; border: 1px solid #e5e7eb; }
    .auth-header { text-align: center; margin-bottom: 1.5rem; }
    .auth-header h1 { font-size: 1.5rem; margin-bottom: 0.25rem; color: #111827; }
    .auth-header p { color: #6b7280; font-size: 0.875rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.375rem; font-weight: 500; color: #374151; font-size: 0.875rem; }
    .input { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; transition: border-color 0.15s; box-sizing: border-box; }
    .input:focus { outline: none; border-color: #2563eb; }
    .btn { padding: 0.625rem 1.25rem; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-block { width: 100%; display: flex; justify-content: center; padding: 0.75rem; font-size: 0.875rem; }
    .error-message { background: #fee2e2; color: #b91c1c; padding: 0.625rem; border-radius: 6px; margin-bottom: 1rem; text-align: center; font-size: 0.875rem; }
    .auth-footer { text-align: center; margin-top: 1.25rem; color: #6b7280; font-size: 0.875rem; }
    .auth-footer a { color: #2563eb; font-weight: 500; text-decoration: none; }
    .demo-credentials { margin-top: 1.25rem; padding: 0.875rem; background: #f9fafb; border-radius: 6px; font-size: 0.8125rem; border: 1px solid #e5e7eb; }
    .demo-credentials p { margin: 0.125rem 0; color: #6b7280; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) { }

  login(): void {
    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          // Redirect based on user role
          const role = res.user.role;
          if (role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else if (role === 'teacher') {
            this.router.navigate(['/teacher/dashboard']);
          } else {
            this.router.navigate(['/student/dashboard']);
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
