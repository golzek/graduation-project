import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

function useVisible(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return { ref, visible };
}

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
    const [val, setVal] = useState(0);
    const { ref, visible } = useVisible(0.3);
    useEffect(() => {
        if (!visible) return;
        let start = 0;
        const step = Math.ceil(to / 60);
        const t = setInterval(() => {
            start += step;
            if (start >= to) { setVal(to); clearInterval(t); }
            else setVal(start);
        }, 16);
        return () => clearInterval(t);
    }, [visible, to]);
    return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

const FEATURES = [
    { icon: '◈', title: 'Структуровані курси', desc: 'Модулі, уроки, відео та текстовий контент в одному місці.' },
    { icon: '◎', title: 'Прогрес і статистика', desc: 'Відстежуй скільки пройдено, скільки годин витрачено.' },
    { icon: '◇', title: 'Сертифікати', desc: 'Завершив курс — отримай PDF-сертифікат з унікальним кодом.' },
    { icon: '◉', title: 'Q&A з викладачем', desc: 'Задавай питання прямо під уроком, отримуй відповіді.' },
    { icon: '○', title: 'Підписка', desc: 'Необмежений доступ до всіх курсів за місячну підписку.' },
    { icon: '◐', title: 'Реферальна програма', desc: 'Запрошуй друзів і отримуй знижки на навчання.' },
];

const STEPS = [
    { n: '01', title: 'Зареєструйся', desc: 'Акаунт через email або Google за 30 секунд.' },
    { n: '02', title: 'Обери курс', desc: 'Каталог з фільтрами за рівнем, категорією та рейтингом.' },
    { n: '03', title: 'Навчайся', desc: 'Відео, текст, Q&A — у своєму темпі, з будь-якого пристрою.' },
    { n: '04', title: 'Отримай сертифікат', desc: 'PDF з унікальним кодом верифікації — реальне підтвердження.' },
];

const TESTIMONIALS = [
    { name: 'Аліна К.', role: 'Фронтенд-розробник', text: 'Пройшла три курси за два місяці. Структура ідеальна — нічого зайвого, тільки практика.' },
    { name: 'Дмитро Л.', role: 'Data Analyst', text: 'Зручний Q&A врятував кілька разів. Викладач відповідає швидко, пояснює зрозуміло.' },
    { name: 'Оксана М.', role: 'UX Designer', text: 'Підписка окупилась за перший же тиждень. Пройшла вже 5 курсів, зупинятись не планую.' },
];

const s: Record<string, React.CSSProperties> = {
    page: { fontFamily: 'var(--font)', background: 'var(--bg)', color: 'var(--text)', overflowX: 'hidden' },

    hero: { position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 clamp(24px,6vw,96px)', overflow: 'hidden' },
    heroBg: { position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' },
    heroInner: { position: 'relative', zIndex: 1, maxWidth: 760 },
    eyebrow: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 28, padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 4 },
    dot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--text)', display: 'inline-block', animation: 'pulse 2s infinite' },
    h1: { fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 28 },
    h1Bold: { fontWeight: 700 },
    heroSub: { fontSize: 'clamp(1rem, 1.5vw, 1.15rem)', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 520, marginBottom: 44 },
    heroCta: { display: 'flex', gap: 14, flexWrap: 'wrap' as const },
    btnPrimary: { display: 'inline-block', padding: '14px 32px', background: 'var(--accent)', color: 'var(--accent-inv)', fontSize: '0.9rem', fontWeight: 600, borderRadius: 'var(--radius-md)', textDecoration: 'none', transition: 'transform 0.15s, box-shadow 0.15s', letterSpacing: '0.01em' },
    btnSecondary: { display: 'inline-block', padding: '14px 32px', background: 'transparent', color: 'var(--text)', fontSize: '0.9rem', fontWeight: 500, borderRadius: 'var(--radius-md)', textDecoration: 'none', border: '1.5px solid var(--border-strong)', transition: 'border-color 0.15s', letterSpacing: '0.01em' },
    heroScroll: { position: 'absolute', bottom: 40, left: 'clamp(24px,6vw,96px)', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', zIndex: 1 },
    scrollLine: { width: 32, height: 1, background: 'var(--border-strong)' },

    stats: { borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '32px clamp(24px,6vw,96px)', display: 'flex', gap: 0, overflowX: 'auto' as const },
    statItem: { flex: '1 0 160px', padding: '0 32px 0 0', borderRight: '1px solid var(--border)', marginRight: 32 },
    statNum: { fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1 },
    statLabel: { fontSize: '0.78rem', color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 4 },

    section: { padding: 'clamp(64px,10vw,120px) clamp(24px,6vw,96px)' },
    sectionTag: { fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 16 },
    h2: { fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 16 },
    h2Light: { fontWeight: 300 },
    sectionSub: { fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: 480, lineHeight: 1.7, marginBottom: 56 },

    featGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' },
    featCell: { padding: '36px 32px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', transition: 'background 0.2s' },
    featIcon: { fontSize: '1.4rem', marginBottom: 18, color: 'var(--text)', display: 'block' },
    featTitle: { fontSize: '0.95rem', fontWeight: 600, marginBottom: 8 },
    featDesc: { fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 },

    stepsBg: { background: 'var(--bg-subtle)' },
    stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 32 },
    stepItem: { display: 'flex', flexDirection: 'column', gap: 12 },
    stepNum: { fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', fontFamily: 'var(--mono)' },
    stepLine: { width: '100%', height: 2, background: 'var(--border-strong)', marginBottom: 4 },
    stepTitle: { fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.01em' },
    stepDesc: { fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 },

    testGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
    testCard: { padding: '32px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)' },
    testQuote: { fontSize: '1.4rem', lineHeight: 1, color: 'var(--border-strong)', marginBottom: 12, fontFamily: 'Georgia, serif' },
    testText: { fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 },
    testAuthor: { display: 'flex', flexDirection: 'column', gap: 2 },
    testName: { fontSize: '0.85rem', fontWeight: 600 },
    testRole: { fontSize: '0.75rem', color: 'var(--text-tertiary)' },

    ctaBanner: { margin: '0 clamp(24px,6vw,96px)', marginBottom: 'clamp(64px,10vw,120px)', borderRadius: 'var(--radius-lg)', background: 'var(--accent)', color: 'var(--accent-inv)', padding: 'clamp(48px,7vw,80px) clamp(32px,5vw,72px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 32 },
    ctaTitle: { fontSize: 'clamp(1.5rem, 3vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1, maxWidth: 500 },
    ctaLight: { fontWeight: 300 },
    btnInverse: { display: 'inline-block', padding: '14px 36px', background: 'var(--accent-inv)', color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 700, borderRadius: 'var(--radius-md)', textDecoration: 'none', whiteSpace: 'nowrap' as const, flexShrink: 0 },
};

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const { ref, visible } = useVisible();
    return (
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(24px)', transition: `opacity 0.6s ${delay}s, transform 0.6s ${delay}s` }}>
            {children}
        </div>
    );
}

export function LandingPage() {
    return (
        <div style={s.page}>
            <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .feat-cell:hover { background: var(--bg-muted) !important; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .btn-secondary:hover { border-color: var(--text) !important; }
      `}</style>

            <section style={s.hero}>
                <svg style={s.heroBg} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
                    <line x1="0" y1="300" x2="1440" y2="300" stroke="var(--border)" strokeWidth="1"/>
                    <line x1="0" y1="600" x2="1440" y2="600" stroke="var(--border)" strokeWidth="1"/>
                    <line x1="480" y1="0" x2="480" y2="900" stroke="var(--border)" strokeWidth="1"/>
                    <line x1="960" y1="0" x2="960" y2="900" stroke="var(--border)" strokeWidth="1"/>
                    <circle cx="960" cy="300" r="180" fill="none" stroke="var(--border)" strokeWidth="1"/>
                    <circle cx="960" cy="300" r="80" fill="none" stroke="var(--border)" strokeWidth="1"/>
                </svg>

                <div style={s.heroInner}>
                    <div style={s.eyebrow}>
                        <span style={s.dot}/>
                        Навчання онлайн
                    </div>
                    <h1 style={s.h1}>
                        Знання,<br/>
                        <span style={s.h1Bold}>які працюють</span><br/>
                        на тебе
                    </h1>
                    <p style={s.heroSub}>
                        Структуровані відеокурси від практикуючих спеціалістів.
                        Навчайся у своєму темпі, отримуй сертифікати, ростай у кар'єрі.
                    </p>
                    <div style={s.heroCta}>
                        <Link to="/courses" style={s.btnPrimary} className="btn-primary">
                            Переглянути курси →
                        </Link>
                        <Link to="/register" style={s.btnSecondary} className="btn-secondary">
                            Реєстрація безкоштовна
                        </Link>
                    </div>
                </div>

                <div style={s.heroScroll}>
                    <span style={s.scrollLine}/>
                    scroll
                </div>
            </section>

            <div style={s.stats}>
                {[
                    { to: 1200, suffix: '+', label: 'Студентів' },
                    { to: 48, suffix: '', label: 'Курсів' },
                    { to: 32, suffix: '', label: 'Викладачів' },
                    { to: 94, suffix: '%', label: 'Завершили курс' },
                ].map((st, i) => (
                    <div key={i} style={{ ...s.statItem, ...(i === 3 ? { borderRight: 'none', marginRight: 0 } : {}) }}>
                        <div style={s.statNum}><Counter to={st.to} suffix={st.suffix}/></div>
                        <div style={s.statLabel}>{st.label}</div>
                    </div>
                ))}
            </div>

            <section style={s.section}>
                <Reveal>
                    <div style={s.sectionTag}>Можливості</div>
                    <h2 style={s.h2}>Все що потрібно<br/><span style={s.h2Light}>для навчання</span></h2>
                    <p style={s.sectionSub}>Від першого уроку до сертифіката — платформа супроводжує на кожному кроці.</p>
                </Reveal>
                <Reveal delay={0.1}>
                    <div style={s.featGrid}>
                        {FEATURES.map((f, i) => (
                            <div key={i} style={s.featCell} className="feat-cell">
                                <span style={s.featIcon}>{f.icon}</span>
                                <div style={s.featTitle}>{f.title}</div>
                                <div style={s.featDesc}>{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </Reveal>
            </section>

            <section style={{ ...s.section, ...s.stepsBg }}>
                <Reveal>
                    <div style={s.sectionTag}>Як це працює</div>
                    <h2 style={s.h2}>Чотири кроки<br/><span style={s.h2Light}>до нових знань</span></h2>
                    <p style={s.sectionSub}>Без складних налаштувань — від реєстрації до першого уроку за кілька хвилин.</p>
                </Reveal>
                <Reveal delay={0.1}>
                    <div style={s.stepsGrid}>
                        {STEPS.map((st, i) => (
                            <div key={i} style={s.stepItem}>
                                <div style={s.stepNum}>{st.n}</div>
                                <div style={s.stepLine}/>
                                <div style={s.stepTitle}>{st.title}</div>
                                <div style={s.stepDesc}>{st.desc}</div>
                            </div>
                        ))}
                    </div>
                </Reveal>
            </section>

            <section style={s.section}>
                <Reveal>
                    <div style={s.sectionTag}>Відгуки</div>
                    <h2 style={s.h2}>Що кажуть<br/><span style={s.h2Light}>студенти</span></h2>
                </Reveal>
                <Reveal delay={0.1}>
                    <div style={s.testGrid}>
                        {TESTIMONIALS.map((t, i) => (
                            <div key={i} style={s.testCard}>
                                <div style={s.testQuote}>"</div>
                                <p style={s.testText}>{t.text}</p>
                                <div style={s.testAuthor}>
                                    <span style={s.testName}>{t.name}</span>
                                    <span style={s.testRole}>{t.role}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Reveal>
            </section>

            <Reveal>
                <div style={s.ctaBanner}>
                    <div style={s.ctaTitle}>
                        Почни навчання<br/>
                        <span style={s.ctaLight}>вже сьогодні — безкоштовно</span>
                    </div>
                    <Link to="/register" style={s.btnInverse}>
                        Створити акаунт →
                    </Link>
                </div>
            </Reveal>
        </div>
    );
}