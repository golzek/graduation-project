import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';

const API = process.env.REACT_APP_API_URL ?? 'http://localhost:3000';

function authFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('accessToken');
    return fetch(`${API}${path}`, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...opts.headers,
        },
    }).then(r => r.json());
}

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    meta: Record<string, any> | null;
    createdAt: string;
}

interface NotifCtx {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    deleteOne: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const NotifContext = createContext<NotifCtx | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const refresh = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const data = await authFetch<Notification[]>('/notifications');
            setNotifications(Array.isArray(data) ? data : []);
        } catch {
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) {
            setNotifications([]);
            return;
        }
        setLoading(true);
        refresh().finally(() => setLoading(false));

        intervalRef.current = setInterval(refresh, 30_000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isAuthenticated, refresh]);

    const markRead = useCallback(async (id: string) => {
        await authFetch(`/notifications/${id}/read`, { method: 'PATCH' });
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, isRead: true } : n)),
        );
    }, []);

    const markAllRead = useCallback(async () => {
        await authFetch('/notifications/read-all', { method: 'PATCH' });
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }, []);

    const deleteOne = useCallback(async (id: string) => {
        await authFetch(`/notifications/${id}`, { method: 'DELETE' });
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <NotifContext.Provider value={{ notifications, unreadCount, loading, markRead, markAllRead, deleteOne, refresh }}>
            {children}
        </NotifContext.Provider>
    );
}

export function useNotifications(): NotifCtx {
    const ctx = useContext(NotifContext);
    if (!ctx) throw new Error('useNotifications must be inside <NotificationProvider>');
    return ctx;
}