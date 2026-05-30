import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, apiFetch } from '../context/AuthContext';

interface Plan {
    plan: 'monthly' | 'annual';
    label: string;
    price: number;
    pricePerMonth: number;
    months: number;
    discount: number;
    description: string;
}

interface ActiveSub {
    id: string;
    plan: 'monthly' | 'annual';
    status: 'active' | 'cancelled' | 'expired';
    paidPrice: number;
    startedAt: string;
    expiresAt: string;
    cancelledAt: string | null;
}

interface SubData {
    active: ActiveSub | null;
    hasSubscription: boolean;
    daysLeft: number | null;
    plans: Plan[];
    history: ActiveSub[];
}

export function SubscriptionPage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [data, setData]         = useState<SubData | null>(null);
    const [loading, setLoading]   = useState(true);
    const [paying, setPaying]     = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [error, setError]       = useState('');
    const [showCancel, setShowCancel] = useState(false);

    const load = useCallback(() => {
        if (!isAuthenticated) { setLoading(false); return; }
        setLoading(true);
        apiFetch<SubData>('/subscriptions/my')
            .then(setData)
            .catch(() => setError('Не вдалось завантажити дані підписки'))
            .finally(() => setLoading(false));
    }, [isAuthenticated]);

    useEffect(() => { load(); }, [load]);

    const handleBuy = async (plan: Plan) => {
        if (!isAuthenticated) { navigate('/login'); return; }
        setPaying(plan.plan);
        setError('');
        try {
            const res = await apiFetch<any>(`/payments/subscribe`, {
                method: 'POST',
                body: JSON.stringify({ plan: plan.plan }),
            });

            if (res.free) { load(); return; }

            const form = document.createElement('form');
            form.method = 'POST'; form.action = res.action;
            Object.entries(res.formData as Record<string, string>).forEach(([name, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden'; input.name = name; input.value = value;
                form.appendChild(input);
            });
            document.body.appendChild(form); form.submit(); document.body.removeChild(form);
        } catch (e: any) {
            setError(e.message || 'Помилка під час оплати');
        } finally {
            setPaying(null);
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await apiFetch('/subscriptions/cancel', { method: 'POST' });
            setShowCancel(false);
            load();
        } catch (e: any) {
            setError(e.message || 'Помилка скасування');
        } finally {
            setCancelling(false);
        }
    };

    const planLabel: Record<string, string> = { monthly: 'Місячна', annual: 'Річна' };
    const statusLabel: Record<string, string> = { active: 'Активна', cancelled: 'Скасована', expired: 'Закінчилась' };
    const statusColor: Record<string, string> = { active: '#16a34a', cancelled: '#d97706', expired: '#9ca3af' };

    if (loading) {
        return (
            <div style={s.page}>
                <div style={s.centered}><p style={{ color: '#9a9a9a' }}>Завантаження...</p></div>
            </div>
        );
    }

    const active = data?.active ?? null;
    const plans  = data?.plans ?? [];
    const history = (data?.history ?? []).filter(h => h.status !== 'active');

    return (
        <div style={s.page}>
            <div style={s.header}>
                <div style={s.headerInner}>
                    <h1 style={s.title}>Підписка</h1>
                    <p style={s.sub}>Необмежений доступ до всіх курсів платформи</p>
                </div>
            </div>

            <div style={s.body}>
                {error && (
                    <div style={s.errorBanner}>{error}</div>
                )}

                {active && (
                    <div style={s.activeBanner}>
                        <div style={s.activeBannerLeft}>
                            <span style={s.activeDot} />
                            <div>
                                <p style={s.activeTitle}>
                                    {planLabel[active.plan]} підписка активна
                                </p>
                                <p style={s.activeMeta}>
                                    Діє до {new Date(active.expiresAt).toLocaleDateString('uk-UA')}
                                    {data?.daysLeft !== null && ` · залишилось ${data?.daysLeft} дн.`}
                                    {active.status === 'cancelled' && ' · скасована, не поновлюється'}
                                </p>
                            </div>
                        </div>
                        {active.status === 'active' && (
                            <button onClick={() => setShowCancel(true)} style={s.cancelBtn}>
                                Скасувати
                            </button>
                        )}
                    </div>
                )}

                <div style={s.plansGrid}>
                    {plans.map(plan => {
                        const isCurrentPlan = active?.plan === plan.plan && active?.status === 'active';
                        return (
                            <div
                                key={plan.plan}
                                style={{
                                    ...s.planCard,
                                    ...(plan.plan === 'annual' ? s.planCardFeatured : {}),
                                    ...(isCurrentPlan ? s.planCardActive : {}),
                                }}
                            >
                                {plan.plan === 'annual' && !isCurrentPlan && (
                                    <div style={s.popularBadge}>Найвигідніше</div>
                                )}
                                {isCurrentPlan && (
                                    <div style={{ ...s.popularBadge, background: '#16a34a' }}>Ваш план</div>
                                )}

                                <p style={s.planLabel}>{plan.label}</p>
                                <div style={s.planPriceRow}>
                                    <span style={s.planPrice}>{plan.price} ₴</span>
                                    <span style={s.planPriceSub}>
                    {plan.months === 1 ? '/ місяць' : '/ рік'}
                  </span>
                                </div>

                                {plan.months > 1 && (
                                    <p style={s.planPerMonth}>
                                        {plan.pricePerMonth} ₴/міс
                                        {plan.discount > 0 && (
                                            <span style={s.discountTag}> −{plan.discount}%</span>
                                        )}
                                    </p>
                                )}

                                <p style={s.planDesc}>{plan.description}</p>

                                <ul style={s.featureList}>
                                    <li style={s.featureItem}>✓ Всі курси без обмежень</li>
                                    <li style={s.featureItem}>✓ Сертифікати після завершення</li>
                                    <li style={s.featureItem}>✓ Нові курси без доплати</li>
                                    {plan.months > 1 && <li style={s.featureItem}>✓ Пріоритетна підтримка</li>}
                                </ul>

                                <button
                                    onClick={() => handleBuy(plan)}
                                    disabled={!!paying || isCurrentPlan}
                                    style={{
                                        ...s.buyBtn,
                                        ...(plan.plan === 'annual' && !isCurrentPlan ? s.buyBtnFeatured : {}),
                                        ...(isCurrentPlan ? s.buyBtnDisabled : {}),
                                    }}
                                >
                                    {paying === plan.plan
                                        ? 'Обробка...'
                                        : isCurrentPlan
                                            ? 'Активний план'
                                            : active
                                                ? 'Продовжити'
                                                : 'Підписатись'}
                                </button>

                                {!isCurrentPlan && (
                                    <p style={s.liqpayNote}>
                                        <img src="https://cdn.wayforpay.com/icons/wfp-logo.png" alt="WayForPay" style={{ height: 14, verticalAlign: 'middle', marginRight: 4 }} onError={e => (e.currentTarget.style.display='none')} />
                                        Безпечна оплата через WayForPay
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div style={s.faq}>
                    <h2 style={s.faqTitle}>Часті питання</h2>
                    {[
                        { q: 'Що включає підписка?', a: 'Необмежений доступ до всіх опублікованих курсів платформи на термін підписки.' },
                        { q: 'Чи можна скасувати?', a: 'Так. Доступ залишається активним до кінця оплаченого періоду, але автоматичного списання не буде.' },
                        { q: 'Що з сертифікатами?', a: 'Сертифікати залишаються у вас назавжди навіть після закінчення підписки.' },
                        { q: 'Як продовжити?', a: 'Оберіть будь-який план — він автоматично додасться до поточного терміну.' },
                    ].map(({ q, a }, i) => (
                        <div key={i} style={s.faqItem}>
                            <p style={s.faqQ}>{q}</p>
                            <p style={s.faqA}>{a}</p>
                        </div>
                    ))}
                </div>

                {history.length > 0 && (
                    <div style={s.historySection}>
                        <h2 style={s.faqTitle}>Історія підписок</h2>
                        <div style={s.historyTable}>
                            <div style={s.historyHeader}>
                                <span>План</span>
                                <span>Статус</span>
                                <span>Оплачено</span>
                                <span>Початок</span>
                                <span>Кінець</span>
                            </div>
                            {history.map(h => (
                                <div key={h.id} style={s.historyRow}>
                                    <span>{planLabel[h.plan] ?? h.plan}</span>
                                    <span style={{ color: statusColor[h.status] ?? '#9ca3af', fontWeight: 500, fontSize: '0.8rem' }}>
                    {statusLabel[h.status] ?? h.status}
                  </span>
                                    <span>{Number(h.paidPrice).toLocaleString('uk-UA')} ₴</span>
                                    <span>{new Date(h.startedAt).toLocaleDateString('uk-UA')}</span>
                                    <span>{new Date(h.expiresAt).toLocaleDateString('uk-UA')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showCancel && (
                <div style={modal.overlay} onClick={() => setShowCancel(false)}>
                    <div style={modal.box} onClick={e => e.stopPropagation()}>
                        <p style={modal.title}>Скасувати підписку?</p>
                        <p style={modal.sub}>
                            Доступ до курсів залишиться активним до{' '}
                            <strong>{active ? new Date(active.expiresAt).toLocaleDateString('uk-UA') : ''}</strong>.
                            Після цього підписка не поновлюватиметься.
                        </p>
                        <div style={modal.btns}>
                            <button style={modal.btnCancel} onClick={() => setShowCancel(false)}>Назад</button>
                            <button style={modal.btnConfirm} onClick={handleCancel} disabled={cancelling}>
                                {cancelling ? 'Скасування...' : 'Так, скасувати'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    page:    { minHeight: '100vh', background: '#fafafa' },
    centered: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' },
    header:  { borderBottom: '1px solid #ebebeb', background: '#fff', padding: '36px 0 32px' },
    headerInner: { maxWidth: 1000, margin: '0 auto', padding: '0 32px', textAlign: 'center' as const },
    title:   { fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 },
    sub:     { fontSize: '1rem', color: '#9a9a9a' },
    body:    { maxWidth: 1000, margin: '40px auto', padding: '0 32px' },
    errorBanner: {
        background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10,
        padding: '12px 16px', color: '#dc2626', fontSize: '0.875rem', marginBottom: 24,
    },
    activeBanner: {
        background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12,
        padding: '16px 20px', marginBottom: 32,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
    },
    activeBannerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    activeDot: { width: 10, height: 10, borderRadius: '50%', background: '#16a34a', flexShrink: 0 },
    activeTitle: { fontSize: '0.95rem', fontWeight: 600, color: '#15803d', margin: 0 },
    activeMeta:  { fontSize: '0.8rem', color: '#16a34a', marginTop: 3, opacity: 0.8 },
    cancelBtn: {
        padding: '7px 16px', borderRadius: 8,
        border: '1.5px solid #fca5a5', background: '#fff',
        color: '#dc2626', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
        flexShrink: 0,
    },
    plansGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 20, marginBottom: 48,
    },
    planCard: {
        background: '#fff', border: '1.5px solid #ebebeb',
        borderRadius: 16, padding: '28px 24px',
        position: 'relative' as const,
    },
    planCardFeatured: {
        border: '2px solid #0a0a0a',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    },
    planCardActive: {
        border: '2px solid #16a34a',
        boxShadow: '0 4px 24px rgba(22,163,74,0.12)',
    },
    popularBadge: {
        position: 'absolute' as const, top: -12, left: '50%',
        transform: 'translateX(-50%)',
        background: '#0a0a0a', color: '#fff',
        fontSize: '0.7rem', fontWeight: 700,
        padding: '3px 12px', borderRadius: 99,
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap' as const,
    },
    planLabel:    { fontSize: '0.75rem', fontWeight: 600, color: '#9a9a9a', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 12 },
    planPriceRow: { display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 },
    planPrice:    { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.04em' },
    planPriceSub: { fontSize: '0.875rem', color: '#9a9a9a' },
    planPerMonth: { fontSize: '0.8rem', color: '#6b7280', marginBottom: 12 },
    discountTag:  { color: '#16a34a', fontWeight: 700 },
    planDesc:     { fontSize: '0.875rem', color: '#5a5a5a', marginBottom: 20, lineHeight: 1.5 },
    featureList:  { listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column' as const, gap: 8 },
    featureItem:  { fontSize: '0.875rem', color: '#374151' },
    buyBtn: {
        width: '100%', padding: '12px',
        background: '#f5f5f5', color: '#0a0a0a',
        border: 'none', borderRadius: 10,
        fontSize: '0.9rem', fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background 0.15s',
    },
    buyBtnFeatured: { background: '#0a0a0a', color: '#fafafa' },
    buyBtnDisabled: { background: '#f0fdf4', color: '#16a34a', cursor: 'default' },
    liqpayNote: { textAlign: 'center' as const, fontSize: '0.72rem', color: '#9a9a9a', marginTop: 12 },
    faq: { marginBottom: 48 },
    faqTitle: { fontSize: '1rem', fontWeight: 600, marginBottom: 16, letterSpacing: '-0.02em' },
    faqItem: {
        borderBottom: '1px solid #f0f0f0', paddingBottom: 16, marginBottom: 16,
    },
    faqQ: { fontSize: '0.9rem', fontWeight: 600, marginBottom: 6 },
    faqA: { fontSize: '0.875rem', color: '#5a5a5a', lineHeight: 1.6 },
    historySection: { marginBottom: 48 },
    historyTable: { border: '1.5px solid #ebebeb', borderRadius: 12, overflow: 'hidden' },
    historyHeader: {
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
        padding: '10px 16px', background: '#fafafa',
        fontSize: '0.75rem', fontWeight: 600, color: '#9a9a9a',
        textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    },
    historyRow: {
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
        padding: '12px 16px', borderTop: '1px solid #f0f0f0',
        fontSize: '0.875rem', alignItems: 'center',
    },
};

const modal: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    box: {
        background: '#fff', borderRadius: 14, padding: '28px 28px 22px',
        width: 360, boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
    },
    title: { fontSize: '1rem', fontWeight: 600, color: '#0a0a0a', marginBottom: 8 },
    sub:   { fontSize: '0.875rem', color: '#5a5a5a', lineHeight: 1.6, marginBottom: 22 },
    btns:  { display: 'flex', gap: 10 },
    btnCancel: {
        flex: 1, padding: '9px', borderRadius: 8,
        border: '1.5px solid #ebebeb', background: 'transparent',
        fontSize: '0.875rem', cursor: 'pointer', color: '#5a5a5a', fontFamily: 'inherit',
    },
    btnConfirm: {
        flex: 1, padding: '9px', borderRadius: 8,
        border: 'none', background: '#dc2626',
        fontSize: '0.875rem', cursor: 'pointer', color: '#fff', fontWeight: 500, fontFamily: 'inherit',
    },
};