import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Skeleton } from '../components/Skeleton';

type Tab = 'stats' | 'users' | 'courses' | 'reviews';

interface PlatformStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  newUsersThisMonth: number;
  newCoursesThisMonth: number;
  usersByRole: Record<string, number>;
  registrationsByDay: { date: string; count: number }[];
}

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

interface PendingReview {
  id: string;
  rating: number;
  body: string;
  createdAt: string;
  user: { name: string; email: string };
  course: { title: string };
}

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>('stats');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'stats',   label: 'Статистика' },
    { key: 'users',   label: 'Користувачі' },
    { key: 'courses', label: 'Курси' },
    { key: 'reviews', label: 'Відгуки' },
  ];

  return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.headerInner}>
            <Link to="/courses" style={s.backLink}>← До сайту</Link>
            <div style={s.headerTitle}>
              <span style={s.headerDot} />
              Адмін-панель
            </div>
            <div style={s.tabsRow}>
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
          </div>
        </div>

        <div style={s.body}>
          {tab === 'stats'   && <StatsTab />}
          {tab === 'users'   && <UsersTab />}
          {tab === 'courses' && <CoursesTab />}
          {tab === 'reviews' && <ReviewsTab />}
        </div>
      </div>
  );
}

function StatsTab() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    apiFetch<PlatformStats>('/admin/stats').then(setStats).catch(console.error);
  }, []);

  if (!stats) return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[0,1,2,3].map(i => (
              <div key={i} style={s.card}>
                <Skeleton width={50} height={28} style={{ marginBottom: 8 }} />
                <Skeleton width={120} height={13} style={{ marginBottom: 4 }} />
                <Skeleton width={80} height={11} />
              </div>
          ))}
        </div>
      </div>
  );

  const metrics = [
    { label: 'Користувачів',  value: stats.totalUsers,                         sub: `+${stats.newUsersThisMonth} цього місяця` },
    { label: 'Курсів',        value: stats.totalCourses,                        sub: `+${stats.newCoursesThisMonth} цього місяця` },
    { label: 'Записів',       value: stats.totalEnrollments,                    sub: 'загалом' },
    { label: 'Дохід',         value: `${stats.totalRevenue.toLocaleString('uk-UA')} ₴`, sub: 'загалом' },
  ];

  return (
      <div>
        <p style={s.pageTitle}>Статистика платформи</p>

        <div style={s.metricsRow}>
          {metrics.map(m => (
              <div key={m.label} style={s.card}>
                <p style={s.metricValue}>{m.value}</p>
                <p style={s.metricLabel}>{m.label}</p>
                <p style={s.metricSub}>{m.sub}</p>
              </div>
          ))}
        </div>

        <div style={s.twoCol}>
          <div style={s.card}>
            <p style={s.cardTitle}>Користувачі по ролях</p>
            {Object.entries(stats.usersByRole).map(([role, count]) => {
              const total = stats.totalUsers || 1;
              const pct = Math.round((Number(count) / total) * 100);
              const roleLabel: Record<string, string> = { student: 'Студент', teacher: 'Викладач', admin: 'Адмін', moderator: 'Модератор' };
              return (
                  <div key={role} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 5 }}>
                      <span style={{ fontWeight: 500 }}>{roleLabel[role] ?? role}</span>
                      <span style={{ color: '#9a9a9a' }}>{Number(count)} ({pct}%)</span>
                    </div>
                    <div style={s.track}>
                      <div style={{ ...s.fill, width: `${pct}%` }} />
                    </div>
                  </div>
              );
            })}
          </div>

          <div style={s.card}>
            <p style={s.cardTitle}>Реєстрації за 7 днів</p>
            <MiniBarChart data={stats.registrationsByDay} />
            {stats.registrationsByDay.length === 0 && (
                <p style={s.emptyText}>Немає даних</p>
            )}
          </div>
        </div>
      </div>
  );
}

function UsersTab() {
  const toast = useToast();
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    try {
      const data = await apiFetch<AdminUser[]>(`/admin/users?${params}`);
      setUsers(data);
    } catch { toast.error('Не вдалось завантажити користувачів'); }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) });
      toast.success('Роль оновлено');
      load();
    } catch { toast.error('Помилка зміни ролі'); }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !isActive }) });
      toast.success(isActive ? 'Користувача заблоковано' : 'Користувача розблоковано');
      load();
    } catch { toast.error('Помилка'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Видалити користувача?')) return;
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
      toast.success('Видалено');
      load();
    } catch { toast.error('Помилка видалення'); }
  };

  return (
      <div>
        <p style={s.pageTitle}>Користувачі {!loading && `(${users.length})`}</p>

        <div style={s.filterRow}>
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
            {['student','teacher','moderator','admin'].map(r => (
                <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div style={s.tableWrap}>
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
                        <p style={{ fontSize: '0.75rem', color: '#9a9a9a' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={s.td}>
                    <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        style={s.inlineSelect}
                    >
                      {['student','teacher','moderator','admin'].map(r => (
                          <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td style={s.td}>
                  <span style={{ ...s.badge, ...(u.isActive ? s.badgeGreen : s.badgeRed) }}>
                    {u.isActive ? 'Активний' : 'Блок'}
                  </span>
                  </td>
                  <td style={s.td}>
                  <span style={{ fontSize: '0.8rem', color: '#9a9a9a' }}>
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
      </div>
  );
}

function CoursesTab() {
  const toast = useToast();
  const [courses, setCourses]         = useState<AdminCourse[]>([]);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading]         = useState(true);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    try {
      const data = await apiFetch<AdminCourse[]>(`/admin/courses?${params}`);
      setCourses(data);
    } catch { toast.error('Не вдалось завантажити курси'); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/admin/courses/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      toast.success('Статус оновлено');
      load();
    } catch { toast.error('Помилка'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Видалити курс разом з усіма уроками?')) return;
    try {
      await apiFetch(`/admin/courses/${id}`, { method: 'DELETE' });
      toast.success('Курс видалено');
      load();
    } catch { toast.error('Помилка видалення'); }
  };

  const statusStyle: Record<string, React.CSSProperties> = {
    draft:     { ...s.badge, background: '#f5f5f5', color: '#5a5a5a' },
    published: { ...s.badge, ...s.badgeGreen },
    archived:  { ...s.badge, ...s.badgeRed },
  };
  const statusLabel: Record<string, string> = { draft: 'Чернетка', published: 'Опублікований', archived: 'Архів' };

  return (
      <div>
        <p style={s.pageTitle}>Курси {!loading && `(${courses.length})`}</p>

        <div style={s.filterRow}>
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

        <div style={s.tableWrap}>
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
                    <p style={{ fontSize: '0.72rem', color: '#9a9a9a' }}>{c.author.email}</p>
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
                  <span style={{ fontSize: '0.8rem', color: '#9a9a9a' }}>
                    {new Date(c.createdAt).toLocaleDateString('uk-UA')}
                  </span>
                  </td>
                  <td style={s.td}>
                    <button style={{ ...s.actionBtn, ...s.actionBtnDanger }} onClick={() => handleDelete(c.id)}>
                      Видалити
                    </button>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>
          {!loading && courses.length === 0 && <p style={s.emptyText}>Нічого не знайдено</p>}
        </div>
      </div>
  );
}

function ReviewsTab() {
  const toast = useToast();
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await apiFetch<PendingReview[]>('/reviews/admin/pending');
      setReviews(data);
    } catch { toast.error('Не вдалось завантажити відгуки'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    try {
      await apiFetch(`/reviews/admin/${id}/approve`, { method: 'PATCH' });
      toast.success('Відгук схвалено');
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch { toast.error('Помилка'); }
  };

  const reject = async (id: string) => {
    try {
      await apiFetch(`/reviews/${id}`, { method: 'DELETE' });
      toast.info('Відгук відхилено');
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch { toast.error('Помилка'); }
  };

  if (loading) return (
      <div>
        <p style={s.pageTitle}>Відгуки на модерацію</p>
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
      </div>
  );

  return (
      <div>
        <p style={s.pageTitle}>Відгуки на модерацію ({reviews.length})</p>

        {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontSize: '2rem', marginBottom: 12 }}>✓</p>
              <p style={{ color: '#9a9a9a', fontSize: '0.9rem' }}>Всі відгуки перевірено</p>
            </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map(r => (
                  <div key={r.id} style={s.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{r.user.name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#9a9a9a' }}>{r.user.email}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#0a0a0a', letterSpacing: 1, fontSize: '0.9rem' }}>
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </span>
                        <span style={{ fontSize: '0.75rem', color: '#9a9a9a' }}>
                    {new Date(r.createdAt).toLocaleDateString('uk-UA')}
                  </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#9a9a9a', marginBottom: 8 }}>
                      Курс: <span style={{ color: '#0a0a0a', fontWeight: 500 }}>{r.course.title}</span>
                    </p>

                    {r.body && (
                        <p style={{
                          fontSize: '0.875rem', color: '#2a2a2a', lineHeight: 1.6,
                          padding: '10px 14px', background: '#f5f5f5',
                          borderRadius: 8, marginBottom: 14,
                        }}>
                          {r.body}
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={s.btnApprove} onClick={() => approve(r.id)}>Схвалити</button>
                      <button style={s.btnReject}  onClick={() => reject(r.id)}>Відхилити</button>
                    </div>
                  </div>
              ))}
            </div>
        )}
      </div>
  );
}

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 80, marginTop: 14 }}>
        {data.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: '0.6rem', color: '#9a9a9a' }}>{d.count || ''}</span>
              <div style={{
                width: '100%',
                height: `${Math.max((d.count / max) * 56, d.count > 0 ? 3 : 0)}px`,
                background: '#0a0a0a', borderRadius: '3px 3px 0 0', opacity: 0.8,
              }} />
              <span style={{ fontSize: '0.55rem', color: '#9a9a9a' }}>
            {new Date(d.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'numeric' })}
          </span>
            </div>
        ))}
      </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:   { minHeight: '100vh', background: '#fafafa' },

  header: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(250,250,250,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #ebebeb',
  },
  headerInner: {
    maxWidth: 1160, margin: '0 auto',
    padding: '0 32px', height: 56,
    display: 'flex', alignItems: 'center', gap: 24,
  },
  backLink: {
    fontSize: '0.8rem', color: '#9a9a9a',
    whiteSpace: 'nowrap', flexShrink: 0,
  },
  headerTitle: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: '0.95rem', fontWeight: 600,
    letterSpacing: '-0.02em', color: '#0a0a0a',
    flexShrink: 0, marginRight: 8,
  },
  headerDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#0a0a0a', flexShrink: 0,
  },
  tabsRow: { display: 'flex', gap: 2 },
  tabBtn: {
    padding: '5px 14px', borderRadius: 6,
    border: 'none', background: 'transparent',
    fontSize: '0.875rem', color: '#5a5a5a', cursor: 'pointer',
  },
  tabBtnActive: { color: '#0a0a0a', fontWeight: 500, background: '#f0f0f0' },

  body: { maxWidth: 1160, margin: '28px auto', padding: '0 32px' },

  pageTitle: {
    fontSize: '0.7rem', fontWeight: 500,
    textTransform: 'uppercase' as const, letterSpacing: '0.07em',
    color: '#9a9a9a', marginBottom: 18,
  },

  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 },

  card: { background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '18px 20px' },
  cardTitle: {
    fontSize: '0.7rem', fontWeight: 500,
    textTransform: 'uppercase' as const, letterSpacing: '0.07em',
    color: '#9a9a9a', marginBottom: 16,
  },

  metricValue: { fontSize: '1.6rem', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 2 },
  metricLabel: { fontSize: '0.75rem', color: '#5a5a5a', fontWeight: 500 },
  metricSub:   { fontSize: '0.72rem', color: '#9a9a9a', marginTop: 3 },

  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },

  track: { height: 3, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' },
  fill:  { height: '100%', background: '#0a0a0a', borderRadius: 99, transition: 'width 0.4s' },

  filterRow: { display: 'flex', gap: 10, marginBottom: 16 },

  tableWrap: { background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, overflow: 'hidden' },
  table:     { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    padding: '11px 16px', textAlign: 'left' as const,
    fontSize: '0.65rem', fontWeight: 500,
    color: '#9a9a9a', background: '#fafafa',
    borderBottom: '1px solid #ebebeb',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
  },
  td: {
    padding: '12px 16px', borderBottom: '1px solid #f5f5f5',
    fontSize: '0.875rem', color: '#0a0a0a', verticalAlign: 'middle' as const,
  },

  miniAvatar: {
    width: 30, height: 30, borderRadius: '50%',
    background: '#0a0a0a', color: '#fafafa',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.7rem', fontWeight: 600, flexShrink: 0,
  },
  courseThumb: {
    width: 30, height: 30, borderRadius: 6,
    background: '#f0f0f0', color: '#5a5a5a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.9rem', fontWeight: 600, flexShrink: 0,
  },

  badge:     { padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 500, display: 'inline-block' },
  badgeGreen:{ background: '#f0fdf4', color: '#16a34a' },
  badgeRed:  { background: '#fef2f2', color: '#dc2626' },

  inlineSelect: {
    padding: '4px 8px', borderRadius: 6,
    border: '1.5px solid #ebebeb', background: '#fff',
    fontSize: '0.8rem', cursor: 'pointer', outline: 'none',
    fontFamily: 'inherit', color: '#0a0a0a',
  },


  actionBtn: {
    padding: '5px 10px', borderRadius: 6,
    border: '1.5px solid #ebebeb', background: 'transparent',
    fontSize: '0.78rem', cursor: 'pointer', color: '#5a5a5a',
    fontFamily: 'inherit',
  },
  actionBtnDanger: { color: '#dc2626', borderColor: '#fecaca' },

  btnApprove: {
    padding: '7px 18px', borderRadius: 7,
    border: '1.5px solid #ebebeb', background: '#0a0a0a',
    color: '#fafafa', fontSize: '0.8rem', fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnReject: {
    padding: '7px 18px', borderRadius: 7,
    border: '1.5px solid #ebebeb', background: 'transparent',
    color: '#5a5a5a', fontSize: '0.8rem',
    cursor: 'pointer', fontFamily: 'inherit',
  },

  emptyText: { textAlign: 'center' as const, padding: '28px', color: '#9a9a9a', fontSize: '0.875rem' },
};