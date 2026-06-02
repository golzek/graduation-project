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

interface PayoutRequest {
  id: string;
  amount: number;
  paymentDetails: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  adminComment: string | null;
  processedAt: string | null;
  createdAt: string;
}

interface EarningsSummary {
  gross: number;
  netEarnings: number;
  alreadyRequested: number;
  available: number;
  platformFeePercent: number;
  byMonth: { month: string; net: number }[];
  requests: PayoutRequest[];
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
        <p style={{ color: 'var(--text-secondary)' }}>Не вдалося завантажити дані. Перевірте підключення до сервера.</p>
        <Link to="/courses/create" style={{ display: 'inline-block', marginTop: 16, padding: '12px 24px', background: '#4f46e5', color: 'var(--bg-elevated)', borderRadius: 10, textDecoration: 'none', fontWeight: 600 }}>
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

        <div style={s.body} className="r-body">

          <div style={s.metricsRow} className="metrics-row r-metrics" >
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
              <div style={s.twoCol} className="r-two-col-300">

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
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
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
                          <span style={{ color: 'var(--text-secondary)' }}>Середнє завершення курсу</span>
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
                                    <span style={{ width: 90, textAlign: 'right' as const, fontSize: 12, color: 'var(--text-secondary)' }}>
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

          <PayoutsPanel />
        </div>
      </div>
  );
}

function PayoutsPanel() {
  const [data, setData]           = useState<EarningsSummary | null>(null);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [amount, setAmount]       = useState('');
  const [details, setDetails]     = useState('');
  const [submitting, setSub]      = useState(false);
  const [err, setErr]             = useState('');
  const [ok, setOk]               = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch<EarningsSummary>('/payouts/my/earnings');
      setData(d);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const hasPending = data?.requests.some(r => r.status === 'pending' || r.status === 'approved');
    if (!hasPending) return;
    const id = setInterval(() => { load(); }, 30_000);
    return () => clearInterval(id);
  }, [data, load]);

  const formatPaymentInput = (raw: string): string => {
    const trimmed = raw.replace(/\s+/g, '');
    if (/^UA/i.test(trimmed)) return trimmed.toUpperCase();
    const digits = trimmed.replace(/\D/g, '').slice(0, 19);
    return digits.replace(/(.{4})/g, '$1 ').trimEnd();
  };

  const cardDigitCount = (val: string): number => {
    if (/^UA/i.test(val.replace(/\s+/g, ''))) return 0;
    return val.replace(/\D/g, '').length;
  };

  const isCardValid = (val: string): boolean => {
    const normalized = val.replace(/\s+/g, '');
    if (/^UA/i.test(normalized)) return /^UA\d{27}$/i.test(normalized);
    const digits = normalized.replace(/\D/g, '');
    return digits.length >= 13 && digits.length <= 19;
  };

  const cancelRequest = async (id: string) => {
    try {
      await apiFetch(`/payouts/my/request/${id}`, { method: 'DELETE' });
      load();
    } catch (e: any) {
      alert(e.message || 'Помилка скасування');
    }
  };

  const displayPaymentDetails = (val: string): string => {
    const normalized = val.replace(/\s+/g, '');
    if (/^UA/i.test(normalized)) return normalized.toUpperCase();
    const digits = normalized.replace(/\D/g, '');
    if (digits.length >= 13 && digits.length <= 19) {
      return digits.replace(/(.{4})/g, '$1 ').trimEnd();
    }
    return val;
  };

  const handleRequest = async () => {
    setErr(''); setOk('');
    if (!amount || Number(amount) <= 0) { setErr('Введіть суму виплати'); return; }
    if (!details.trim()) { setErr('Введіть реквізити для виплати'); return; }
    if (data && Number(amount) > data.available) {
      setErr(`Максимум доступно: ${data.available.toLocaleString('uk-UA')} ₴`); return;
    }
    setSub(true);
    try {
      await apiFetch('/payouts/my/request', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(amount), paymentDetails: details }),
      });
      setOk('Запит на виплату відправлено! Адміністратор розгляне його найближчим часом.');
      setAmount(''); setDetails('');
      setShowForm(false);
      load();
    } catch (e: any) {
      setErr(e.message || 'Помилка відправки запиту');
    } finally { setSub(false); }
  };

  const statusLabel: Record<string, string> = {
    pending:  'Очікує',
    approved: 'Схвалено',
    rejected: 'Відхилено',
    paid:     'Виплачено',
  };
  const statusColor: Record<string, string> = {
    pending: '#d97706', approved: '#2563eb', rejected: '#dc2626', paid: '#16a34a',
  };
  const statusBg: Record<string, string> = {
    pending: '#fffbeb', approved: '#eff6ff', rejected: '#fef2f2', paid: '#f0fdf4',
  };

  const maxBar = data ? Math.max(...data.byMonth.map(m => m.net), 1) : 1;

  const fmtMonth = (m: string) => {
    const [y, mo] = m.split('-');
    const months = ['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру'];
    return `${months[parseInt(mo) - 1]} ${y.slice(2)}`;
  };

  return (
      <div style={{ marginTop: 28, background: 'var(--bg-elevated)', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ ...s.sectionTitle, margin: 0 }}>💸 Виплати</h3>
          {data && data.available > 0 && !showForm && (
              data.requests.some(r => r.status === 'pending') ? (
                  <span style={{ fontSize: 12, color: '#d97706', background: '#fffbeb', padding: '5px 12px', borderRadius: 8, border: '1px solid #fde68a' }}>
                ⏳ Запит очікує розгляду
              </span>
              ) : (
                  <button
                      onClick={() => { setShowForm(true); setErr(''); setOk(''); }}
                      style={{ padding: '8px 18px', background: '#059669', color: 'var(--bg-elevated)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >Запит на виплату</button>
              )
          )}
        </div>

        {loading ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Завантаження...</p>
        ) : !data ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Не вдалось завантажити дані</p>
        ) : (
            <>
              <div style={{ display: 'grid', gap: 12, marginBottom: 20 }} className="r-metrics">
                {[
                  { label: 'Валовий дохід', value: `${data.gross.toLocaleString('uk-UA')} ₴`, sub: 'від продажів', color: 'var(--text-secondary)' },
                  { label: 'Комісія платформи', value: `${data.platformFeePercent}%`, sub: `−${(data.gross * data.platformFeePercent / 100).toLocaleString('uk-UA')} ₴`, color: '#d97706' },
                  { label: 'Чистий заробіток', value: `${data.netEarnings.toLocaleString('uk-UA')} ₴`, sub: `виведено: ${data.alreadyRequested.toLocaleString('uk-UA')} ₴`, color: '#2563eb' },
                  { label: 'Доступно до виводу', value: `${data.available.toLocaleString('uk-UA')} ₴`, sub: data.available > 0 ? 'можна вивести' : 'немає коштів', color: data.available > 0 ? '#059669' : 'var(--text-tertiary)' },
                ].map(c => (
                    <div key={c.label} style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px' }}>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: c.color }}>{c.value}</p>
                      <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{c.label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>{c.sub}</p>
                    </div>
                ))}
              </div>

              {data.byMonth.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ ...s.chartTitle, marginBottom: 12 }}>Чистий заробіток по місяцях</p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                      {data.byMonth.map((m, i) => {
                        const h = Math.max((m.net / maxBar) * 60, m.net > 0 ? 4 : 0);
                        return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                              {m.net > 0 && <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{m.net >= 1000 ? `${(m.net/1000).toFixed(1)}k` : m.net}</span>}
                              <div title={`${fmtMonth(m.month)}: ${m.net.toLocaleString('uk-UA')} ₴`} style={{ width: '100%', height: `${h}px`, background: '#059669', borderRadius: '3px 3px 0 0', opacity: 0.8 }} />
                              <span style={{ fontSize: 9, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{fmtMonth(m.month)}</span>
                            </div>
                        );
                      })}
                    </div>
                  </div>
              )}

              {ok && (
                  <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#16a34a', marginBottom: 14 }}>
                    ✓ {ok}
                  </div>
              )}

              {showForm && (
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: 18, marginBottom: 18 }}>
                    <p style={{ margin: '0 0 14px', fontWeight: 600, fontSize: 14, color: '#065f46' }}>Новий запит на виплату</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 12 }} className="r-label-value">
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Сума (₴) *</label>
                        <input
                            type="number" min="1" max={data.available} step="0.01"
                            placeholder={`макс. ${data.available}`}
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            style={inp}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Реквізити (IBAN / картка) *</label>
                        <input
                            placeholder="UA123456… або 4111 1111 1111 1111"
                            value={details}
                            onChange={e => setDetails(formatPaymentInput(e.target.value))}
                            inputMode="text"
                            autoComplete="cc-number"
                            style={{ ...inp, borderColor: details && !isCardValid(details) ? '#f87171' : undefined }}
                        />
                        {details && !(/^UA/i.test(details.replace(/\s+/g,''))) && (
                            <p style={{ fontSize: 11, marginTop: 3, color: cardDigitCount(details) >= 13 && cardDigitCount(details) <= 19 ? '#16a34a' : '#d97706' }}>
                              {cardDigitCount(details)} / 16 цифр{cardDigitCount(details) >= 13 && cardDigitCount(details) <= 19 ? ' ✓' : ''}
                            </p>
                        )}
                      </div>
                    </div>
                    {err && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{err}</p>}
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 10 }}>
                      Запит буде розглянуто адміністратором. Після схвалення кошти буде переказано на вказані реквізити.
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                          onClick={handleRequest} disabled={submitting}
                          style={{ padding: '8px 20px', background: submitting ? 'var(--text-tertiary)' : '#059669', color: 'var(--bg-elevated)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: submitting ? 'default' : 'pointer', fontFamily: 'inherit' }}
                      >{submitting ? 'Відправка...' : 'Відправити'}</button>
                      <button
                          onClick={() => { setShowForm(false); setErr(''); }}
                          style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-secondary)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                      >Скасувати</button>
                    </div>
                  </div>
              )}

              {data.requests.length > 0 && (
                  <div>
                    <p style={{ ...s.chartTitle, marginBottom: 10 }}>Історія запитів</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {data.requests.map(r => (
                          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, border: '1.5px solid #f3f4f6' }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', minWidth: 100 }}>
                              {r.amount.toLocaleString('uk-UA')} ₴
                            </span>
                            <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: statusBg[r.status], color: statusColor[r.status], flexShrink: 0 }}>
                              {statusLabel[r.status]}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {displayPaymentDetails(r.paymentDetails)}
                            </span>
                            {r.adminComment && (
                                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', maxWidth: 160 }} title={r.adminComment}>
                                  💬 {r.adminComment.slice(0, 40)}{r.adminComment.length > 40 ? '…' : ''}
                                </span>
                            )}
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                              {new Date(r.createdAt).toLocaleDateString('uk-UA')}
                            </span>
                            {r.status === 'pending' && (
                                <button
                                    onClick={() => cancelRequest(r.id)}
                                    style={{ fontSize: 11, padding: '3px 10px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', borderRadius: 6, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}
                                >Скасувати</button>
                            )}
                          </div>
                      ))}
                    </div>
                  </div>
              )}

              {data.requests.length === 0 && data.available === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>
                    Запитів на виплату ще не було
                  </p>
              )}
            </>
        )}
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
      <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={s.chartTitle}>🏷 Промокоди</p>
          <button
              onClick={() => { setShowForm(f => !f); setErr(''); setSuccess(''); }}
              style={{ padding: '6px 14px', borderRadius: 7, border: '1.5px solid #ede9fe', background: showForm ? '#ede9fe' : 'var(--bg-elevated)', color: '#4f46e5', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >{showForm ? 'Скасувати' : '+ Новий промокод'}</button>
        </div>

        {success && <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 13, color: '#16a34a', marginBottom: 12 }}>✓ {success}</div>}

        {showForm && (
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, marginBottom: 16, border: '1.5px solid #ede9fe' }}>
              <div style={{ display: 'grid', gap: 10, marginBottom: 10 }} className="r-two-col-equal">
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Код *</label>
                  <input
                      placeholder="SUMMER20"
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase())}
                      style={inp}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Знижка (%) *</label>
                  <input
                      type="number" min="1" max="100" placeholder="20"
                      value={discount}
                      onChange={e => setDiscount(e.target.value)}
                      style={inp}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Ліміт використань</label>
                  <input
                      type="number" min="1" placeholder="Необмежено"
                      value={limit}
                      onChange={e => setLimit(e.target.value)}
                      style={inp}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Дійсний до</label>
                  <input
                      type="date"
                      value={expires}
                      onChange={e => setExpires(e.target.value)}
                      style={inp}
                  />
                </div>
              </div>
              {err && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{err}</p>}
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 10 }}>
                Промокод буде активований після схвалення адміністратором.
              </p>
              <button
                  onClick={handleCreate}
                  disabled={submitting}
                  style={{ padding: '8px 20px', background: submitting ? 'var(--text-tertiary)' : '#4f46e5', color: 'var(--bg-elevated)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: submitting ? 'default' : 'pointer', fontFamily: 'inherit' }}
              >{submitting ? 'Відправка...' : 'Відправити на схвалення'}</button>
            </div>
        )}

        {loading ? (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Завантаження...</p>
        ) : promos.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Промокодів ще немає</p>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {promos.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1.5px solid #f3f4f6' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, letterSpacing: '0.05em', flex: '0 0 auto' }}>{p.code}</span>
                    <span style={{ fontWeight: 600, color: '#4f46e5', fontSize: 13 }}>−{p.discountPercent}%</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>
                {p.usedCount}/{p.usageLimit ?? '∞'} використань
                      {p.expiresAt ? ` · до ${new Date(p.expiresAt).toLocaleDateString('uk-UA')}` : ''}
              </span>
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: statusBg[p.status], color: statusColor[p.status] }}>
                {statusLabel[p.status]}
              </span>
                    {p.adminComment && p.status === 'rejected' && (
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', maxWidth: 120 }} title={p.adminComment}>💬 {p.adminComment.slice(0, 30)}{p.adminComment.length > 30 ? '...' : ''}</span>
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
  border: '1.5px solid var(--border)', borderRadius: 7,
  fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'var(--bg-elevated)',
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
        <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{value}</p>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{label}</p>
      </div>
  );
}

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
        {data.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{d.count || ''}</span>
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
  page: { minHeight: '100vh', background: 'var(--bg)' },
  centered: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-secondary)' },
  header: { background: 'var(--bg-elevated)', color: 'var(--text)', padding: '36px 32px', borderBottom: '1px solid var(--border)' },
  headerRow: { maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text)' },
  sub: { opacity: 0.7, marginTop: 4, color: 'var(--text-secondary)' },
  btnCreate: { padding: '12px 24px', background: '#4f46e5', color: 'var(--bg-elevated)', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  body: { maxWidth: 1200, margin: '32px auto',  },
  metricsRow: { display: 'grid', gap: 16, marginBottom: 28 },
  metricCard: { background: 'var(--bg-elevated)', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  metricIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  metricValue: { margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text)' },
  metricLabel: { margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary)' },
  twoCol: { display: 'grid', gap: 24 },
  courseList: { background: 'var(--bg-elevated)', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', height: 'fit-content' },
  sectionTitle: { fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' },
  courseRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 6, transition: 'background 0.15s' },
  courseRowActive: { background: '#ede9fe' },
  courseDetail: { background: 'var(--bg-elevated)', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  miniMetrics: { display: 'grid', gap: 12, marginBottom: 20 },
  miniMetric: { background: 'var(--bg)', borderRadius: 10, padding: '12px 16px' },
  progressTrack: { height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#4f46e5', borderRadius: 5, transition: 'width 0.5s' },
  chartTitle: { fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 10px' },
  lessonTable: { border: '1px solid #f3f4f6', borderRadius: 10, overflow: 'hidden' },
  tableHeader: { display: 'flex', padding: '10px 14px', background: 'var(--bg)', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' },
  tableRow: { display: 'flex', padding: '10px 14px', borderTop: '1px solid var(--border)', alignItems: 'center' },
  btnEdit: { padding: '10px 18px', background: '#ede9fe', color: '#4f46e5', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 },
  btnFull: { padding: '10px 18px', background: 'var(--bg-muted)', color: 'var(--text-secondary)', borderRadius: 8, textDecoration: 'none', fontSize: 13 },
  empty: { textAlign: 'center', padding: 80 },
  btnLink: { display: 'inline-block', marginTop: 16, padding: '12px 24px', background: '#4f46e5', color: 'var(--bg-elevated)', borderRadius: 10, textDecoration: 'none', fontWeight: 600 },
};