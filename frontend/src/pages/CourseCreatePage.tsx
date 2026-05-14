import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../context/AuthContext';

export function CourseCreatePage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ title: '', description: '', category: '', level: 'beginner', price: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!form.title.trim()) { setError('Введіть назву курсу'); return; }
        if (!form.description.trim()) { setError('Введіть опис курсу'); return; }
        setLoading(true); setError('');
        try {
            const course = await apiFetch<any>('/courses', {
                method: 'POST',
                body: JSON.stringify(form),
            });
            // Redirect to editor so teacher can add modules/lessons and publish
            navigate(`/courses/${course.id}/edit`);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 32px 40px' }}>
            <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>
                    Створити курс
                </h2>
                <p style={{ color: '#9a9a9a', fontSize: '0.9rem' }}>
                    Після створення ви зможете додати модулі та уроки
                </p>
            </div>

            {error && (
                <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: '0.85rem', marginBottom: 16 }}>
                    {error}
                </div>
            )}

            <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Назва курсу *</label>
                <input
                    placeholder="Наприклад: Python для початківців"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    style={inp}
                />
            </div>

            <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Опис *</label>
                <textarea
                    placeholder="Що студенти дізнаються на цьому курсі?"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    style={{ ...inp, height: 100, resize: 'vertical' as const }}
                />
            </div>

            <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Категорія</label>
                <input
                    placeholder="Наприклад: Програмування"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    style={inp}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div>
                    <label style={lbl}>Рівень</label>
                    <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} style={inp}>
                        <option value="beginner">Початківець</option>
                        <option value="intermediate">Середній</option>
                        <option value="advanced">Просунутий</option>
                    </select>
                </div>
                <div>
                    <label style={lbl}>Ціна (₴)</label>
                    <input
                        type="number"
                        placeholder="0 = безкоштовно"
                        value={form.price}
                        min={0}
                        onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                        style={inp}
                    />
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                    width: '100%', padding: '13px',
                    background: loading ? '#d1d5db' : '#0a0a0a',
                    color: '#fff', border: 'none', borderRadius: 10,
                    fontSize: '0.95rem', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
                }}
            >
                {loading ? 'Створення...' : 'Створити курс →'}
            </button>
        </div>
    );
}

const lbl: React.CSSProperties = {
    display: 'block', marginBottom: 6,
    fontSize: '0.78rem', fontWeight: 500, color: '#5a5a5a',
    textTransform: 'uppercase', letterSpacing: '0.05em',
};
const inp: React.CSSProperties = {
    display: 'block', width: '100%', padding: '10px 14px',
    border: '1.5px solid #ebebeb', borderRadius: 8,
    fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none',
    background: '#fff', color: '#0a0a0a',
};
