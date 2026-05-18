import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastCtx {
    success: (msg: string) => void;
    error:   (msg: string) => void;
    info:    (msg: string) => void;
    warning: (msg: string) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

const icons: Record<ToastType, string> = {
    success: '✓',
    error:   '✕',
    info:    'i',
    warning: '!',
};

const colors: Record<ToastType, { bg: string; border: string; icon: string; iconBg: string }> = {
    success: { bg: '#fff',     border: '#d1fae5', icon: '#065f46', iconBg: '#d1fae5' },
    error:   { bg: '#fff',     border: '#fee2e2', icon: '#991b1b', iconBg: '#fee2e2' },
    info:    { bg: '#fff',     border: '#dbeafe', icon: '#1e40af', iconBg: '#dbeafe' },
    warning: { bg: '#fff',     border: '#fef3c7', icon: '#92400e', iconBg: '#fef3c7' },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const [visible, setVisible] = useState(false);
    const c = colors[toast.type];

    useEffect(() => {
        const t1 = setTimeout(() => setVisible(true), 10);
        const t2 = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onRemove(toast.id), 300);
        }, 3500);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [toast.id, onRemove]);

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: c.bg,
            border: `1.5px solid ${c.border}`,
            borderRadius: 10,
            padding: '12px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
            minWidth: 280, maxWidth: 380,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
            pointerEvents: 'all',
        }}>
            <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: c.iconBg, color: c.icon,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
            }}>
                {icons[toast.type]}
            </div>
            <p style={{ flex: 1, fontSize: '0.875rem', color: '#1a1a1a', lineHeight: 1.4 }}>
                {toast.message}
            </p>
            <button
                onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9a9a9a', fontSize: '0.9rem', padding: '0 2px', lineHeight: 1,
                    flexShrink: 0,
                }}
            >✕</button>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const add = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, type, message }]);
    }, []);

    const remove = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const ctx: ToastCtx = {
        success: (msg) => add('success', msg),
        error:   (msg) => add('error', msg),
        info:    (msg) => add('info', msg),
        warning: (msg) => add('warning', msg),
    };

    return (
        <ToastContext.Provider value={ctx}>
            {children}
            <div style={{
                position: 'fixed', bottom: 24, right: 24,
                display: 'flex', flexDirection: 'column', gap: 8,
                zIndex: 9999, pointerEvents: 'none',
            }}>
                {toasts.map(t => (
                    <ToastItem key={t.id} toast={t} onRemove={remove} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastCtx {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be inside <ToastProvider>');
    return ctx;
}