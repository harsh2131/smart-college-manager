import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-teacher-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>🎓 College Manager</h2>
          <p>Teacher Portal</p>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/teacher/dashboard" routerLinkActive="active" class="nav-item">📊 Dashboard</a>
          <a routerLink="/teacher/subjects" routerLinkActive="active" class="nav-item">📚 Subjects</a>
          <a routerLink="/teacher/attendance" routerLinkActive="active" class="nav-item">📋 Attendance</a>
          <a routerLink="/teacher/marks" routerLinkActive="active" class="nav-item">📝 Marks</a>
          <a routerLink="/teacher/assignments" routerLinkActive="active" class="nav-item">📄 Assignments</a>
          <a routerLink="/teacher/students" routerLinkActive="active" class="nav-item">👥 Students</a>
          <a routerLink="/teacher/analytics" routerLinkActive="active" class="nav-item">📈 Analytics</a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <span>{{ user?.name }}</span>
            <small>{{ user?.email }}</small>
          </div>
          <button (click)="logout()" class="btn-logout">Logout</button>
        </div>
      </aside>
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; background: #f9fafb; }
    .sidebar { width: 240px; background: #1e293b; color: white; position: fixed; height: 100vh; display: flex; flex-direction: column; z-index: 100; }
    .sidebar-header { padding: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .sidebar-header h2 { font-size: 1.125rem; margin: 0 0 0.125rem; }
    .sidebar-header p { font-size: 0.8125rem; opacity: 0.6; margin: 0; }
    .sidebar-nav { flex: 1; padding: 0.75rem 0; overflow-y: auto; }
    .nav-item { display: flex; align-items: center; gap: 0.625rem; padding: 0.75rem 1.25rem; color: rgba(255,255,255,0.6); text-decoration: none; font-size: 0.875rem; transition: background 0.15s; border-left: 2px solid transparent; }
    .nav-item:hover, .nav-item.active { background: rgba(255,255,255,0.08); color: white; border-left-color: #2563eb; }
    .sidebar-footer { padding: 0.875rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.08); }
    .user-info span { display: block; font-weight: 500; font-size: 0.875rem; }
    .user-info small { opacity: 0.6; font-size: 0.75rem; }
    .btn-logout { width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.08); border: none; color: white; border-radius: 4px; cursor: pointer; margin-top: 0.5rem; font-size: 0.8125rem; transition: background 0.15s; }
    .btn-logout:hover { background: rgba(255,255,255,0.12); }
    
    .main-content { margin-left: 240px; flex: 1; min-height: 100vh; }
    
    @media (max-width: 768px) { 
      .sidebar { display: none; } 
      .main-content { margin-left: 0; } 
    }
  `]
})
export class TeacherLayoutComponent implements OnInit {
  user: any = null;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}
