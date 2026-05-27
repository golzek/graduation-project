import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../context/AuthContext';
import { useWishlistContext } from '../context/WishlistContext';

export function useWishlist() {
    return useWishlistContext();
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
    const [items, setItems]     = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { reload: reloadIds, version } = useWishlistContext();

    const load = useCallback(() => {
        if (!localStorage.getItem('accessToken')) { setLoading(false); return; }
        setLoading(true);
        apiFetch<WishlistItem[]>('/wishlist')
            .then(setItems)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load, version]);

    const remove = useCallback(async (courseId: string) => {
        await apiFetch(`/wishlist/${courseId}`, { method: 'DELETE' });
        setItems(prev => prev.filter(i => i.course.id !== courseId));
        reloadIds();
    }, [reloadIds]);

    return { items, loading, remove, reload: load };
}