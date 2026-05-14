import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const loc = useLocation();
  const active = (path: string) => loc.pathname.startsWith(path);

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
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <Link to="/teacher" style={{ ...s.link, ...(active('/teacher') ? s.linkActive : {}) }}>
              Кабінет
            </Link>
          )}
          {(user?.role === 'student' || user?.role === 'admin') && (
              <Link to="/student" style={{ ...s.link, ...(active('/student') ? s.linkActive : {}) }}>
                Кабінет студента
              </Link>
          )}
        </div>

        <div style={s.right}>
          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <Link to="/admin" style={s.adminLink}>Адмін</Link>
              )}
              <span style={s.userName}>{user?.name}</span>
              <button style={s.logoutBtn} onClick={logout}>Вийти</button>
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
  userName: { fontSize: '0.8rem', color: '#9a9a9a' },
  adminLink: {
    fontSize: '0.75rem', fontWeight: 500,
    padding: '4px 10px', borderRadius: 4,
    background: '#0a0a0a', color: '#fafafa',
    letterSpacing: '0.03em', textTransform: 'uppercase' as const,
  },
  logoutBtn: {
    padding: '5px 14px', borderRadius: 6,
    border: '1.5px solid #ebebeb', background: 'transparent',
    fontSize: '0.875rem', color: '#5a5a5a',
    transition: 'border-color 0.1s, color 0.1s',
  },
  registerBtn: {
    padding: '6px 16px', borderRadius: 6,
    background: '#0a0a0a', color: '#fafafa',
    fontSize: '0.875rem', fontWeight: 500,
  },
};
