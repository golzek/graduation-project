import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlistItems } from '../hooks/useWishlist';
import { useToast } from '../components/Toast';

function LevelBadge({ level }: { level: string }) {
    const map: Record<string, { label: string; color: string; bg: string }> = {
        beginner:     { label: 'Початковий', color: '#15803d', bg: '#dcfce7' },
        intermediate: { label: 'Середній',   color: '#b45309', bg: '#fef3c7' },
        advanced:     { label: 'Просунутий', color: '#7c3aed', bg: '#ede9fe' },
    };
    const t = map[level] ?? { label: level, color: '#5a5a5a', bg: '#f5f5f5' };
    return (
        <span style={{
            display: 'inline-block',
            padding: '2px 8px', borderRadius: 99,
            fontSize: '0.68rem', fontWeight: 500,
            color: t.color, background: t.bg,
        }}>{t.label}</span>
    );
}

function StarRating({ rating }: { rating: number | null }) {
    if (rating === null) return <span style={{ fontSize: '0.75rem', color: '#9a9a9a' }}>Без оцінок</span>;
    return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>★</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#0a0a0a' }}>
                {rating.toFixed(1)}
            </span>
        </span>
    );
}

export function WishlistPage() {
    const { items, loading, remove, reload } = useWishlistItems();
    const { success: toastSuccess, error: toastError } = useToast();
    const [removing, setRemoving] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'date' | 'price' | 'rating'>('date');

    const handleRemove = async (courseId: string, courseTitle: string) => {
        setRemoving(courseId);
        try {
            await remove(courseId);
            toastSuccess(`"${courseTitle}" видалено зі списку бажань`);
        } catch {
            toastError('Не вдалося видалити курс');
            reload();
        } finally {
            setRemoving(null);
        }
    };

    const sorted = [...items].sort((a, b) => {
        if (sortBy === 'price')  return a.course.price - b.course.price;
        if (sortBy === 'rating') return (b.course.rating ?? 0) - (a.course.rating ?? 0);
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });

    const totalValue = items.reduce((sum, i) => sum + i.course.price, 0);

    if (loading) {
        return (
            <div style={s.page}>
                <div style={s.headerWrap}>
                    <div style={s.headerInner}>
                        <div style={s.skeletonTitle} />
                        <div style={s.skeletonSub} />
                    </div>
                </div>
                <div style={s.body}>
                    <div style={s.grid}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={s.skeletonCard} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={s.page}>
            <div style={s.headerWrap}>
                <div style={s.headerInner}>
                    <div>
                        <h1 style={s.title}>Список бажань</h1>
                        <p style={s.subtitle}>
                            {items.length === 0
                                ? 'Тут з\'являться збережені курси'
                                : `${items.length} ${pluralCourses(items.length)} · загальна вартість ${totalValue.toLocaleString('uk-UA')} ₴`}
                        </p>
                    </div>

                    {items.length > 0 && (
                        <div style={s.sortWrap}>
                            <span style={s.sortLabel}>Сортувати:</span>
                            {(['date', 'price', 'rating'] as const).map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setSortBy(opt)}
                                    style={{
                                        ...s.sortBtn,
                                        ...(sortBy === opt ? s.sortBtnActive : {}),
                                    }}
                                >
                                    {opt === 'date' ? 'За датою' : opt === 'price' ? 'За ціною' : 'За рейтингом'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div style={s.body}>
                {items.length === 0 ? (
                    <div style={s.empty}>
                        <div style={s.emptyIcon}>♡</div>
                        <h2 style={s.emptyTitle}>Список бажань порожній</h2>
                        <p style={s.emptySub}>
                            Знайди цікавий курс і натисни ♡, щоб зберегти його на потім
                        </p>
                        <Link to="/courses" style={s.btnPrimary}>
                            Перейти до каталогу
                        </Link>
                    </div>
                ) : (
                    <div style={s.grid}>
                        {sorted.map(item => (
                            <WishlistCard
                                key={item.id}
                                item={item}
                                removing={removing === item.course.id}
                                onRemove={handleRemove}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface CardProps {
    item: import('../hooks/useWishlist').WishlistItem;
    removing: boolean;
    onRemove: (courseId: string, courseTitle: string) => void;
}

function WishlistCard({ item, removing, onRemove }: CardProps) {
    const { course } = item;
    const addedDate = new Date(item.addedAt).toLocaleDateString('uk-UA', {
        day: 'numeric', month: 'long', year: 'numeric',
    });

    return (
        <div style={{ ...s.card, opacity: removing ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            <Link to={`/courses/${course.id}`} style={{ textDecoration: 'none' }}>
                <div style={s.thumb}>
                    {course.thumbnailUrl ? (
                        <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            style={s.thumbImg}
                        />
                    ) : (
                        <div style={s.thumbPlaceholder}>
                            {course.title[0]}
                        </div>
                    )}
                </div>
            </Link>

            <div style={s.cardBody}>
                <div style={s.cardTop}>
                    <div style={s.cardMeta}>
                        <LevelBadge level={course.level} />
                        <span style={s.category}>{course.category}</span>
                    </div>
                    <button
                        onClick={() => onRemove(course.id, course.title)}
                        disabled={removing}
                        title="Видалити зі списку бажань"
                        style={s.removeBtn}
                    >
                        ♥
                    </button>
                </div>

                <Link to={`/courses/${course.id}`} style={s.cardTitleLink}>
                    <h3 style={s.cardTitle}>{course.title}</h3>
                </Link>

                <p style={s.authorText}>{course.author?.name}</p>

                <div style={s.cardFooter}>
                    <div style={s.cardFooterLeft}>
                        <StarRating rating={course.rating} />
                        <span style={s.addedDate}>Додано {addedDate}</span>
                    </div>
                    <div style={s.priceWrap}>
                        {course.price === 0 ? (
                            <span style={s.priceFree}>Безкоштовно</span>
                        ) : (
                            <span style={s.price}>{course.price.toLocaleString('uk-UA')} ₴</span>
                        )}
                    </div>
                </div>

                <Link to={`/courses/${course.id}`} style={s.btnGo}>
                    До курсу →
                </Link>
            </div>
        </div>
    );
}

function pluralCourses(n: number): string {
    if (n % 10 === 1 && n % 100 !== 11) return 'курс';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'курси';
    return 'курсів';
}

const s: Record<string, React.CSSProperties> = {
    page:        { minHeight: '100vh', background: '#fafafa' },
    headerWrap:  { borderBottom: '1px solid #ebebeb', background: '#fff', padding: '28px 0' },
    headerInner: {
        maxWidth: 1160, margin: '0 auto', padding: '0 32px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap' as const,
    },
    title:    { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 },
    subtitle: { fontSize: '0.875rem', color: '#9a9a9a' },

    sortWrap:      { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const },
    sortLabel:     { fontSize: '0.75rem', color: '#9a9a9a', marginRight: 2 },
    sortBtn: {
        padding: '5px 12px', borderRadius: 6,
        border: '1.5px solid #ebebeb', background: 'transparent',
        fontSize: '0.78rem', color: '#5a5a5a', cursor: 'pointer',
        transition: 'all 0.15s',
    },
    sortBtnActive: {
        background: '#0a0a0a', color: '#fff',
        border: '1.5px solid #0a0a0a',
    },

    body:  { maxWidth: 1160, margin: '32px auto', padding: '0 32px' },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 20,
    },

    card: {
        background: '#fff', border: '1.5px solid #ebebeb',
        borderRadius: 14, overflow: 'hidden',
        display: 'flex', flexDirection: 'column' as const,
        transition: 'box-shadow 0.2s',
    },
    thumb:    { height: 160, overflow: 'hidden', background: '#f5f5f5' },
    thumbImg: { width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' },
    thumbPlaceholder: {
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.5rem', fontWeight: 700, color: '#d0d0d0',
        background: '#f5f5f5',
    },
    cardBody:  { padding: '16px', display: 'flex', flexDirection: 'column' as const, flex: 1 },
    cardTop:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cardMeta:  { display: 'flex', alignItems: 'center', gap: 6 },
    category:  { fontSize: '0.72rem', color: '#9a9a9a' },

    removeBtn: {
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', background: '#fff1f2',
        borderRadius: '50%', color: '#ef4444',
        fontSize: '0.9rem', cursor: 'pointer',
        flexShrink: 0, transition: 'transform 0.15s, background 0.15s',
    },

    cardTitleLink: { textDecoration: 'none', color: 'inherit' },
    cardTitle: {
        fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.4,
        letterSpacing: '-0.01em', marginBottom: 4,
        display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
    },
    authorText: { fontSize: '0.78rem', color: '#9a9a9a', marginBottom: 12 },

    cardFooter:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, marginTop: 'auto' },
    cardFooterLeft: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
    addedDate:      { fontSize: '0.7rem', color: '#c0c0c0' },

    priceWrap: { textAlign: 'right' as const },
    price:     { fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#0a0a0a' },
    priceFree: { fontSize: '0.9rem', fontWeight: 600, color: '#15803d' },

    btnGo: {
        display: 'block', textAlign: 'center' as const,
        padding: '9px', borderRadius: 8,
        background: '#0a0a0a', color: '#fafafa',
        fontSize: '0.85rem', fontWeight: 500,
        textDecoration: 'none', transition: 'opacity 0.15s',
    },

    empty: {
        display: 'flex', flexDirection: 'column' as const,
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 32px', textAlign: 'center' as const,
    },
    emptyIcon:  { fontSize: '3.5rem', color: '#e0e0e0', marginBottom: 20, lineHeight: 1 },
    emptyTitle: { fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 },
    emptySub:   { color: '#9a9a9a', fontSize: '0.9rem', maxWidth: 340, lineHeight: 1.6, marginBottom: 24 },
    btnPrimary: {
        display: 'inline-block',
        padding: '10px 24px', borderRadius: 8,
        background: '#0a0a0a', color: '#fafafa',
        fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none',
    },

    skeletonTitle: { height: 28, width: 220, borderRadius: 6, background: '#f0f0f0', marginBottom: 10 },
    skeletonSub:   { height: 16, width: 160, borderRadius: 6, background: '#f5f5f5' },
    skeletonCard:  { height: 340, borderRadius: 14, background: '#f5f5f5' },
};