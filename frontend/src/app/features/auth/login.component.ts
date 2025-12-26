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
    .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .auth-card { background: white; border-radius: 20px; padding: 2.5rem; width: 100%; max-width: 420px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15); }
    .auth-header { text-align: center; margin-bottom: 2rem; }
    .auth-header h1 { font-size: 1.75rem; margin-bottom: 0.5rem; color: #1e293b; }
    .auth-header p { color: #64748b; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #1e293b; }
    .input { width: 100%; padding: 0.875rem 1rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s; box-sizing: border-box; }
    .input:focus { outline: none; border-color: #6366f1; }
    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: #6366f1; color: white; }
    .btn-primary:hover { background: #4f46e5; transform: translateY(-2px); }
    .btn-block { width: 100%; display: flex; justify-content: center; padding: 1rem; font-size: 1rem; }
    .error-message { background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; text-align: center; }
    .auth-footer { text-align: center; margin-top: 1.5rem; color: #64748b; }
    .auth-footer a { color: #6366f1; font-weight: 600; text-decoration: none; }
    .demo-credentials { margin-top: 1.5rem; padding: 1rem; background: #f1f5f9; border-radius: 8px; font-size: 0.875rem; }
    .demo-credentials p { margin: 0.25rem 0; color: #64748b; }
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
