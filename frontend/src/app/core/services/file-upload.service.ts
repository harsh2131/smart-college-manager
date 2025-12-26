import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpProgressEvent, HttpResponse } from '@angular/common/http';
import { Observable, map, filter } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadProgress {
    status: 'progress' | 'complete';
    progress: number;
    file?: {
        url: string;
        originalName: string;
        filename: string;
        size: number;
        mimetype: string;
    };
}

@Injectable({ providedIn: 'root' })
export class FileUploadService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    /**
     * Upload a single file with progress tracking
     */
    uploadFile(file: File): Observable<UploadProgress> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post(`${this.apiUrl}/upload`, formData, {
            reportProgress: true,
            observe: 'events'
        }).pipe(
            filter((event: HttpEvent<any>): event is HttpProgressEvent | HttpResponse<any> =>
                event.type === HttpEventType.UploadProgress || event.type === HttpEventType.Response
            ),
            map((event: HttpProgressEvent | HttpResponse<any>): UploadProgress => {
                if (event.type === HttpEventType.UploadProgress) {
                    const progress = event.total ? Math.round(100 * event.loaded / event.total) : 0;
                    return { status: 'progress', progress };
                } else {
                    const response = event as HttpResponse<any>;
                    return {
                        status: 'complete',
                        progress: 100,
                        file: response.body?.file
                    };
                }
            })
        );
    }

    /**
     * Upload multiple files
     */
    uploadMultiple(files: File[]): Observable<UploadProgress> {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        return this.http.post(`${this.apiUrl}/upload/multiple`, formData, {
            reportProgress: true,
            observe: 'events'
        }).pipe(
            filter((event: HttpEvent<any>): event is HttpProgressEvent | HttpResponse<any> =>
                event.type === HttpEventType.UploadProgress || event.type === HttpEventType.Response
            ),
            map((event: HttpProgressEvent | HttpResponse<any>): UploadProgress => {
                if (event.type === HttpEventType.UploadProgress) {
                    const progress = event.total ? Math.round(100 * event.loaded / event.total) : 0;
                    return { status: 'progress', progress };
                } else {
                    const response = event as HttpResponse<any>;
                    return {
                        status: 'complete',
                        progress: 100,
                        file: response.body?.files?.[0]
                    };
                }
            })
        );
    }

    /**
     * Get file icon based on mime type
     */
    getFileIcon(mimetype: string): string {
        if (mimetype.startsWith('image/')) return '🖼️';
        if (mimetype === 'application/pdf') return '📄';
        if (mimetype.includes('word')) return '📝';
        if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
        if (mimetype === 'application/zip') return '📦';
        return '📎';
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
