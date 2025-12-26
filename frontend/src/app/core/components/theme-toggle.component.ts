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
            background: var(--bg-secondary, #f1f5f9);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: 12px;
            padding: 0.625rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 44px;
            min-height: 44px;
        }
        
        .theme-toggle:hover {
            background: var(--bg-hover, #e2e8f0);
            transform: scale(1.05);
        }
        
        .theme-toggle:active {
            transform: scale(0.95);
        }
        
        .theme-icon {
            font-size: 1.25rem;
            line-height: 1;
            transition: transform 0.3s ease;
        }
        
        .theme-toggle:hover .theme-icon {
            transform: rotate(15deg);
        }
    `]
})
export class ThemeToggleComponent {
    themeService = inject(ThemeService);
}
