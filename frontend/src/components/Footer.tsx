import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer style={s.footer}>
            <div style={s.inner} className="r-footer-inner">
                <div style={s.brand}>
                    <Link to="/courses" style={s.logo}>LearnHub</Link>
                    <p style={s.tagline}>
                        Навчайся. Розвивайся. Досягай.
                    </p>
                    <p style={s.copy}>© {year} LearnHub. Всі права захищені.</p>
                </div>

                <div style={s.col}>
                    <p style={s.colTitle}>Платформа</p>
                    <Link to="/courses"      style={s.link}>Каталог курсів</Link>
                    <Link to="/subscription" style={s.link}>Підписка</Link>
                    <Link to="/certificates" style={s.link}>Мої сертифікати</Link>
                    <Link to="/wishlist"     style={s.link}>Список бажань</Link>
                </div>

                <div style={s.col}>
                    <p style={s.colTitle}>Викладачам</p>
                    <Link to="/teacher"         style={s.link}>Кабінет викладача</Link>
                    <Link to="/courses/create"  style={s.link}>Створити курс</Link>
                </div>

                <div style={s.col}>
                    <p style={s.colTitle}>Підтримка</p>
                    <Link to="/terms"   style={s.link}>Умови користування</Link>
                    <Link to="/privacy" style={s.link}>Політика конфіденційності</Link>
                    <a href="mailto:elearn@gmail.com" style={s.link}>elearn@gmail.com</a>
                </div>

            </div>

            <div style={s.bar}>
                <div style={s.barInner} className="r-footer-bar-inner">
          <span style={s.barText}>
            Зроблено з ❤️ для освіти
          </span>
                    <div style={s.barLinks}>
                        <Link to="/terms"   style={s.barLink}>Умови користування</Link>
                        <span style={s.dot}>·</span>
                        <Link to="/privacy" style={s.barLink}>Політика конфіденційності</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

const s: Record<string, React.CSSProperties> = {
    footer: {
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
        marginTop: 80,
    },
    inner: {
        maxWidth: 1160,
        margin: '0 auto',

        display: 'grid',
        gap: 40,
    },

    brand: { display: 'flex', flexDirection: 'column' as const, gap: 10 },
    logo: {
        fontSize: '1.1rem', fontWeight: 700,
        letterSpacing: '-0.03em', color: 'var(--text)',
        textDecoration: 'none',
    },
    tagline: { fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 200 },
    copy:    { fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 },

    col: { display: 'flex', flexDirection: 'column' as const, gap: 10 },
    colTitle: {
        fontSize: '0.7rem', fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.07em', color: 'var(--text-tertiary)',
        marginBottom: 4,
    },
    link: {
        fontSize: '0.875rem', color: 'var(--text-secondary)',
        textDecoration: 'none', transition: 'color 0.15s',
    },

    bar: { borderTop: '1px solid #f5f5f5', background: 'var(--bg)' },
    barInner: {
        maxWidth: 1160, margin: '0 auto',

        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    barText: { fontSize: '0.78rem', color: 'var(--text-tertiary)' },
    barLinks: { display: 'flex', alignItems: 'center', gap: 8 },
    barLink: { fontSize: '0.78rem', color: 'var(--text-tertiary)', textDecoration: 'none' },
    dot: { color: 'var(--border-strong)', fontSize: '0.78rem' },
};