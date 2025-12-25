import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>🎓 Create Account</h1>
          <p>Join the Smart College Manager</p>
        </div>
        
        <form (ngSubmit)="register()" class="auth-form">
          <div class="form-group"><label>Full Name</label><input type="text" class="input" [(ngModel)]="formData.name" name="name" required></div>
          <div class="form-group"><label>Email</label><input type="email" class="input" [(ngModel)]="formData.email" name="email" required></div>
          <div class="form-group"><label>Password</label><input type="password" class="input" [(ngModel)]="formData.password" name="password" required></div>
          <div class="form-group">
            <label>Role</label>
            <select class="input" [(ngModel)]="formData.role" name="role">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <div class="form-group"><label>Department</label><input type="text" class="input" [(ngModel)]="formData.department" name="department" placeholder="e.g., CSE" required></div>
          
          <div *ngIf="formData.role === 'student'" class="grid-2">
            <div class="form-group"><label>Semester</label><input type="number" class="input" [(ngModel)]="formData.semester" name="semester" min="1" max="8"></div>
            <div class="form-group"><label>Division</label><input type="text" class="input" [(ngModel)]="formData.division" name="division" placeholder="e.g., A"></div>
          </div>
          
          <div *ngIf="error" class="error-message">{{ error }}</div>
          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">{{ loading ? 'Creating...' : 'Create Account' }}</button>
        </form>
        
        <p class="auth-footer">Already have an account? <a routerLink="/login">Login here</a></p>
      </div>
    </div>
  `,
    styles: [`
    .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .auth-card { background: white; border-radius: 20px; padding: 2.5rem; width: 100%; max-width: 480px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15); }
    .auth-header { text-align: center; margin-bottom: 2rem; }
    .auth-header h1 { font-size: 1.75rem; margin-bottom: 0.5rem; color: #1e293b; }
    .auth-header p { color: #64748b; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .input { width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem; box-sizing: border-box; }
    .input:focus { outline: none; border-color: #6366f1; }
    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #6366f1; color: white; }
    .btn-block { width: 100%; display: flex; justify-content: center; padding: 1rem; }
    .error-message { background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; text-align: center; }
    .auth-footer { text-align: center; margin-top: 1.5rem; color: #64748b; }
    .auth-footer a { color: #6366f1; font-weight: 600; text-decoration: none; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  `]
})
export class RegisterComponent {
    formData = { name: '', email: '', password: '', role: 'student', department: '', semester: 5, division: 'A' };
    error = '';
    loading = false;

    constructor(private authService: AuthService, private router: Router) { }

    register(): void {
        this.loading = true;
        this.error = '';
        this.authService.register(this.formData).subscribe({
            next: (res) => {
                this.loading = false;
                if (res.success) {
                    this.router.navigate([res.user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard']);
                }
            },
            error: (err) => { this.loading = false; this.error = err.error?.message || 'Registration failed.'; }
        });
    }
}
