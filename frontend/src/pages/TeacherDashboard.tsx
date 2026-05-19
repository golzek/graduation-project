import React, { useEffect, useState, useCallback } from 'react';
import { TeacherDashboardSkeleton } from '../components/Skeleton';
import { Link } from 'react-router-dom';

import { apiFetch } from '../context/AuthContext';

interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  status: 'pending' | 'approved' | 'rejected';
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  adminComment: string | null;
  createdAt: string;
}
interface TeacherStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  totalCertificates: number;
  courses: CourseStats[];
}

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

export function TeacherDashboard() {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [activeCourse, setActiveCourse] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<TeacherStats>('/analytics/teacher')
        .then((data) => {
          setStats(data);
          if (data.courses.length > 0) setActiveCourse(data.courses[0].courseId);
        })
        .catch(() => setFetchError(true))
        .finally(() => setLoading(false));
  }, []);

  if (loading) return <TeacherDashboardSkeleton />;
  if (fetchError) return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <p style={{ color: '#6b7280' }}>Не вдалося завантажити дані. Перевірте підключення до сервера.</p>
        <Link to="/courses/create" style={{ display: 'inline-block', marginTop: 16, padding: '12px 24px', background: '#4f46e5', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}>
          Створити перший курс
        </Link>
      </div>
  );

  const selectedCourse = stats.courses.find((c) => c.courseId === activeCourse);

  return (
      <div style={s.page}>

        <div style={s.header}>
          <div style={s.headerRow}>
            <div>
              <h1 style={s.title}>Панель викладача</h1>
              <p style={s.sub}>Аналітика та управління курсами</p>
            </div>
            <Link to="/courses/create" style={s.btnCreate}>+ Новий курс</Link>
          </div>
        </div>

        <div style={s.body}>

          <div style={s.metricsRow}>
            <MetricCard icon="📚" label="Курсів" value={stats.totalCourses} color="#4f46e5" />
            <MetricCard icon="👥" label="Студентів" value={stats.totalStudents} color="#0891b2" />
            <MetricCard icon="💰" label="Дохід (₴)" value={stats.totalRevenue.toLocaleString('uk-UA')} color="#059669" />
            <MetricCard icon="🎓" label="Сертифікатів" value={stats.totalCertificates} color="#d97706" />
          </div>


          {stats.courses.length === 0 ? (
              <div style={s.empty}>
                <p>У тебе ще немає курсів</p>
                <Link to="/courses/create" style={s.btnLink}>Створити перший курс</Link>
              </div>
          ) : (
              <div style={s.twoCol}>

                <div style={s.courseList}>
                  <h3 style={s.sectionTitle}>Мої курси</h3>
                  {stats.courses.map((c) => (
                      <div
                          key={c.courseId}
                          style={{ ...s.courseRow, ...(activeCourse === c.courseId ? s.courseRowActive : {}) }}
                          onClick={() => setActiveCourse(c.courseId)}
                      >
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{c.title}</p>
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
                            {c.students} студентів · {c.avgProgressPercent}% прогрес
                          </p>
                        </div>
                        <span style={{ fontWeight: 700, color: '#059669', fontSize: 14 }}>
                    {c.revenue.toLocaleString('uk-UA')} ₴
                  </span>
                      </div>
                  ))}
                </div>


                {selectedCourse && (
                    <div style={s.courseDetail}>
                      <h3 style={s.sectionTitle}>{selectedCourse.title}</h3>


                      <div style={s.miniMetrics}>
                        <MiniMetric label="Студентів" value={selectedCourse.students} />
                        <MiniMetric label="Дохід" value={`${selectedCourse.revenue.toLocaleString()} ₴`} />
                        <MiniMetric label="Сертифікатів" value={selectedCourse.certificates} />
                        <MiniMetric label="Сер. прогрес" value={`${selectedCourse.avgProgressPercent}%`} />
                      </div>


                      <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                          <span style={{ color: '#6b7280' }}>Середнє завершення курсу</span>
                          <strong>{selectedCourse.avgProgressPercent}%</strong>
                        </div>
                        <div style={s.progressTrack}>
                          <div style={{ ...s.progressFill, width: `${selectedCourse.avgProgressPercent}%` }} />
                        </div>
                      </div>


                      {selectedCourse.enrollsByDay.length > 0 && (
                          <div style={{ marginBottom: 24 }}>
                            <p style={s.chartTitle}>Записи за останні 30 днів</p>
                            <MiniBarChart data={selectedCourse.enrollsByDay} />
                          </div>
                      )}


                      {selectedCourse.topLessons.length > 0 && (
                          <div>
                            <p style={s.chartTitle}>Топ уроків за переглядами</p>
                            <div style={s.lessonTable}>
                              <div style={s.tableHeader}>
                                <span style={{ flex: 1 }}>Урок</span>
                                <span style={{ width: 70, textAlign: 'right' as const }}>Перегляди</span>
                                <span style={{ width: 90, textAlign: 'right' as const }}>Сер. час</span>
                              </div>
                              {selectedCourse.topLessons.map((l, i) => (
                                  <div key={i} style={s.tableRow}>
                                    <span style={{ flex: 1, fontSize: 13 }}>{l.title}</span>
                                    <span style={{ width: 70, textAlign: 'right' as const, fontSize: 13, fontWeight: 600 }}>
                            {l.views}
                          </span>
                                    <span style={{ width: 90, textAlign: 'right' as const, fontSize: 12, color: '#6b7280' }}>
                            {Math.round(l.avgWatchedSec / 60)} хв
                          </span>
                                  </div>
                              ))}
                            </div>
                          </div>
                      )}

                      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                        <Link to={`/courses/${selectedCourse.courseId}/edit`} style={s.btnEdit}>
                          Редагувати курс
                        </Link>
                        <Link to={`/analytics/courses/${selectedCourse.courseId}`} style={s.btnFull}>
                          Детальна аналітика
                        </Link>
                      </div>

                      <PromoCodesPanel courseId={selectedCourse.courseId} />
                    </div>
                )}
              </div>
          )}
        </div>
      </div>
  );
}


function PromoCodesPanel({ courseId }: { courseId: string }) {
  const [promos, setPromos]         = useState<PromoCode[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr]               = useState('');
  const [success, setSuccess]       = useState('');

  const [code,      setCode]      = useState('');
  const [discount,  setDiscount]  = useState('');
  const [limit,     setLimit]     = useState('');
  const [expires,   setExpires]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<PromoCode[]>(`/promo-codes/my?courseId=${courseId}`);
      setPromos(data);
    } catch {} finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!code.trim() || !discount) { setErr('Код та знижка обов\'язкові'); return; }
    setSubmitting(true); setErr(''); setSuccess('');
    try {
      await apiFetch(`/promo-codes/course/${courseId}`, {
        method: 'POST',
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountPercent: Number(discount),
          usageLimit: limit ? Number(limit) : undefined,
          expiresAt: expires || undefined,
        }),
      });
      setSuccess('Промокод відправлено на схвалення адміну');
      setCode(''); setDiscount(''); setLimit(''); setExpires('');
      setShowForm(false);
      load();
    } catch (e: any) {
      setErr(e.message || 'Помилка створення');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Видалити промокод?')) return;
    try { await apiFetch(`/promo-codes/${id}`, { method: 'DELETE' }); load(); }
    catch {}
  };

  const statusLabel: Record<string, string> = { pending: 'Очікує', approved: 'Активний', rejected: 'Відхилений' };
  const statusColor: Record<string, string> = { pending: '#d97706', approved: '#16a34a', rejected: '#dc2626' };
  const statusBg:    Record<string, string> = { pending: '#fffbeb', approved: '#f0fdf4', rejected: '#fef2f2' };

  return (
      <div style={{ marginTop: 24, borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={s.chartTitle}>🏷 Промокоди</p>
          <button
              onClick={() => { setShowForm(f => !f); setErr(''); setSuccess(''); }}
              style={{ padding: '6px 14px', borderRadius: 7, border: '1.5px solid #ede9fe', background: showForm ? '#ede9fe' : '#fff', color: '#4f46e5', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >{showForm ? 'Скасувати' : '+ Новий промокод'}</button>
        </div>

        {success && <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 13, color: '#16a34a', marginBottom: 12 }}>✓ {success}</div>}

        {showForm && (
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16, marginBottom: 16, border: '1.5px solid #ede9fe' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Код *</label>
                  <input
                      placeholder="SUMMER20"
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase())}
                      style={inp}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Знижка (%) *</label>
                  <input
                      type="number" min="1" max="100" placeholder="20"
                      value={discount}
                      onChange={e => setDiscount(e.target.value)}
                      style={inp}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Ліміт використань</label>
                  <input
                      type="number" min="1" placeholder="Необмежено"
                      value={limit}
                      onChange={e => setLimit(e.target.value)}
                      style={inp}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Дійсний до</label>
                  <input
                      type="date"
                      value={expires}
                      onChange={e => setExpires(e.target.value)}
                      style={inp}
                  />
                </div>
              </div>
              {err && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{err}</p>}
              <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10 }}>
                Промокод буде активований після схвалення адміністратором.
              </p>
              <button
                  onClick={handleCreate}
                  disabled={submitting}
                  style={{ padding: '8px 20px', background: submitting ? '#9ca3af' : '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: submitting ? 'default' : 'pointer', fontFamily: 'inherit' }}
              >{submitting ? 'Відправка...' : 'Відправити на схвалення'}</button>
            </div>
        )}

        {loading ? (
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Завантаження...</p>
        ) : promos.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Промокодів ще немає</p>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {promos.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fff', borderRadius: 10, border: '1.5px solid #f3f4f6' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, letterSpacing: '0.05em', flex: '0 0 auto' }}>{p.code}</span>
                    <span style={{ fontWeight: 600, color: '#4f46e5', fontSize: 13 }}>−{p.discountPercent}%</span>
                    <span style={{ fontSize: 12, color: '#6b7280', flex: 1 }}>
                {p.usedCount}/{p.usageLimit ?? '∞'} використань
                      {p.expiresAt ? ` · до ${new Date(p.expiresAt).toLocaleDateString('uk-UA')}` : ''}
              </span>
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: statusBg[p.status], color: statusColor[p.status] }}>
                {statusLabel[p.status]}
              </span>
                    {p.adminComment && p.status === 'rejected' && (
                        <span style={{ fontSize: 11, color: '#9ca3af', maxWidth: 120 }} title={p.adminComment}>💬 {p.adminComment.slice(0, 30)}{p.adminComment.length > 30 ? '...' : ''}</span>
                    )}
                    {p.status !== 'approved' && (
                        <button
                            onClick={() => handleDelete(p.id)}
                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, opacity: 0.6 }}
                            title="Видалити"
                        >×</button>
                    )}
                  </div>
              ))}
            </div>
        )}
      </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '8px 10px',
  border: '1.5px solid #e5e7eb', borderRadius: 7,
  fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff',
};

function MetricCard({ icon, label, value, color }: { icon: string; label: string; value: any; color: string }) {
  return (
      <div style={s.metricCard}>
        <div style={{ ...s.metricIcon, background: color + '18', color }}>{icon}</div>
        <div>
          <p style={s.metricValue}>{value}</p>
          <p style={s.metricLabel}>{label}</p>
        </div>
      </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: any }) {
  return (
      <div style={s.miniMetric}>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>{value}</p>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{label}</p>
      </div>
  );
}

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
        {data.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, color: '#9ca3af' }}>{d.count || ''}</span>
              <div
                  title={`${new Date(d.date).toLocaleDateString('uk-UA')}: ${d.count}`}
                  style={{
                    width: '100%',
                    height: `${Math.max((d.count / max) * 56, d.count > 0 ? 4 : 0)}px`,
                    background: '#4f46e5',
                    borderRadius: '3px 3px 0 0',
                    opacity: 0.8,
                    transition: 'opacity 0.2s',
                    cursor: 'pointer',
                  }}
              />
            </div>
        ))}
      </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f9fafb' },
  centered: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#6b7280' },
  header: { background: '#1e1b4b', color: '#fff', padding: '36px 32px' },
  headerRow: { maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 700, margin: 0 },
  sub: { opacity: 0.7, marginTop: 4 },
  btnCreate: { padding: '12px 24px', background: '#4f46e5', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  body: { maxWidth: 1200, margin: '32px auto', padding: '0 32px' },
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
  metricCard: { background: '#fff', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  metricIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  metricValue: { margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' },
  metricLabel: { margin: '2px 0 0', fontSize: 13, color: '#6b7280' },
  twoCol: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 },
  courseList: { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', height: 'fit-content' },
  sectionTitle: { fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#111827' },
  courseRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 6, transition: 'background 0.15s' },
  courseRowActive: { background: '#ede9fe' },
  courseDetail: { background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  miniMetrics: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 },
  miniMetric: { background: '#f9fafb', borderRadius: 10, padding: '12px 16px' },
  progressTrack: { height: 10, background: '#e5e7eb', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#4f46e5', borderRadius: 5, transition: 'width 0.5s' },
  chartTitle: { fontWeight: 600, fontSize: 13, color: '#374151', margin: '0 0 10px' },
  lessonTable: { border: '1px solid #f3f4f6', borderRadius: 10, overflow: 'hidden' },
  tableHeader: { display: 'flex', padding: '10px 14px', background: '#f9fafb', fontSize: 12, fontWeight: 600, color: '#6b7280' },
  tableRow: { display: 'flex', padding: '10px 14px', borderTop: '1px solid #f3f4f6', alignItems: 'center' },
  btnEdit: { padding: '10px 18px', background: '#ede9fe', color: '#4f46e5', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 },
  btnFull: { padding: '10px 18px', background: '#f3f4f6', color: '#374151', borderRadius: 8, textDecoration: 'none', fontSize: 13 },
  empty: { textAlign: 'center', padding: 80 },
  btnLink: { display: 'inline-block', marginTop: 16, padding: '12px 24px', background: '#4f46e5', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600 },
};