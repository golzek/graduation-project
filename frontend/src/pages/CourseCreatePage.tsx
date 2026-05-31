import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../context/AuthContext';

interface FormState {
    title: string;
    description: string;
    category: string;
    level: string;
    price: number;
}

const REQUIRED_FIELDS: (keyof FormState)[] = ['title', 'description', 'category'];

const FIELD_LABELS: Record<string, string> = {
    title:       "Назва курсу",
    description: "Опис",
    category:    "Категорія",
};

const FIELD_HINTS: Record<string, string> = {
    title:       "Коротка і чітка назва — перше що бачить студент у каталозі",
    description: "Опишіть що студент отримає після проходження курсу",
    category:    "Наприклад: Програмування, Дизайн, Маркетинг",
};

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim())
        errs.title = "Введіть назву курсу";
    else if (form.title.trim().length < 5)
        errs.title = "Назва занадто коротка — мінімум 5 символів";
    if (!form.description.trim())
        errs.description = "Введіть опис курсу";
    else if (form.description.trim().length < 20)
        errs.description = "Опис занадто короткий — мінімум 20 символів";
    if (!form.category.trim())
        errs.category = "Вкажіть категорію курсу";
    if (form.price < 0)
        errs.price = "Ціна не може бути від'ємною";
    return errs;
}

export function CourseCreatePage() {
    const navigate = useNavigate();
    const [form, setForm] = useState<FormState>({
        title: '', description: '', category: '', level: 'beginner', price: 0,
    });
    const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [loading, setLoading]   = useState(false);
    const [serverError, setServerError] = useState('');

    const errors = validate(form);
    const hasErrors = Object.keys(errors).length > 0;

    const fieldError = (field: keyof FormState) =>
        (touched[field] || submitAttempted) ? errors[field] : undefined;

    const touch = (field: keyof FormState) =>
        setTouched(t => ({ ...t, [field]: true }));

    const set = (field: keyof FormState, value: string | number) =>
        setForm(f => ({ ...f, [field]: value }));

    const handleSubmit = async () => {
        setSubmitAttempted(true);
        if (hasErrors) return;
        setLoading(true);
        setServerError('');
        try {
            const course = await apiFetch<any>('/courses', {
                method: 'POST',
                body: JSON.stringify(form),
            });
            navigate(`/courses/${course.id}/edit`);
        } catch (e: any) {
            setServerError(e.message ?? 'Помилка при створенні курсу');
        } finally {
            setLoading(false);
        }
    };

    const completedCount = REQUIRED_FIELDS.filter(f => !errors[f]).length;
    const progressPct    = Math.round((completedCount / REQUIRED_FIELDS.length) * 100);

    return (
        <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 32px 40px' }} className="r-course-create-wrap">
            <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>
                    Створити курс
                </h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    Після створення ви зможете додати модулі та уроки
                </p>
            </div>

            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 6 }}>
                    <span>Обов'язкові поля заповнено</span>
                    <span style={{ fontWeight: 500, color: progressPct === 100 ? '#16a34a' : 'var(--text-secondary)' }}>
                        {completedCount} / {REQUIRED_FIELDS.length}
                    </span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', borderRadius: 99,
                        width: `${progressPct}%`,
                        background: progressPct === 100 ? '#16a34a' : 'var(--accent)',
                        transition: 'width 0.3s',
                    }} />
                </div>
            </div>

            {serverError && (
                <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: '0.85rem', marginBottom: 16 }}>
                    {serverError}
                </div>
            )}

            <Field
                label="Назва курсу" required
                hint={FIELD_HINTS.title}
                error={fieldError('title')}
            >
                <input
                    placeholder="Наприклад: Python для початківців"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    onBlur={() => touch('title')}
                    style={inpStyle(!!fieldError('title'))}
                />
            </Field>

            <Field
                label="Опис" required
                hint={FIELD_HINTS.description}
                error={fieldError('description')}
            >
                <textarea
                    placeholder="Що студенти дізнаються на цьому курсі?"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    onBlur={() => touch('description')}
                    style={{ ...inpStyle(!!fieldError('description')), height: 100, resize: 'vertical' as const }}
                />
            </Field>

            <Field
                label="Категорія" required
                hint={FIELD_HINTS.category}
                error={fieldError('category')}
            >
                <input
                    placeholder="Наприклад: Програмування"
                    value={form.category}
                    onChange={e => set('category', e.target.value)}
                    onBlur={() => touch('category')}
                    style={inpStyle(!!fieldError('category'))}
                />
            </Field>

            <div style={{ display: 'grid', gap: 12, marginBottom: 24 }} className="r-two-col-equal">
                <Field label="Рівень">
                    <select
                        value={form.level}
                        onChange={e => set('level', e.target.value)}
                        style={inpStyle(false)}
                    >
                        <option value="beginner">Початківець</option>
                        <option value="intermediate">Середній</option>
                        <option value="advanced">Просунутий</option>
                    </select>
                </Field>
                <Field label="Ціна (₴)" error={fieldError('price')}>
                    <input
                        type="number"
                        placeholder="0 = безкоштовно"
                        value={form.price}
                        min={0}
                        onChange={e => set('price', Number(e.target.value))}
                        onBlur={() => touch('price')}
                        style={inpStyle(!!fieldError('price'))}
                    />
                </Field>
            </div>

            {submitAttempted && hasErrors && (
                <div style={{ padding: '10px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, color: '#c2410c', fontSize: '0.82rem', marginBottom: 16 }}>
                    Будь ласка, заповніть всі обов'язкові поля перед створенням курсу
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                    width: '100%', padding: '13px',
                    background: loading ? '#d1d5db' : 'var(--text)',
                    color: 'var(--bg-elevated)', border: 'none', borderRadius: 10,
                    fontSize: '0.95rem', fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    opacity: (submitAttempted && hasErrors) ? 0.6 : 1,
                }}
            >
                {loading ? 'Створення...' : 'Створити курс →'}
            </button>
        </div>
    );
}

function Field({ label, required, hint, error, children }: {
    label: string; required?: boolean; hint?: string;
    error?: string; children: React.ReactNode;
}) {
    return (
        <div style={{ marginBottom: 18 }}>
            <label style={lbl}>
                {label}
                {required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
            </label>
            {children}
            {error ? (
                <p style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>⚠</span> {error}
                </p>
            ) : hint ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 5 }}>
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

const lbl: React.CSSProperties = {
    display: 'block', marginBottom: 6,
    fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
};

function inpStyle(hasError: boolean): React.CSSProperties {
    return {
        display: 'block', width: '100%', padding: '10px 14px',
        border: `1.5px solid ${hasError ? '#fca5a5' : 'var(--border)'}`,
        borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' as const,
        outline: 'none', background: hasError ? '#fff5f5' : 'var(--bg-elevated)',
        color: 'var(--text)', fontFamily: 'inherit',
        transition: 'border-color 0.15s',
    };
}