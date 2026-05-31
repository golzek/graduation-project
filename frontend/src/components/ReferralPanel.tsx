import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../context/AuthContext';

interface Invited {
    id: string;
    name: string;
    createdAt: string;
}

const s: Record<string, React.CSSProperties> = {
    card: {
        background: 'var(--bg-elevated)',
        border: '1.5px solid var(--border)',
        borderRadius: 12,
        padding: '24px 28px',
        marginTop: 24,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    title: {
        fontSize: '1rem',
        fontWeight: 600,
        color: 'var(--text)',
        margin: 0,
    },
    badge: {
        background: 'var(--accent)',
        color: 'var(--accent-inv)',
        borderRadius: 20,
        padding: '2px 10px',
        fontSize: '0.75rem',
        fontWeight: 600,
    },
    linkRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-subtle)',
        borderRadius: 8,
        padding: '10px 14px',
        marginBottom: 16,
    },
    linkText: {
        flex: 1,
        fontSize: '0.82rem',
        color: 'var(--text-secondary)',
        wordBreak: 'break-all' as const,
        fontFamily: 'monospace',
    },
    copyBtn: {
        flexShrink: 0,
        padding: '6px 14px',
        background: 'var(--accent)',
        color: 'var(--accent-inv)',
        border: 'none',
        borderRadius: 6,
        fontSize: '0.8rem',
        cursor: 'pointer',
        fontWeight: 500,
    },
    copiedBtn: {
        background: '#16a34a',
    },
    list: {
        listStyle: 'none',
        margin: 0,
        padding: 0,
    },
    listItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid var(--border)',
        fontSize: '0.85rem',
        color: 'var(--text)',
    },
    date: {
        fontSize: '0.75rem',
        color: 'var(--text-tertiary)',
    },
    empty: {
        fontSize: '0.85rem',
        color: 'var(--text-tertiary)',
        textAlign: 'center' as const,
        padding: '16px 0',
    },
};

export function ReferralPanel() {
    const [link, setLink]       = useState<string | null>(null);
    const [invited, setInvited] = useState<Invited[]>([]);
    const [copied, setCopied]   = useState(false);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const [linkRes, myRes] = await Promise.all([
                apiFetch<{ link: string }>('/referral/link'),
                apiFetch<Invited[]>('/referral/my'),
            ]);
            setLink(linkRes.link);
            setInvited(myRes);
        } catch {
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const copy = () => {
        if (!link) return;
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (loading) return null;

    return (
        <div style={s.card}>
            <div style={s.header}>
                <h3 style={s.title}>🔗 Реферальна програма</h3>
                {invited.length > 0 && (
                    <span style={s.badge}>+{invited.length} запрошено</span>
                )}
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 12, marginTop: 0 }}>
                Поділись посиланням з друзями — коли вони зареєструються, ти побачиш їх тут.
            </p>

            {link && (
                <div style={s.linkRow}>
                    <span style={s.linkText}>{link}</span>
                    <button
                        style={{ ...s.copyBtn, ...(copied ? s.copiedBtn : {}) }}
                        onClick={copy}
                    >
                        {copied ? '✓ Скопійовано' : 'Скопіювати'}
                    </button>
                </div>
            )}

            {invited.length > 0 ? (
                <ul style={s.list}>
                    {invited.map(u => (
                        <li key={u.id} style={s.listItem}>
                            <span>👤 {u.name}</span>
                            <span style={s.date}>
                {new Date(u.createdAt).toLocaleDateString('uk-UA')}
              </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p style={s.empty}>Ще ніхто не зареєструвався за твоїм посиланням</p>
            )}
        </div>
    );
}