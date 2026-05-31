import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, Notification } from '../context/NotificationContext';

const TYPE_ICON: Record<string, string> = {
    course_pending_review : '📋',
    new_user_registered   : '👥',
    course_approved       : '✅',
    course_rejected       : '❌',
    enrollment_confirmed  : '🎉',
    new_course_available  : '🎓',
    course_status_changed : '🔄',
    new_enrollment        : '👤',
};

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'щойно';
    if (m < 60) return `${m} хв тому`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} год тому`;
    return `${Math.floor(h / 24)} дн тому`;
}

function NotifItem({ n, onRead, onDelete, onNavigate }: {
    n: Notification;
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
    onNavigate: (n: Notification) => void;
}) {
    return (
        <div
            style={{
                display: 'flex', gap: 10, padding: '10px 14px', cursor: 'pointer',
                background: n.isRead ? 'transparent' : 'rgba(var(--accent-rgb,10,10,10),0.04)',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.15s',
            }}
            onClick={() => { onRead(n.id); onNavigate(n); }}
        >
            <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: 'var(--bg-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem',
            }}>
                {TYPE_ICON[n.type] ?? '🔔'}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontSize: '0.8rem', fontWeight: n.isRead ? 400 : 600,
                    color: 'var(--text)', marginBottom: 2, lineHeight: 1.3,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {n.title}
                </p>
                <p style={{
                    fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {n.message}
                </p>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 3 }}>
                    {timeAgo(n.createdAt)}
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                {!n.isRead && (
                    <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: '#3b82f6', alignSelf: 'flex-start', marginTop: 4,
                    }} />
                )}
                <button
                    onClick={e => { e.stopPropagation(); onDelete(n.id); }}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-tertiary)', fontSize: '0.8rem',
                        padding: '2px 4px', lineHeight: 1, marginTop: 'auto',
                    }}
                    title="Видалити"
                >✕</button>
            </div>
        </div>
    );
}

export function NotificationBell() {
    const { notifications, unreadCount, loading, markRead, markAllRead, deleteOne } = useNotifications();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleNavigate = (n: Notification) => {
        setOpen(false);
        const courseId = n.meta?.courseId;
        if (!courseId) return;
        if (n.type === 'course_pending_review') navigate('/admin');
        else navigate(`/courses/${courseId}`);
    };

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(v => !v)}
                style={{
                    width: 32, height: 32,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--bg-elevated)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem',
                    position: 'relative', transition: 'border-color 0.2s',
                }}
                aria-label="Нотифікації"
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: -4, right: -4,
                        background: '#ef4444', color: 'var(--bg-elevated)',
                        fontSize: '0.6rem', fontWeight: 700,
                        width: 16, height: 16, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 340,
                background: 'var(--bg-elevated)',
                border: '1.5px solid var(--border)',
                borderRadius: 12,
                boxShadow: 'var(--shadow-lg)',
                zIndex: 300, overflow: 'hidden',
                transformOrigin: 'top right',
                transition: 'opacity 0.18s ease, transform 0.18s ease, visibility 0.18s',
                ...(open
                    ? { opacity: 1, transform: 'translateY(0) scale(1)', visibility: 'visible' as const, pointerEvents: 'all' as const }
                    : { opacity: 0, transform: 'translateY(-6px) scale(0.97)', visibility: 'hidden' as const, pointerEvents: 'none' as const }
                ),
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px 10px',
                    borderBottom: '1px solid var(--border)',
                }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                        Нотифікації {unreadCount > 0 && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                background: '#ef4444', color: 'var(--bg-elevated)',
                                fontSize: '0.65rem', fontWeight: 700,
                                width: 18, height: 18, borderRadius: '50%', marginLeft: 6,
                            }}>{unreadCount}</span>
                        )}
                    </p>
                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAllRead()}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '0.74rem', color: '#3b82f6', fontWeight: 500,
                            }}
                        >
                            Прочитати всі
                        </button>
                    )}
                </div>

                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                    {loading && notifications.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '32px 16px', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                            Завантаження...
                        </p>
                    ) : notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                            <p style={{ fontSize: '1.8rem', marginBottom: 8 }}>🔕</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Нотифікацій поки немає</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <NotifItem key={n.id} n={n} onRead={markRead} onDelete={deleteOne} onNavigate={handleNavigate} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
