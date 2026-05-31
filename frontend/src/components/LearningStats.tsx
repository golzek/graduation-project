import React, { useEffect, useState } from 'react';
import { apiFetch } from '../context/AuthContext';

interface StudentStats {
    totalWatchedSec: number;
    streak: number;
    activityByDay:  { day: string; seconds: number }[];
    weeklySeconds:  { week: string; seconds: number }[];
    hourHeatmap:    { hour: number; seconds: number }[];
    weekdaySeconds: { dow: number; seconds: number }[];
}

function fmtTime(sec: number): string {
    if (sec < 60)   return `${sec}с`;
    if (sec < 3600) return `${Math.floor(sec / 60)}хв`;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return m > 0 ? `${h}г ${m}хв` : `${h}г`;
}

const DAYS_UA = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS_UA = ['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру'];

const s: Record<string, React.CSSProperties> = {
    wrap:  { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 },
    row:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    card:  {
        background: 'var(--bg-elevated)', border: '1.5px solid var(--border)',
        borderRadius: 12, padding: '18px 20px',
    },
    label: {
        fontSize: '0.72rem', fontWeight: 500,
        textTransform: 'uppercase' as const, letterSpacing: '0.07em',
        color: 'var(--text-tertiary)', marginBottom: 10,
    },
    big:   { fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1 },
    sub:   { fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 },
    flame: { fontSize: '1.4rem', marginRight: 6 },
    streakRow: { display: 'flex', alignItems: 'center' },
};

export function LearningStats() {
    const [stats, setStats] = useState<StudentStats | null>(null);

    useEffect(() => {
        apiFetch<StudentStats>('/analytics/student').then(setStats).catch(() => {});
    }, []);

    if (!stats) return null;

    const { totalWatchedSec, streak, activityByDay, weeklySeconds, weekdaySeconds } = stats;

    const activeDays = activityByDay.filter(d => d.seconds > 0).length;
    const avgPerDay  = activeDays ? Math.round(totalWatchedSec / activeDays) : 0;

    const bestDow = weekdaySeconds.reduce(
        (best, cur) => (cur.seconds > (best?.seconds ?? 0) ? cur : best),
        weekdaySeconds[0],
    );

    const maxWeekSec = Math.max(...weeklySeconds.map(w => w.seconds), 1);

    const activityMap = new Map(activityByDay.map(d => [d.day.slice(0, 10), d.seconds]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const calDays: { date: Date; sec: number }[] = [];
    for (let i = 59; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        calDays.push({ date: d, sec: activityMap.get(key) ?? 0 });
    }
    const maxCalSec = Math.max(...calDays.map(d => d.sec), 1);

    const cellColor = (sec: number) => {
        if (sec === 0) return 'var(--bg-muted)';
        const t = sec / maxCalSec;
        if (t < 0.25) return '#c8e6c9';
        if (t < 0.5)  return '#66bb6a';
        if (t < 0.75) return '#2e7d32';
        return '#1b5e20';
    };

    return (
        <div style={s.wrap}>
            <div style={s.row}>
                <div style={s.card}>
                    <p style={s.label}>Загальний час навчання</p>
                    <p style={s.big}>{fmtTime(totalWatchedSec)}</p>
                    <p style={s.sub}>
                        {activeDays > 0
                            ? `≈ ${fmtTime(avgPerDay)} на день · ${activeDays} активних днів`
                            : 'Почни перший урок!'}
                    </p>
                </div>

                <div style={s.card}>
                    <p style={s.label}>Streak</p>
                    <div style={s.streakRow}>
                        <span style={s.flame}>{streak > 0 ? '🔥' : '💤'}</span>
                        <div>
                            <p style={s.big}>{streak}</p>
                            <p style={s.sub}>
                                {streak === 0
                                    ? 'Займись сьогодні щоб почати'
                                    : streak === 1
                                        ? 'день поспіль'
                                        : streak < 5
                                            ? 'дні поспіль'
                                            : 'днів поспіль'}
                            </p>
                        </div>
                    </div>
                    {bestDow && (
                        <p style={{ ...s.sub, marginTop: 8 }}>
                            Найкращий день — {DAYS_UA[bestDow.dow]} ({fmtTime(bestDow.seconds)} всього)
                        </p>
                    )}
                </div>
            </div>

            {weeklySeconds.length > 0 && (
                <div style={s.card}>
                    <p style={s.label}>Час навчання по тижнях</p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
                        {weeklySeconds.map((w, i) => {
                            const h = Math.max(4, Math.round((w.seconds / maxWeekSec) * 56));
                            const d = new Date(w.week);
                            const label = `${d.getDate()} ${MONTHS_UA[d.getMonth()]}`;
                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <div
                                        title={fmtTime(w.seconds)}
                                        style={{
                                            width: '100%', height: h,
                                            background: 'var(--accent)', borderRadius: 3,
                                            opacity: i === weeklySeconds.length - 1 ? 1 : 0.45,
                                            transition: 'height 0.4s',
                                        }}
                                    />
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div style={s.card}>
                <p style={s.label}>Активність за 60 днів</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {calDays.map(({ date, sec }, i) => (
                        <div
                            key={i}
                            title={`${date.toLocaleDateString('uk-UA')}: ${sec > 0 ? fmtTime(sec) : 'немає активності'}`}
                            style={{
                                width: 12, height: 12, borderRadius: 2,
                                background: cellColor(sec),
                                cursor: sec > 0 ? 'default' : undefined,
                            }}
                        />
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>менше</span>
                    {['var(--bg-muted)','#c8e6c9','#66bb6a','#2e7d32','#1b5e20'].map(c => (
                        <div key={c} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                    ))}
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>більше</span>
                </div>
            </div>
        </div>
    );
}