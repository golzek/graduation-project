import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
      <div style={m.overlay} onClick={onCancel}>
        <div style={m.box} onClick={e => e.stopPropagation()}>
          <p style={m.title}>Вийти з акаунту?</p>
          <p style={m.sub}>Тебе буде перенаправлено на сторінку входу.</p>
          <div style={m.btns}>
            <button style={m.btnCancel} onClick={onCancel}>Скасувати</button>
            <button style={m.btnConfirm} onClick={onConfirm}>Вийти</button>
          </div>
        </div>
      </div>
  );
}

const m: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9000,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  box: {
    background: 'var(--bg-elevated)', borderRadius: 14, padding: '28px 28px 22px',
    width: 320, boxShadow: 'var(--shadow-lg)',
    border: '1.5px solid var(--border)',
  },
  title: { fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: 8 },
  sub:   { fontSize: '0.875rem', color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: 22 },
  btns:  { display: 'flex', gap: 10 },
  btnCancel: {
    flex: 1, padding: '9px', borderRadius: 8,
    border: '1.5px solid var(--border)', background: 'transparent',
    fontSize: '0.875rem', cursor: 'pointer', color: 'var(--text-secondary)',
    fontFamily: 'inherit',
  },
  btnConfirm: {
    flex: 1, padding: '9px', borderRadius: 8,
    border: 'none', background: 'var(--accent)',
    fontSize: '0.875rem', cursor: 'pointer', color: 'var(--accent-inv)', fontWeight: 500,
    fontFamily: 'inherit',
  },
};

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const loc = useLocation();
  const navigate = useNavigate();

  const [open, setOpen]             = useState(false);
  const [showLogout, setShowLogout] = useState(false);
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

  const handleLogoutConfirm = () => {
    setShowLogout(false);
    logout();
    navigate('/login');
  };

  const goToProfile = () => {
    setOpen(false);
    if (user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'super_admin') {
      navigate('/teacher');
    } else {
      navigate('/student');
    }
  };

  const initials = user?.name
      ? user.name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()
      : '?';

  return (
      <>
        {showLogout && (
            <LogoutModal
                onConfirm={handleLogoutConfirm}
                onCancel={() => setShowLogout(false)}
            />
        )}

        <header style={s.header}>
          <nav style={s.nav}>
            <Link to="/courses" style={s.logo}>
              <span style={s.logoDot} />
              LearnHub
            </Link>

            <div style={s.links} />

            <div style={s.right}>
              <button
                  onClick={toggle}
                  style={s.themeBtn}
                  aria-label="Змінити тему"
                  title={theme === 'dark' ? 'Світла тема' : 'Темна тема'}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              {isAuthenticated ? (
                  <>
                    <NotificationBell />
                    <div ref={dropRef} style={s.profileWrap}>
                      <button
                          style={s.profileBtn}
                          onClick={() => setOpen(v => !v)}
                          aria-expanded={open}
                      >
                        <div style={s.avatar}>{initials}</div>
                        <span style={s.userName}>{user?.name}</span>
                        <svg
                            width="12" height="12" viewBox="0 0 12 12" fill="none"
                            style={{ ...s.chevron, ...(open ? s.chevronOpen : {}) }}
                        >
                          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      <div style={{
                        ...s.dropdown,
                        ...(open ? s.dropdownOpen : s.dropdownClosed),
                      }}>
                        <div style={s.dropHeader}>
                          <div style={{ ...s.avatar, ...s.avatarLg }}>{initials}</div>
                          <div>
                            <p style={s.dropName}>{user?.name}</p>
                            <p style={s.dropRole}>{
                              user?.role === 'teacher'     ? 'Викладач'
                                  : user?.role === 'admin'       ? 'Адміністратор'
                                      : user?.role === 'super_admin' ? 'Супер-адмін'
                                          : 'Студент'
                            }</p>
                          </div>
                        </div>

                        <div style={s.dropDivider} />

                        <button style={s.dropItem} onClick={goToProfile}>
                          <span style={s.dropIcon}>👤</span>
                          {user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'super_admin'
                              ? 'Кабінет викладача'
                              : 'Кабінет студента'}
                        </button>

                        <Link to="/profile" style={s.dropItem} onClick={() => setOpen(false)}>
                          <span style={s.dropIcon}>⚙️</span>
                          Налаштування профілю
                        </Link>

                        <Link to="/certificates" style={s.dropItem} onClick={() => setOpen(false)}>
                          <span style={s.dropIcon}>🏆</span>
                          Мої сертифікати
                        </Link>

                        <Link to="/wishlist" style={s.dropItem} onClick={() => setOpen(false)}>
                          <span style={s.dropIcon}>♡</span>
                          Список бажань
                        </Link>

                        <Link to="/subscription" style={s.dropItem} onClick={() => setOpen(false)}>
                          <span style={s.dropIcon}>⭐</span>
                          Підписка
                        </Link>

                        {(user?.role === 'admin' || user?.role === 'super_admin') && (
                            <Link to="/admin" style={s.dropItem} onClick={() => setOpen(false)}>
                              <span style={s.dropIcon}>🛡️</span>
                              Адмін-панель
                            </Link>
                        )}

                        <div style={s.dropDivider} />

                        <button
                            style={{ ...s.dropItem, ...s.dropItemDanger }}
                            onClick={() => { setOpen(false); setShowLogout(true); }}
                        >
                          <span style={s.dropIcon}>↩</span>
                          Вийти
                        </button>
                      </div>
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
      </>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: {
    position: 'sticky', top: 0, zIndex: 100,
    backdropFilter: 'blur(12px)',
    background: 'rgba(var(--bg-rgb, 250,250,250),0.92)',
    borderBottom: '1px solid var(--border)',
  },
  nav: {
    maxWidth: 1160, margin: '0 auto',
    padding: '0 32px', height: 56,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: '0.95rem', fontWeight: 600,
    letterSpacing: '-0.02em',
    marginRight: 24, color: 'var(--text)',
  },
  logoDot: {
    width: 7, height: 7,
    borderRadius: '50%', background: 'var(--accent)', flexShrink: 0,
  },
  links: { display: 'flex', gap: 2, flex: 1 },
  link: {
    padding: '5px 12px', borderRadius: 6,
    fontSize: '0.875rem', color: 'var(--text-secondary)',
  },
  right: { display: 'flex', alignItems: 'center', gap: 8 },
  registerBtn: {
    padding: '6px 16px', borderRadius: 6,
    background: 'var(--accent)', color: 'var(--accent-inv)',
    fontSize: '0.875rem', fontWeight: 500,
  },
  profileWrap: { position: 'relative' },
  profileBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'transparent', border: '1.5px solid var(--border)',
    borderRadius: 8, padding: '4px 10px 4px 5px',
    cursor: 'pointer', color: 'var(--text-secondary)',
  },
  avatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'var(--accent)', color: 'var(--accent-inv)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.7rem', fontWeight: 600, flexShrink: 0,
  },
  userName: { fontSize: '0.8rem', color: 'var(--text)', fontWeight: 500 },
  chevron: {
    transition: 'transform 0.2s ease',
    flexShrink: 0, color: 'var(--text-tertiary)',
  },
  chevronOpen: { transform: 'rotate(180deg)' },

  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    width: 230,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 200,
    transformOrigin: 'top right',
    transition: 'opacity 0.18s ease, transform 0.18s ease, visibility 0.18s',
    background: 'var(--bg-elevated)',
    border: '1.5px solid var(--border)',
    boxShadow: 'var(--shadow-lg)',
  },
  dropdownOpen: {
    opacity: 1,
    transform: 'translateY(0) scale(1)',
    visibility: 'visible' as const,
    pointerEvents: 'all' as const,
  },
  dropdownClosed: {
    opacity: 0,
    transform: 'translateY(-6px) scale(0.97)',
    visibility: 'hidden' as const,
    pointerEvents: 'none' as const,
  },
  dropHeader: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px',
  },
  avatarLg: { width: 38, height: 38, fontSize: '0.85rem' },
  dropName: { fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', marginBottom: 1 },
  dropRole: { fontSize: '0.72rem', color: 'var(--text-tertiary)' },
  dropDivider: { height: 1, background: 'var(--border)', margin: '0 12px' },
  dropItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '10px 16px',
    fontSize: '0.875rem', color: 'var(--text-secondary)',
    background: 'transparent', border: 'none',
    textDecoration: 'none', cursor: 'pointer',
    textAlign: 'left' as const,
    fontFamily: 'inherit',
  },
  dropItemDanger: { color: '#e53e3e' },
  dropIcon: { fontSize: '0.85rem', width: 18, flexShrink: 0 },
  themeBtn: {
    width: 32, height: 32,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-elevated)',
    border: '1.5px solid var(--border)',
    borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem',
    transition: 'border-color 0.2s, background 0.2s',
    flexShrink: 0,
  },
};
