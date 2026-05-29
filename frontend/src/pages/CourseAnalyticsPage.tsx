import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../context/AuthContext';

interface CourseStats {
    courseId: string;
    title: string;
    students: number;
    revenue: number;
    certificates: number;
    avgProgressPercent: number;
    enrollsByDay: { date: string; count: number }[];
    topLessons: { title: string; views: number; avgWatchedSec: number }[];
}

export function CourseAnalyticsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [stats, setStats] = useState<CourseStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        apiFetch<CourseStats>(`/analytics/courses/${id}`)
            .then(setStats)
            .catch(() => setError('Не вдалось завантажити аналітику'))
            .finally(() => setLoading(false));
    }, [id]);

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        if (h > 0) return `${h} год ${m} хв`;
        if (m > 0) return `${m} хв`;
        return `${sec} сек`;
    };

    const fmtDate = (d: string) => new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });

    if (loading) return (
        <div style={s.page}>
            <div style={s.container}>
                <div style={s.skeletonHeader} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
                    {[0,1,2,3].map(i => <div key={i} style={s.skeletonCard} />)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div style={{ ...s.skeletonCard, height: 220 }} />
                    <div style={{ ...s.skeletonCard, height: 220 }} />
                </div>
            </div>
        </div>
    );

    if (error || !stats) return (
        <div style={s.page}>
            <div style={{ textAlign: 'center', padding: '80px 32px' }}>
                <p style={{ fontSize: '2rem', marginBottom: 12 }}>😕</p>
                <p style={{ color: '#6b7280', marginBottom: 20 }}>{error || 'Курс не знайдено'}</p>
                <button onClick={() => navigate('/teacher')} style={s.btnBack}>← Назад до дашборду</button>
            </div>
        </div>
    );

    const maxEnrolls = Math.max(...stats.enrollsByDay.map(d => d.count), 1);
    const maxViews   = Math.max(...stats.topLessons.map(l => l.views), 1);

    const metrics = [
        { icon: '👥', label: 'Студентів',    value: stats.students,             color: '#0891b2' },
        { icon: '💰', label: 'Дохід',        value: `${stats.revenue.toLocaleString('uk-UA')} ₴`, color: '#059669' },
        { icon: '🎓', label: 'Сертифікатів', value: stats.certificates,         color: '#d97706' },
        { icon: '📈', label: 'Сер. прогрес', value: `${stats.avgProgressPercent}%`, color: '#7c3aed' },
    ];

    return (
        <div style={s.page}>
            <div style={s.container}>

                <div style={s.header}>
                    <button onClick={() => navigate('/teacher')} style={s.btnBack}>← Назад</button>
                    <div>
                        <p style={s.breadcrumb}>Аналітика курсу</p>
                        <h1 style={s.title}>{stats.title}</h1>
                    </div>
                    <Link to={`/courses/${stats.courseId}/edit`} style={s.btnEdit}>Редагувати курс</Link>
                </div>

                <div style={s.metricsRow}>
                    {metrics.map(m => (
                        <div key={m.label} style={s.metricCard}>
                            <div style={{ ...s.metricIcon, background: m.color + '18', color: m.color }}>{m.icon}</div>
                            <div>
                                <p style={s.metricValue}>{m.value}</p>
                                <p style={s.metricLabel}>{m.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={s.card}>
                    <p style={s.cardTitle}>Середнє завершення курсу</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={s.progressTrack}>
                            <div style={{ ...s.progressFill, width: `${stats.avgProgressPercent}%` }} />
                        </div>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#7c3aed', flexShrink: 0 }}>
              {stats.avgProgressPercent}%
            </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 8 }}>
                        Відсоток студентів, які в середньому пройшли уроки курсу
                    </p>
                </div>

                <div style={s.twoCol}>
                    <div style={s.card}>
                        <p style={s.cardTitle}>Записи за останні 30 днів</p>
                        {stats.enrollsByDay.length === 0 ? (
                            <p style={s.empty}>Записів за цей період немає</p>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 120, marginTop: 8 }}>
                                {stats.enrollsByDay.map((d, i) => {
                                    const h = Math.max((d.count / maxEnrolls) * 90, d.count > 0 ? 6 : 0);
                                    return (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                            {d.count > 0 && <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>{d.count}</span>}
                                            <div
                                                title={`${fmtDate(d.date)}: ${d.count}`}
                                                style={{
                                                    width: '100%', height: `${h}px`,
                                                    background: 'linear-gradient(180deg, #6366f1, #4f46e5)',
                                                    borderRadius: '3px 3px 0 0', opacity: 0.85,
                                                }}
                                            />
                                            {(i === 0 || i === stats.enrollsByDay.length - 1 || i === Math.floor(stats.enrollsByDay.length / 2)) && (
                                                <span style={{ fontSize: '0.58rem', color: '#c0c0c0', whiteSpace: 'nowrap' }}>{fmtDate(d.date)}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div style={s.card}>
                        <p style={s.cardTitle}>Топ уроків за переглядами</p>
                        {stats.topLessons.length === 0 ? (
                            <p style={s.empty}>Даних про перегляди ще немає</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                                {stats.topLessons.map((l, i) => {
                                    const pct = Math.round((l.views / maxViews) * 100);
                                    return (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c0c0c0', flexShrink: 0 }}>#{i + 1}</span>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: 12, flexShrink: 0, marginLeft: 12 }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5' }}>{l.views} переглядів</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{formatTime(l.avgWatchedSec)} сер.</span>
                                                </div>
                                            </div>
                                            <div style={{ height: 4, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${pct}%`, background: '#4f46e5', borderRadius: 99, transition: 'width 0.4s' }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ ...s.card, background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', border: 'none', color: '#fff' }}>
                    <p style={{ ...s.cardTitle, color: 'rgba(255,255,255,0.6)' }}>Загальний підсумок</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
                        {[
                            { label: 'Конверсія в сертифікат', value: stats.students > 0 ? `${Math.round((stats.certificates / stats.students) * 100)}%` : '—' },
                            { label: 'Дохід на студента', value: stats.students > 0 ? `${Math.round(stats.revenue / stats.students).toLocaleString('uk-UA')} ₴` : '—' },
                            { label: 'Записів за 30 днів', value: stats.enrollsByDay.reduce((s, d) => s + d.count, 0) },
                        ].map(item => (
                            <div key={item.label}>
                                <p style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{item.value}</p>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' }}>{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    page:        { minHeight: '100vh', background: '#f9fafb' },
    container:   { maxWidth: 1100, margin: '0 auto', padding: '32px 32px 60px' },
    header:      { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 },
    breadcrumb:  { fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' },
    title:       { fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#111827', letterSpacing: '-0.02em' },
    btnBack: {
        padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb',
        background: '#fff', color: '#374151', fontSize: '0.85rem',
        cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, textDecoration: 'none',
        display: 'inline-flex', alignItems: 'center',
    },
    btnEdit: {
        marginLeft: 'auto', padding: '9px 20px', borderRadius: 8,
        background: '#4f46e5', color: '#fff', fontSize: '0.85rem',
        fontWeight: 600, textDecoration: 'none', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center',
    },
    metricsRow:   { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 },
    metricCard:   { background: '#fff', borderRadius: 14, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' },
    metricIcon:   { width: 46, height: 46, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
    metricValue:  { margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#111827' },
    metricLabel:  { margin: '2px 0 0', fontSize: '0.78rem', color: '#6b7280' },
    twoCol:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },
    card:         { background: '#fff', borderRadius: 14, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', marginBottom: 20 },
    cardTitle:    { fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', margin: '0 0 14px' },
    progressTrack:{ flex: 1, height: 12, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' },
    progressFill: { height: '100%', background: 'linear-gradient(90deg, #7c3aed, #4f46e5)', borderRadius: 99, transition: 'width 0.6s ease' },
    empty:        { color: '#9ca3af', fontSize: '0.875rem', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' },
    skeletonHeader: { height: 60, background: '#f0f0f0', borderRadius: 10, marginBottom: 28, animation: 'pulse 1.5s ease-in-out infinite' },
    skeletonCard:   { height: 100, background: '#f0f0f0', borderRadius: 14, animation: 'pulse 1.5s ease-in-out infinite' },
};