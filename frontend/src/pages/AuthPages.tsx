import React, { useState, FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', display: 'flex',
    background: '#fafafa',
  },
  left: {
    width: 420, flexShrink: 0,
    display: 'flex', flexDirection: 'column' as const,
    justifyContent: 'center', padding: '60px 48px',
    borderRight: '1px solid #ebebeb',
  },
  right: {
    flex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 48,
    background: '#f5f5f5',
  },
  tagline: {
    fontSize: '2.2rem', fontWeight: 600,
    letterSpacing: '-0.03em', lineHeight: 1.2,
    color: '#0a0a0a', maxWidth: 340,
  },
  sub: { marginTop: 12, color: '#9a9a9a', fontSize: '0.9rem', lineHeight: 1.6 },
  logo: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: '0.9rem', fontWeight: 600,
    color: '#0a0a0a', marginBottom: 48,
    textDecoration: 'none',
  },
  dot: { width: 7, height: 7, borderRadius: '50%', background: '#0a0a0a' },
  formBox: {
    width: '100%', maxWidth: 360,
  },
  title: {
    fontSize: '1.4rem', fontWeight: 600,
    letterSpacing: '-0.02em', marginBottom: 6,
  },
  hint: { fontSize: '0.85rem', color: '#9a9a9a', marginBottom: 32 },
  field: { marginBottom: 16 },
  label: {
    display: 'block', marginBottom: 6,
    fontSize: '0.75rem', fontWeight: 500,
    color: '#5a5a5a', textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%', padding: '10px 14px',
    background: '#fff', color: '#0a0a0a',
    border: '1.5px solid #ebebeb', borderRadius: 8,
    fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  },
  btn: {
    width: '100%', padding: '11px',
    background: '#0a0a0a', color: '#fafafa',
    border: 'none', borderRadius: 8,
    fontSize: '0.9rem', fontWeight: 500,
    cursor: 'pointer', marginTop: 8,
    transition: 'opacity 0.15s',
  },
  error: {
    padding: '10px 14px', borderRadius: 8,
    background: '#fafafa', border: '1.5px solid #d6d6d6',
    fontSize: '0.85rem', color: '#0a0a0a',
    marginBottom: 16,
  },
  switch: {
    marginTop: 24, textAlign: 'center' as const,
    fontSize: '0.85rem', color: '#9a9a9a',
  },
  switchLink: { color: '#0a0a0a', fontWeight: 500 },
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? '/courses';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); navigate(from, { replace: true }); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <Link to="/" style={s.logo}><span style={s.dot}/>LearnHub</Link>
        <p style={s.tagline}>Навчання без зайвого шуму</p>
        <p style={s.sub}>Курси, прогрес і сертифікати — все в одному місці.</p>
      </div>
      <div style={s.right}>
        <div style={s.formBox}>
          <h1 style={s.title}>Вхід</h1>
          <p style={s.hint}>Раді тебе бачити знову</p>
          {error && <div style={s.error}>{error}</div>}
          <form onSubmit={submit}>
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Пароль</label>
              <input style={s.input} type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
              type="submit" disabled={loading}>
              {loading ? 'Входимо...' : 'Увійти'}
            </button>
          </form>
          <p style={s.switch}>
            Немає акаунту?{' '}
            <Link to="/register" style={s.switchLink}>Зареєструватись</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    if (password.length < 6) { setError('Пароль мінімум 6 символів'); return; }
    setLoading(true);
    try { await register(name, email, password); navigate('/courses', { replace: true }); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <Link to="/" style={s.logo}><span style={s.dot}/>LearnHub</Link>
        <p style={s.tagline}>Почни навчатися сьогодні</p>
        <p style={s.sub}>Безкоштова реєстрація. Доступ до сотень курсів.</p>
      </div>
      <div style={s.right}>
        <div style={s.formBox}>
          <h1 style={s.title}>Реєстрація</h1>
          <p style={s.hint}>Створи акаунт за хвилину</p>
          {error && <div style={s.error}>{error}</div>}
          <form onSubmit={submit}>
            <div style={s.field}>
              <label style={s.label}>Ім'я</label>
              <input style={s.input} type="text" value={name}
                onChange={e => setName(e.target.value)} placeholder="Іван Петренко" required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Пароль</label>
              <input style={s.input} type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="мінімум 6 символів" required />
            </div>
            <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
              type="submit" disabled={loading}>
              {loading ? 'Створюємо...' : 'Зареєструватись'}
            </button>
          </form>
          <p style={s.switch}>
            Вже є акаунт?{' '}
            <Link to="/login" style={s.switchLink}>Увійти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
