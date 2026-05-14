import React, { useEffect, useState, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL ?? 'http://localhost:3000';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ message: 'Помилка' }));
    throw new Error(e.message);
  }
  return res.json();
}

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

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'stats', label: 'Статистика', icon: '📊' },
    { key: 'users', label: 'Користувачі', icon: '👥' },
    { key: 'courses', label: 'Курси', icon: '📚' },
    { key: 'reviews', label: 'Відгуки', icon: '⭐' },
  ];

  return (
    <div style={s.page}>
      <aside style={s.sidebar}>
        <div style={s.logo}>⚙️ Адмін</div>
        <nav>
          {tabs.map((t) => (
            <button
              key={t.key}
              style={{ ...s.navBtn, ...(tab === t.key ? s.navBtnActive : {}) }}
              onClick={() => setTab(t.key)}
            >
              <span style={{ marginRight: 10 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      <main style={s.main}>
        {tab === 'stats'   && <StatsTab />}
        {tab === 'users'   && <UsersTab />}
        {tab === 'courses' && <CoursesTab />}
        {tab === 'reviews' && <ReviewsTab />}
      </main>
    </div>
  );
}

function StatsTab() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    apiFetch<PlatformStats>('/admin/stats').then(setStats).catch(console.error);
  }, []);

  if (!stats) return <Loader />;

  const roleColors: Record<string, string> = {
    student: '#4f46e5', teacher: '#059669', admin: '#dc2626', moderator: '#d97706',
  };

  return (
    <div>
      <h2 style={s.pageTitle}>Статистика платформи</h2>

      <div style={s.statsGrid}>
        {[
          { label: 'Всього користувачів', value: stats.totalUsers, icon: '👤', sub: `+${stats.newUsersThisMonth} цього місяця`, color: '#4f46e5' },
          { label: 'Курсів', value: stats.totalCourses, icon: '📚', sub: `+${stats.newCoursesThisMonth} цього місяця`, color: '#0891b2' },
          { label: 'Записів', value: stats.totalEnrollments, icon: '✍️', sub: 'загалом', color: '#059669' },
          { label: 'Дохід (₴)', value: stats.totalRevenue.toLocaleString('uk-UA'), icon: '💰', sub: 'загалом', color: '#d97706' },
        ].map((m) => (
          <div key={m.label} style={s.statCard}>
            <div style={{ ...s.statIcon, background: m.color + '15', color: m.color }}>{m.icon}</div>
            <p style={s.statValue}>{m.value}</p>
            <p style={s.statLabel}>{m.label}</p>
            <p style={s.statSub}>{m.sub}</p>
          </div>
        ))}
      </div>

      <div style={s.twoCol}>
        <div style={s.card}>
          <h3 style={s.cardTitle}>Користувачі по ролях</h3>
          {Object.entries(stats.usersByRole).map(([role, count]) => {
            const total = stats.totalUsers || 1;
            const pct = Math.round((Number(count) / total) * 100);
            return (
              <div key={role} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{role}</span>
                  <span style={{ color: '#6b7280' }}>{Number(count)} ({pct}%)</span>
                </div>
                <div style={s.track}>
                  <div style={{ ...s.fill, width: `${pct}%`, background: roleColors[role] ?? '#6b7280' }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={s.card}>
          <h3 style={s.cardTitle}>Реєстрації за 7 днів</h3>
          <MiniBarChart data={stats.registrationsByDay} color="#4f46e5" />
          {stats.registrationsByDay.length === 0 && (
            <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: 20 }}>Немає даних</p>
          )}
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    apiFetch<AdminUser[]>(`/admin/users?${params}`).then(setUsers).catch(console.error);
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (id: string, role: string) => {
    await apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) });
    load();
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !isActive }) });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Видалити користувача?')) return;
    await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h2 style={s.pageTitle}>Користувачі ({users.length})</h2>

      <div style={s.filterRow}>
        <input
          style={s.searchInput}
          placeholder="Пошук по email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={s.select} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Всі ролі</option>
          {['student', 'teacher', 'moderator', 'admin'].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {['Ім\'я', 'Email', 'Роль', 'Статус', 'Дата реєстрації', 'Дії'].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.5 }}>
                <td style={s.td}>{u.name}</td>
                <td style={s.td}><span style={s.mono}>{u.email}</span></td>
                <td style={s.td}>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    style={{ ...s.select, padding: '4px 8px', fontSize: 12 }}
                  >
                    {['student', 'teacher', 'moderator', 'admin'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td style={s.td}>
                  <span style={{ ...s.badge, background: u.isActive ? '#d1fae5' : '#fee2e2', color: u.isActive ? '#065f46' : '#991b1b' }}>
                    {u.isActive ? 'Активний' : 'Заблокований'}
                  </span>
                </td>
                <td style={s.td}>
                  <span style={s.dateText}>{new Date(u.createdAt).toLocaleDateString('uk-UA')}</span>
                </td>
                <td style={s.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={s.btnSm} onClick={() => handleToggleActive(u.id, u.isActive)}>
                      {u.isActive ? '🔒 Блок' : '🔓 Розблок'}
                    </button>
                    <button style={{ ...s.btnSm, ...s.btnDanger }} onClick={() => handleDelete(u.id)}>
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p style={s.empty}>Нічого не знайдено</p>}
      </div>
    </div>
  );
}

function CoursesTab() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    apiFetch<AdminCourse[]>(`/admin/courses?${params}`).then(setCourses).catch(console.error);
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id: string, status: string) => {
    await apiFetch(`/admin/courses/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Видалити курс разом з усіма уроками?')) return;
    await apiFetch(`/admin/courses/${id}`, { method: 'DELETE' });
    load();
  };

  const statusColors: Record<string, { bg: string; color: string }> = {
    draft:     { bg: '#f3f4f6', color: '#374151' },
    published: { bg: '#d1fae5', color: '#065f46' },
    archived:  { bg: '#fee2e2', color: '#991b1b' },
  };

  return (
    <div>
      <h2 style={s.pageTitle}>Курси ({courses.length})</h2>

      <div style={s.filterRow}>
        <input
          style={s.searchInput}
          placeholder="Пошук по назві..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={s.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Всі статуси</option>
          {['draft', 'published', 'archived'].map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
      </div>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {['Назва', 'Автор', 'Статус', 'Ціна', 'Дата', 'Дії'].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => {
              const sc = statusColors[c.status] ?? statusColors.draft;
              return (
                <tr key={c.id}>
                  <td style={s.td}><span style={{ fontWeight: 500 }}>{c.title}</span></td>
                  <td style={s.td}>
                    <span style={{ fontSize: 13 }}>{c.author.name}</span>
                    <br />
                    <span style={{ ...s.mono, fontSize: 11 }}>{c.author.email}</span>
                  </td>
                  <td style={s.td}>
                    <select
                      value={c.status}
                      onChange={(e) => handleStatus(c.id, e.target.value)}
                      style={{ ...s.select, padding: '4px 8px', fontSize: 12, background: sc.bg, color: sc.color, border: 'none' }}
                    >
                      {['draft', 'published', 'archived'].map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </td>
                  <td style={s.td}>
                    {c.price === 0 ? <span style={{ color: '#059669' }}>Безкоштовно</span> : `${c.price} ₴`}
                  </td>
                  <td style={s.td}>
                    <span style={s.dateText}>{new Date(c.createdAt).toLocaleDateString('uk-UA')}</span>
                  </td>
                  <td style={s.td}>
                    <button style={{ ...s.btnSm, ...s.btnDanger }} onClick={() => handleDelete(c.id)}>
                      🗑 Видалити
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {courses.length === 0 && <p style={s.empty}>Нічого не знайдено</p>}
      </div>
    </div>
  );
}

function ReviewsTab() {
  const [reviews, setReviews] = useState<PendingReview[]>([]);

  const load = () => {
    apiFetch<PendingReview[]>('/reviews/admin/pending').then(setReviews).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    await apiFetch(`/reviews/admin/${id}/approve`, { method: 'PATCH' });
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const reject = async (id: string) => {
    await apiFetch(`/reviews/${id}`, { method: 'DELETE' });
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div>
      <h2 style={s.pageTitle}>Відгуки на модерацію ({reviews.length})</h2>

      {reviews.length === 0 ? (
        <div style={s.emptyBlock}>
          <p style={{ fontSize: 40 }}>✅</p>
          <p style={{ color: '#6b7280' }}>Всі відгуки перевірено!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reviews.map((r) => (
            <div key={r.id} style={s.reviewCard}>
              <div style={s.reviewTop}>
                <div>
                  <span style={{ fontWeight: 600 }}>{r.user.name}</span>
                  <span style={s.mono}> · {r.user.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={s.stars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span style={s.dateText}>{new Date(r.createdAt).toLocaleDateString('uk-UA')}</span>
                </div>
              </div>

              <p style={s.reviewCourse}>Курс: <strong>{r.course.title}</strong></p>
              {r.body && <p style={s.reviewBody}>{r.body}</p>}

              <div style={s.reviewActions}>
                <button style={s.btnApprove} onClick={() => approve(r.id)}>✓ Схвалити</button>
                <button style={s.btnReject} onClick={() => reject(r.id)}>✕ Відхилити</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniBarChart({ data, color }: { data: { date: string; count: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginTop: 12 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 9, color: '#9ca3af' }}>{d.count || ''}</span>
          <div style={{ width: '100%', height: `${Math.max((d.count / max) * 60, d.count > 0 ? 3 : 0)}px`, background: color, borderRadius: '3px 3px 0 0', opacity: 0.75 }} />
          <span style={{ fontSize: 8, color: '#d1d5db' }}>
            {new Date(d.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'numeric' })}
          </span>
        </div>
      ))}
    </div>
  );
}

function Loader() {
  return <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>Завантаження...</div>;
}

// --- Стилі ---
const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', minHeight: '100vh', background: '#f3f4f6' },
  sidebar: { width: 220, background: '#1e1b4b', padding: '0 0 32px', flexShrink: 0 },
  logo: { padding: '28px 24px 20px', fontSize: 18, fontWeight: 700, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 },
  navBtn: { display: 'flex', alignItems: 'center', width: '100%', padding: '12px 24px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)', fontSize: 14, cursor: 'pointer', textAlign: 'left' },
  navBtnActive: { background: 'rgba(255,255,255,0.1)', color: '#fff', borderLeft: '3px solid #818cf8' },
  main: { flex: 1, padding: '32px 36px', maxWidth: 1100 },
  pageTitle: { fontSize: 22, fontWeight: 700, margin: '0 0 24px', color: '#111827' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  statIcon: { width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12 },
  statValue: { margin: '0 0 2px', fontSize: 26, fontWeight: 700, color: '#111827' },
  statLabel: { margin: '0 0 4px', fontSize: 13, color: '#6b7280' },
  statSub: { margin: 0, fontSize: 11, color: '#9ca3af' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card: { background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: 14, fontWeight: 700, margin: '0 0 16px', color: '#111827' },
  track: { height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, transition: 'width 0.4s' },
  filterRow: { display: 'flex', gap: 12, marginBottom: 18 },
  searchInput: { flex: 1, padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' },
  select: { padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, background: '#fff', cursor: 'pointer' },
  tableWrap: { background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #f3f4f6', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '13px 16px', borderBottom: '1px solid #f9fafb', fontSize: 14, color: '#374151', verticalAlign: 'middle' },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 },
  mono: { fontFamily: 'monospace', fontSize: 12, color: '#9ca3af' },
  dateText: { fontSize: 12, color: '#9ca3af' },
  btnSm: { padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: '#fff' },
  btnDanger: { color: '#dc2626', borderColor: '#fca5a5' },
  empty: { textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: 14 },
  emptyBlock: { textAlign: 'center', padding: '80px 0' },
  reviewCard: { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  reviewTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewCourse: { fontSize: 13, color: '#6b7280', margin: '0 0 8px' },
  reviewBody: { fontSize: 14, color: '#374151', margin: '0 0 14px', lineHeight: 1.6, padding: '10px 14px', background: '#f9fafb', borderRadius: 8 },
  stars: { color: '#f59e0b', fontSize: 16, letterSpacing: 1 },
  reviewActions: { display: 'flex', gap: 10 },
  btnApprove: { padding: '8px 20px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnReject: { padding: '8px 20px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};
