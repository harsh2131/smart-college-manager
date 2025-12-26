import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface SocketNotification {
    _id: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
    private socket: Socket | null = null;
    private notificationSubject = new BehaviorSubject<SocketNotification | null>(null);
    private connectionStatus = new BehaviorSubject<boolean>(false);

    constructor(private authService: AuthService) {
        // Auto-connect when user is logged in
        this.authService.currentUser$.subscribe(user => {
            if (user) {
                this.connect(user._id);
            } else {
                this.disconnect();
            }
        });
    }

    /**
     * Connect to Socket.IO server
     */
    connect(userId: string): void {
        if (this.socket?.connected) return;

        // Get the base URL without /api
        const socketUrl = environment.apiUrl.replace('/api', '');

        this.socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: true
        });

        this.socket.on('connect', () => {
            console.log('🔌 Socket connected');
            this.connectionStatus.next(true);

            // Join user's notification room
            this.socket?.emit('join', userId);
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
            this.connectionStatus.next(false);
        });

        this.socket.on('notification', (notification: SocketNotification) => {
            console.log('📬 Received notification:', notification);
            this.notificationSubject.next(notification);
        });

        this.socket.on('error', (error: any) => {
            console.error('Socket error:', error);
        });
    }

    /**
     * Disconnect from Socket.IO server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connectionStatus.next(false);
        }
    }

    /**
     * Get notifications as observable
     */
    get notifications$(): Observable<SocketNotification | null> {
        return this.notificationSubject.asObservable();
    }

    /**
     * Get connection status as observable
     */
    get isConnected$(): Observable<boolean> {
        return this.connectionStatus.asObservable();
    }

    /**
     * Check if currently connected
     */
    get isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    ngOnDestroy(): void {
        this.disconnect();
    }
}
