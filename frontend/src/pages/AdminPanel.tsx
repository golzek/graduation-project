import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Skeleton } from '../components/Skeleton';
import { NotificationBell } from '../components/NotificationBell';
import { useTheme } from '../context/ThemeContext';

type Tab = 'stats' | 'users' | 'courses' | 'teachers' | 'reviews' | 'promos' | 'payouts' | 'audit';

interface TopCourse {
  courseId: string;
  title: string;
  enrollments: number;
  revenue: number;
}

interface PlatformStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  completionRate: number;
  newUsersThisMonth: number | null;
  newCoursesThisMonth: number | null;
  periodLabel: string | null;
  usersByRole: Record<string, number>;
  registrationsByDay: { date: string; count: number }[];
  revenueByDay: { date: string; revenue: number }[];
  topCourses: TopCourse[];
  granularity?: 'day' | 'month';
  dateFrom?: string | null;
  dateTo?: string | null;
}

type PeriodPreset = 'week' | 'month' | 'year' | 'custom';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AdminCourse {
  id: string;
  title: string;
  status: string;
  price: number;
  createdAt: string;
  author: { name: string; email: string };
}

interface CourseLesson {
  id: string;
  title: string;
  type: string;
  durationSec: number;
  orderIndex: number;
  isFree: boolean;
  contentUrl?: string | null;
  textContent?: string | null;
}

interface CourseModuleDetail {
  id: string;
  title: string;
  orderIndex: number;
  lessons: CourseLesson[];
}

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  price: number;
  level: string;
  category: string | null;
  thumbnailUrl: string | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; email: string };
  modules: CourseModuleDetail[];
}

interface PendingReview {
  id: string;
  rating: number;
  body: string;
  isApproved: boolean;
  createdAt: string;
  user: { name: string; email: string };
  course: { title: string };
}

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>('stats');
  const { theme, toggle } = useTheme();

  const tabs: { key: Tab; label: string }[] = [
    { key: 'stats',    label: 'Статистика' },
    { key: 'users',    label: 'Користувачі' },
    { key: 'courses',  label: 'Курси' },
    { key: 'teachers', label: 'Викладачі' },
    { key: 'reviews',  label: 'Відгуки' },
    { key: 'promos',   label: 'Промокоди' },
    { key: 'payouts',  label: 'Виплати' },
    { key: 'audit',    label: 'Аудит' },
  ];

  return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.headerInner} className="r-admin-header-inner">
            <Link to="/courses" style={s.backLink}>← До сайту</Link>
            <div style={s.headerTitle}>
              <span style={s.headerDot} />
              Адмін-панель
            </div>
            <div style={s.tabsRow} className="r-admin-tabs">
              {tabs.map(t => (
                  <button
                      key={t.key}
                      style={{ ...s.tabBtn, ...(tab === t.key ? s.tabBtnActive : {}) }}
                      onClick={() => setTab(t.key)}
                  >
                    {t.label}
                  </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <NotificationBell />
              <button
                  onClick={toggle}
                  style={s.themeBtn}
                  aria-label="Змінити тему"
                  title={theme === 'dark' ? 'Світла тема' : 'Темна тема'}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>

        <div style={s.body} className="r-admin-body">
          {tab === 'stats'   && <StatsTab />}
          {tab === 'users'   && <UsersTab />}
          {tab === 'courses' && <CoursesTab />}
          {tab === 'teachers' && <TeachersTab />}
          {tab === 'reviews' && <ReviewsTab />}
          {tab === 'promos'  && <PromosTab />}
          {tab === 'payouts' && <PayoutsTab />}
          {tab === 'audit'   && <AuditTab />}
        </div>
      </div>
  );
}

function StatsTab() {
  const [stats, setStats]     = useState<PlatformStats | null>(null);
  const [period, setPeriod]   = useState<PeriodPreset>('week');
  const [customFrom, setFrom] = useState('');
  const [customTo,   setTo]   = useState('');
  const [loading, setLoading] = useState(true);

  const load = (p: PeriodPreset, from: string, to: string) => {
    setLoading(true);
    setStats(null);
    const params = new URLSearchParams();
    if (p !== 'custom') { params.set('period', p); }
    else { if (from) params.set('from', from); if (to) params.set('to', to); }
    apiFetch<PlatformStats>(`/admin/stats?${params}`)
        .then(setStats).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(period, customFrom, customTo); }, []);

  const handlePeriod = (p: PeriodPreset) => {
    setPeriod(p);
    if (p !== 'custom') load(p, '', '');
  };

  const handleCustomApply = () => load('custom', customFrom, customTo);

  const presets: { key: PeriodPreset; label: string }[] = [
    { key: 'week',   label: '7 днів' },
    { key: 'month',  label: 'Місяць' },
    { key: 'year',   label: 'Рік' },
    { key: 'custom', label: 'Довільний' },
  ];

  const periodSelector = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {presets.map(p => (
              <button
                  key={p.key}
                  style={{ ...s.periodBtn, ...(period === p.key ? s.periodBtnActive : {}) }}
                  onClick={() => handlePeriod(p.key)}
              >{p.label}</button>
          ))}
        </div>
        {period === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="date" className="input" style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                     value={customFrom} onChange={e => setFrom(e.target.value)} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>—</span>
              <input type="date" className="input" style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                     value={customTo} onChange={e => setTo(e.target.value)} />
              <button style={s.applyBtn} onClick={handleCustomApply}>Застосувати</button>
            </div>
        )}
      </div>
  );

  if (loading || !stats) return (
      <div>
        {periodSelector}
        <div style={{ display: 'grid', gap: 12, marginBottom: 24 }} className="r-metrics-5">
          {[0,1,2,3,4].map(i => (
              <div key={i} style={s.card}>
                <Skeleton width={50} height={28} style={{ marginBottom: 8 }} />
                <Skeleton width={120} height={13} style={{ marginBottom: 4 }} />
                <Skeleton width={80} height={11} />
              </div>
          ))}
        </div>
      </div>
  );

  const pl = stats.periodLabel ?? null;
  const metrics = [
    {
      label: 'Користувачів',
      value: stats.totalUsers,
      sub: pl ? pl : stats.newUsersThisMonth !== null ? `+${stats.newUsersThisMonth} цього місяця` : 'загалом',
    },
    {
      label: 'Курсів',
      value: stats.totalCourses,
      sub: pl ? pl : stats.newCoursesThisMonth !== null ? `+${stats.newCoursesThisMonth} цього місяця` : 'загалом',
    },
    { label: 'Записів', value: stats.totalEnrollments, sub: pl || 'загалом' },
    { label: 'Дохід',   value: `${stats.totalRevenue.toLocaleString('uk-UA')} ₴`, sub: pl || 'загалом' },
    {
      label: 'Completion rate',
      value: `${stats.completionRate}%`,
      sub: 'завершили курс',
      highlight: true,
    },
  ];

  return (
      <div>
        <p style={s.pageTitle}>Статистика платформи</p>

        {periodSelector}

        <div style={{ ...s.metricsRow }} className="r-metrics-5">
          {metrics.map(m => (
              <div key={m.label} style={s.card}>
                {'highlight' in m && m.highlight ? (
                    <CompletionRing pct={stats.completionRate} />
                ) : (
                    <p style={s.metricValue}>{m.value}</p>
                )}
                <p style={s.metricLabel}>{m.label}</p>
                <p style={s.metricSub}>{m.sub}</p>
              </div>
          ))}
        </div>

        <div style={s.twoCol} className="r-two-col-equal">
          <div style={s.card}>
            <p style={s.cardTitle}>Користувачі по ролях</p>
            {(() => {
              const roleLabel: Record<string, string> = { student: 'Студент', teacher: 'Викладач', admin: 'Адмін', moderator: 'Модератор', super_admin: 'Супер-адмін' };
              const roleTotal = Object.values(stats.usersByRole).reduce((a, b) => a + Number(b), 0) || 1;
              return Object.entries(stats.usersByRole).map(([role, count]) => {
                const pct = Math.round((Number(count) / roleTotal) * 100);
                return (
                    <div key={role} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 5 }}>
                        <span style={{ fontWeight: 500 }}>{roleLabel[role] ?? role}</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>{Number(count)} ({pct}%)</span>
                      </div>
                      <div style={s.track}>
                        <div style={{ ...s.fill, width: `${pct}%` }} />
                      </div>
                    </div>
                );
              });
            })()}
          </div>

          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 0 }}>
              <p style={s.cardTitle}>Реєстрації та дохід</p>
              {stats.dateFrom && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                  {new Date(stats.dateFrom).toLocaleDateString('uk-UA')} — {stats.dateTo ? new Date(stats.dateTo).toLocaleDateString('uk-UA') : 'сьогодні'}
                </span>
              )}
            </div>
            <DualBarChart
                registrations={stats.registrationsByDay}
                revenue={stats.revenueByDay}
                granularity={stats.granularity}
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <TopCoursesTable courses={stats.topCourses} />
        </div>
      </div>
  );
}

function CompletionRing({ pct }: { pct: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
        <svg width={54} height={54} style={{ flexShrink: 0 }}>
          <circle cx={27} cy={27} r={r} fill="none" stroke="var(--border-strong)" strokeWidth={4} />
          <circle
              cx={27} cy={27} r={r} fill="none"
              stroke="var(--accent)" strokeWidth={4}
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 27 27)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
          <text x={27} y={32} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)">{pct}%</text>
        </svg>
      </div>
  );
}

function UsersTab() {
  const toast = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  const load = useCallback(async (p = 1) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    params.set('page', String(p));
    params.set('limit', String(LIMIT));
    try {
      const res = await apiFetch<{ data: AdminUser[]; total: number; page: number; totalPages: number }>(`/admin/users?${params}`);
      setUsers(res.data);
      setTotalPages(res.totalPages);
      setPage(p);
    } catch { toast.error('Не вдалось завантажити користувачів'); }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) });
      toast.success('Роль оновлено');
      load(page);
    } catch { toast.error('Помилка зміни ролі'); }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !isActive }) });
      toast.success(isActive ? 'Користувача заблоковано' : 'Користувача розблоковано');
      load(page);
    } catch { toast.error('Помилка'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Видалити користувача?')) return;
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
      toast.success('Видалено');
      load(page);
    } catch { toast.error('Помилка видалення'); }
  };

  return (
      <div>
        <p style={s.pageTitle}>Користувачі {!loading && `(${users.length})`}</p>

        <div style={s.filterRow} className="r-filter-row">
          <input
              className="input"
              style={{ flex: 1 }}
              placeholder="Пошук по імені або email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
          />
          <select
              className="input"
              style={{ width: 160 }}
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="">Всі ролі</option>
            {['student','teacher','admin','super_admin'].map(r => (
                <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div style={s.tableWrap} className="r-table-wrap">
          <table style={s.table}>
            <thead>
            <tr>
              {["Користувач", "Роль", "Статус", "Зареєстрований", "Дії"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
            </thead>
            <tbody>
            {loading ? (
                [0,1,2,3,4].map(i => (
                    <tr key={i}>
                      {[200, 100, 80, 90, 120].map((w, j) => (
                          <td key={j} style={s.td}><Skeleton width={w} height={13} /></td>
                      ))}
                    </tr>
                ))
            ) : users.map(u => (
                <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.5 }}>
                  <td style={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={s.miniAvatar}>{u.name?.[0]?.toUpperCase()}</div>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 1 }}>{u.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={s.td}>
                    {u.role === 'super_admin' ? (
                        <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600 }}>Супер-адмін</span>
                    ) : (
                        <select
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            style={s.inlineSelect}
                        >
                          {['student','teacher', ...(isSuperAdmin ? ['admin','super_admin'] : ['admin'])].map(r => (
                              <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                    )}
                  </td>
                  <td style={s.td}>
                  <span style={{ ...s.badge, ...(u.isActive ? s.badgeGreen : s.badgeRed) }}>
                    {u.isActive ? 'Активний' : 'Блок'}
                  </span>
                  </td>
                  <td style={s.td}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    {new Date(u.createdAt).toLocaleDateString('uk-UA')}
                  </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={s.actionBtn} onClick={() => handleToggleActive(u.id, u.isActive)}>
                        {u.isActive ? 'Блок' : 'Розблок'}
                      </button>
                      <button style={{ ...s.actionBtn, ...s.actionBtnDanger }} onClick={() => handleDelete(u.id)}>
                        Видалити
                      </button>
                    </div>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>
          {!loading && users.length === 0 && <p style={s.emptyText}>Нічого не знайдено</p>}
        </div>
        {totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginTop:16 }}>
              <button className="btn" onClick={() => load(page - 1)} disabled={page <= 1} style={{ padding:'4px 12px' }}>←</button>
              <span style={{ fontSize:13, color:'var(--color-text-secondary)' }}>{page} / {totalPages}</span>
              <button className="btn" onClick={() => load(page + 1)} disabled={page >= totalPages} style={{ padding:'4px 12px' }}>→</button>
            </div>
        )}
      </div>
  );
}

function CourseDetailModal({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const [course, setCourse] = React.useState<CourseDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    apiFetch<CourseDetail>(`/courses/${courseId}`)
        .then(setCourse)
        .catch(() => setError('Не вдалось завантажити курс'))
        .finally(() => setLoading(false));
  }, [courseId]);

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const levelLabel: Record<string, string> = { beginner: 'Початковий', intermediate: 'Середній', advanced: 'Просунутий' };
  const statusLabel: Record<string, string> = { draft: 'Чернетка', published: 'Опублікований', archived: 'Архів', pending: 'На перевірці' };
  const statusBadgeStyle: Record<string, React.CSSProperties> = {
    draft:     { background: 'var(--bg-subtle)', color: 'var(--text-secondary)' },
    published: { background: '#f0fdf4', color: '#16a34a' },
    archived:  { background: '#fef2f2', color: '#dc2626' },
    pending:   { background: '#fffbeb', color: '#d97706' },
  };
  const lessonTypeLabel: Record<string, string> = { video: '▶ Відео', text: '📝 Текст', quiz: '❓ Тест' };

  const totalLessons = course?.modules?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ?? 0;
  const totalDuration = course?.modules?.reduce((sum, m) =>
      sum + (m.lessons?.reduce((s, l) => s + (l.durationSec ?? 0), 0) ?? 0), 0) ?? 0;
  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h} год ${m} хв`;
    if (m > 0) return `${m} хв`;
    return `${sec} сек`;
  };

  return (
      <div
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
      >
        <div style={{
          background: 'var(--bg-elevated)', borderRadius: 16, width: '100%', maxWidth: 780,
          maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.07em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                Перегляд курсу
              </span>
              {course && (
                  <span style={{ ...s.badge, ...(statusBadgeStyle[course.status] ?? {}) }}>
                    {statusLabel[course.status] ?? course.status}
                  </span>
              )}
            </div>
            <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: '1.5px solid var(--border)', background: 'transparent',
                  cursor: 'pointer', fontSize: '1rem', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'inherit',
                }}
            >✕</button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Skeleton width={320} height={24} style={{ marginBottom: 8 }} />
                  <Skeleton width={200} height={14} />
                  <Skeleton height={80} borderRadius={10} style={{ marginTop: 8 }} />
                  <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
                    {[0,1,2].map(i => <Skeleton key={i} height={60} borderRadius={10} />)}
                  </div>
                </div>
            ) : error ? (
                <p style={{ color: '#dc2626', textAlign: 'center', padding: '40px 0' }}>{error}</p>
            ) : course ? (
                <div>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'flex-start' }}>
                    {course.thumbnailUrl ? (
                        <img
                            src={course.thumbnailUrl} alt={course.title}
                            style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 10, flexShrink: 0, border: '1px solid var(--border)' }}
                        />
                    ) : (
                        <div style={{
                          width: 120, height: 80, borderRadius: 10, flexShrink: 0,
                          background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '2rem', color: 'var(--text-tertiary)', border: '1px solid var(--border)',
                        }}>
                          📚
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em', color: 'var(--text)' }}>
                        {course.title}
                      </h2>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={s.miniAvatar}>{course.author?.name?.[0]?.toUpperCase()}</div>
                          <div>
                            <p style={{ fontSize: '0.8rem', fontWeight: 500, margin: 0, color: 'var(--text)' }}>{course.author?.name}</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0 }}>{course.author?.email}</p>
                          </div>
                        </div>
                        {course.rating != null && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 8 }}>⭐ {Number(course.rating).toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 10, marginBottom: 20 }} className="r-metrics">
                    {[
                      { label: 'Ціна', value: course.price === 0 ? 'Безкоштовно' : `${course.price} ₴` },
                      { label: 'Рівень', value: levelLabel[course.level] ?? course.level },
                      { label: 'Уроків', value: String(totalLessons) },
                      { label: 'Тривалість', value: totalDuration > 0 ? formatDuration(totalDuration) : '—' },
                    ].map(m => (
                        <div key={m.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{m.label}</p>
                          <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: 'var(--text)' }}>{m.value}</p>
                        </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' as const }}>
                    {course.category && (
                        <span style={{ fontSize: '0.78rem', background: 'var(--bg-muted)', borderRadius: 6, padding: '3px 10px', color: 'var(--text-secondary)' }}>
                          🏷 {course.category}
                        </span>
                    )}
                    <span style={{ fontSize: '0.78rem', background: 'var(--bg-muted)', borderRadius: 6, padding: '3px 10px', color: 'var(--text-secondary)' }}>
                      📅 Створено {new Date(course.createdAt).toLocaleDateString('uk-UA')}
                    </span>
                    <span style={{ fontSize: '0.78rem', background: 'var(--bg-muted)', borderRadius: 6, padding: '3px 10px', color: 'var(--text-secondary)' }}>
                      🔄 Оновлено {new Date(course.updatedAt).toLocaleDateString('uk-UA')}
                    </span>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 8 }}>Опис</p>
                    <p style={{
                      fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7,
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 10, padding: '14px 16px', margin: 0,
                      whiteSpace: 'pre-wrap' as const,
                    }}>
                      {course.description || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Опис відсутній</span>}
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 12 }}>
                      Програма курсу ({course.modules?.length ?? 0} {(course.modules?.length ?? 0) === 1 ? 'модуль' : 'модулі(ів)'})
                    </p>
                    {!course.modules?.length ? (
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', fontStyle: 'italic' }}>Модулі ще не додані</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {course.modules.map((mod, mi) => (
                              <ModuleAccordion key={mod.id} mod={mod} index={mi} lessonTypeLabel={lessonTypeLabel} formatDuration={formatDuration} />
                          ))}
                        </div>
                    )}
                  </div>
                </div>
            ) : null}
          </div>
        </div>
      </div>
  );
}

function ModuleAccordion({
                           mod, index, lessonTypeLabel, formatDuration,
                         }: {
  mod: CourseModuleDetail;
  index: number;
  lessonTypeLabel: Record<string, string>;
  formatDuration: (s: number) => string;
}) {
  const [open, setOpen] = React.useState(index === 0);
  const totalSec = mod.lessons?.reduce((s, l) => s + (l.durationSec ?? 0), 0) ?? 0;

  return (
      <div style={{ border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <button
            onClick={() => setOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: 'var(--bg)', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', textAlign: 'left' as const,
            }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'var(--accent)', color: 'var(--bg-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
            }}>{index + 1}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{mod.title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {mod.lessons?.length ?? 0} уроків{totalSec > 0 ? ` · ${formatDuration(totalSec)}` : ''}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{open ? '▲' : '▼'}</span>
          </div>
        </button>
        {open && (
            <div style={{ borderTop: '1px solid var(--border)' }}>
              {!mod.lessons?.length ? (
                  <p style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Уроків немає</p>
              ) : (
                  mod.lessons.map((lesson, li) => (
                      <div
                          key={lesson.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 16px',
                            borderBottom: li < mod.lessons.length - 1 ? '1px solid #f5f5f5' : 'none',
                            background: 'var(--bg-elevated)',
                          }}
                      >
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', width: 20, flexShrink: 0, textAlign: 'right' as const }}>
                          {li + 1}
                        </span>
                        <span style={{
                          fontSize: '0.7rem', padding: '2px 7px', borderRadius: 5,
                          background: 'var(--bg-muted)', color: 'var(--text-secondary)', flexShrink: 0,
                        }}>
                          {lessonTypeLabel[lesson.type] ?? lesson.type}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text)', flex: 1 }}>{lesson.title}</span>
                        {lesson.isFree && (
                            <span style={{ fontSize: '0.68rem', background: '#f0fdf4', color: '#16a34a', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>
                              Безкоштовно
                            </span>
                        )}
                        {lesson.durationSec > 0 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>{formatDuration(lesson.durationSec)}</span>
                        )}
                      </div>
                  ))
              )}
            </div>
        )}
      </div>
  );
}

function CoursesTab() {
  const toast = useToast();
  const [courses, setCourses]           = useState<AdminCourse[]>([]);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading]           = useState(true);
  const [viewCourseId, setViewCourseId] = useState<string | null>(null);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const LIMIT = 20;

  const load = useCallback(async (p = 1) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    params.set('page', String(p));
    params.set('limit', String(LIMIT));
    try {
      const res = await apiFetch<{ data: AdminCourse[]; total: number; page: number; totalPages: number }>(`/admin/courses?${params}`);
      setCourses(res.data);
      setTotalPages(res.totalPages);
      setPage(p);
    } catch { toast.error('Не вдалось завантажити курси'); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/admin/courses/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      toast.success('Статус оновлено');
      load(page);
    } catch { toast.error('Помилка'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Видалити курс разом з усіма уроками?')) return;
    try {
      await apiFetch(`/admin/courses/${id}`, { method: 'DELETE' });
      toast.success('Курс видалено');
      load(page);
    } catch { toast.error('Помилка видалення'); }
  };

  const statusStyle: Record<string, React.CSSProperties> = {
    draft:     { ...s.badge, background: 'var(--bg-subtle)', color: 'var(--text-secondary)' },
    published: { ...s.badge, ...s.badgeGreen },
    archived:  { ...s.badge, ...s.badgeRed },
  };
  const statusLabel: Record<string, string> = { draft: 'Чернетка', published: 'Опублікований', archived: 'Архів' };

  return (
      <div>
        {viewCourseId && (
            <CourseDetailModal courseId={viewCourseId} onClose={() => setViewCourseId(null)} />
        )}
        <p style={s.pageTitle}>Курси {!loading && `(${courses.length})`}</p>

        <div style={s.filterRow} className="r-filter-row">
          <input
              className="input"
              style={{ flex: 1 }}
              placeholder="Пошук по назві..."
              value={search}
              onChange={e => setSearch(e.target.value)}
          />
          <select
              className="input"
              style={{ width: 180 }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Всі статуси</option>
            {['draft','published','archived'].map(st => (
                <option key={st} value={st}>{statusLabel[st]}</option>
            ))}
          </select>
        </div>

        <div style={s.tableWrap} className="r-table-wrap">
          <table style={s.table}>
            <thead>
            <tr>
              {['Курс', 'Автор', 'Статус', 'Ціна', 'Дата', 'Дії'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
            </thead>
            <tbody>
            {loading ? (
                [0,1,2,3].map(i => (
                    <tr key={i}>
                      {[220, 160, 90, 70, 80, 100].map((w, j) => (
                          <td key={j} style={s.td}><Skeleton width={w} height={13} /></td>
                      ))}
                    </tr>
                ))
            ) : courses.map(c => (
                <tr key={c.id}>
                  <td style={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={s.courseThumb}>{c.title[0]}</div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{c.title}</span>
                    </div>
                  </td>
                  <td style={s.td}>
                    <p style={{ fontSize: '0.85rem', marginBottom: 1 }}>{c.author.name}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{c.author.email}</p>
                  </td>
                  <td style={s.td}>
                    <select
                        value={c.status}
                        onChange={e => handleStatus(c.id, e.target.value)}
                        style={s.inlineSelect}
                    >
                      {['draft','published','archived'].map(st => (
                          <option key={st} value={st}>{statusLabel[st]}</option>
                      ))}
                    </select>
                  </td>
                  <td style={s.td}>
                  <span style={{ fontSize: '0.875rem' }}>
                    {c.price === 0 ? 'Безкоштовно' : `${c.price} ₴`}
                  </span>
                  </td>
                  <td style={s.td}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    {new Date(c.createdAt).toLocaleDateString('uk-UA')}
                  </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                          style={s.actionBtn}
                          onClick={() => setViewCourseId(c.id)}
                      >
                        👁 Переглянути
                      </button>
                      <button style={{ ...s.actionBtn, ...s.actionBtnDanger }} onClick={() => handleDelete(c.id)}>
                        Видалити
                      </button>
                    </div>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>
          {!loading && courses.length === 0 && <p style={s.emptyText}>Нічого не знайдено</p>}
        </div>
        {totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginTop:16 }}>
              <button className="btn" onClick={() => load(page - 1)} disabled={page <= 1} style={{ padding:'4px 12px' }}>←</button>
              <span style={{ fontSize:13, color:'var(--color-text-secondary)' }}>{page} / {totalPages}</span>
              <button className="btn" onClick={() => load(page + 1)} disabled={page >= totalPages} style={{ padding:'4px 12px' }}>→</button>
            </div>
        )}
      </div>
  );
}

function ReviewsTab() {
  const toast = useToast();
  const [reviews, setReviews]   = useState<PendingReview[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<'pending' | 'all'>('pending');

  const load = useCallback(async (f: 'pending' | 'all') => {
    setLoading(true);
    try {
      const url = f === 'pending' ? '/reviews/admin/all?pending=true' : '/reviews/admin/all';
      const data = await apiFetch<PendingReview[]>(url);
      setReviews(data);
    } catch { toast.error('Не вдалось завантажити відгуки'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  const approve = async (id: string) => {
    try {
      await apiFetch(`/reviews/admin/${id}/approve`, { method: 'PATCH' });
      toast.success('Відгук схвалено');
      load(filter);
    } catch { toast.error('Помилка'); }
  };

  const reject = async (id: string) => {
    try {
      await apiFetch(`/reviews/${id}`, { method: 'DELETE' });
      toast.info('Відгук відхилено');
      load(filter);
    } catch { toast.error('Помилка'); }
  };

  const pendingCount = reviews.filter(r => !r.isApproved).length;

  return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <p style={{ ...s.pageTitle, marginBottom: 0 }}>Відгуки {!loading && `(${reviews.length})`}</p>
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            {(['pending', 'all'] as const).map(f => (
                <button
                    key={f}
                    style={{ ...s.periodBtn, ...(filter === f ? s.periodBtnActive : {}) }}
                    onClick={() => setFilter(f)}
                >
                  {f === 'pending' ? `На модерацію${pendingCount > 0 && !loading ? ` (${pendingCount})` : ''}` : 'Всі'}
                </button>
            ))}
          </div>
        </div>

        {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[0,1,2].map(i => (
                  <div key={i} style={s.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <Skeleton width={160} height={14} />
                      <Skeleton width={80} height={14} />
                    </div>
                    <Skeleton width={200} height={12} style={{ marginBottom: 10 }} />
                    <Skeleton height={40} borderRadius={8} style={{ marginBottom: 14 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Skeleton width={90} height={32} borderRadius={8} />
                      <Skeleton width={90} height={32} borderRadius={8} />
                    </div>
                  </div>
              ))}
            </div>
        ) : reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontSize: '2rem', marginBottom: 12 }}>{filter === 'pending' ? '✓' : '💬'}</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                {filter === 'pending' ? 'Всі відгуки перевірено' : 'Відгуків ще немає'}
              </p>
            </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map(r => (
                  <div key={r.id} style={{ ...s.card, opacity: r.isApproved ? 0.75 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{r.user.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{r.user.email}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: '#f59e0b', letterSpacing: 1, fontSize: '0.9rem' }}>
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </span>
                        <span style={{
                          ...s.badge,
                          ...(r.isApproved ? s.badgeGreen : { background: '#fffbeb', color: '#d97706' }),
                        }}>
                          {r.isApproved ? 'Схвалено' : 'Очікує'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {new Date(r.createdAt).toLocaleDateString('uk-UA')}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                      Курс: <span style={{ color: 'var(--text)', fontWeight: 500 }}>{r.course.title}</span>
                    </p>

                    {r.body && (
                        <p style={{
                          fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6,
                          padding: '10px 14px', background: 'var(--bg-subtle)',
                          borderRadius: 8, marginBottom: 14,
                        }}>
                          {r.body}
                        </p>
                    )}

                    {!r.isApproved && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={s.btnApprove} onClick={() => approve(r.id)}>Схвалити</button>
                          <button style={s.btnReject}  onClick={() => reject(r.id)}>Відхилити</button>
                        </div>
                    )}
                  </div>
              ))}
            </div>
        )}
      </div>
  );
}

interface AdminPromo {
  id: string;
  code: string;
  discountPercent: number;
  status: 'pending' | 'approved' | 'rejected';
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  adminComment: string | null;
  createdAt: string;
  course: { id: string; title: string };
  teacher: { id: string; name: string; email: string };
}

function PromosTab() {
  const toast = useToast();
  const [promos, setPromos]         = useState<AdminPromo[]>([]);
  const [statusFilter, setStatus]   = useState<'pending' | 'approved' | 'rejected' | ''>('pending');
  const [loading, setLoading]       = useState(true);
  const [comment, setComment]       = useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/promo-codes/admin/all?status=${statusFilter}` : '/promo-codes/admin/all';
      const data = await apiFetch<AdminPromo[]>(url);
      setPromos(data);
    } catch { toast.error('Не вдалось завантажити промокоди'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const review = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await apiFetch(`/promo-codes/admin/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminComment: comment[id] || undefined }),
      });
      toast.success(status === 'approved' ? 'Промокод схвалено' : 'Промокод відхилено');
      load();
    } catch { toast.error('Помилка'); }
  };

  const statusLabel: Record<string, string> = { pending: 'Очікує', approved: 'Активний', rejected: 'Відхилений' };
  const statusBadge: Record<string, React.CSSProperties> = {
    pending:  { ...s.badge, background: '#fffbeb', color: '#d97706' },
    approved: { ...s.badge, ...s.badgeGreen },
    rejected: { ...s.badge, ...s.badgeRed },
  };

  return (
      <div>
        <p style={s.pageTitle}>Промокоди {!loading && `(${promos.length})`}</p>

        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {(['pending','approved','rejected',''] as const).map(st => (
              <button
                  key={st || 'all'}
                  style={{ ...s.periodBtn, ...(statusFilter === st ? s.periodBtnActive : {}) }}
                  onClick={() => setStatus(st)}
              >
                {st === '' ? 'Всі' : statusLabel[st]}
              </button>
          ))}
        </div>

        <div style={s.tableWrap} className="r-table-wrap">
          <table style={s.table}>
            <thead>
            <tr>
              {['Код / Курс', 'Викладач', 'Знижка', 'Використання', 'Статус', 'Дії'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
            </thead>
            <tbody>
            {loading ? (
                [0,1,2,3].map(i => (
                    <tr key={i}>{[200,140,60,100,80,160].map((w,j) => <td key={j} style={s.td}><Skeleton width={w} height={13} /></td>)}</tr>
                ))
            ) : promos.map(p => (
                <tr key={p.id}>
                  <td style={s.td}>
                    <p style={{ fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.04em', fontSize: '0.9rem', marginBottom: 2 }}>{p.code}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{p.course.title}</p>
                  </td>
                  <td style={s.td}>
                    <p style={{ fontSize: '0.83rem', marginBottom: 1 }}>{p.teacher.name}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{p.teacher.email}</p>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>−{p.discountPercent}%</span>
                  </td>
                  <td style={s.td}>
                    <p style={{ fontSize: '0.8rem' }}>{p.usedCount} / {p.usageLimit ?? '∞'}</p>
                    {p.expiresAt && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                          до {new Date(p.expiresAt).toLocaleDateString('uk-UA')}
                        </p>
                    )}
                  </td>
                  <td style={s.td}>
                    <span style={statusBadge[p.status]}>{statusLabel[p.status]}</span>
                    {p.adminComment && (
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 4, maxWidth: 140 }}>{p.adminComment}</p>
                    )}
                  </td>
                  <td style={s.td}>
                    {p.status === 'pending' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <input
                              placeholder="Коментар (необов.)"
                              value={comment[p.id] || ''}
                              onChange={e => setComment(prev => ({ ...prev, [p.id]: e.target.value }))}
                              style={{ ...s.inlineSelect, width: '100%', boxSizing: 'border-box' as const }}
                          />
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button style={s.btnApprove} onClick={() => review(p.id, 'approved')}>Схвалити</button>
                            <button style={s.btnReject}  onClick={() => review(p.id, 'rejected')}>Відхилити</button>
                          </div>
                        </div>
                    ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {new Date(p.createdAt).toLocaleDateString('uk-UA')}
                    </span>
                    )}
                  </td>
                </tr>
            ))}
            </tbody>
          </table>
          {!loading && promos.length === 0 && <p style={s.emptyText}>Нічого не знайдено</p>}
        </div>
      </div>
  );
}

interface AdminPayoutRequest {
  id: string;
  amount: number;
  paymentDetails: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  adminComment: string | null;
  processedAt: string | null;
  createdAt: string;
  teacher: { id: string; name: string; email: string } | null;
}

function PayoutsTab() {
  const toast = useToast();
  const [payouts, setPayouts]     = useState<AdminPayoutRequest[]>([]);
  const [statusF, setStatusF]     = useState<'pending'|'approved'|'rejected'|'paid'|''>('pending');
  const [loading, setLoading]     = useState(true);
  const [comment, setComment]     = useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = statusF ? `/payouts/admin/all?status=${statusF}` : '/payouts/admin/all';
      const data = await apiFetch<AdminPayoutRequest[]>(url);
      setPayouts(data);
    } catch { toast.error('Не вдалось завантажити виплати'); }
    finally { setLoading(false); }
  }, [statusF]);

  useEffect(() => { load(); }, [load]);

  const review = async (id: string, status: 'approved' | 'rejected' | 'paid') => {
    try {
      await apiFetch(`/payouts/admin/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminComment: comment[id] || undefined }),
      });
      const labels: Record<string, string> = { approved: 'Схвалено', rejected: 'Відхилено', paid: 'Виплачено' };
      toast.success(labels[status]);
      load();
    } catch { toast.error('Помилка'); }
  };

  const statusLabel: Record<string, string> = { pending: 'Очікує', approved: 'Схвалено', rejected: 'Відхилено', paid: 'Виплачено' };
  const statusBadge: Record<string, React.CSSProperties> = {
    pending:  { ...s.badge, background: '#fffbeb', color: '#d97706' },
    approved: { ...s.badge, background: '#eff6ff', color: '#2563eb' },
    rejected: { ...s.badge, ...s.badgeRed },
    paid:     { ...s.badge, ...s.badgeGreen },
  };

  const totalPending  = payouts.filter(p => p.status === 'pending').reduce((a, p) => a + p.amount, 0);
  const totalApproved = payouts.filter(p => p.status === 'approved').reduce((a, p) => a + p.amount, 0);
  const totalPaid     = payouts.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0);

  return (
      <div>
        <p style={s.pageTitle}>Виплати викладачам {!loading && `(${payouts.length})`}</p>

        <div style={{ display: 'grid', gap: 12, marginBottom: 20 }} className="r-three-col">
          {[
            { label: 'Очікують обробки', value: `${totalPending.toLocaleString('uk-UA')} ₴`, color: '#d97706', bg: '#fffbeb' },
            { label: 'Схвалено (не виплачено)', value: `${totalApproved.toLocaleString('uk-UA')} ₴`, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Виплачено', value: `${totalPaid.toLocaleString('uk-UA')} ₴`, color: '#16a34a', bg: '#f0fdf4' },
          ].map(c => (
              <div key={c.label} style={{ ...s.card, background: c.bg, borderColor: 'transparent' }}>
                <p style={{ ...s.metricValue, fontSize: '1.3rem', color: c.color }}>{c.value}</p>
                <p style={s.metricLabel}>{c.label}</p>
              </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {(['pending','approved','rejected','paid',''] as const).map(st => (
              <button
                  key={st || 'all'}
                  style={{ ...s.periodBtn, ...(statusF === st ? s.periodBtnActive : {}) }}
                  onClick={() => setStatusF(st)}
              >
                {st === '' ? 'Всі' : statusLabel[st]}
              </button>
          ))}
        </div>

        <div style={s.tableWrap} className="r-table-wrap">
          <table style={s.table}>
            <thead>
            <tr>
              {['Викладач', 'Сума', 'Реквізити', 'Дата запиту', 'Статус', 'Дії'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
            </thead>
            <tbody>
            {loading ? (
                [0,1,2,3].map(i => (
                    <tr key={i}>{[180,90,200,90,80,180].map((w,j) => <td key={j} style={s.td}><Skeleton width={w} height={13} /></td>)}</tr>
                ))
            ) : payouts.map(p => (
                <tr key={p.id}>
                  <td style={s.td}>
                    {p.teacher ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={s.miniAvatar}>{p.teacher.name?.[0]?.toUpperCase()}</div>
                          <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 1 }}>{p.teacher.name}</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{p.teacher.email}</p>
                          </div>
                        </div>
                    ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: '1rem', fontWeight: 700 }}>{p.amount.toLocaleString('uk-UA')} ₴</span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', wordBreak: 'break-all' as const, maxWidth: 200, display: 'block' }}>
                      {p.paymentDetails}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                      {new Date(p.createdAt).toLocaleDateString('uk-UA')}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={statusBadge[p.status]}>{statusLabel[p.status]}</span>
                    {p.adminComment && (
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 4, maxWidth: 140 }}>{p.adminComment}</p>
                    )}
                    {p.processedAt && (
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {new Date(p.processedAt).toLocaleDateString('uk-UA')}
                        </p>
                    )}
                  </td>
                  <td style={s.td}>
                    {(p.status === 'pending' || p.status === 'approved') ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <input
                              placeholder="Коментар (необов.)"
                              value={comment[p.id] || ''}
                              onChange={e => setComment(prev => ({ ...prev, [p.id]: e.target.value }))}
                              style={{ ...s.inlineSelect, width: '100%', boxSizing: 'border-box' as const }}
                          />
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                            {p.status === 'pending' && (
                                <button style={s.btnApprove} onClick={() => review(p.id, 'approved')}>Схвалити</button>
                            )}
                            {p.status === 'approved' && (
                                <button style={{ ...s.btnApprove, background: '#16a34a' }} onClick={() => review(p.id, 'paid')}>Виплачено ✓</button>
                            )}
                            {p.status === 'pending' && (
                                <button style={s.btnReject} onClick={() => review(p.id, 'rejected')}>Відхилити</button>
                            )}
                          </div>
                        </div>
                    ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Оброблено</span>
                    )}
                  </td>
                </tr>
            ))}
            </tbody>
          </table>
          {!loading && payouts.length === 0 && <p style={s.emptyText}>Нічого не знайдено</p>}
        </div>
      </div>
  );
}

function DualBarChart({
                        registrations,
                        revenue,
                        granularity,
                      }: {
  registrations: { date: string; count: number }[];
  revenue: { date: string; revenue: number }[];
  granularity?: string;
}) {
  const dateSet = Array.from(new Set([...registrations.map(d => d.date), ...revenue.map(d => d.date)])).sort();
  const regMap = Object.fromEntries(registrations.map(d => [d.date, d.count]));
  const revMap = Object.fromEntries(revenue.map(d => [d.date, d.revenue]));
  const data = dateSet.map(date => ({
    date,
    count: regMap[date] ?? 0,
    revenue: revMap[date] ?? 0,
  }));

  const maxCount   = Math.max(...data.map(d => d.count),   1);
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  const fmtDate = (d: string) => {
    const date = new Date(d);
    return granularity === 'month'
        ? date.toLocaleDateString('uk-UA', { month: 'short', year: '2-digit' })
        : date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'numeric' });
  };

  if (data.length === 0) return <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: 14 }}>Немає даних за цей період</p>;

  const few = data.length <= 4;

  return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)' }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Реєстрації</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#d1d5db' }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Дохід (₴)</span>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 6, height: 80,
          justifyContent: few ? 'flex-start' : 'stretch',
        }}>
          {data.map((d, i) => {
            const countH  = Math.max((d.count   / maxCount)   * 60, d.count   > 0 ? 4 : 0);
            const revH    = Math.max((d.revenue / maxRevenue) * 60, d.revenue > 0 ? 4 : 0);
            const colStyle: React.CSSProperties = few
                ? { flex: '0 0 auto', width: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }
                : { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 };
            return (
                <div key={i} style={colStyle}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, width: '100%', justifyContent: 'center' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      {d.count > 0 && <span style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>{d.count}</span>}
                      <div style={{ width: '100%', height: `${countH}px`, background: 'var(--accent)', borderRadius: '2px 2px 0 0', opacity: 0.9 }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      {d.revenue > 0 && <span style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>{d.revenue >= 1000 ? `${(d.revenue/1000).toFixed(1)}k` : d.revenue}</span>}
                      <div style={{ width: '100%', height: `${revH}px`, background: '#d1d5db', borderRadius: '2px 2px 0 0' }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '0.52rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{fmtDate(d.date)}</span>
                </div>
            );
          })}
        </div>
      </div>
  );
}

interface AuditLog {
  id: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  path: string;
  method: string;
  statusCode: number | null;
  isError: boolean;
  createdAt: string;
  payload: any;
  response: any;
}

function AuditTab() {
  const [items, setItems]       = useState<AuditLog[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [actionF, setActionF]   = useState('');
  const [errorOnly, setErrorOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback((p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: '50' });
    if (search)    params.set('search', search);
    if (actionF)   params.set('action', actionF);
    if (errorOnly) params.set('isError', 'true');
    apiFetch<{ items: AuditLog[]; total: number; pages: number }>(`/admin/audit?${params}`)
        .then(d => { setItems(d.items); setTotal(d.total); setPages(d.pages); setPage(p); })
        .catch(console.error)
        .finally(() => setLoading(false));
  }, [search, actionF, errorOnly]);

  useEffect(() => { load(1); }, [load]);

  const actionColors: Record<string, string> = {
    CREATE: '#16a34a', UPDATE: '#2563eb', DELETE: '#dc2626',
    LOGIN: '#7c3aed', LOGOUT: '#6b7280', BAN: '#dc2626', UNBAN: '#16a34a',
  };

  return (
      <div style={{ padding: '0 0 32px' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' as const, alignItems: 'center' }}>
          <input
              placeholder="Пошук по email або шляху..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load(1)}
              style={{ padding: '7px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', minWidth: 240 }}
          />
          <select
              value={actionF}
              onChange={e => setActionF(e.target.value)}
              style={{ padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit' }}
          >
            <option value="">Всі дії</option>
            {['CREATE','UPDATE','DELETE','LOGIN','LOGOUT','BAN','UNBAN'].map(a => (
                <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={errorOnly} onChange={e => setErrorOnly(e.target.checked)} />
            Тільки помилки
          </label>
          <button
              onClick={() => load(1)}
              style={{ padding: '7px 18px', background: 'var(--accent)', color: 'var(--bg-elevated)', border: 'none', borderRadius: 8, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}
          >Фільтрувати</button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
          Всього: {total} записів
        </span>
        </div>

        {loading ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Завантаження...</p>
        ) : items.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Записів не знайдено</p>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
              {items.map(log => (
                  <div
                      key={log.id}
                      style={{
                        background: log.isError ? '#fff5f5' : 'var(--bg-elevated)',
                        border: `1.5px solid ${log.isError ? '#fecaca' : 'var(--border)'}`,
                        borderRadius: 10, overflow: 'hidden',
                      }}
                  >
                    <div
                        onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer' }}
                    >
                <span style={{
                  padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700,
                  background: (actionColors[log.action] ?? '#6b7280') + '18',
                  color: actionColors[log.action] ?? '#6b7280',
                  flexShrink: 0,
                }}>{log.action}</span>

                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flexShrink: 0, minWidth: 80 }}>
                  {log.method} <span style={{ color: log.isError ? '#dc2626' : (log.statusCode ?? 0) < 300 ? '#16a34a' : '#d97706', fontWeight: 600 }}>{log.statusCode ?? '—'}</span>
                </span>

                      <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {log.path}
                </span>

                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                  {log.actorEmail ?? '—'}
                </span>

                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', flexShrink: 0, minWidth: 130, textAlign: 'right' as const }}>
                  {new Date(log.createdAt).toLocaleString('uk-UA')}
                </span>

                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{expanded === log.id ? '▲' : '▼'}</span>
                    </div>

                    {expanded === log.id && (
                        <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px', fontSize: '0.8rem', marginTop: 8 }} className="r-label-value">
                            <span style={{ color: 'var(--text-tertiary)' }}>Entity</span>
                            <span>{log.entity}{log.entityId ? ` / ${log.entityId}` : ''}</span>
                            <span style={{ color: 'var(--text-tertiary)' }}>Role</span>
                            <span>{log.actorRole ?? '—'}</span>
                            {log.payload && (
                                <>
                                  <span style={{ color: 'var(--text-tertiary)' }}>Payload</span>
                                  <pre style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' as const }}>
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                                </>
                            )}
                            {log.response && (
                                <>
                                  <span style={{ color: 'var(--text-tertiary)' }}>Response</span>
                                  <pre style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' as const }}>
                          {JSON.stringify(log.response, null, 2)}
                        </pre>
                                </>
                            )}
                          </div>
                        </div>
                    )}
                  </div>
              ))}
            </div>
        )}

        {pages > 1 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' as const }}>
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button
                      key={p}
                      onClick={() => load(p)}
                      style={{
                        width: 34, height: 34, borderRadius: 8,
                        border: `1.5px solid ${p === page ? 'var(--accent)' : 'var(--border)'}`,
                        background: p === page ? 'var(--accent)' : 'var(--bg-elevated)',
                        color: p === page ? 'var(--accent-inv)' : 'var(--text)',
                        fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                  >{p}</button>
              ))}
            </div>
        )}
      </div>
  );
}

function TopCoursesTable({ courses }: { courses: { courseId: string; title: string; enrollments: number; revenue: number }[] }) {
  const [sortBy, setSortBy] = React.useState<'enrollments' | 'revenue'>('enrollments');

  const sorted = [...courses].sort((a, b) => b[sortBy] - a[sortBy]);
  const maxVal = Math.max(...sorted.map(c => c[sortBy]), 1);

  return (
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={s.cardTitle}>Топ курсів</p>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
                style={{ ...s.periodBtn, ...(sortBy === 'enrollments' ? s.periodBtnActive : {}), fontSize: '0.72rem', padding: '3px 10px' }}
                onClick={() => setSortBy('enrollments')}
            >За записами</button>
            <button
                style={{ ...s.periodBtn, ...(sortBy === 'revenue' ? s.periodBtnActive : {}), fontSize: '0.72rem', padding: '3px 10px' }}
                onClick={() => setSortBy('revenue')}
            >За доходом</button>
          </div>
        </div>

        {sorted.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>Немає даних</p>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sorted.map((c, i) => {
                const val    = c[sortBy];
                const pct    = Math.round((val / maxVal) * 100);
                const isRev  = sortBy === 'revenue';
                return (
                    <div key={c.courseId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-tertiary)', width: 16, flexShrink: 0 }}>#{i + 1}</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexShrink: 0, marginLeft: 12 }}>
                          <span style={{ fontSize: '0.75rem', color: isRev ? 'var(--text)' : 'var(--text-tertiary)', fontWeight: isRev ? 600 : 400 }}>
                            {c.revenue.toLocaleString('uk-UA')} ₴
                          </span>
                          <span style={{ fontSize: '0.75rem', color: !isRev ? 'var(--text)' : 'var(--text-tertiary)', fontWeight: !isRev ? 600 : 400 }}>
                            {c.enrollments} зап.
                          </span>
                        </div>
                      </div>
                      <div style={{ ...s.track, height: 4 }}>
                        <div style={{ ...s.fill, width: `${pct}%`, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                );
              })}
            </div>
        )}
      </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:   { minHeight: '100vh', background: 'var(--bg)' },

  header: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(var(--bg-rgb),0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
  },
  headerInner: {
    maxWidth: 1160, margin: '0 auto',
    height: 56,
    display: 'flex', alignItems: 'center', gap: 24,
  },
  backLink: {
    fontSize: '0.8rem', color: 'var(--text-tertiary)',
    whiteSpace: 'nowrap', flexShrink: 0,
  },
  headerTitle: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: '0.95rem', fontWeight: 600,
    letterSpacing: '-0.02em', color: 'var(--text)',
    flexShrink: 0, marginRight: 8,
  },
  headerDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: 'var(--accent)', flexShrink: 0,
  },
  tabsRow: { display: 'flex', gap: 2 },
  tabBtn: {
    padding: '5px 14px', borderRadius: 6,
    border: 'none', background: 'transparent',
    fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer',
  },
  tabBtnActive: { color: 'var(--text)', fontWeight: 500, background: 'var(--bg-muted)' },
  themeBtn: {
    width: 32, height: 32,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-elevated)',
    border: '1.5px solid var(--border)',
    borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem',
    transition: 'border-color 0.2s, background 0.2s',
    flexShrink: 0,
  },

  body: { maxWidth: 1160, margin: '28px auto' },

  pageTitle: {
    fontSize: '0.7rem', fontWeight: 500,
    textTransform: 'uppercase' as const, letterSpacing: '0.07em',
    color: 'var(--text-tertiary)', marginBottom: 18,
  },

  metricsRow: { display: 'grid', gap: 12, marginBottom: 20 },

  card: { background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '18px 20px' },
  cardTitle: {
    fontSize: '0.7rem', fontWeight: 500,
    textTransform: 'uppercase' as const, letterSpacing: '0.07em',
    color: 'var(--text-tertiary)', marginBottom: 16,
  },

  metricValue: { fontSize: '1.6rem', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 2 },
  metricLabel: { fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 },
  metricSub:   { fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 3 },

  twoCol: { display: 'grid', gap: 16 },

  track: { height: 3, background: 'var(--bg-muted)', borderRadius: 99, overflow: 'hidden' },
  fill:  { height: '100%', background: 'var(--accent)', borderRadius: 99, transition: 'width 0.4s' },

  filterRow: { display: 'flex', gap: 10, marginBottom: 16 },

  tableWrap: { background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'auto' },
  table:     { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    padding: '11px 16px', textAlign: 'left' as const,
    fontSize: '0.65rem', fontWeight: 500,
    color: 'var(--text-tertiary)', background: 'var(--bg)',
    borderBottom: '1px solid var(--border)',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
  },
  td: {
    padding: '12px 16px', borderBottom: '1px solid var(--border)',
    fontSize: '0.875rem', color: 'var(--text)', verticalAlign: 'middle' as const,
  },

  miniAvatar: {
    width: 30, height: 30, borderRadius: '50%',
    background: 'var(--accent)', color: 'var(--accent-inv)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.7rem', fontWeight: 600, flexShrink: 0,
  },
  courseThumb: {
    width: 30, height: 30, borderRadius: 6,
    background: 'var(--bg-muted)', color: 'var(--text-secondary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.9rem', fontWeight: 600, flexShrink: 0,
  },

  badge:     { padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 500, display: 'inline-block' },
  badgeGreen:{ background: '#f0fdf4', color: '#16a34a' },
  badgeRed:  { background: '#fef2f2', color: '#dc2626' },

  inlineSelect: {
    padding: '4px 8px', borderRadius: 6,
    border: '1.5px solid var(--border)', background: 'var(--bg-elevated)',
    fontSize: '0.8rem', cursor: 'pointer', outline: 'none',
    fontFamily: 'inherit', color: 'var(--text)',
  },

  actionBtn: {
    padding: '5px 10px', borderRadius: 6,
    border: '1.5px solid var(--border)', background: 'transparent',
    fontSize: '0.78rem', cursor: 'pointer', color: 'var(--text-secondary)',
    fontFamily: 'inherit',
  },
  actionBtnDanger: { color: '#dc2626', borderColor: '#fecaca' },

  btnApprove: {
    padding: '7px 18px', borderRadius: 7,
    border: '1.5px solid var(--border)', background: 'var(--accent)',
    color: 'var(--accent-inv)', fontSize: '0.8rem', fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnReject: {
    padding: '7px 18px', borderRadius: 7,
    border: '1.5px solid var(--border)', background: 'transparent',
    color: 'var(--text-secondary)', fontSize: '0.8rem',
    cursor: 'pointer', fontFamily: 'inherit',
  },

  emptyText: { textAlign: 'center' as const, padding: '28px', color: 'var(--text-tertiary)', fontSize: '0.875rem' },

  periodBtn: {
    padding: '5px 14px', borderRadius: 6,
    border: '1.5px solid var(--border)', background: 'transparent',
    fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer',
    fontFamily: 'inherit',
  },
  periodBtnActive: {
    background: 'var(--accent)', color: 'var(--accent-inv)',
    borderColor: 'var(--accent)', fontWeight: 500,
  },
  applyBtn: {
    padding: '5px 14px', borderRadius: 6,
    border: '1.5px solid var(--accent)', background: 'var(--accent)',
    color: 'var(--accent-inv)', fontSize: '0.8rem', cursor: 'pointer',
    fontFamily: 'inherit', fontWeight: 500,
  },
};
interface TeacherStat {
  id: string; name: string; email: string; joinedAt: string;
  revenue: number; enrollments: number;
  totalCourses: number; published: number; pending: number;
  certificates: number; avgRating: number; reviewCount: number;
}

function TeachersTab() {
  const [teachers, setTeachers] = React.useState<TeacherStat[]>([]);
  const [loading,  setLoading]  = React.useState(true);
  const [sortBy,   setSortBy]   = React.useState<'revenue' | 'enrollments' | 'totalCourses' | 'certificates'>('revenue');
  const [search,   setSearch]   = React.useState('');

  React.useEffect(() => {
    apiFetch<TeacherStat[]>('/admin/teachers/stats')
        .then(d => setTeachers(d))
        .catch(() => {})
        .finally(() => setLoading(false));
  }, []);

  const sorted = [...teachers]
      .filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b[sortBy] - a[sortBy]);

  const totalRevenue = teachers.reduce((s, t) => s + t.revenue, 0);
  const totalEnroll  = teachers.reduce((s, t) => s + t.enrollments, 0);

  const sortButtons: { key: typeof sortBy; label: string }[] = [
    { key: 'revenue',     label: 'За доходом' },
    { key: 'enrollments', label: 'За записами' },
    { key: 'totalCourses',label: 'За курсами' },
    { key: 'certificates',label: 'За серт.' },
  ];

  return (
      <div>
        <div style={{ display: 'grid', gap: 16, marginBottom: 24 }} className="r-three-col">
          {[
            { label: 'Всього викладачів', value: teachers.length },
            { label: 'Загальний дохід',   value: `${totalRevenue.toLocaleString('uk-UA')} ₴` },
            { label: 'Загальних записів', value: totalEnroll.toLocaleString('uk-UA') },
          ].map(c => (
              <div key={c.label} style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '18px 20px', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>{c.value}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>{c.label}</p>
              </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' as const, alignItems: 'center' }}>
          <input
              placeholder="Пошук за ім'ям або email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.85rem', outline: 'none', width: 240 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {sortButtons.map(b => (
                <button key={b.key} onClick={() => setSortBy(b.key)}
                        style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid', fontSize: '0.78rem', cursor: 'pointer',
                          borderColor: sortBy === b.key ? 'var(--accent)' : 'var(--border)',
                          background:  sortBy === b.key ? 'var(--accent)' : 'var(--bg-elevated)',
                          color:       sortBy === b.key ? 'var(--accent-inv)' : 'var(--text-secondary)',
                        }}>{b.label}</button>
            ))}
          </div>
        </div>

        {loading ? (
            <p style={{ color: 'var(--text-tertiary)', padding: 24 }}>Завантаження...</p>
        ) : sorted.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', padding: 24 }}>Викладачів не знайдено</p>
        ) : (
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Викладач', 'Дохід', 'Записів', 'Курси', 'Опубл.', 'Сертиф.', 'Рейтинг'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, whiteSpace: 'nowrap' as const }}>{h}</th>
                  ))}
                </tr>
                </thead>
                <tbody>
                {sorted.map((t, i) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--text-tertiary)', width: 32 }}>#{i + 1}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
                            {t.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>{t.name}</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0 }}>{t.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap' as const }}>
                        {t.revenue > 0 ? `${t.revenue.toLocaleString('uk-UA')} ₴` : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.875rem' }}>{t.enrollments}</td>
                      <td style={{ padding: '12px 14px', fontSize: '0.875rem' }}>{t.totalCourses}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600 }}>{t.published}</span>
                        {t.pending > 0 && <span style={{ background: '#fffbeb', color: '#d97706', padding: '2px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, marginLeft: 4 }}>{t.pending} очік.</span>}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.875rem' }}>{t.certificates}</td>
                      <td style={{ padding: '12px 14px' }}>
                        {t.avgRating > 0 ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.875rem' }}>
                        ⭐ {t.avgRating.toFixed(1)}
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>({t.reviewCount})</span>
                      </span>
                        ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        )}
      </div>
  );
}