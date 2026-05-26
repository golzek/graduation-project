import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../context/AuthContext';

export function useWishlist() {
    const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    // Завантаження ID курсів при монтуванні (тільки якщо авторизований)
    useEffect(() => {
        if (!localStorage.getItem('accessToken')) return;
        setLoading(true);
        apiFetch<string[]>('/wishlist/ids')
            .then(ids => setWishlistIds(new Set(ids)))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const isInWishlist = useCallback(
        (courseId: string) => wishlistIds.has(courseId),
        [wishlistIds],
    );

    const toggle = useCallback(async (courseId: string) => {
        const inList = wishlistIds.has(courseId);
        // Оптимістичне оновлення UI
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
            // Відкатуємо при помилці
            setWishlistIds(prev => {
                const next = new Set(prev);
                inList ? next.add(courseId) : next.delete(courseId);
                return next;
            });
        }
    }, [wishlistIds]);

    return { wishlistIds, isInWishlist, toggle, loading };
}

export interface WishlistItem {
    id: string;
    addedAt: string;
    course: {
        id: string; title: string; description: string;
        price: number; level: string; category: string;
        rating: number | null; thumbnailUrl: string | null;
        author: { id: string; name: string };
    };
}

export function useWishlistItems() {
    const [items, setItems]   = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        if (!localStorage.getItem('accessToken')) { setLoading(false); return; }
        setLoading(true);
        apiFetch<WishlistItem[]>('/wishlist')
            .then(setItems)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const remove = useCallback(async (courseId: string) => {
        await apiFetch(`/wishlist/${courseId}`, { method: 'DELETE' });
        setItems(prev => prev.filter(i => i.course.id !== courseId));
    }, []);

    return { items, loading, remove, reload: load };
}