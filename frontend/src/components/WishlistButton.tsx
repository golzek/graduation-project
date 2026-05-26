import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../hooks/useWishlist';

interface Props {
    courseId: string;
    variant?: 'icon' | 'full';
    stopPropagation?: boolean;
}

export function WishlistButton({ courseId, variant = 'icon', stopPropagation = false }: Props) {
    const { isAuthenticated } = useAuth();
    const { isInWishlist, toggle } = useWishlist();
    const [busy, setBusy] = useState(false);

    if (!isAuthenticated) return null;

    const inList = isInWishlist(courseId);

    const handleClick = async (e: React.MouseEvent) => {
        if (stopPropagation) e.preventDefault();
        if (busy) return;
        setBusy(true);
        await toggle(courseId);
        setBusy(false);
    };

    if (variant === 'full') {
        return (
            <button
                onClick={handleClick}
                disabled={busy}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px', borderRadius: 8,
                    border: `1.5px solid ${inList ? '#ef4444' : '#ebebeb'}`,
                    background: inList ? '#fff1f2' : '#fff',
                    color: inList ? '#ef4444' : '#5a5a5a',
                    fontSize: '0.9rem', fontWeight: 500,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    opacity: busy ? 0.7 : 1,
                }}
            >
        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>
          {inList ? '♥' : '♡'}
        </span>
                {inList ? 'У списку бажань' : 'Зберегти на потім'}
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            disabled={busy}
            title={inList ? 'Видалити зі списку бажань' : 'Зберегти на потім'}
            style={{
                position: 'absolute', top: 8, right: 8,
                width: 30, height: 30,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,0.92)',
                color: inList ? '#ef4444' : '#9a9a9a',
                fontSize: '1rem',
                cursor: busy ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                transition: 'color 0.15s, transform 0.15s',
                transform: busy ? 'scale(0.9)' : 'scale(1)',
                lineHeight: 1,
                zIndex: 2,
            }}
        >
            {inList ? '♥' : '♡'}
        </button>
    );
}