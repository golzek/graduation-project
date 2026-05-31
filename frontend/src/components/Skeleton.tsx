import React from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, style }: SkeletonProps) {
    return (
        <div style={{
            width, height, borderRadius,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-shimmer 1.4s ease infinite',
            ...style,
        }} />
    );
}

if (typeof document !== 'undefined' && !document.getElementById('skeleton-style')) {
    const s = document.createElement('style');
    s.id = 'skeleton-style';
    s.textContent = `@keyframes skeleton-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
    document.head.appendChild(s);
}

export function StudentDashboardSkeleton() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '28px 0' }}>
                <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }} className="r-header-inner">
                    <Skeleton width={44} height={44} borderRadius="50%" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Skeleton width={180} height={20} />
                        <Skeleton width={120} height={14} />
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1160, margin: '28px auto' }} className="r-skeleton-body">
                <div style={{ display: 'grid', gap: 12, marginBottom: 24 }} className="r-skeleton-metrics">
                    {[0,1,2,3].map(i => (
                        <div key={i} style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                            <Skeleton width={60} height={32} style={{ marginBottom: 8 }} />
                            <Skeleton width={100} height={12} />
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gap: 16 }} className="r-skeleton-two">
                    <div style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
                        <Skeleton width={80} height={12} style={{ marginBottom: 16 }} />
                        {[0,1,2].map(i => (
                            <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                                <Skeleton width={38} height={38} borderRadius={8} />
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <Skeleton height={14} width="70%" />
                                    <Skeleton height={11} width="40%" />
                                    <Skeleton height={3} borderRadius={99} style={{ marginTop: 4 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
                            <Skeleton width={100} height={12} style={{ marginBottom: 14 }} />
                            {[0,1,2].map(i => (
                                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                    <Skeleton width={6} height={6} borderRadius="50%" style={{ marginTop: 5 }} />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                                        <Skeleton height={13} width="80%" />
                                        <Skeleton height={11} width="50%" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
                            <Skeleton width={90} height={12} style={{ marginBottom: 14 }} />
                            {[0,1].map(i => (
                                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                    <Skeleton width={22} height={22} borderRadius={4} />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                                        <Skeleton height={13} width="75%" />
                                        <Skeleton height={11} width="45%" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TeacherDashboardSkeleton() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '28px 0' }}>
                <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }} className="r-header-inner">
                    <Skeleton width={44} height={44} borderRadius="50%" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Skeleton width={200} height={20} />
                        <Skeleton width={140} height={14} />
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1160, margin: '28px auto' }} className="r-skeleton-body">
                <div style={{ display: 'grid', gap: 12, marginBottom: 24 }} className="r-skeleton-metrics">
                    {[0,1,2,3].map(i => (
                        <div key={i} style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                            <Skeleton width={70} height={32} style={{ marginBottom: 8 }} />
                            <Skeleton width={110} height={12} />
                        </div>
                    ))}
                </div>

                <div style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
                    <Skeleton width={120} height={12} style={{ marginBottom: 16 }} />
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                        {[0,1,2].map(i => <Skeleton key={i} width={140} height={36} borderRadius={8} />)}
                    </div>
                    <Skeleton height={200} borderRadius={10} />
                </div>
            </div>
        </div>
    );
}