import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCourses, useMyEnrollmentsProgress, Course } from '../hooks/useCourses';
import { useAuth } from '../context/AuthContext';
import { WishlistButton } from '../components/WishlistButton';

const LEVELS = [
  { value: '', label: 'Всі рівні' },
  { value: 'beginner', label: 'Початковий' },
  { value: 'intermediate', label: 'Середній' },
  { value: 'advanced', label: 'Просунутий' },
];

const SORT_OPTIONS = [
  { value: 'newest',  label: 'Нові спочатку' },
  { value: 'rating',  label: 'За рейтингом' },
  { value: 'price_asc',  label: 'Ціна ↑' },
  { value: 'price_desc', label: 'Ціна ↓' },
  { value: 'free',    label: 'Безкоштовні' },
];

const MAX_PRICE = 5000;

const PALETTE: Record<string, [string, string]> = {
  A: ['#667eea','#764ba2'], B: ['#f093fb','#f5576c'], C: ['#4facfe','#00f2fe'],
  D: ['#43e97b','#38f9d7'], E: ['#fa709a','#fee140'], F: ['#a18cd1','#fbc2eb'],
  G: ['#fda085','#f6d365'], H: ['#96fbc4','#f9f586'], I: ['#f77062','#fe5196'],
  J: ['#c3cfe2','#c3cfe2'], K: ['#e0c3fc','#8ec5fc'], L: ['#fddb92','#d1fdff'],
  M: ['#a1c4fd','#c2e9fb'], N: ['#fccb90','#d57eeb'], O: ['#a8edea','#fed6e3'],
  P: ['#d4fc79','#96e6a1'], Q: ['#f5f7fa','#c3cfe2'], R: ['#ffecd2','#fcb69f'],
  S: ['#a18cd1','#fbc2eb'], T: ['#ff9a9e','#fecfef'], U: ['#667eea','#764ba2'],
  V: ['#f093fb','#f5576c'], W: ['#4facfe','#00f2fe'], X: ['#43e97b','#38f9d7'],
  Y: ['#fa709a','#fee140'], Z: ['#a18cd1','#fbc2eb'],
};

function getGradient(title: string): string {
  const letter = (title[0] ?? 'A').toUpperCase();
  const [a, b] = PALETTE[letter] ?? ['#667eea', '#764ba2'];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}

export function CatalogPage() {
  const [search, setSearch]       = useState('');
  const [level, setLevel]         = useState('');
  const [category, setCategory]   = useState('');
  const [maxPrice, setMaxPrice]   = useState<number>(MAX_PRICE);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort]           = useState('newest');
  const [page, setPage]           = useState(1);
  const [view, setView]           = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const resetFilters = () => {
    setLevel(''); setCategory(''); setMaxPrice(MAX_PRICE);
    setMinRating(0); setSort('newest'); setPage(1);
  };

  const isFreeSort = sort === 'free';
  const hasActiveFilters = !!level || (!!category && category !== 'Всі') ||
      maxPrice < MAX_PRICE || minRating > 0 || isFreeSort;

  const { courses: rawCourses, total, totalPages, loading } = useCourses({
    search:    search    || undefined,
    level:     level     || undefined,
    category:  category === 'Всі' ? undefined : category || undefined,
    minPrice:  isFreeSort ? 0 : undefined,
    maxPrice:  isFreeSort ? 0 : maxPrice < MAX_PRICE ? maxPrice : undefined,
    minRating: minRating > 0 ? minRating : undefined,
    page, limit: 12,
  });

  const courses = useMemo(() => {
    const c = [...rawCourses];
    if (sort === 'rating')     c.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    if (sort === 'price_asc')  c.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price_desc') c.sort((a, b) => Number(b.price) - Number(a.price));
    return c;
  }, [rawCourses, sort]);

  const dynamicCategories = useMemo(() => {
    const cats = Array.from(new Set(rawCourses.map(c => c.category).filter(Boolean)));
    return ['Всі', ...cats];
  }, [rawCourses]);

  const { progressMap } = useMyEnrollmentsProgress();

  const [prevIsEmpty, setPrevIsEmpty] = useState(false);
  useEffect(() => {
    if (!loading) setPrevIsEmpty(courses.length === 0);
  }, [loading, courses]);
  const shouldFade = loading && !(prevIsEmpty && courses.length === 0);

  const totalLessons = (c: Course) =>
      c.modules?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ?? 0;

  return (
      <div style={s.page}>
        <div style={s.hero}>
          <div style={s.heroInner} className="r-container-wide">
            <div style={s.heroText}>
              <h1 style={s.heroTitle}>Каталог курсів</h1>
              <p style={s.heroSub}>
                {loading ? '...' : `${total} курс${total === 1 ? '' : total < 5 ? 'и' : 'ів'} доступно`}
              </p>
            </div>
            <div style={s.searchWrap}>
              <span style={s.searchIcon}>🔍</span>
              <input
                  style={s.search}
                  placeholder="Пошук за назвою або темою..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
              {search && (
                  <button style={s.searchClear} onClick={() => { setSearch(''); setPage(1); }}>✕</button>
              )}
            </div>
          </div>
        </div>

        <div style={s.body} className="r-sidebar-layout">
          <aside style={s.aside} className="r-sidebar r-catalog-aside">
            <div style={s.asideHeader}>
              <span style={s.asideTitle}>Фільтри</span>
              {hasActiveFilters && (
                  <button style={s.resetBtn} onClick={resetFilters}>Скинути</button>
              )}
            </div>

            <div style={s.filterGroup}>
              <p style={s.filterLabel}>Категорія</p>
              <div style={s.filterList}>
                {dynamicCategories.map(c => (
                    <button key={c}
                            style={{ ...s.filterChip, ...((category === c || (c === 'Всі' && !category)) ? s.filterChipActive : {}) }}
                            onClick={() => { setCategory(c === 'Всі' ? '' : c); setPage(1); }}>
                      {c}
                    </button>
                ))}
              </div>
            </div>

            <div style={s.filterGroup}>
              <p style={s.filterLabel}>Рівень</p>
              {LEVELS.map(l => (
                  <button key={l.value}
                          style={{ ...s.filterRow, ...(level === l.value ? s.filterRowActive : {}) }}
                          onClick={() => { setLevel(l.value); setPage(1); }}>
                    <span style={s.filterDot(level === l.value)} />
                    {l.label}
                  </button>
              ))}
            </div>

            <div style={s.filterGroup}>
              <p style={s.filterLabel}>Максимальна ціна</p>
              <div style={s.priceDisplay}>
                {maxPrice >= MAX_PRICE ? (
                    <span style={s.priceAny}>Будь-яка</span>
                ) : (
                    <span style={s.priceValue}>до {maxPrice.toLocaleString()} ₴</span>
                )}
              </div>
              <input type="range" min={0} max={MAX_PRICE} step={100} value={maxPrice}
                     onChange={e => { setMaxPrice(Number(e.target.value)); setPage(1); }}
                     style={s.range} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={s.rangeLabel}>0 ₴</span>
                <span style={s.rangeLabel}>{MAX_PRICE.toLocaleString()} ₴</span>
              </div>
            </div>

            <div style={s.filterGroup}>
              <p style={s.filterLabel}>Мінімальний рейтинг</p>
              <div style={{ display: 'flex', gap: 3 }}>
                {[1,2,3,4,5].map(star => (
                    <button key={star}
                            onClick={() => { setMinRating(minRating === star ? 0 : star); setPage(1); }}
                            style={{ ...s.starBtn, color: star <= minRating ? '#f59e0b' : 'var(--border-strong)' }}>
                      ★
                    </button>
                ))}
              </div>
              {minRating > 0 && (
                  <p style={s.ratingHint}>від {minRating}★</p>
              )}
            </div>
          </aside>

          {}
          <div className={`r-filter-drawer-overlay${mobileFilterOpen ? ' open' : ''}`}
               onClick={() => setMobileFilterOpen(false)}>
            <div className="r-filter-drawer" onClick={e => e.stopPropagation()}>
              <div className="r-filter-drawer-handle" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)' }}>Фільтри</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {hasActiveFilters && (
                      <button style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 6, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }} onClick={resetFilters}>Скинути</button>
                  )}
                  <button style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 6, background: 'var(--accent)', color: 'var(--accent-inv)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }} onClick={() => setMobileFilterOpen(false)}>Готово</button>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <p style={s.filterLabel}>Категорія</p>
                <div style={s.filterList}>
                  {dynamicCategories.map(cat => (
                      <button key={cat}
                              style={{ ...s.filterChip, ...((category === cat || (cat === 'Всі' && !category)) ? s.filterChipActive : {}) }}
                              onClick={() => { setCategory(cat === 'Всі' ? '' : cat); setPage(1); }}>
                        {cat}
                      </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <p style={s.filterLabel}>Рівень</p>
                {LEVELS.map(l => (
                    <button key={l.value}
                            style={{ ...s.filterRow, ...(level === l.value ? s.filterRowActive : {}) }}
                            onClick={() => { setLevel(l.value); setPage(1); }}>
                      <span style={s.filterDot(level === l.value)} />
                      {l.label}
                    </button>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <p style={s.filterLabel}>Максимальна ціна</p>
                <div style={s.priceDisplay}>
                  {maxPrice >= MAX_PRICE ? (
                      <span style={s.priceAny}>Будь-яка</span>
                  ) : (
                      <span style={s.priceValue}>до {maxPrice.toLocaleString()} ₴</span>
                  )}
                </div>
                <input type="range" min={0} max={MAX_PRICE} step={100} value={maxPrice}
                       onChange={e => { setMaxPrice(Number(e.target.value)); setPage(1); }}
                       style={{ ...s.range, width: '100%' }} />
              </div>

              <div>
                <p style={s.filterLabel}>Мінімальний рейтинг</p>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1,2,3,4,5].map(star => (
                      <button key={star}
                              onClick={() => { setMinRating(minRating === star ? 0 : star); setPage(1); }}
                              style={{ ...s.starBtn, color: star <= minRating ? '#f59e0b' : 'var(--border-strong)', fontSize: '1.4rem' }}>
                        ★
                      </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <main style={s.main} className="r-sidebar-main">
            <div style={s.toolbar} className="catalog-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={s.toolbarCount}>
                  {loading ? 'Завантаження...' : `${total} результат${total === 1 ? '' : total < 5 ? 'и' : 'ів'}`}
                </p>
                <button
                    className="r-mobile-filter-btn"
                    onClick={() => setMobileFilterOpen(true)}
                >
                  {hasActiveFilters ? `⚙ Фільтри (!)` : `⚙ Фільтри`}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={sort} onChange={e => setSort(e.target.value)} style={s.sortSelect}>
                  {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <div style={s.viewToggle}>
                  <button style={{ ...s.viewBtn, ...(view === 'grid' ? s.viewBtnActive : {}) }} onClick={() => setView('grid')} title="Сітка">⊞</button>
                  <button style={{ ...s.viewBtn, ...(view === 'list' ? s.viewBtnActive : {}) }} onClick={() => setView('list')} title="Список">☰</button>
                </div>
              </div>
            </div>

            <div style={{ opacity: shouldFade ? 0 : 1, transition: 'opacity 0.2s', minHeight: 200 }}>
              {!loading && courses.length === 0 ? (
                  <div style={s.empty}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
                    <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 8 }}>Нічого не знайдено</p>
                    <p style={s.emptyHint}>
                      Спробуйте змінити фільтри або пошуковий запит
                    </p>
                    {hasActiveFilters && (
                        <button style={s.emptyResetBtn} onClick={resetFilters}>Скинути всі фільтри</button>
                    )}
                  </div>
              ) : (
                  <div style={view === 'grid' ? s.grid : s.listLayout} className={view === 'grid' ? 'r-catalog-grid' : ''}>
                    {(loading && courses.length === 0 ? Array(6).fill(null) : courses).map((c, i) =>
                        c === null ? (
                            <SkeletonCard key={i} />
                        ) : view === 'grid' ? (
                            <CourseCard key={c.id} course={c}
                                        progress={isAuthenticated ? progressMap[c.id] : undefined}
                                        lessonsCount={totalLessons(c)}
                                        isAuthenticated={isAuthenticated}
                            />
                        ) : (
                            <CourseListRow key={c.id} course={c}
                                           progress={isAuthenticated ? progressMap[c.id] : undefined}
                                           lessonsCount={totalLessons(c)}
                                           isAuthenticated={isAuthenticated}
                            />
                        )
                    )}
                  </div>
              )}
            </div>

            {totalPages > 1 && (
                <div style={s.pagination}>
                  <button style={{ ...s.pageBtn, opacity: page === 1 ? 0.3 : 1 }}
                          disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                        if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                        acc.push(p); return acc;
                      }, [])
                      .map((p, i) => p === '...'
                          ? <span key={`dots-${i}`} style={s.pageDots}>…</span>
                          : <button key={p} style={{ ...s.pageBtn, ...(p === page ? s.pageBtnActive : {}) }}
                                    onClick={() => setPage(p as number)}>{p}</button>
                      )}
                  <button style={{ ...s.pageBtn, opacity: page === totalPages ? 0.3 : 1 }}
                          disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>→</button>
                </div>
            )}
          </main>
        </div>
      </div>
  );
}

function SkeletonCard() {
  return (
      <div style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ aspectRatio: '16/9', background: 'var(--bg-muted)', }} />
        <div style={{ padding: '14px 16px' }}>
          {[80, 60, 100, 50].map((w, i) => (
              <div key={i} style={{ height: i === 2 ? 14 : 10, width: `${w}%`, background: 'var(--bg-muted)', borderRadius: 4, marginBottom: 8 }} />
          ))}
        </div>
      </div>
  );
}

function CourseCard({ course, progress, lessonsCount, isAuthenticated }: {
  course: Course; progress?: number; lessonsCount: number; isAuthenticated: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const lvl: Record<string, string> = { beginner: 'Початковий', intermediate: 'Середній', advanced: 'Просунутий' };
  const lvlColor: Record<string, string> = { beginner: '#16a34a', intermediate: '#2563eb', advanced: '#7c3aed' };
  const isEnrolled = progress !== undefined;
  const isDone = progress === 100;

  return (
      <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            background: 'var(--bg-elevated)', borderRadius: 14, overflow: 'hidden',
            border: `1.5px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
            boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
            transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.15s',
            transform: hovered ? 'translateY(-3px)' : 'none',
            display: 'flex', flexDirection: 'column' as const,
            position: 'relative' as const,
          }}
      >
        <Link to={`/courses/${course.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            aspectRatio: '16/9', position: 'relative' as const, overflow: 'hidden',
            background: course.thumbnailUrl ? undefined : getGradient(course.title),
          }}>
            {course.thumbnailUrl ? (
                <img src={course.thumbnailUrl} alt={course.title}
                     style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '-0.05em' }}>
                {course.title[0]}
              </span>
                </div>
            )}

            {isEnrolled && (
                <div style={{
                  position: 'absolute' as const, inset: 0,
                  background: 'rgba(0,0,0,0.32)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    background: isDone ? '#16a34a' : 'rgba(255,255,255,0.95)',
                    color: isDone ? 'var(--accent-inv)' : 'var(--text)',
                    borderRadius: 99, padding: '6px 16px',
                    fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em',
                  }}>
                    {isDone ? '🏆 Завершено' : `▶ Продовжити · ${progress}%`}
                  </div>
                </div>
            )}

            <div style={{
              position: 'absolute' as const, top: 8, left: 8,
              background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
              borderRadius: 6, padding: '2px 8px',
              fontSize: '0.65rem', fontWeight: 700,
              color: lvlColor[course.level] ?? 'var(--text-secondary)',
              textTransform: 'uppercase' as const, letterSpacing: '0.06em',
            }}>
              {lvl[course.level]}
            </div>

            {Number(course.price) === 0 && !isEnrolled && (
                <div style={{
                  position: 'absolute' as const, top: 8, right: 8,
                  background: '#16a34a', color: 'var(--bg-elevated)',
                  borderRadius: 6, padding: '2px 8px',
                  fontSize: '0.65rem', fontWeight: 700,
                  letterSpacing: '0.04em',
                }}>FREE</div>
            )}
          </div>

          <div style={{ padding: '14px 16px 10px', flex: 1 }}>
            {course.category && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
              {course.category}
            </span>
            )}
            <h3 style={{
              fontSize: '0.92rem', fontWeight: 700,
              margin: '4px 0 6px', lineHeight: 1.35,
              letterSpacing: '-0.01em', color: 'var(--text)',
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
            }}>{course.title}</h3>
            <p style={{
              fontSize: '0.78rem', color: 'var(--text-tertiary)', lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
              marginBottom: 8,
            }}>{course.description}</p>

            <StarRating value={course.rating} />

            {isEnrolled && progress !== undefined && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 3, background: 'var(--bg-muted)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: isDone ? '#16a34a' : '#3b82f6', borderRadius: 99, transition: 'width 0.4s' }} />
                  </div>
                </div>
            )}
          </div>
        </Link>

        <div style={{ padding: '0 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            {course.author?.name}
          </span>
            {lessonsCount > 0 && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginLeft: 8 }}>
              · {lessonsCount} урок{lessonsCount === 1 ? '' : lessonsCount < 5 ? 'и' : 'ів'}
            </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isAuthenticated && !isEnrolled && (
                <WishlistButton courseId={course.id} variant="icon" />
            )}
            {!isEnrolled && (
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
              {Number(course.price) === 0 ? 'Безкоштовно' : `${Number(course.price).toLocaleString()} ₴`}
            </span>
            )}
          </div>
        </div>
      </div>
  );
}

function CourseListRow({ course, progress, lessonsCount, isAuthenticated }: {
  course: Course; progress?: number; lessonsCount: number; isAuthenticated: boolean;
}) {
  const lvl: Record<string, string> = { beginner: 'Початковий', intermediate: 'Середній', advanced: 'Просунутий' };
  const isEnrolled = progress !== undefined;

  return (
      <Link to={`/courses/${course.id}`} style={{ ...s.listRow }}>
        <div className="r-list-thumb" style={{
          width: 120, height: 75, flexShrink: 0, borderRadius: 8, overflow: 'hidden',
          background: course.thumbnailUrl ? undefined : getGradient(course.title),
          position: 'relative' as const,
        }}>
          {course.thumbnailUrl
              ? <img src={course.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>{course.title[0]}</span>
              </div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>{lvl[course.level]}</span>
            {course.category && <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{course.category}</span>}
          </div>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 4, color: 'var(--text)', letterSpacing: '-0.01em' }}>{course.title}</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', lineHeight: 1.4, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{course.description}</p>
        </div>
        <div className="r-list-meta" style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <StarRating value={course.rating} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{lessonsCount} урок{lessonsCount < 5 ? 'и' : 'ів'}</span>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isEnrolled ? '#16a34a' : 'var(--text)' }}>
          {isEnrolled ? '✓ Записаний' : Number(course.price) === 0 ? 'Безкоштовно' : `${Number(course.price).toLocaleString()} ₴`}
        </span>
        </div>
      </Link>
  );
}

function StarRating({ value }: { value: number | null }) {
  if (!value || Number(value) === 0) return null;
  const rounded = Math.round(Number(value) * 2) / 2;
  return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {[1,2,3,4,5].map(star => (
            <span key={star} style={{
              fontSize: '0.72rem',
              color: star <= Math.floor(rounded) ? '#f59e0b' : star - 0.5 <= rounded ? '#fbbf24' : 'var(--border-strong)',
            }}>★</span>
        ))}
        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginLeft: 3 }}>{Number(value).toFixed(1)}</span>
      </div>
  );
}

const s: Record<string, any> = {
  page:   { minHeight: '100vh', background: 'var(--bg-subtle)' },
  hero:   { background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', padding: '40px 0 28px' },
  heroInner: { maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column' as const, gap: 16 },
  heroText: {},
  heroTitle: { fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: 4 },
  heroSub:   { color: 'var(--text-tertiary)', fontSize: '0.875rem' },
  searchWrap: { position: 'relative' as const, maxWidth: 520, display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute' as const, left: 14, fontSize: '0.85rem', pointerEvents: 'none' as const, color: 'var(--text-tertiary)' },
  searchClear: { position: 'absolute' as const, right: 12, background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.8rem', padding: 4 },
  search: {
    width: '100%', padding: '11px 36px 11px 38px',
    border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: '0.9rem', outline: 'none',
    background: 'var(--bg)', color: 'var(--text)',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  },

  body:  { maxWidth: 1200, margin: '28px auto', display: 'flex', gap: 28, alignItems: 'flex-start' },
  aside: { flexShrink: 0, background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '18px 16px', position: 'sticky' as const, top: 80 },
  asideHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  asideTitle: { fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--text)' },
  resetBtn: { background: 'none', border: 'none', fontSize: '0.75rem', color: '#dc2626', cursor: 'pointer', padding: 0, fontFamily: 'inherit' },

  filterGroup: { marginBottom: 22 },
  filterLabel: { fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 8 },
  filterList: { display: 'flex', flexWrap: 'wrap' as const, gap: 4 },
  filterChip: {
    padding: '4px 10px', borderRadius: 99, border: '1.5px solid var(--border)',
    background: 'var(--bg-elevated)', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer',
    transition: 'all 0.12s', fontFamily: 'inherit', outline: 'none',
  },
  filterChipActive: { background: 'var(--accent)', color: 'var(--accent-inv)', borderColor: 'var(--accent)' },

  filterRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 8px', borderRadius: 8, border: 'none',
    background: 'transparent', fontSize: '0.85rem', color: 'var(--text-secondary)',
    cursor: 'pointer', width: '100%', textAlign: 'left' as const,
    marginBottom: 2, transition: 'background 0.12s', fontFamily: 'inherit',
  },
  filterRowActive: { background: 'var(--bg-muted)', color: 'var(--text)', fontWeight: 600 },
  filterDot: (active: boolean) => ({
    width: 8, height: 8, borderRadius: '50%',
    background: active ? 'var(--accent)' : 'var(--border-strong)', flexShrink: 0, transition: 'background 0.12s',
  }),

  priceDisplay: { marginBottom: 8 },
  priceAny: { color: 'var(--text-tertiary)', fontSize: '0.8rem' },
  priceValue: { fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' },
  range: { width: '100%', accentColor: 'var(--accent)', cursor: 'pointer', margin: '4px 0' },
  rangeLabel: { fontSize: '0.65rem', color: 'var(--text-tertiary)' },

  ratingHint: { fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 4 },
  starBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '2px 1px', lineHeight: 1, transition: 'transform 0.1s' },

  main: { flex: 1, minWidth: 0 },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  toolbarCount: { fontSize: '0.82rem', color: 'var(--text-tertiary)' },
  sortSelect: { padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.82rem', background: 'var(--bg-elevated)', cursor: 'pointer', outline: 'none', color: 'var(--text)', fontFamily: 'inherit' },
  viewToggle: { display: 'flex', border: '1.5px solid var(--border)', borderRadius: 8, overflow: 'hidden' },
  viewBtn: { padding: '6px 10px', background: 'var(--bg-elevated)', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-tertiary)', transition: 'background 0.1s' },
  viewBtnActive: { background: 'var(--accent)', color: 'var(--accent-inv)' },

  grid: { display: 'grid', gap: 16 },
  listLayout: { display: 'flex', flexDirection: 'column' as const, gap: 10 },
  listRow: {
    display: 'flex', alignItems: 'center', gap: 16,
    background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: 12,
    padding: '12px 16px', textDecoration: 'none', color: 'inherit',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },

  empty: { textAlign: 'center' as const, padding: '80px 20px', color: 'var(--text)' },
  emptyHint: { color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: 20 },
  emptyResetBtn: {
    padding: '9px 22px', background: 'var(--accent)', color: 'var(--accent-inv)',
    border: 'none', borderRadius: 8, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
  },

  pagination: { display: 'flex', gap: 6, justifyContent: 'center', marginTop: 32, alignItems: 'center' },
  pageDots: { padding: '0 4px', color: 'var(--text-tertiary)' },
  pageBtn: {
    width: 36, height: 36, borderRadius: 8,
    border: '1.5px solid var(--border)', background: 'var(--bg-elevated)',
    fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.12s',
  },
  pageBtnActive: { background: 'var(--accent)', color: 'var(--accent-inv)', borderColor: 'var(--accent)' },
};