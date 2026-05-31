import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth, apiFetch } from '../context/AuthContext';

interface Cert {
  id: string;
  verifyCode: string;
  pdfUrl: string;
  issuedAt: string;
  course: { id: string; title: string; author: { name: string } };
}

export function MyCertificatesPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Cert[]>('/certificates/my')
        .then(setCerts)
        .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={s.centered}>Завантаження...</div>;

  return (
      <div style={s.page}>
        <div style={s.header}>
          <h1 style={s.title}>Мої сертифікати</h1>
          <p style={s.sub}>Отримано: {certs.length}</p>
        </div>

        {certs.length === 0 ? (
            <div style={s.empty}>
              <p style={{ fontSize: 48, margin: 0 }}>🎓</p>
              <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>
                Ще немає сертифікатів. Завершуй курси на 100%!
              </p>
              <Link to="/courses" style={s.btnLink}>Перейти до каталогу</Link>
            </div>
        ) : (
            <div style={s.grid}>
              {certs.map((cert) => (
                  <CertCard key={cert.id} cert={cert} />
              ))}
            </div>
        )}
      </div>
  );
}

function CertCard({ cert }: { cert: Cert }) {
  const [claiming, setClaiming] = useState(false);
  const date = new Date(cert.issuedAt).toLocaleDateString('uk-UA', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
      <div style={s.card}>
        <div style={s.cardTop}>
          <span style={{ fontSize: 36 }}>🏆</span>
          <p style={s.cardTopLabel}>Сертифікат</p>
        </div>

        <div style={s.cardBody}>
          <h3 style={s.courseTitle}>{cert.course.title}</h3>
          <p style={s.authorLine}>Викладач: {cert.course.author?.name}</p>
          <p style={s.dateLine}>Видано: {date}</p>

          <div style={s.codeBlock}>
            <span style={s.codeLabel}>Код верифікації</span>
            <span style={s.code}>{cert.verifyCode}</span>
          </div>

          <div style={s.actions}>
            <a href={cert.pdfUrl} target="_blank" rel="noreferrer" style={s.btnDownload}>
              ⬇ Завантажити PDF
            </a>
            <Link to={`/certificates/verify/${cert.verifyCode}`} style={s.btnVerify}>
              Перевірити
            </Link>
          </div>
        </div>
      </div>
  );
}

export function VerifyCertPage() {
  const { code: codeParam } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const [input, setInput]   = useState(codeParam ?? '');
  const [result, setResult] = useState<any>(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const check = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true); setResult(null); setError('');
    try {
      const data = await apiFetch<any>(`/certificates/verify/${code.trim().toUpperCase()}`);
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? 'Сертифікат не знайдено');
    } finally { setLoading(false); }
  };

  // auto-check if code is in URL
  useEffect(() => { if (codeParam) check(codeParam); }, [codeParam]);

  const handleSubmit = () => {
    if (input.trim()) {
      navigate(`/certificates/verify/${input.trim().toUpperCase()}`, { replace: true });
    }
  };

  return (
      <div style={sv.page}>
        <div style={sv.card}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🎓</div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>
              Перевірка сертифікату
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Введіть код верифікації щоб підтвердити автентичність сертифіката
            </p>
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <input
                value={input}
                onChange={e => setInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Наприклад: A1B2C3D4E5F6..."
                style={{
                  flex: 1, padding: '11px 14px', borderRadius: 8,
                  border: '1.5px solid var(--border)', fontSize: '0.875rem',
                  fontFamily: 'monospace', letterSpacing: '0.05em', outline: 'none',
                  background: 'var(--bg)',
                }}
            />
            <button
                onClick={handleSubmit}
                disabled={loading || !input.trim()}
                style={{
                  padding: '11px 20px', borderRadius: 8, border: 'none',
                  background: loading || !input.trim() ? '#d1d5db' : '#4f46e5',
                  color: 'var(--bg-elevated)', fontWeight: 600, fontSize: '0.875rem',
                  cursor: loading || !input.trim() ? 'default' : 'pointer',
                  fontFamily: 'inherit', flexShrink: 0,
                }}
            >{loading ? '...' : 'Перевірити'}</button>
          </div>

          {/* Result */}
          {loading && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Перевірка...
              </div>
          )}

          {error && !loading && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>❌</div>
                <p style={{ color: '#dc2626', fontWeight: 600, margin: '0 0 4px' }}>Сертифікат не знайдено</p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', margin: 0 }}>Перевірте правильність коду</p>
              </div>
          )}

          {result && !loading && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #059669, #047857)', padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>✅</div>
                  <p style={{ color: 'var(--bg-elevated)', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Сертифікат дійсний</p>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  {[
                    { label: 'Студент',      value: result.studentName },
                    { label: 'Курс',         value: result.courseName },
                    { label: 'Дата видачі',  value: new Date(result.issuedAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) },
                    { label: 'Код',          value: result.verifyCode, mono: true },
                  ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #d1fae5' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{row.label}</span>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text)', fontFamily: row.mono ? 'monospace' : 'inherit', letterSpacing: row.mono ? '0.1em' : 'normal' }}>
                          {row.value}
                        </strong>
                      </div>
                  ))}
                  {result.pdfUrl && (
                      <a href={result.pdfUrl} target="_blank" rel="noreferrer" style={{
                        display: 'block', marginTop: 16, padding: '11px', textAlign: 'center',
                        background: '#059669', color: 'var(--bg-elevated)', borderRadius: 8,
                        textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
                      }}>
                        Завантажити PDF
                      </a>
                  )}
                </div>
              </div>
          )}

          {!result && !error && !loading && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 4 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
                  💡 Код верифікації вказаний на самому сертифікаті у форматі <code style={{ background: 'var(--bg-muted)', padding: '1px 6px', borderRadius: 4 }}>XXXXXXXXXXXXXXXXXXXXXXXX</code>
                </p>
              </div>
          )}
        </div>
      </div>
  );
}

const sv: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', background: 'var(--bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '32px 16px',
  },
  card: {
    background: 'var(--bg-elevated)', borderRadius: 20, padding: '40px 36px',
    maxWidth: 500, width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6',
  },
};

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: 'var(--bg)', paddingBottom: 60 },
  header: { background: '#1e1b4b', color: 'var(--bg-elevated)', padding: '48px 32px 32px', textAlign: 'center' },
  title: { fontSize: 28, fontWeight: 700, margin: 0 },
  sub: { opacity: 0.75, marginTop: 8 },
  centered: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-secondary)' },
  empty: { textAlign: 'center', padding: '80px 32px' },
  btnLink: { display: 'inline-block', marginTop: 20, padding: '12px 24px', background: '#4f46e5', color: 'var(--bg-elevated)', borderRadius: 10, textDecoration: 'none', fontWeight: 600 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, maxWidth: 1100, margin: '40px auto', padding: '0 32px' },
  card: { background: 'var(--bg-elevated)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  cardTop: { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '24px', textAlign: 'center', color: 'var(--bg-elevated)' },
  cardTopLabel: { margin: '8px 0 0', fontWeight: 600, opacity: 0.9, fontSize: 14 },
  cardBody: { padding: 24 },
  courseTitle: { fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' },
  authorLine: { fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 4px' },
  dateLine: { fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' },
  codeBlock: { background: 'var(--bg-muted)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', flexDirection: 'column' as const, gap: 4 },
  codeLabel: { fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: 1 },
  code: { fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)', letterSpacing: 2 },
  actions: { display: 'flex', gap: 10 },
  btnDownload: { flex: 1, padding: '10px', background: '#4f46e5', color: 'var(--bg-elevated)', borderRadius: 8, textDecoration: 'none', textAlign: 'center' as const, fontSize: 13, fontWeight: 600 },
  btnVerify: { padding: '10px 16px', background: 'var(--bg-muted)', color: 'var(--text-secondary)', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 500 },
  verifyPage: { minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 },
  verifyCard: { background: 'var(--bg-elevated)', borderRadius: 20, padding: '48px 40px', maxWidth: 480, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  verifyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)', fontSize: 15 },
};