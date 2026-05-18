import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const active = (path: string) => loc.pathname.startsWith(path);
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setOpen(false); }, [loc.pathname]);

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  const goToProfile = () => {
    setOpen(false);
    if (user?.role === 'teacher' || user?.role === 'admin') {
      navigate('/teacher');
    } else {
      navigate('/student');
    }
  };

  const initials = user?.name
      ? user.name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()
      : '?';

  return (
      <header style={s.header}>
        <nav style={s.nav}>
          <Link to="/courses" style={s.logo}>
            <span style={s.logoDot} />
            LearnHub
          </Link>

          <div style={s.links}>
            <Link to="/courses" style={{ ...s.link, ...(active('/courses') ? s.linkActive : {}) }}>
              Курси
            </Link>
            {isAuthenticated && (
                <Link to="/certificates" style={{ ...s.link, ...(active('/certificates') ? s.linkActive : {}) }}>
                  Сертифікати
                </Link>
            )}
          </div>

          <div style={s.right}>
            {isAuthenticated ? (
                <>
                  <div ref={dropRef} style={s.profileWrap}>
                    <button style={s.profileBtn} onClick={() => setOpen(v => !v)} aria-expanded={open}>
                      <div style={s.avatar}>{initials}</div>
                      <span style={s.userName}>{user?.name}</span>
                      <svg
                          width="12" height="12" viewBox="0 0 12 12" fill="none"
                          style={{ ...s.chevron, ...(open ? s.chevronOpen : {}) }}
                      >
                        <path d="M2 4l4 4 4-4" stroke="#9a9a9a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    {open && (
                        <div style={s.dropdown}>
                          <div style={s.dropHeader}>
                            <div style={{ ...s.avatar, ...s.avatarLg }}>{initials}</div>
                            <div>
                              <p style={s.dropName}>{user?.name}</p>
                              <p style={s.dropRole}>{
                                user?.role === 'teacher' ? 'Викладач'
                                    : user?.role === 'admin' ? 'Адміністратор'
                                        : 'Студент'
                              }</p>
                            </div>
                          </div>

                          <div style={s.dropDivider} />

                          <button style={s.dropItem} onClick={goToProfile}>
                            <span style={s.dropIcon}>👤</span>
                            {user?.role === 'teacher' || user?.role === 'admin'
                                ? 'Кабінет викладача'
                                : 'Кабінет студента'}
                          </button>

                          <Link to="/certificates" style={s.dropItem} onClick={() => setOpen(false)}>
                            <span style={s.dropIcon}>🏆</span>
                            Мої сертифікати
                          </Link>

                          {user?.role === 'admin' && (
                              <Link to="/admin" style={s.dropItem} onClick={() => setOpen(false)}>
                                <span style={s.dropIcon}>⚙️</span>
                                Адмін-панель
                              </Link>
                          )}

                          <div style={s.dropDivider} />

                          <button style={{ ...s.dropItem, ...s.dropItemDanger }} onClick={handleLogout}>
                            <span style={s.dropIcon}>↩</span>
                            Вийти
                          </button>
                        </div>
                    )}
                  </div>
                </>
            ) : (
                <>
                  <Link to="/login" style={s.link}>Вхід</Link>
                  <Link to="/register" style={s.registerBtn}>Реєстрація</Link>
                </>
            )}
          </div>
        </nav>
      </header>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(250,250,250,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #ebebeb',
  },
  nav: {
    maxWidth: 1160, margin: '0 auto',
    padding: '0 32px', height: 56,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: '0.95rem', fontWeight: 600,
    letterSpacing: '-0.02em', color: '#0a0a0a',
    marginRight: 24,
  },
  logoDot: {
    width: 7, height: 7,
    borderRadius: '50%', background: '#0a0a0a',
    flexShrink: 0,
  },
  links: { display: 'flex', gap: 2, flex: 1 },
  link: {
    padding: '5px 12px', borderRadius: 6,
    fontSize: '0.875rem', color: '#5a5a5a',
    transition: 'color 0.1s',
  },
  linkActive: { color: '#0a0a0a', fontWeight: 500 },
  right: { display: 'flex', alignItems: 'center', gap: 8 },
  registerBtn: {
    padding: '6px 16px', borderRadius: 6,
    background: '#0a0a0a', color: '#fafafa',
    fontSize: '0.875rem', fontWeight: 500,
  },

  // Profile trigger button
  profileWrap: { position: 'relative' },
  profileBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'transparent', border: '1.5px solid #ebebeb',
    borderRadius: 8, padding: '4px 10px 4px 5px',
    cursor: 'pointer', transition: 'border-color 0.15s',
  },
  avatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: '#0a0a0a', color: '#fafafa',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.7rem', fontWeight: 600, flexShrink: 0,
  },
  userName: { fontSize: '0.8rem', color: '#3a3a3a', fontWeight: 500 },
  chevron: { transition: 'transform 0.2s', flexShrink: 0 },
  chevronOpen: { transform: 'rotate(180deg)' },

  // Dropdown panel
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    width: 220,
    background: '#fff',
    border: '1.5px solid #ebebeb',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    zIndex: 200,
  },
  dropHeader: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px',
  },
  avatarLg: {
    width: 38, height: 38,
    fontSize: '0.85rem',
  },
  dropName: { fontSize: '0.875rem', fontWeight: 600, color: '#0a0a0a', marginBottom: 1 },
  dropRole: { fontSize: '0.72rem', color: '#9a9a9a' },
  dropDivider: { height: 1, background: '#f0f0f0', margin: '0 12px' },
  dropItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '10px 16px',
    fontSize: '0.875rem', color: '#3a3a3a',
    background: 'transparent', border: 'none',
    textDecoration: 'none', cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'background 0.1s',
  },
  dropItemDanger: { color: '#e53e3e' },
  dropIcon: { fontSize: '0.9rem', width: 18, flexShrink: 0 },
};