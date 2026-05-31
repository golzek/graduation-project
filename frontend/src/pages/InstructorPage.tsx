import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../context/AuthContext';
import { WishlistButton } from '../components/WishlistButton';

interface InstructorProfile {
    instructor: {
        id: string;
        name: string;
        avatarUrl: string | null;
        memberSince: string;
    };
    stats: {
        totalCourses: number;
        totalStudents: number;
        avgRating: number;
        totalReviews: number;
    };
    courses: {
        id: string;
        title: string;
        description: string;
        price: number;
        level: string;
        category: string;
        rating: number | null;
        thumbnailUrl: string | null;
        createdAt: string;
    }[];
    isFollowing: boolean;
}

function levelLabel(level: string) {
    const map: Record<string, { label: string; color: string; bg: string }> = {
        beginner:     { label: 'Початковий', color: '#15803d', bg: '#dcfce7' },
        intermediate: { label: 'Середній',   color: '#b45309', bg: '#fef3c7' },
        advanced:     { label: 'Просунутий', color: '#7c3aed', bg: '#ede9fe' },
    };
    return map[level] ?? { label: level, color: 'var(--text-secondary)', bg: 'var(--bg-subtle)' };
}

function memberSinceLabel(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
}

function pluralStudents(n: number) {
    if (n % 10 === 1 && n % 100 !== 11) return 'студент';
    if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'студенти';
    return 'студентів';
}

function pluralCourses(n: number) {
    if (n % 10 === 1 && n % 100 !== 11) return 'курс';
    if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'курси';
    return 'курсів';
}

function Skeleton({ w, h, r = 8 }: { w: string | number; h: number; r?: number }) {
    return (
        <div style={{
            width: w, height: h, borderRadius: r,
            background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
        }} />
    );
}

function CourseCard({ course }: { course: InstructorProfile['courses'][0] }) {
    const lv = levelLabel(course.level);
    return (
        <div style={s.card}>
            <Link to={`/courses/${course.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={s.thumb}>
                    {course.thumbnailUrl
                        ? <img src={course.thumbnailUrl} alt={course.title} style={s.thumbImg} />
                        : <div style={s.thumbPlaceholder}>{course.title[0]}</div>
                    }
                    <WishlistButton courseId={course.id} stopPropagation />
                </div>
            </Link>

            <div style={s.cardBody}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ ...s.badge, color: lv.color, background: lv.bg }}>{lv.label}</span>
                    {course.category && <span style={s.categoryChip}>{course.category}</span>}
                </div>

                <Link to={`/courses/${course.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 style={s.cardTitle}>{course.title}</h3>
                </Link>

                <p style={s.cardDesc}>{course.description}</p>

                <div style={s.cardFooter}>
                    {course.rating !== null ? (
                        <span style={s.rating}>
                            <span style={{ color: '#f59e0b' }}>★</span> {course.rating.toFixed(1)}
                        </span>
                    ) : (
                        <span style={s.noRating}>Без оцінок</span>
                    )}
                    <span style={s.price}>
                        {course.price === 0
                            ? <span style={{ color: '#15803d', fontWeight: 600 }}>Безкоштовно</span>
                            : <>{course.price.toLocaleString('uk-UA')} ₴</>
                        }
                    </span>
                </div>

                <Link to={`/courses/${course.id}`} style={s.btnGo}>До курсу →</Link>
            </div>
        </div>
    );
}

export function InstructorPage() {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<InstructorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'rating' | 'price'>('date');
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        apiFetch<InstructorProfile>(`/instructors/${id}`)
            .then(setData)
            .catch(() => setError('Викладача не знайдено'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <LoadingSkeleton />;
    if (error || !data) return (
        <div style={s.errorWrap}>
            <div style={s.errorIcon}>🔍</div>
            <h2 style={s.errorTitle}>{error || 'Щось пішло не так'}</h2>
            <Link to="/courses" style={s.btnPrimary}>До каталогу</Link>
        </div>
    );

    const { instructor, stats, courses } = data;

    const filtered = courses
        .filter(c =>
            !search ||
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.category?.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
            if (sortBy === 'price')  return a.price - b.price;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    return (
        <div style={s.page}>
            <div style={s.hero}>
                <div className="r-instructor-hero-inner" style={s.heroInner} >
                    <div style={s.avatarWrap}>
                        {instructor.avatarUrl
                            ? <img src={instructor.avatarUrl} alt={instructor.name} style={s.avatar} />
                            : <div style={s.avatarFallback}>{instructor.name[0].toUpperCase()}</div>
                        }
                    </div>

                    <div style={{ flex: 1 }}>
                        <p style={s.roleTag}>Викладач</p>
                        <h1 style={s.name}>{instructor.name}</h1>
                        <p style={s.since}>На платформі з {memberSinceLabel(instructor.memberSince)}</p>
                    </div>
                </div>
            </div>

            <div style={s.statsBar}>
                <div style={s.statsInner} className="r-instructor-stats-inner">
                    <div className="r-instructor-grid" style={s.statsGrid} >
                        <StatCard icon="📚" value={stats.totalCourses} label={pluralCourses(stats.totalCourses)} />
                        <StatCard icon="👥" value={stats.totalStudents} label={pluralStudents(stats.totalStudents)} />
                        <StatCard
                            icon="⭐"
                            value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
                            label="середній рейтинг"
                        />
                        <StatCard icon="💬" value={stats.totalReviews} label="відгуків" />
                    </div>
                </div>
            </div>

            <div style={s.body}>
                <div style={s.toolbar}>
                    <h2 style={s.sectionTitle}>
                        Курси викладача
                        {courses.length > 0 && (
                            <span style={s.countBadge}>{courses.length}</span>
                        )}
                    </h2>

                    <div style={s.toolbarRight}>
                        <input
                            type="text"
                            placeholder="Пошук курсів..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={s.searchInput}
                        />
                        <div style={s.sortWrap}>
                            {(['date', 'rating', 'price'] as const).map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setSortBy(opt)}
                                    style={{ ...s.sortBtn, ...(sortBy === opt ? s.sortBtnActive : {}) }}
                                >
                                    {opt === 'date' ? 'Новіші' : opt === 'rating' ? 'Рейтинг' : 'Ціна'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div style={s.empty}>
                        <div style={s.emptyIcon}>{search ? '🔍' : '📭'}</div>
                        <p style={s.emptyText}>
                            {search ? 'Нічого не знайдено' : 'Викладач ще не опублікував курси'}
                        </p>
                        {search && (
                            <button onClick={() => setSearch('')} style={s.btnPrimary}>
                                Скинути пошук
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={s.grid}>
                        {filtered.map(c => <CourseCard key={c.id} course={c} />)}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, value, label }: { icon: string; value: string | number; label: string }) {
    return (
        <div style={s.statCard}>
            <span style={s.statIcon}>{icon}</span>
            <span style={s.statValue}>{value}</span>
            <span style={s.statLabel}>{label}</span>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div style={s.page}>
            <div style={s.hero}>
                <div style={{ ...s.heroInner, gap: 20 }}>
                    <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                        <Skeleton w={80}  h={14} />
                        <Skeleton w={200} h={28} />
                        <Skeleton w={160} h={14} />
                    </div>
                </div>
            </div>
            <div style={s.statsBar}>
                <div style={s.statsInner} className="r-instructor-stats-inner">
                    <div style={{ display: 'grid', gap: 16 }}>
                        {[1,2,3,4].map(i => <Skeleton key={i} w="100%" h={80} r={12} />)}
                    </div>
                </div>
            </div>
            <div style={s.body}>
                <div style={{ display: 'grid', gap: 20 }}>
                    {[1,2,3].map(i => <Skeleton key={i} w="100%" h={320} r={14} />)}
                </div>
            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    page:   { minHeight: '100vh', background: 'var(--bg)' },

    hero:      { background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', padding: '36px 0' },
    heroInner: {
        maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 28,
    },
    avatarWrap: { flexShrink: 0 },
    avatar:    { width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid #f0f0f0' },
    avatarFallback: {
        width: 96, height: 96, borderRadius: '50%',
        background: 'linear-gradient(135deg,#0a0a0a,#444)',
        color: 'var(--bg-elevated)', fontSize: '2rem', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    roleTag: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 },
    name:    { fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: 6 },
    since:   { fontSize: '0.82rem', color: 'var(--text-tertiary)' },

    statsBar:   { background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', padding: '20px 0' },
    statsInner: { maxWidth: 1100, margin: '0 auto',  },
    statsGrid: {
        display: 'grid',

        gap: 16,
    },
    statCard: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '16px 12px', borderRadius: 12,
        border: '1.5px solid var(--border)', background: 'var(--bg)',
        gap: 4,
    },
    statIcon:  { fontSize: '1.4rem', lineHeight: 1, marginBottom: 4 },
    statValue: { fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' },
    statLabel: { fontSize: '0.72rem', color: 'var(--text-tertiary)', textAlign: 'center' },

    body: { maxWidth: 1100, margin: '32px auto' },

    toolbar: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 24,
    },
    sectionTitle: {
        fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em',
        color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10,
    },
    countBadge: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 24, height: 24, borderRadius: 99,
        background: 'var(--accent)', color: 'var(--bg-elevated)',
        fontSize: '0.7rem', fontWeight: 700, padding: '0 7px',
    },
    toolbarRight: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    searchInput: {
        padding: '7px 12px', borderRadius: 8,
        border: '1.5px solid var(--border)', background: 'var(--bg-elevated)',
        fontSize: '0.82rem', color: 'var(--text)', outline: 'none',
        width: 'clamp(100px, 20vw, 180px)',
    },
    sortWrap:      { display: 'flex', gap: 6 },
    sortBtn: {
        padding: '6px 14px', borderRadius: 6,
        border: '1.5px solid var(--border)', background: 'transparent',
        fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer',
        transition: 'all 0.15s',
    },
    sortBtnActive: { background: 'var(--accent)', color: 'var(--bg-elevated)', border: '1.5px solid var(--accent)' },

    grid: {
        display: 'grid',

        gap: 20,
    },

    card: {
        background: 'var(--bg-elevated)', border: '1.5px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'box-shadow 0.2s',
    },
    thumb: { height: 160, overflow: 'hidden', background: 'var(--bg-subtle)', position: 'relative' },
    thumbImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    thumbPlaceholder: {
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-tertiary)',
    },
    cardBody:  { padding: 16, display: 'flex', flexDirection: 'column', flex: 1 },
    badge: { display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 500 },
    categoryChip: { fontSize: '0.7rem', color: 'var(--text-tertiary)' },
    cardTitle: {
        fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.4,
        letterSpacing: '-0.01em', marginBottom: 6,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
    },
    cardDesc: {
        fontSize: '0.78rem', color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: 12,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
    },
    cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 'auto' },
    rating:   { fontSize: '0.82rem', fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 },
    noRating: { fontSize: '0.75rem', color: 'var(--text-tertiary)' },
    price:    { fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' },
    btnGo: {
        display: 'block', textAlign: 'center', padding: '9px',
        borderRadius: 8, background: 'var(--accent)', color: 'var(--accent-inv)',
        fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none',
        transition: 'opacity 0.15s',
    },

    empty: {
        padding: '60px 32px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    },
    emptyIcon: { fontSize: '3rem', marginBottom: 16 },
    emptyText: { color: 'var(--text-tertiary)', fontSize: '0.95rem', marginBottom: 20 },

    errorWrap: {
        minHeight: '60vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 32,
    },
    errorIcon:  { fontSize: '3rem', marginBottom: 16 },
    errorTitle: { fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', marginBottom: 20 },

    btnPrimary: {
        display: 'inline-block', padding: '10px 24px', borderRadius: 8,
        background: 'var(--accent)', color: 'var(--accent-inv)',
        fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none',
        border: 'none', cursor: 'pointer',
    },
};