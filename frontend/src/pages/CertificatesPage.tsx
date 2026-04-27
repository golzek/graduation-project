import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL ?? 'http://localhost:3000';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ message: 'Помилка' }));
    throw new Error(e.message);
  }
  return res.json();
}

interface Cert {
  id: string;
  verifyCode: string;
  pdfUrl: string;
  issuedAt: string;
  course: { id: string; title: string; author: { name: string } };
}

// =============================================
//   МОЇ СЕРТИФІКАТИ
// =============================================
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
          <p style={{ color: '#6b7280', marginTop: 12 }}>
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
      {/* Декоративна шапка */}
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

// =============================================
//   ПУБЛІЧНА ВЕРИФІКАЦІЯ
// =============================================
export function VerifyCertPage() {
  const { code } = useParams<{ code: string }>();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    apiFetch(`/certificates/verify/${code}`)
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <div style={s.centered}>Перевірка...</div>;

  return (
    <div style={s.verifyPage}>
      <div style={s.verifyCard}>
        {error ? (
          <>
            <div style={{ fontSize: 56, textAlign: 'center' }}>❌</div>
            <h2 style={{ color: '#dc2626', textAlign: 'center' }}>Сертифікат не знайдено</h2>
            <p style={{ color: '#6b7280', textAlign: 'center' }}>{error}</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 56, textAlign: 'center' }}>✅</div>
            <h2 style={{ color: '#065f46', textAlign: 'center', marginBottom: 24 }}>
              Сертифікат дійсний
            </h2>
            <div style={s.verifyRow}><span>Студент</span><strong>{result.studentName}</strong></div>
            <div style={s.verifyRow}><span>Курс</span><strong>{result.courseName}</strong></div>
            <div style={s.verifyRow}>
              <span>Дата видачі</span>
              <strong>
                {new Date(result.issuedAt).toLocaleDateString('uk-UA', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </strong>
            </div>
            <div style={s.verifyRow}><span>Код</span><code style={s.code}>{result.verifyCode}</code></div>
          </>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f9fafb', paddingBottom: 60 },
  header: { background: '#1e1b4b', color: '#fff', padding: '48px 32px 32px', textAlign: 'center' },
  title: { fontSize: 28, fontWeight: 700, margin: 0 },
  sub: { opacity: 0.75, marginTop: 8 },
  centered: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#6b7280' },
  empty: { textAlign: 'center', padding: '80px 32px' },
  btnLink: { display: 'inline-block', marginTop: 20, padding: '12px 24px', background: '#4f46e5', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, maxWidth: 1100, margin: '40px auto', padding: '0 32px' },
  card: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  cardTop: { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '24px', textAlign: 'center', color: '#fff' },
  cardTopLabel: { margin: '8px 0 0', fontWeight: 600, opacity: 0.9, fontSize: 14 },
  cardBody: { padding: 24 },
  courseTitle: { fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: '#111827' },
  authorLine: { fontSize: 13, color: '#6b7280', margin: '0 0 4px' },
  dateLine: { fontSize: 13, color: '#6b7280', margin: '0 0 16px' },
  codeBlock: { background: '#f3f4f6', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', flexDirection: 'column' as const, gap: 4 },
  codeLabel: { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: 1 },
  code: { fontFamily: 'monospace', fontSize: 13, color: '#374151', letterSpacing: 2 },
  actions: { display: 'flex', gap: 10 },
  btnDownload: { flex: 1, padding: '10px', background: '#4f46e5', color: '#fff', borderRadius: 8, textDecoration: 'none', textAlign: 'center' as const, fontSize: 13, fontWeight: 600 },
  btnVerify: { padding: '10px 16px', background: '#f3f4f6', color: '#374151', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 500 },
  verifyPage: { minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 },
  verifyCard: { background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 480, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  verifyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6', fontSize: 15 },
};
