import React, { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL ?? 'http://localhost:3000';

const s: Record<string, React.CSSProperties> = {
    page:    { minHeight: '100vh', display: 'flex', background: 'var(--bg)' },
    left:    { flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px', borderRight: '1px solid var(--border)' },
    right:   { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, background: 'var(--bg-subtle)' },
    tagline: { fontSize: '2.2rem', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.2, color: 'var(--text)', maxWidth: 340 },
    sub:     { marginTop: 12, color: 'var(--text-tertiary)', fontSize: '0.9rem', lineHeight: 1.6 },
    logo:    { display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginBottom: 48, textDecoration: 'none' },
    dot:     { width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' },
    formBox: { width: '100%', maxWidth: 360 },
    title:   { fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 },
    hint:    { fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 32 },
    field:   { marginBottom: 16 },
    label:   { display: 'block', marginBottom: 6, fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    input:   { width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', color: 'var(--text)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const },
    btn:     { width: '100%', padding: '11px', background: 'var(--accent)', color: 'var(--accent-inv)', border: 'none', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', marginTop: 8 },
    error:   { padding: '10px 14px', borderRadius: 8, background: 'var(--bg)', border: '1.5px solid var(--border-strong)', fontSize: '0.85rem', color: 'var(--text)', marginBottom: 16 },
    success: { padding: '10px 14px', borderRadius: 8, background: 'var(--bg)', border: '1.5px solid #86efac', fontSize: '0.85rem', color: 'var(--text)', marginBottom: 16 },
    back:    { marginTop: 24, textAlign: 'center' as const, fontSize: '0.85rem', color: 'var(--text-tertiary)' },
    backLink:{ color: 'var(--text)', fontWeight: 500 },
};

export function ForgotPasswordPage() {
    const [email, setEmail]       = useState('');
    const [error, setError]       = useState('');
    const [success, setSuccess]   = useState(false);
    const [loading, setLoading]   = useState(false);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await fetch(`${API}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            setSuccess(true);
        } catch {
            setError('Щось пішло не так. Спробуй пізніше.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={s.page} className="auth-layout r-auth-page">
            <div style={s.left} className="auth-left r-auth-left">
                <Link to="/" style={s.logo}><span style={s.dot}/>LearnHub</Link>
                <p style={s.tagline}>Забув пароль?</p>
                <p style={s.sub}>Введи свій email і ми надішлемо посилання для скидання.</p>
            </div>
            <div style={s.right} className="auth-right r-auth-right">
                <div style={s.formBox}>
                    <h1 style={s.title}>Скидання пароля</h1>
                    <p style={s.hint}>Вкажи email свого акаунта</p>

                    {error && <div style={s.error}>{error}</div>}
                    {success && (
                        <div style={s.success}>
                            Якщо акаунт з таким email існує — лист вже в дорозі. Перевір пошту.
                        </div>
                    )}

                    {!success && (
                        <form onSubmit={submit}>
                            <div style={s.field}>
                                <label style={s.label}>Email</label>
                                <input
                                    style={s.input} type="email" value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="your@email.com" required
                                />
                            </div>
                            <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>
                                {loading ? 'Надсилаємо...' : 'Надіслати посилання'}
                            </button>
                        </form>
                    )}

                    <p style={s.back}>
                        <Link to="/login" style={s.backLink}>← Повернутись до входу</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export function ResetPasswordPage() {
    const location  = useLocation();
    const navigate  = useNavigate();
    const token     = new URLSearchParams(location.search).get('token') ?? '';

    const [password, setPassword]   = useState('');
    const [confirm, setConfirm]     = useState('');
    const [error, setError]         = useState('');
    const [loading, setLoading]     = useState(false);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirm) { setError('Паролі не співпадають'); return; }
        if (password.length < 6)  { setError('Пароль мінімум 6 символів'); return; }
        if (!token)               { setError('Токен відсутній або посилання недійсне'); return; }
        setLoading(true);
        try {
            const res = await fetch(`${API}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message ?? 'Помилка');
            }
            navigate('/login', { state: { resetSuccess: true } });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={s.page} className="auth-layout r-auth-page">
            <div style={s.left} className="auth-left r-auth-left">
                <Link to="/" style={s.logo}><span style={s.dot}/>LearnHub</Link>
                <p style={s.tagline}>Новий пароль</p>
                <p style={s.sub}>Придумай надійний пароль для свого акаунта.</p>
            </div>
            <div style={s.right} className="auth-right r-auth-right">
                <div style={s.formBox}>
                    <h1 style={s.title}>Встановити пароль</h1>
                    <p style={s.hint}>Введи новий пароль двічі</p>

                    {error && <div style={s.error}>{error}</div>}

                    <form onSubmit={submit}>
                        <div style={s.field}>
                            <label style={s.label}>Новий пароль</label>
                            <input
                                style={s.input} type="password" value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="мінімум 6 символів" required
                            />
                        </div>
                        <div style={s.field}>
                            <label style={s.label}>Повтори пароль</label>
                            <input
                                style={s.input} type="password" value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                placeholder="••••••••" required
                            />
                        </div>
                        <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>
                            {loading ? 'Зберігаємо...' : 'Зберегти пароль'}
                        </button>
                    </form>

                    <p style={s.back}>
                        <Link to="/login" style={s.backLink}>← Повернутись до входу</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}