import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer style={s.footer}>
            <div style={s.inner}>
                <div style={s.brand}>
                    <Link to="/courses" style={s.logo}>ELearn</Link>
                    <p style={s.tagline}>
                        Навчайся. Розвивайся. Досягай.
                    </p>
                    <p style={s.copy}>© {year} ELearn. Всі права захищені.</p>
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
                    <Link to="/terms"   style={s.link}>Terms &amp; Conditions</Link>
                    <Link to="/privacy" style={s.link}>Privacy Policy</Link>
                    <a href="mailto:support@elearn.ua" style={s.link}>support@elearn.ua</a>
                </div>

            </div>

            <div style={s.bar}>
                <div style={s.barInner}>
          <span style={s.barText}>
            Зроблено з ❤️ для освіти
          </span>
                    <div style={s.barLinks}>
                        <Link to="/terms"   style={s.barLink}>Terms &amp; Conditions</Link>
                        <span style={s.dot}>·</span>
                        <Link to="/privacy" style={s.barLink}>Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

const s: Record<string, React.CSSProperties> = {
    footer: {
        borderTop: '1px solid #ebebeb',
        background: '#fff',
        marginTop: 80,
    },
    inner: {
        maxWidth: 1160,
        margin: '0 auto',
        padding: '56px 32px 48px',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr',
        gap: 40,
    },

    brand: { display: 'flex', flexDirection: 'column' as const, gap: 10 },
    logo: {
        fontSize: '1.1rem', fontWeight: 700,
        letterSpacing: '-0.03em', color: '#0a0a0a',
        textDecoration: 'none',
    },
    tagline: { fontSize: '0.85rem', color: '#5a5a5a', lineHeight: 1.5, maxWidth: 200 },
    copy:    { fontSize: '0.75rem', color: '#b0b0b0', marginTop: 4 },

    col: { display: 'flex', flexDirection: 'column' as const, gap: 10 },
    colTitle: {
        fontSize: '0.7rem', fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.07em', color: '#9a9a9a',
        marginBottom: 4,
    },
    link: {
        fontSize: '0.875rem', color: '#5a5a5a',
        textDecoration: 'none', transition: 'color 0.15s',
    },

    bar: { borderTop: '1px solid #f5f5f5', background: '#fafafa' },
    barInner: {
        maxWidth: 1160, margin: '0 auto',
        padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    barText: { fontSize: '0.78rem', color: '#b0b0b0' },
    barLinks: { display: 'flex', alignItems: 'center', gap: 8 },
    barLink: { fontSize: '0.78rem', color: '#b0b0b0', textDecoration: 'none' },
    dot: { color: '#d6d6d6', fontSize: '0.78rem' },
};