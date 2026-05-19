import React, { useState, useEffect } from 'react';
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

const MAX_PRICE = 5000;

export function CatalogPage() {
  const [search, setSearch]       = useState('');
  const [level, setLevel]         = useState('');
  const [category, setCategory]   = useState('');
  const [maxPrice, setMaxPrice]   = useState<number>(MAX_PRICE);
  const [freeOnly, setFreeOnly]   = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [page, setPage]           = useState(1);
  const { isAuthenticated } = useAuth();

  const resetFilters = () => {
    setLevel(''); setCategory(''); setMaxPrice(MAX_PRICE);
    setFreeOnly(false); setMinRating(0); setPage(1);
  };

  const hasActiveFilters =
      !!level || (!!category && category !== 'Всі') ||
      maxPrice < MAX_PRICE || freeOnly || minRating > 0;

  const { courses, total, totalPages, loading } = useCourses({
    search:    search    || undefined,
    level:     level     || undefined,
    category:  category === 'Всі' ? undefined : category || undefined,
    minPrice:  freeOnly  ? 0 : undefined,
    maxPrice:  freeOnly  ? 0 : maxPrice < MAX_PRICE ? maxPrice : undefined,
    minRating: minRating > 0 ? minRating : undefined,
    page, limit: 12,
  });

  const { progressMap } = useMyEnrollmentsProgress();


  const [prevIsEmpty, setPrevIsEmpty] = useState(false);

  useEffect(() => {
    if (!loading) setPrevIsEmpty(courses.length === 0);
  }, [loading, courses]);

  const shouldFade = loading && !(prevIsEmpty && courses.length === 0);

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
              <p style={s.filterLabel}>Категорія</p>
              {CATEGORIES.map(c => (
                  <button key={c}
                          style={{ ...s.filterBtn, ...((category === c || (c === 'Всі' && !category)) ? s.filterBtnActive : {}) }}
                          onClick={() => { setCategory(c === 'Всі' ? '' : c); setPage(1); }}>
                    {c}
                  </button>
              ))}
            </div>

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
              <p style={s.filterLabel}>Ціна</p>
              <label style={s.checkRow}>
                <input
                    type="checkbox"
                    checked={freeOnly}
                    onChange={e => { setFreeOnly(e.target.checked); setPage(1); }}
                    style={{ marginRight: 8, accentColor: '#0a0a0a' }}
                />
                <span style={s.checkLabel}>Тільки безкоштовні</span>
              </label>
              {!freeOnly && (
                  <div style={{ marginTop: 10 }}>
                    <div style={s.priceRow}>
                      <span style={s.priceVal}>0 ₴</span>
                      <span style={s.priceVal}>{maxPrice.toLocaleString()} ₴</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={MAX_PRICE}
                        step={100}
                        value={maxPrice}
                        onChange={e => { setMaxPrice(Number(e.target.value)); setPage(1); }}
                        style={s.range}
                    />
                    <p style={s.rangeHint}>
                      {maxPrice === MAX_PRICE ? 'Будь-яка ціна' : `до ${maxPrice.toLocaleString()} ₴`}
                    </p>
                  </div>
              )}
            </div>

            <div style={s.filterGroup}>
              <p style={s.filterLabel}>Мінімальний рейтинг</p>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1, 2, 3, 4, 5].map(star => (
                    <button key={star}
                            title={`від ${star} ${star === 1 ? 'зірки' : 'зірок'}`}
                            onClick={() => { setMinRating(minRating === star ? 0 : star); setPage(1); }}
                            style={{
                              ...s.starBtn,
                              color: star <= minRating ? '#f59e0b' : '#d1d5db',
                              transform: star <= minRating ? 'scale(1.15)' : 'scale(1)',
                            }}>
                      ★
                    </button>
                ))}
              </div>
              {minRating > 0 ? (
                  <p style={s.rangeHint}>від {minRating} {minRating === 1 ? 'зірки' : 'зірок'}</p>
              ) : (
                  <p style={s.rangeHint}>будь-який рейтинг</p>
              )}
            </div>

            {hasActiveFilters && (
                <button style={s.resetBtn} onClick={resetFilters}>
                  ✕ Скинути фільтри
                </button>
            )}
          </aside>

          <main style={s.main}>
            <div style={{
              opacity: shouldFade ? 0 : 1,
              transition: shouldFade ? 'opacity 0.25s ease' : 'none',
              minHeight: 200,
            }}>
              {!loading && courses.length === 0 && (
                  <div style={s.empty}>
                    <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔍</div>
                    Нічого не знайдено
                    {hasActiveFilters && (
                        <div>
                          <button
                              style={{ ...s.resetBtn, display: 'inline-block', marginTop: 16, width: 'auto', padding: '7px 20px' }}
                              onClick={resetFilters}
                          >
                            Скинути фільтри
                          </button>
                        </div>
                    )}
                  </div>
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

function StarRating({ value }: { value: number | null }) {
  if (!value) return null;
  const rounded = Math.round(value * 2) / 2;
  return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 6 }}>
        {[1, 2, 3, 4, 5].map(star => (
            <span key={star} style={{
              fontSize: '0.75rem',
              color: star <= Math.floor(rounded) ? '#f59e0b'
                  : star - 0.5 <= rounded ? '#fbbf24' : '#d1d5db',
            }}>★</span>
        ))}
        <span style={{ fontSize: '0.7rem', color: '#9a9a9a', marginLeft: 3 }}>
        {Number(value).toFixed(1)}
      </span>
      </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const done = percent === 100;
  return (
      <div style={{ marginTop: 10 }}>
        <div style={{ height: 4, borderRadius: 99, background: '#f0f0f0', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${percent}%`, borderRadius: 99,
            background: done ? '#16a34a' : '#3b82f6',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <p style={{ fontSize: '0.7rem', color: done ? '#16a34a' : '#3b82f6', fontWeight: 500, marginTop: 4 }}>
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
      <Link to={`/courses/${course.id}`} style={{ ...s.card, ...(isEnrolled ? s.cardEnrolled : {}) }}>
        <div style={{ ...s.thumb, background: isEnrolled ? '#eff6ff' : '#f5f5f5' }}>
          {isEnrolled && (
              <div style={s.enrolledBadge}>
                {progress === 100 ? '🏆 Завершено' : '▶ Продовжити'}
              </div>
          )}
          <span style={{ ...s.thumbLetter, color: isEnrolled ? '#bfdbfe' : '#d6d6d6' }}>
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

          <StarRating value={course.rating} />
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
  aside: { width: 200, flexShrink: 0 },
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
  checkRow: { display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' as const },
  checkLabel: { fontSize: '0.875rem', color: '#5a5a5a' },
  priceRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  priceVal: { fontSize: '0.7rem', color: '#9a9a9a' },
  range: { width: '100%', accentColor: '#0a0a0a', cursor: 'pointer' },
  rangeHint: { fontSize: '0.72rem', color: '#3b82f6', marginTop: 4, fontWeight: 500, margin: '4px 0 0' },
  starBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '1.3rem', padding: '2px 1px', lineHeight: 1,
    transition: 'transform 0.12s, color 0.12s',
  },
  resetBtn: {
    display: 'block', width: '100%',
    padding: '7px 10px', borderRadius: 6,
    border: '1.5px solid #ebebeb', background: '#fff',
    fontSize: '0.8rem', color: '#5a5a5a', cursor: 'pointer',
    textAlign: 'center' as const,
  },
  main:  { flex: 1, minHeight: 600 },
  grid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
  empty:  { color: '#9a9a9a', padding: 60, textAlign: 'center' as const, fontSize: '0.9rem' },
  card: {
    display: 'block', background: '#fff',
    border: '1.5px solid #ebebeb', borderRadius: 12,
    overflow: 'hidden', color: 'inherit',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    textDecoration: 'none',
  },
  cardEnrolled: { borderColor: '#bfdbfe' },
  thumb: {
    aspectRatio: '16/9',
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
  thumbLetter: { fontSize: '2.5rem', fontWeight: 600 },
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