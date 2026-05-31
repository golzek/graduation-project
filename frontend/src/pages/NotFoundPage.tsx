import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const s: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', padding: '40px 24px', textAlign: 'center',
    },
    code: {
        fontSize: 'clamp(5rem, 18vw, 9rem)', fontWeight: 700,
        letterSpacing: '-0.05em', color: 'var(--border-strong)',
        lineHeight: 1, margin: 0,
    },
    title: {
        fontSize: '1.3rem', fontWeight: 600,
        color: 'var(--text)', margin: '16px 0 8px',
        letterSpacing: '-0.02em',
    },
    sub: {
        color: 'var(--text-tertiary)', fontSize: '0.9rem',
        maxWidth: 340, lineHeight: 1.6, margin: '0 auto 32px',
    },
    actions: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const },
    btn: {
        padding: '10px 24px', borderRadius: 8, fontWeight: 500,
        fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'none',
        border: '1.5px solid var(--border)',
        background: 'var(--accent)', color: 'var(--accent-inv)',
    },
    btnGhost: {
        padding: '10px 24px', borderRadius: 8, fontWeight: 500,
        fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'none',
        border: '1.5px solid var(--border)',
        background: 'var(--bg-elevated)', color: 'var(--text)',
    },
};

export function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div style={s.page}>
            <p style={s.code}>404</p>
            <h1 style={s.title}>Сторінку не знайдено</h1>
            <p style={s.sub}>Схоже, цієї сторінки не існує або вона була переміщена.</p>
            <div style={s.actions}>
                <Link to="/" style={s.btn}>На головну</Link>
                <button style={s.btnGhost} onClick={() => navigate(-1)}>← Назад</button>
            </div>
        </div>
    );
}