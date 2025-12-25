import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
    _id: string;
    userId: string;
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    department: string;
    semester?: number;
    division?: string;
    rollNumber?: string;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    user: User;
    message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private apiUrl = environment.apiUrl;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadUser();
    }

    private loadUser(): void {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            this.currentUserSubject.next(JSON.parse(user));
        }
    }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
            .pipe(tap(res => {
                if (res.success) {
                    localStorage.setItem('token', res.token);
                    localStorage.setItem('user', JSON.stringify(res.user));
                    this.currentUserSubject.next(res.user);
                }
            }));
    }

    register(userData: any): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, userData)
            .pipe(tap(res => {
                if (res.success) {
                    localStorage.setItem('token', res.token);
                    localStorage.setItem('user', JSON.stringify(res.user));
                    this.currentUserSubject.next(res.user);
                }
            }));
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    isTeacher(): boolean {
        const user = this.getCurrentUser();
        return user?.role === 'teacher' || user?.role === 'admin';
    }

    isStudent(): boolean {
        return this.getCurrentUser()?.role === 'student';
    }
}
