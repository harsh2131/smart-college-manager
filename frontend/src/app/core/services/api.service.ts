import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getSubjects(params?: any): Observable<any> {
        return this.http.get(`${this.apiUrl}/subjects`, { params });
    }
    getMySubjects(): Observable<any> {
        return this.http.get(`${this.apiUrl}/subjects/my`);
    }
    createSubject(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/subjects`, data);
    }
    getSubjectStudents(subjectId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/subjects/${subjectId}/students`);
    }
    assignStudents(subjectId: string, studentIds: string[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/subjects/${subjectId}/students`, { studentIds });
    }

    markAttendance(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/attendance/mark`, data);
    }
    getAttendanceSummary(studentId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/attendance/summary/${studentId}`);
    }
    getAtRiskStudents(subjectId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/attendance/at-risk/${subjectId}`);
    }

    enterMarks(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/marks`, data);
    }
    getMarksSummary(studentId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/marks/summary/${studentId}`);
    }

    getDeadlines(params?: any): Observable<any> {
        return this.http.get(`${this.apiUrl}/deadlines`, { params });
    }
    getUpcomingDeadlines(): Observable<any> {
        return this.http.get(`${this.apiUrl}/deadlines/upcoming`);
    }
    createDeadline(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/deadlines`, data);
    }

    getStudentAnalytics(studentId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/analytics/student/${studentId}`);
    }
    getClassAnalytics(subjectId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/analytics/class/${subjectId}`);
    }
    getAllAtRisk(): Observable<any> {
        return this.http.get(`${this.apiUrl}/analytics/at-risk`);
    }
}
