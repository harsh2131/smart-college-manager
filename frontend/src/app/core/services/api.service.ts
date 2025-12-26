import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    // Subjects
    getSubjects(params?: any): Observable<any> { return this.http.get(`${this.apiUrl}/subjects`, { params }); }
    getMySubjects(): Observable<any> { return this.http.get(`${this.apiUrl}/subjects/my`); }
    createSubject(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/subjects`, data); }
    getSubjectStudents(subjectId: string): Observable<any> { return this.http.get(`${this.apiUrl}/subjects/${subjectId}/students`); }
    assignStudents(subjectId: string, studentIds: string[]): Observable<any> { return this.http.post(`${this.apiUrl}/subjects/${subjectId}/students`, { studentIds }); }

    // Attendance
    markAttendance(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/attendance/mark`, data); }
    getAttendanceSummary(studentId: string): Observable<any> { return this.http.get(`${this.apiUrl}/attendance/summary/${studentId}`); }
    getAttendanceByDate(subjectId: string, date: string): Observable<any> { return this.http.get(`${this.apiUrl}/attendance/subject/${subjectId}/date/${date}`); }
    getAtRiskStudents(subjectId: string): Observable<any> { return this.http.get(`${this.apiUrl}/attendance/at-risk/${subjectId}`); }
    updateAttendance(id: string, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/attendance/${id}`, data); }

    // Marks
    enterMarks(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/marks`, data); }
    getMarksSummary(studentId: string): Observable<any> { return this.http.get(`${this.apiUrl}/marks/summary/${studentId}`); }
    getStudentSubjectMarks(studentId: string, subjectId: string): Observable<any> { return this.http.get(`${this.apiUrl}/marks/student/${studentId}/subject/${subjectId}`); }

    // Deadlines
    getDeadlines(params?: any): Observable<any> { return this.http.get(`${this.apiUrl}/deadlines`, { params }); }
    getUpcomingDeadlines(): Observable<any> { return this.http.get(`${this.apiUrl}/deadlines/upcoming`); }
    createDeadline(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/deadlines`, data); }

    // Assignments (NEW)
    getAssignments(params?: any): Observable<any> { return this.http.get(`${this.apiUrl}/assignments`, { params }); }
    createAssignment(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/assignments`, data); }
    getAssignment(id: string): Observable<any> { return this.http.get(`${this.apiUrl}/assignments/${id}`); }
    updateAssignment(id: string, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/assignments/${id}`, data); }
    deleteAssignment(id: string): Observable<any> { return this.http.delete(`${this.apiUrl}/assignments/${id}`); }
    getPendingReviews(): Observable<any> { return this.http.get(`${this.apiUrl}/assignments/pending-review`); }

    // Submissions (NEW)
    submitAssignment(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/submissions`, data); }
    getSubmissions(assignmentId: string): Observable<any> { return this.http.get(`${this.apiUrl}/submissions/assignment/${assignmentId}`); }
    gradeSubmission(id: string, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/submissions/${id}/grade`, data); }
    getStudentSubmissions(studentId: string): Observable<any> { return this.http.get(`${this.apiUrl}/submissions/student/${studentId}`); }

    // File Upload
    uploadFile(formData: FormData): Observable<any> { return this.http.post(`${this.apiUrl}/upload`, formData); }

    // Analytics
    getTeacherDashboard(): Observable<any> { return this.http.get(`${this.apiUrl}/analytics/teacher-dashboard`); }
    getStudentDashboard(): Observable<any> { return this.http.get(`${this.apiUrl}/analytics/student-dashboard`); }
    getStudentAnalytics(studentId: string): Observable<any> { return this.http.get(`${this.apiUrl}/analytics/student/${studentId}`); }
    getClassAnalytics(subjectId: string): Observable<any> { return this.http.get(`${this.apiUrl}/analytics/class/${subjectId}`); }
    getAllAtRisk(): Observable<any> { return this.http.get(`${this.apiUrl}/analytics/at-risk`); }

    // Advanced Analytics - Student
    getStudentPerformance(studentId: string): Observable<any> { return this.http.get(`${this.apiUrl}/analytics/student/${studentId}/performance`); }
    getStudentAttendanceTrend(studentId: string, weeks = 8): Observable<any> { return this.http.get(`${this.apiUrl}/analytics/student/${studentId}/attendance-trend`, { params: { weeks } }); }

    // Advanced Analytics - Teacher
    getTeacherClassPerformance(): Observable<any> { return this.http.get(`${this.apiUrl}/analytics/teacher/class-performance`); }
    getTeacherSubmissionStats(): Observable<any> { return this.http.get(`${this.apiUrl}/analytics/teacher/submission-stats`); }
    getTeacherAttendanceHeatmap(): Observable<any> { return this.http.get(`${this.apiUrl}/analytics/teacher/attendance-heatmap`); }

    // Advanced Analytics - Admin
    getAdminOverview(): Observable<any> { return this.http.get(`${this.apiUrl}/analytics/admin/overview`); }
    getAdminDepartmentStats(dept: string): Observable<any> { return this.http.get(`${this.apiUrl}/analytics/admin/department/${dept}`); }
    getAdminAtRiskSummary(): Observable<any> { return this.http.get(`${this.apiUrl}/analytics/admin/at-risk-summary`); }
    getAdminTeacherStats(): Observable<any> { return this.http.get(`${this.apiUrl}/analytics/admin/teacher-stats`); }

    // Notifications
    getNotifications(unreadOnly = false): Observable<any> { return this.http.get(`${this.apiUrl}/notifications`, { params: { unreadOnly: unreadOnly.toString() } }); }
    markNotificationRead(id: string): Observable<any> { return this.http.put(`${this.apiUrl}/notifications/${id}/read`, {}); }
    markAllNotificationsRead(): Observable<any> { return this.http.put(`${this.apiUrl}/notifications/read-all`, {}); }

    // ==================== FEE MANAGEMENT ====================
    // Admin
    createFee(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/fees`, data); }
    getFees(params?: any): Observable<any> { return this.http.get(`${this.apiUrl}/fees`, { params }); }
    getFee(id: string): Observable<any> { return this.http.get(`${this.apiUrl}/fees/${id}`); }
    updateFee(id: string, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/fees/${id}`, data); }
    deleteFee(id: string): Observable<any> { return this.http.delete(`${this.apiUrl}/fees/${id}`); }
    getFeeSummary(academicYear?: string): Observable<any> { return this.http.get(`${this.apiUrl}/fees/admin/summary`, { params: academicYear ? { academicYear } : {} }); }
    // Student
    getMyFees(): Observable<any> { return this.http.get(`${this.apiUrl}/fees/student/my-fees`); }

    // ==================== PAYMENT MANAGEMENT ====================
    // Student
    makePayment(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/payments`, data); }
    getPaymentHistory(): Observable<any> { return this.http.get(`${this.apiUrl}/payments/history`); }
    getPaymentReceipt(id: string): Observable<any> { return this.http.get(`${this.apiUrl}/payments/receipt/${id}`); }
    // Admin
    getAllPayments(params?: any): Observable<any> { return this.http.get(`${this.apiUrl}/payments/admin/all`, { params }); }
    updatePaymentStatus(id: string, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/payments/${id}/status`, data); }
    recordManualPayment(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/payments/admin/manual`, data); }
    getPaymentSummary(academicYear?: string): Observable<any> { return this.http.get(`${this.apiUrl}/payments/admin/summary`, { params: academicYear ? { academicYear } : {} }); }

    // ==================== RESULT MANAGEMENT ====================
    // Admin/Teacher
    createResult(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/results`, data); }
    createBulkResults(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/results/bulk`, data); }
    publishResult(id: string): Observable<any> { return this.http.put(`${this.apiUrl}/results/${id}/publish`, {}); }
    publishBulkResults(data: any): Observable<any> { return this.http.put(`${this.apiUrl}/results/publish-bulk`, data); }
    getResultsBySemester(semester: number, params?: any): Observable<any> { return this.http.get(`${this.apiUrl}/results/semester/${semester}`, { params }); }
    getStudentResults(studentId: string): Observable<any> { return this.http.get(`${this.apiUrl}/results/student/${studentId}`); }
    getResultSummary(params?: any): Observable<any> { return this.http.get(`${this.apiUrl}/results/admin/summary`, { params }); }
    // Student
    getMyResults(): Observable<any> { return this.http.get(`${this.apiUrl}/results/my-results`); }
    getMarksheet(resultId: string): Observable<any> { return this.http.get(`${this.apiUrl}/results/${resultId}/marksheet`); }

    // ==================== EXAM SESSION & HALL TICKETS ====================
    // Admin
    createExamSession(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/exam-sessions`, data); }
    getExamSessions(params?: any): Observable<any> { return this.http.get(`${this.apiUrl}/exam-sessions`, { params }); }
    getExamSession(id: string): Observable<any> { return this.http.get(`${this.apiUrl}/exam-sessions/${id}`); }
    updateExamSession(id: string, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/exam-sessions/${id}`, data); }
    enableHallTicket(sessionId: string, enable = true): Observable<any> { return this.http.put(`${this.apiUrl}/exam-sessions/${sessionId}/enable-hallticket`, { enable }); }
    getAllHallTickets(params?: any): Observable<any> { return this.http.get(`${this.apiUrl}/halltickets/admin/all`, { params }); }
    updateHallTicketEligibility(id: string, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/halltickets/${id}/eligibility`, data); }
    // Student
    getMyHallTicket(): Observable<any> { return this.http.get(`${this.apiUrl}/halltickets`); }
    downloadHallTicket(): Observable<any> { return this.http.get(`${this.apiUrl}/halltickets/download`); }
    // Public
    verifyHallTicketQR(qr: string): Observable<any> { return this.http.get(`${this.apiUrl}/halltickets/verify/${encodeURIComponent(qr)}`); }

    // ==================== USER MANAGEMENT (Admin) ====================
    getStudents(params?: any): Observable<any> { return this.http.get(`${this.apiUrl}/auth/users`, { params: { ...params, role: 'student' } }); }
    getTeachers(): Observable<any> { return this.http.get(`${this.apiUrl}/auth/users`, { params: { role: 'teacher' } }); }
    createUser(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/auth/register`, data); }
    updateUser(id: string, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/auth/users/${id}`, data); }
    deleteUser(id: string): Observable<any> { return this.http.delete(`${this.apiUrl}/auth/users/${id}`); }
}

