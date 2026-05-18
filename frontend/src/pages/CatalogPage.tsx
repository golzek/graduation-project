import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCourses, useMyEnrollmentsProgress, Course } from '../hooks/useCourses';
import { useAuth } from '../context/AuthContext';

const LEVELS = [
  { value: '', label: 'Всі' },
  { value: 'beginner', label: 'Початковий' },
  { value: 'intermediate', label: 'Середній' },
  { value: 'advanced', label: 'Просунутий' },
];
const CATEGORIES = ['Всі', 'Frontend', 'Backend', 'Дизайн', 'Аналітика', 'DevOps'];

export function CatalogPage() {
  const [search, setSearch]     = useState('');
  const [level, setLevel]       = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage]         = useState(1);
  const { isAuthenticated } = useAuth();

  const { courses, total, totalPages, loading } = useCourses({
    search: search || undefined,
    level:  level  || undefined,
    category: category === 'Всі' ? undefined : category || undefined,
    page, limit: 12,
  });

  const { progressMap } = useMyEnrollmentsProgress();

  return (
      <div style={s.page}>
        <div style={s.hero}>
          <div style={s.heroInner}>
            <h1 style={s.heroTitle}>Каталог курсів</h1>
            <p style={s.heroSub}>{total} курсів доступно</p>
            <input
                style={s.search}
                placeholder="Пошук курсів..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div style={s.body}>
          <aside style={s.aside}>
            <div style={s.filterGroup}>
              <p style={s.filterLabel}>Рівень</p>
              {LEVELS.map(l => (
                  <button key={l.value}
                          style={{ ...s.filterBtn, ...(level === l.value ? s.filterBtnActive : {}) }}
                          onClick={() => { setLevel(l.value); setPage(1); }}>
                    {l.label}
                  </button>
              ))}
            </div>
            <div style={s.filterGroup}>
              <p style={s.filterLabel}>Категорія</p>
              {CATEGORIES.map(c => (
                  <button key={c}
                          style={{ ...s.filterBtn, ...((category === c || (c === 'Всі' && !category)) ? s.filterBtnActive : {}) }}
                          onClick={() => { setCategory(c === 'Всі' ? '' : c); setPage(1); }}>
                    {c}
                  </button>
              ))}
            </div>
          </aside>

          <main style={s.main}>
            {loading && <div style={s.loader}>Завантаження...</div>}
            {!loading && courses.length === 0 && (
                <div style={s.empty}>Нічого не знайдено</div>
            )}
            <div style={s.grid}>
              {courses.map(c => (
                  <CourseCard
                      key={c.id}
                      course={c}
                      progress={isAuthenticated ? progressMap[c.id] : undefined}
                  />
              ))}
            </div>

            {totalPages > 1 && (
                <div style={s.pagination}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p}
                              style={{ ...s.pageBtn, ...(p === page ? s.pageBtnActive : {}) }}
                              onClick={() => setPage(p)}>{p}</button>
                  ))}
                </div>
            )}
          </main>
        </div>
      </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const done = percent === 100;
  return (
      <div style={{ marginTop: 10 }}>
        <div style={{
          height: 4, borderRadius: 99,
          background: '#f0f0f0',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${percent}%`,
            borderRadius: 99,
            background: done ? '#16a34a' : '#3b82f6',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <p style={{
          fontSize: '0.7rem',
          color: done ? '#16a34a' : '#3b82f6',
          fontWeight: 500,
          marginTop: 4,
        }}>
          {done ? '✓ Пройдено повністю' : `Пройдено ${percent}%`}
        </p>
      </div>
  );
}

function CourseCard({ course, progress }: { course: Course; progress?: number }) {
  const lvl: Record<string, string> = {
    beginner: 'Початковий', intermediate: 'Середній', advanced: 'Просунутий'
  };
  const isEnrolled = progress !== undefined;

  return (
      <Link to={`/courses/${course.id}`} style={{
        ...s.card,
        ...(isEnrolled ? s.cardEnrolled : {}),
      }}>
        <div style={{
          ...s.thumb,
          background: isEnrolled ? '#eff6ff' : '#f5f5f5',
        }}>
          {isEnrolled && (
              <div style={s.enrolledBadge}>
                {progress === 100 ? '🏆 Завершено' : '▶ Продовжити'}
              </div>
          )}
          <span style={{
            ...s.thumbLetter,
            color: isEnrolled ? '#bfdbfe' : '#d6d6d6',
          }}>
          {course.title[0]}
        </span>
        </div>

        <div style={s.cardBody}>
          <div style={s.cardMeta}>
            <span style={s.badge}>{lvl[course.level]}</span>
            {course.category && <span style={s.cat}>{course.category}</span>}
          </div>
          <h3 style={s.cardTitle}>{course.title}</h3>
          <p style={s.cardDesc}>{course.description.slice(0, 80)}...</p>

          {isEnrolled && <ProgressBar percent={progress!} />}

          <div style={{ ...s.cardFooter, marginTop: isEnrolled ? 8 : 12 }}>
            <span style={s.author}>{course.author?.name}</span>
            {!isEnrolled && (
                <span style={s.price}>
              {Number(course.price) === 0 ? 'Безкоштовно' : `${course.price} ₴`}
            </span>
            )}
          </div>
        </div>
      </Link>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:   { minHeight: '100vh', background: '#fafafa' },
  hero:   { borderBottom: '1px solid #ebebeb', padding: '48px 0 32px' },
  heroInner: { maxWidth: 1160, margin: '0 auto', padding: '0 32px' },
  heroTitle: { fontSize: '1.8rem', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 4 },
  heroSub:   { color: '#9a9a9a', fontSize: '0.875rem', marginBottom: 20 },
  search: {
    width: '100%', maxWidth: 480,
    padding: '10px 16px', borderRadius: 8,
    border: '1.5px solid #ebebeb', background: '#fff',
    fontSize: '0.9rem', outline: 'none',
  },
  body:  { maxWidth: 1160, margin: '32px auto', padding: '0 32px', display: 'flex', gap: 32 },
  aside: { width: 180, flexShrink: 0 },
  filterGroup: { marginBottom: 28 },
  filterLabel: {
    fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase' as const,
    letterSpacing: '0.07em', color: '#9a9a9a', marginBottom: 8,
  },
  filterBtn: {
    display: 'block', width: '100%', textAlign: 'left' as const,
    padding: '6px 10px', borderRadius: 6, border: 'none',
    background: 'transparent', fontSize: '0.875rem', color: '#5a5a5a',
    cursor: 'pointer', marginBottom: 2,
  },
  filterBtnActive: { background: '#0a0a0a', color: '#fafafa' },
  main:  { flex: 1 },
  grid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
  loader: { color: '#9a9a9a', padding: 40, textAlign: 'center' as const },
  empty:  { color: '#9a9a9a', padding: 60, textAlign: 'center' as const, fontSize: '0.9rem' },
  card: {
    display: 'block', background: '#fff',
    border: '1.5px solid #ebebeb', borderRadius: 12,
    overflow: 'hidden', color: 'inherit',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    textDecoration: 'none',
  },
  cardEnrolled: {
    borderColor: '#bfdbfe',
  },
  thumb: {
    height: 140, background: '#f5f5f5',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative' as const,
  },
  enrolledBadge: {
    position: 'absolute' as const, top: 10, left: 10,
    background: '#3b82f6', color: '#fff',
    fontSize: '0.68rem', fontWeight: 600,
    padding: '3px 8px', borderRadius: 99,
    letterSpacing: '0.02em',
  },
  thumbLetter: { fontSize: '2.5rem', fontWeight: 600, color: '#d6d6d6' },
  cardBody: { padding: '14px 16px' },
  cardMeta: { display: 'flex', gap: 6, marginBottom: 8 },
  badge: {
    fontSize: '0.7rem', fontWeight: 500, padding: '2px 8px',
    borderRadius: 99, border: '1px solid #ebebeb', color: '#5a5a5a',
    textTransform: 'uppercase' as const, letterSpacing: '0.04em',
  },
  cat: { fontSize: '0.7rem', color: '#9a9a9a', padding: '2px 8px' },
  cardTitle: { fontSize: '0.95rem', fontWeight: 600, marginBottom: 6, lineHeight: 1.4, letterSpacing: '-0.01em' },
  cardDesc:  { fontSize: '0.8rem', color: '#9a9a9a', lineHeight: 1.5, marginBottom: 0 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontSize: '0.75rem', color: '#9a9a9a' },
  price:  { fontSize: '0.9rem', fontWeight: 600, color: '#0a0a0a' },
  pagination: { display: 'flex', gap: 6, justifyContent: 'center', marginTop: 32 },
  pageBtn: {
    width: 36, height: 36, borderRadius: 6,
    border: '1.5px solid #ebebeb', background: '#fff',
    fontSize: '0.875rem', cursor: 'pointer',
  },
  pageBtnActive: { background: '#0a0a0a', color: '#fafafa', borderColor: '#0a0a0a' },
};