import React, { useState } from 'react';
import { useAuth, apiFetch } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ReferralPanel } from '../components/ReferralPanel';

export function ProfilePage() {
    const { user } = useAuth();
    const toast = useToast();

    const [name, setName]             = useState(user?.name ?? '');
    const [email, setEmail]           = useState(user?.email ?? '');
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd]         = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [savingInfo, setSavingInfo] = useState(false);
    const [savingPwd, setSavingPwd]   = useState(false);

    const initials = user?.name
        ? user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    const roleLabel =
        user?.role === 'super_admin' ? 'Супер-адмін'
            : user?.role === 'admin' ? 'Адміністратор'
                : user?.role === 'teacher' ? 'Викладач'
                    : 'Студент';

    const handleSaveInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('Ім\'я не може бути порожнім'); return; }
        setSavingInfo(true);
        try {
            await apiFetch('/auth/profile', {
                method: 'PATCH',
                body: JSON.stringify({ name: name.trim(), email: email.trim() }),
            });
            toast.success('Профіль оновлено');
        } catch (err: any) {
            toast.error(err.message ?? 'Помилка збереження');
        } finally {
            setSavingInfo(false);
        }
    };

    const handleSavePwd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPwd) { toast.error('Введи поточний пароль'); return; }
        if (newPwd.length < 6) { toast.error('Новий пароль — мінімум 6 символів'); return; }
        if (newPwd !== confirmPwd) { toast.error('Паролі не збігаються'); return; }
        setSavingPwd(true);
        try {
            await apiFetch('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
            });
            toast.success('Пароль змінено');
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
        } catch (err: any) {
            toast.error(err.message ?? 'Помилка зміни пароля');
        } finally {
            setSavingPwd(false);
        }
    };

    return (
        <div style={s.page}>
            <div style={s.header}>
                <div style={s.headerInner} className="r-header-inner">
                    <div style={s.avatar}>{initials}</div>
                    <div>
                        <h1 style={s.title}>{user?.name}</h1>
                        <p style={s.sub}>{roleLabel} · {user?.email}</p>
                    </div>
                </div>
            </div>

            <div style={s.body} className="r-body">
                <div style={s.grid} className="r-profile-grid">

                    <section style={s.card}>
                        <p style={s.sectionLabel}>Особисті дані</p>
                        <form onSubmit={handleSaveInfo} style={s.form}>
                            <div style={s.field}>
                                <label style={s.label}>Повне ім'я</label>
                                <input
                                    className="input"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Іван Іваненко"
                                />
                            </div>
                            <div style={s.field}>
                                <label style={s.label}>Email</label>
                                <input
                                    className="input"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <button type="submit" style={s.btnPrimary} disabled={savingInfo}>
                                {savingInfo ? 'Зберігаємо...' : 'Зберегти зміни'}
                            </button>
                        </form>
                    </section>

                    <section style={s.card}>
                        <p style={s.sectionLabel}>Зміна пароля</p>
                        <form onSubmit={handleSavePwd} style={s.form}>
                            <div style={s.field}>
                                <label style={s.label}>Поточний пароль</label>
                                <input
                                    className="input"
                                    type="password"
                                    value={currentPwd}
                                    onChange={e => setCurrentPwd(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                            </div>
                            <div style={s.field}>
                                <label style={s.label}>Новий пароль</label>
                                <input
                                    className="input"
                                    type="password"
                                    value={newPwd}
                                    onChange={e => setNewPwd(e.target.value)}
                                    placeholder="Мінімум 6 символів"
                                    autoComplete="new-password"
                                />
                            </div>
                            <div style={s.field}>
                                <label style={s.label}>Підтвердження</label>
                                <input
                                    className="input"
                                    type="password"
                                    value={confirmPwd}
                                    onChange={e => setConfirmPwd(e.target.value)}
                                    placeholder="Повтори новий пароль"
                                    autoComplete="new-password"
                                />
                                {confirmPwd && newPwd !== confirmPwd && (
                                    <p style={s.fieldError}>Паролі не збігаються</p>
                                )}
                            </div>
                            <button type="submit" style={s.btnPrimary} disabled={savingPwd}>
                                {savingPwd ? 'Змінюємо...' : 'Змінити пароль'}
                            </button>
                        </form>
                    </section>

                </div>
                <ReferralPanel />
            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    page:   { minHeight: '100vh', background: 'var(--bg)' },
    header: { borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '28px 0' },
    headerInner: {
        maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16,
    },
    avatar: {
        width: 52, height: 52, borderRadius: '50%',
        background: 'var(--accent)', color: 'var(--accent-inv)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem', fontWeight: 600, flexShrink: 0,
    },
    title:  { fontSize: '1.2rem', fontWeight: 600, letterSpacing: '-0.02em' },
    sub:    { fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: 2 },
    body:   { maxWidth: 1160, margin: '28px auto' },
    grid:   { display: 'grid', gap: 16, maxWidth: 760 },
    card:   {
        background: 'var(--bg-elevated)', border: '1.5px solid var(--border)',
        borderRadius: 12, padding: '20px 22px',
    },
    sectionLabel: {
        fontSize: '0.7rem', fontWeight: 500,
        textTransform: 'uppercase' as const, letterSpacing: '0.07em',
        color: 'var(--text-tertiary)', marginBottom: 18,
    },
    form:   { display: 'flex', flexDirection: 'column' as const, gap: 14 },
    field:  { display: 'flex', flexDirection: 'column' as const, gap: 5 },
    label:  {
        fontSize: '0.78rem', fontWeight: 500,
        color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.04em',
    },
    fieldError: { fontSize: '0.75rem', color: '#e53e3e', marginTop: 2 },
    btnPrimary: {
        marginTop: 4, padding: '10px',
        background: 'var(--accent)', color: 'var(--accent-inv)',
        border: 'none', borderRadius: 8,
        fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
    },
};