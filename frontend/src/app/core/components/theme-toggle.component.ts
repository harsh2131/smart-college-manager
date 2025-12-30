import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';

@Component({
    selector: 'app-theme-toggle',
    standalone: true,
    imports: [CommonModule],
    template: `
        <button 
            class="theme-toggle" 
            (click)="themeService.toggleTheme()"
            [attr.aria-label]="(themeService.theme$ | async) === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            [title]="(themeService.theme$ | async) === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        >
            <span class="theme-icon">
                {{ (themeService.theme$ | async) === 'dark' ? '☀️' : '🌙' }}
            </span>
        </button>
    `,
    styles: [`
        .theme-toggle {
            background: var(--bg-secondary, #f3f4f6);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 6px;
            padding: 0.5rem;
            cursor: pointer;
            transition: background 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 40px;
            min-height: 40px;
        }
        
        .theme-toggle:hover {
            background: var(--bg-hover, #e5e7eb);
        }
        
        .theme-icon {
            font-size: 1.125rem;
            line-height: 1;
        }
    `]
})
export class ThemeToggleComponent {
    themeService = inject(ThemeService);
}
