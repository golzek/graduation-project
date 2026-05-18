import React, { useEffect, useState } from 'react';
import { StudentDashboardSkeleton } from '../components/Skeleton';
import { Link } from 'react-router-dom';
import { useAuth, apiFetch } from '../context/AuthContext';

interface EnrolledCourse {
    id: string;
    course: {
        id: string;
        title: string;
        category: string;
        level: string;
        author: { name: string };
    };
    enrolledAt: string;
    paidPrice: number;
}

interface CourseProgress {
    courseId: string;
    percent: number;
    completedCount: number;
    totalCount: number;
}

interface RecentActivity {
    lessonTitle: string;
    courseTitle: string;
    courseId: string;
    updatedAt: string;
    completed: boolean;
}

export function StudentDashboard() {
    const { user } = useAuth();
    const [enrollments, setEnrollments]     = useState<EnrolledCourse[]>([]);
    const [progresses, setProgresses]       = useState<Record<string, CourseProgress>>({});
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading]             = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const certs = await apiFetch<any[]>('/certificates/my');

                const catalog = await apiFetch<{ data: any[] }>('/courses?limit=50');
                const allCourses = catalog.data ?? [];

                const enrolled: EnrolledCourse[] = [];
                const progressMap: Record<string, CourseProgress> = {};

                await Promise.all(
                    allCourses.map(async (c: any) => {
                        try {
                            const detail = await apiFetch<any>(`/courses/${c.id}`);
                            if (detail.isEnrolled) {
                                enrolled.push({
                                    id: c.id,
                                    course: {
                                        id: c.id,
                                        title: c.title,
                                        category: c.category,
                                        level: c.level,
                                        author: c.author,
                                    },
                                    enrolledAt: c.createdAt,
                                    paidPrice: c.price,
                                });
                                const prog = await apiFetch<CourseProgress>(`/courses/${c.id}/progress`);
                                progressMap[c.id] = { ...prog, courseId: c.id };
                            }
                        } catch {}
                    })
                );

                setEnrollments(enrolled);
                setProgresses(progressMap);
                const recent: RecentActivity[] = enrolled
                    .filter(e => progressMap[e.course.id]?.completedCount > 0)
                    .map(e => ({
                        lessonTitle: `${progressMap[e.course.id]?.completedCount} уроків завершено`,
                        courseTitle: e.course.title,
                        courseId: e.course.id,
                        updatedAt: new Date().toISOString(),
                        completed: progressMap[e.course.id]?.percent === 100,
                    }))
                    .slice(0, 5);

                setRecentActivity(recent);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const totalCourses    = enrollments.length;
    const completedCourses = Object.values(progresses).filter(p => p.percent === 100).length;
    const avgProgress     = totalCourses
        ? Math.round(Object.values(progresses).reduce((s, p) => s + p.percent, 0) / totalCourses)
        : 0;

    if (loading) return <StudentDashboardSkeleton />;

    return (
        <div style={s.page}>
            <div style={s.header}>
                <div style={s.headerInner}>
                    <div style={s.avatar}>{user?.name?.[0] ?? 'S'}</div>
                    <div>
                        <h1 style={s.greeting}>Вітаємо, {user?.name?.split(' ')[0]}!</h1>
                        <p style={s.greetingSub}>Ось твій прогрес навчання</p>
                    </div>
                </div>
            </div>

            <div style={s.body}>
                <div style={s.metricsRow}>
                    <MetricCard label="Курсів записано"   value={totalCourses}    />
                    <MetricCard label="Завершено"          value={completedCourses}/>
                    <MetricCard label="Середній прогрес"  value={`${avgProgress}%`}/>
                    <MetricCard label="Сертифікатів"       value={completedCourses}/>
                </div>

                <div style={s.twoCol}>
                    <div style={s.section}>
                        <div style={s.sectionHead}>
                            <p style={s.sectionTitle}>Мої курси</p>
                            <Link to="/courses" style={s.sectionLink}>Каталог →</Link>
                        </div>

                        {enrollments.length === 0 ? (
                            <div style={s.empty}>
                                <p style={{ marginBottom: 12 }}>Ти ще не записаний на жоден курс</p>
                                <Link to="/courses" style={s.btnPrimary}>Перейти до каталогу</Link>
                            </div>
                        ) : (
                            <div style={s.courseList}>
                                {enrollments.map(e => {
                                    const prog = progresses[e.course.id];
                                    return (
                                        <Link key={e.id} to={`/courses/${e.course.id}`} style={s.courseRow}>
                                            <div style={s.courseThumb}>
                                                {e.course.title[0]}
                                            </div>
                                            <div style={s.courseInfo}>
                                                <p style={s.courseTitle}>{e.course.title}</p>
                                                <p style={s.courseMeta}>{e.course.author?.name} · {e.course.category}</p>
                                                {prog && (
                                                    <div style={{ marginTop: 8 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#9a9a9a', marginBottom: 4 }}>
                                                            <span>{prog.completedCount}/{prog.totalCount} уроків</span>
                                                            <span style={{ fontWeight: 500, color: '#0a0a0a' }}>{prog.percent}%</span>
                                                        </div>
                                                        <div style={s.progressTrack}>
                                                            <div style={{ ...s.progressFill, width: `${prog.percent}%` }} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {prog?.percent === 100 && (
                                                <span style={s.completedBadge}>✓</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div>
                        <div style={{ ...s.section, marginBottom: 16 }}>
                            <p style={s.sectionTitle}>Остання активність</p>
                            {recentActivity.length === 0 ? (
                                <p style={s.emptyText}>Активності поки немає. Почни перший урок!</p>
                            ) : (
                                recentActivity.map((a, i) => (
                                    <Link key={i} to={`/courses/${a.courseId}`} style={s.activityRow}>
                                        <div style={s.activityDot} />
                                        <div>
                                            <p style={s.activityTitle}>{a.courseTitle}</p>
                                            <p style={s.activitySub}>{a.lessonTitle}</p>
                                        </div>
                                        {a.completed && <span style={s.completedBadge}>✓</span>}
                                    </Link>
                                ))
                            )}
                        </div>

                        <div style={s.section}>
                            <div style={s.sectionHead}>
                                <p style={s.sectionTitle}>Сертифікати</p>
                                <Link to="/certificates" style={s.sectionLink}>Всі →</Link>
                            </div>
                            {completedCourses === 0 ? (
                                <p style={s.emptyText}>Завершуй курси на 100% щоб отримати сертифікат</p>
                            ) : (
                                enrollments
                                    .filter(e => progresses[e.course.id]?.percent === 100)
                                    .map(e => (
                                        <div key={e.id} style={s.certRow}>
                                            <div style={s.certIcon}>🏆</div>
                                            <div>
                                                <p style={s.courseTitle}>{e.course.title}</p>
                                                <p style={s.courseMeta}>Курс завершено</p>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div style={s.metricCard}>
            <p style={s.metricValue}>{value}</p>
            <p style={s.metricLabel}>{label}</p>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    page:    { minHeight: '100vh', background: '#fafafa' },
    loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#9a9a9a' },
    header:  { borderBottom: '1px solid #ebebeb', background: '#fff', padding: '28px 0' },
    headerInner: { maxWidth: 1160, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 16 },
    avatar: {
        width: 44, height: 44, borderRadius: '50%',
        background: '#0a0a0a', color: '#fafafa',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', fontWeight: 600, flexShrink: 0,
    },
    greeting:    { fontSize: '1.2rem', fontWeight: 600, letterSpacing: '-0.02em' },
    greetingSub: { fontSize: '0.85rem', color: '#9a9a9a', marginTop: 2 },
    body:        { maxWidth: 1160, margin: '28px auto', padding: '0 32px' },
    metricsRow:  { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
    metricCard:  { background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 10, padding: '16px 18px' },
    metricValue: { fontSize: '1.6rem', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 2 },
    metricLabel: { fontSize: '0.75rem', color: '#9a9a9a', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    twoCol:      { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' },
    section:     { background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '18px 20px' },
    sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle:{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: '#9a9a9a' },
    sectionLink: { fontSize: '0.8rem', color: '#0a0a0a' },
    courseList:  { display: 'flex', flexDirection: 'column' as const, gap: 0 },
    courseRow: {
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 0', borderBottom: '1px solid #f5f5f5',
        textDecoration: 'none', color: 'inherit',
        transition: 'opacity 0.1s',
    },
    courseThumb: {
        width: 38, height: 38, borderRadius: 8,
        background: '#f5f5f5', color: '#9a9a9a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem', fontWeight: 600, flexShrink: 0,
    },
    courseInfo:  { flex: 1, minWidth: 0 },
    courseTitle: { fontSize: '0.875rem', fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
    courseMeta:  { fontSize: '0.75rem', color: '#9a9a9a' },
    progressTrack: { height: 3, background: '#f5f5f5', borderRadius: 99, overflow: 'hidden' },
    progressFill:  { height: '100%', background: '#0a0a0a', borderRadius: 99, transition: 'width 0.5s' },
    completedBadge: {
        width: 20, height: 20, borderRadius: '50%',
        background: '#0a0a0a', color: '#fafafa',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.6rem', flexShrink: 0,
    },
    activityRow: {
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 0', borderBottom: '1px solid #f5f5f5',
        textDecoration: 'none', color: 'inherit',
    },
    activityDot:   { width: 6, height: 6, borderRadius: '50%', background: '#0a0a0a', flexShrink: 0 },
    activityTitle: { fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 },
    activitySub:   { fontSize: '0.75rem', color: '#9a9a9a' },
    certRow:       { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' },
    certIcon:      { fontSize: '1.2rem', flexShrink: 0 },
    empty:         { textAlign: 'center' as const, padding: '32px 0', color: '#9a9a9a', fontSize: '0.875rem' },
    emptyText:     { color: '#9a9a9a', fontSize: '0.8rem', padding: '8px 0' },
    btnPrimary: {
        display: 'inline-block', padding: '8px 18px',
        background: '#0a0a0a', color: '#fafafa',
        borderRadius: 7, fontSize: '0.85rem', textDecoration: 'none',
    },
};