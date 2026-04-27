import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../context/AuthContext';

export function CourseCreatePage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ title: '', description: '', category: '', level: 'beginner', price: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setLoading(true); setError('');
        try {
            const course = await apiFetch<any>('/courses', {
                method: 'POST',
                body: JSON.stringify(form),
            });
            navigate(`/courses/${course.id}`);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '40px auto', padding: 32 }}>
            <h2>Створити курс</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <input placeholder="Назва" value={form.title}
                   onChange={e => setForm({ ...form, title: e.target.value })} style={inp} />
            <textarea placeholder="Опис" value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inp, height: 100 }} />
            <input placeholder="Категорія" value={form.category}
                   onChange={e => setForm({ ...form, category: e.target.value })} style={inp} />
            <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} style={inp}>
                <option value="beginner">Початківець</option>
                <option value="intermediate">Середній</option>
                <option value="advanced">Просунутий</option>
            </select>
            <input type="number" placeholder="Ціна (0 = безкоштовно)" value={form.price}
                   onChange={e => setForm({ ...form, price: Number(e.target.value) })} style={inp} />
            <button onClick={handleSubmit} disabled={loading}
                    style={{ width: '100%', padding: 14, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, cursor: 'pointer' }}>
                {loading ? 'Створення...' : 'Створити курс'}
            </button>
        </div>
    );
}
const inp: React.CSSProperties = { display: 'block', width: '100%', padding: '10px 14px', marginBottom: 12, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' };