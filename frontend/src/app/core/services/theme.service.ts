import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly THEME_KEY = 'smart-college-theme';
    private themeSubject = new BehaviorSubject<Theme>(this.getStoredTheme());

    constructor() {
        this.applyTheme(this.themeSubject.value);
    }

    /**
     * Get current theme as observable
     */
    get theme$(): Observable<Theme> {
        return this.themeSubject.asObservable();
    }

    /**
     * Get current theme value
     */
    get currentTheme(): Theme {
        return this.themeSubject.value;
    }

    /**
     * Check if dark mode is active
     */
    get isDarkMode(): boolean {
        return this.themeSubject.value === 'dark';
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme(): void {
        const newTheme = this.themeSubject.value === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * Set a specific theme
     */
    setTheme(theme: Theme): void {
        this.themeSubject.next(theme);
        this.applyTheme(theme);
        this.storeTheme(theme);
    }

    /**
     * Apply theme to DOM
     */
    private applyTheme(theme: Theme): void {
        const body = document.body;
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            body.classList.remove('light-theme');
        } else {
            body.classList.add('light-theme');
            body.classList.remove('dark-theme');
        }
    }

    /**
     * Get stored theme from localStorage
     */
    private getStoredTheme(): Theme {
        const stored = localStorage.getItem(this.THEME_KEY);
        if (stored === 'dark' || stored === 'light') {
            return stored;
        }
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Store theme in localStorage
     */
    private storeTheme(theme: Theme): void {
        localStorage.setItem(this.THEME_KEY, theme);
    }
}
