import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', display: 'flex',
    background: 'var(--bg)',
  },
  left: {
    flexShrink: 0,
    display: 'flex', flexDirection: 'column' as const,
    justifyContent: 'center', padding: '60px 48px',
    borderRight: '1px solid #ebebeb',
  },
  right: {
    flex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 48,
    background: 'var(--bg-subtle)',
  },
  tagline: {
    fontSize: '2.2rem', fontWeight: 600,
    letterSpacing: '-0.03em', lineHeight: 1.2,
    color: 'var(--text)', maxWidth: 340,
  },
  sub: { marginTop: 12, color: 'var(--text-tertiary)', fontSize: '0.9rem', lineHeight: 1.6 },
  logo: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: '0.9rem', fontWeight: 600,
    color: 'var(--text)', marginBottom: 48,
    textDecoration: 'none',
  },
  dot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' },
  formBox: {
    width: '100%', maxWidth: 360,
  },
  title: {
    fontSize: '1.4rem', fontWeight: 600,
    letterSpacing: '-0.02em', marginBottom: 6,
  },
  hint: { fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 32 },
  field: { marginBottom: 16 },
  label: {
    display: 'block', marginBottom: 6,
    fontSize: '0.75rem', fontWeight: 500,
    color: 'var(--text-secondary)', textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%', padding: '10px 14px',
    background: 'var(--bg-elevated)', color: 'var(--text)',
    border: '1.5px solid var(--border)', borderRadius: 8,
    fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  },
  btn: {
    width: '100%', padding: '11px',
    background: 'var(--accent)', color: 'var(--accent-inv)',
    border: 'none', borderRadius: 8,
    fontSize: '0.9rem', fontWeight: 500,
    cursor: 'pointer', marginTop: 8,
    transition: 'opacity 0.15s',
  },
  googleBtn: {
    width: '100%', padding: '11px',
    background: 'var(--bg-elevated)', color: 'var(--text)',
    border: '1.5px solid var(--border)', borderRadius: 8,
    fontSize: '0.9rem', fontWeight: 500,
    cursor: 'pointer', marginTop: 12,
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box' as const,
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12,
    margin: '20px 0', color: 'var(--border-strong)', fontSize: '0.8rem',
  },
  dividerLine: { flex: 1, height: 1, background: 'var(--border)' },
  error: {
    padding: '10px 14px', borderRadius: 8,
    background: 'var(--bg)', border: '1.5px solid var(--border-strong)',
    fontSize: '0.85rem', color: 'var(--text)',
    marginBottom: 16,
  },
  switch: {
    marginTop: 24, textAlign: 'center' as const,
    fontSize: '0.85rem', color: 'var(--text-tertiary)',
  },
  switchLink: { color: 'var(--text)', fontWeight: 500 },
};

const GoogleLogo = () => (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
);

function GoogleButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  const [hovered, setHovered] = React.useState(false);
  return (
      <button
          type="button"
          style={{
            ...s.googleBtn,
            opacity: loading ? 0.6 : 1,
            borderColor: hovered ? 'var(--border-strong)' : 'var(--border)',
            boxShadow: hovered ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}
          onClick={onClick}
          disabled={loading}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
      >
        <GoogleLogo />
        Продовжити з Google
      </button>
  );
}

function getRoleHome(role: string): string {
  if (role === 'admin' || role === 'super_admin') return '/admin';
  if (role === 'teacher') return '/teacher';
  return '/courses';
}

export function LoginPage() {
  const { login, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname;
  const resetSuccess = (location.state as any)?.resetSuccess;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const loggedUser = await login(email, password);
      navigate(from ?? getRoleHome(loggedUser.role), { replace: true });
    }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
      <div style={s.page} className="auth-layout r-auth-page" >
        <div style={s.left} className="auth-left r-auth-left" >
          <Link to="/" style={s.logo}><span style={s.dot}/>LearnHub</Link>
          <p style={s.tagline}>Навчання без зайвого шуму</p>
          <p style={s.sub}>Курси, прогрес і сертифікати — все в одному місці.</p>
        </div>
        <div style={s.right} className="auth-right r-auth-right" >
          <div style={s.formBox}>
            <h1 style={s.title}>Вхід</h1>
            <p style={s.hint}>Раді тебе бачити знову</p>
            {resetSuccess && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg)', border: '1.5px solid #86efac', fontSize: '0.85rem', color: 'var(--text)', marginBottom: 16 }}>
                  Пароль успішно змінено. Увійди з новим паролем.
                </div>
            )}
            {error && <div style={s.error}>{error}</div>}

            <GoogleButton onClick={loginWithGoogle} loading={loading} />

            <div style={s.divider}>
              <span style={s.dividerLine} />
              або
              <span style={s.dividerLine} />
            </div>

            <form onSubmit={submit}>
              <div style={s.field}>
                <label style={s.label}>Email</label>
                <input style={s.input} type="email" value={email}
                       onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
              <div style={s.field}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...s.label, margin: 0 }}>Пароль</label>
                  <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Забув пароль?</Link>
                </div>
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
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const referralToken = new URLSearchParams(location.search).get('ref') ?? undefined;

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    if (password.length < 6) { setError('Пароль мінімум 6 символів'); return; }
    setLoading(true);
    try {
      const newUser = await register(name, email, password, referralToken);
      navigate(getRoleHome(newUser.role), { replace: true });
    }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
      <div style={s.page} className="auth-layout r-auth-page" >
        <div style={s.left} className="auth-left r-auth-left" >
          <Link to="/" style={s.logo}><span style={s.dot}/>LearnHub</Link>
          <p style={s.tagline}>Почни навчатися сьогодні</p>
          <p style={s.sub}>Безкоштовна реєстрація. Доступ до сотень курсів.</p>
        </div>
        <div style={s.right} className="auth-right r-auth-right" >
          <div style={s.formBox}>
            <h1 style={s.title}>Реєстрація</h1>
            <p style={s.hint}>Створи акаунт за хвилину</p>
            {referralToken && (
                <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.85rem', color: '#166534' }}>
                  🎉 Тебе запросили на платформу! Реєструйся і починай навчання.
                </div>
            )}
            {error && <div style={s.error}>{error}</div>}

            <GoogleButton onClick={loginWithGoogle} loading={loading} />

            <div style={s.divider}>
              <span style={s.dividerLine} />
              або
              <span style={s.dividerLine} />
            </div>

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

export function GoogleCallbackPage() {
  const { handleGoogleCallback, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('accessToken')) {
      handleGoogleCallback(params);
      setProcessed(true);
    } else {
      setError('Помилка авторизації через Google. Спробуй ще раз.');
    }
  }, []);

  useEffect(() => {
    if (!processed || isLoading) return;
    if (user) {
      if (user.role === 'admin' || user.role === 'super_admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'teacher') {
        navigate('/teacher', { replace: true });
      } else {
        navigate('/courses', { replace: true });
      }
    }
  }, [processed, user, isLoading, navigate]);

  if (error) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: 'var(--text)', fontSize: '0.95rem' }}>{error}</p>
          <Link to="/login" style={{ color: 'var(--text)', fontWeight: 500, fontSize: '0.9rem' }}>← Повернутись до входу</Link>
        </div>
    );
  }

  return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Авторизація через Google…</p>
      </div>
  );
}