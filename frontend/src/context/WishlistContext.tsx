import React, {
    createContext, useContext, useState,
    useEffect, useCallback, ReactNode,
} from 'react';
import { apiFetch } from './AuthContext';

interface WishlistCtx {
    wishlistIds: Set<string>;
    loading: boolean;
    isInWishlist: (courseId: string) => boolean;
    toggle: (courseId: string) => Promise<void>;
    reload: () => void;
}

const WishlistContext = createContext<WishlistCtx | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    const load = useCallback(() => {
        if (!localStorage.getItem('accessToken')) return;
        setLoading(true);
        apiFetch<string[]>('/wishlist/ids')
            .then(ids => setWishlistIds(new Set(ids)))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const isInWishlist = useCallback(
        (courseId: string) => wishlistIds.has(courseId),
        [wishlistIds],
    );

    const toggle = useCallback(async (courseId: string) => {
        const inList = wishlistIds.has(courseId);

        setWishlistIds(prev => {
            const next = new Set(prev);
            inList ? next.delete(courseId) : next.add(courseId);
            return next;
        });
        try {
            if (inList) {
                await apiFetch(`/wishlist/${courseId}`, { method: 'DELETE' });
            } else {
                await apiFetch(`/wishlist/${courseId}`, { method: 'POST' });
            }
        } catch {

            setWishlistIds(prev => {
                const next = new Set(prev);
                inList ? next.add(courseId) : next.delete(courseId);
                return next;
            });
        }
    }, [wishlistIds]);

    return (
        <WishlistContext.Provider value={{ wishlistIds, loading, isInWishlist, toggle, reload: load }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlistContext(): WishlistCtx {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlistContext must be inside <WishlistProvider>');
    return ctx;
}