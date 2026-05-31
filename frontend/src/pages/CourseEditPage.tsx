import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../context/AuthContext';

interface LessonData { id: string; title: string; type: string; contentUrl: string | null; textContent: string | null; durationSec: number; isFree: boolean; orderIndex: number; }
interface ModuleData  { id: string; title: string; orderIndex: number; lessons: LessonData[]; }
interface CourseData  { id: string; title: string; description: string; category: string; level: string; price: number; status: string; modules: ModuleData[]; }

interface QuizQuestion { question: string; options: string[]; correctIndex: number; }
const EMPTY_LESSON = { title: '', type: 'video', contentUrl: '', textContent: '', durationSec: 0, isFree: false };
const EMPTY_QUESTION: QuizQuestion = { question: '', options: ['', '', '', ''], correctIndex: 0 };

export function CourseEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [course, setCourse]       = useState<CourseData | null>(null);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState('');
    const [success, setSuccess]     = useState('');
    const [courseForm, setCourseForm] = useState({ title: '', description: '', category: '', level: 'beginner', price: 0 });
    const [newModTitle, setNewModTitle] = useState('');
    const [addingMod, setAddingMod] = useState(false);
    const [expandedMod, setExpandedMod] = useState<string | null>(null);
    const [lessonForms, setLessonForms] = useState<Record<string, typeof EMPTY_LESSON>>({});
    const [addingLesson, setAddingLesson] = useState<Record<string, boolean>>({});
    const [quizQuestions, setQuizQuestions] = useState<Record<string, QuizQuestion[]>>({});

    const load = async () => {
        if (!id) return;
        try {
            const c = await apiFetch<CourseData>(`/courses/${id}`);
            setCourse(c);
            setCourseForm({ title: c.title, description: c.description, category: c.category ?? '', level: c.level, price: Number(c.price) });
            if (c.modules?.length && !expandedMod) setExpandedMod(c.modules[0].id);
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [id]);

    const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 2500); };

    const saveCourse = async () => {
        setSaving(true); setError('');
        try {
            await apiFetch(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify(courseForm) });
            flash('Курс збережено');
            await load();
        } catch (e: any) { setError(e.message); }
        finally { setSaving(false); }
    };

    const publishCourse = async () => {
        setSaving(true); setError('');
        try {
            await apiFetch(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'published' }) });
            flash('Курс опубліковано! 🎉');
            await load();
        } catch (e: any) { setError(e.message); }
        finally { setSaving(false); }
    };

    const addModule = async () => {
        if (!newModTitle.trim()) return;
        setAddingMod(true);
        try {
            await apiFetch(`/courses/${id}/modules`, { method: 'POST', body: JSON.stringify({ title: newModTitle }) });
            setNewModTitle('');
            await load();
        } catch (e: any) { setError(e.message); }
        finally { setAddingMod(false); }
    };

    const deleteModule = async (moduleId: string) => {
        if (!window.confirm('Видалити модуль разом з усіма уроками?')) return;
        try {
            await apiFetch(`/courses/modules/${moduleId}`, { method: 'DELETE' });
            await load();
        } catch (e: any) { setError(e.message); }
    };

    const addLesson = async (moduleId: string) => {
        const form = lessonForms[moduleId] ?? { ...EMPTY_LESSON };
        if (!form.title.trim()) return;
        setAddingLesson(l => ({ ...l, [moduleId]: true }));
        try {
            const qs = quizQuestions[moduleId] ?? [];
            const quizContent = form.type === 'quiz'
                ? JSON.stringify(qs.filter(q => q.question.trim() && q.options.every(o => o.trim())))
                : undefined;
            await apiFetch(`/courses/modules/${moduleId}/lessons`, {
                method: 'POST',
                body: JSON.stringify({
                    title: form.title,
                    type: form.type,
                    contentUrl:  form.contentUrl  || undefined,
                    textContent: form.type === 'quiz' ? quizContent : (form.textContent || undefined),
                    durationSec: Number(form.durationSec) || 0,
                    isFree: form.isFree,
                }),
            });
            setLessonForms(f => ({ ...f, [moduleId]: { ...EMPTY_LESSON } }));
            setQuizQuestions(q => ({ ...q, [moduleId]: [] }));
            await load();
        } catch (e: any) { setError(e.message); }
        finally { setAddingLesson(l => ({ ...l, [moduleId]: false })); }
    };

    const deleteLesson = async (lessonId: string) => {
        if (!window.confirm('Видалити урок?')) return;
        try {
            await apiFetch(`/courses/lessons/${lessonId}`, { method: 'DELETE' });
            await load();
        } catch (e: any) { setError(e.message); }
    };

    if (loading) return <div style={s.center}>Завантаження...</div>;
    if (error && !course) return <div style={s.center}>{error}</div>;

    const isDraft = course?.status === 'draft';
    const totalLessons = course?.modules?.reduce((a, m) => a + m.lessons.length, 0) ?? 0;

    return (
        <div style={s.page}>
            <div style={s.topBar}>
                <div style={s.topInner} className="r-edit-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link to="/teacher" style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>← Панель</Link>
                        <span style={{ color: 'var(--border-strong)' }}>/</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{course?.title}</span>
                        <span style={{
                            padding: '2px 10px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 500,
                            background: isDraft ? '#fef9c3' : '#dcfce7',
                            color: isDraft ? '#a16207' : '#16a34a',
                            border: `1px solid ${isDraft ? '#fde047' : '#86efac'}`,
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>{isDraft ? 'чернетка' : 'опубліковано'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        {!isDraft && (
                            <Link to={`/courses/${id}`} target="_blank" style={{ ...s.btnSecondary, textDecoration: 'none' }}>
                                Переглянути →
                            </Link>
                        )}
                        {isDraft && totalLessons > 0 && (
                            <button onClick={publishCourse} disabled={saving} style={s.btnPublish}>
                                {saving ? '...' : '🚀 Опублікувати'}
                            </button>
                        )}
                        <button onClick={saveCourse} disabled={saving} style={s.btnSave}>
                            {saving ? 'Збереження...' : 'Зберегти'}
                        </button>
                    </div>
                </div>
            </div>

            {success && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 16px', color: '#16a34a', fontSize: '0.85rem', maxWidth: 1100, margin: '16px auto 0' }}>
                    {success}
                </div>
            )}
            {error && (
                <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 16px', color: '#dc2626', fontSize: '0.85rem', maxWidth: 1100, margin: '16px auto 0' }}>
                    {error}
                </div>
            )}

            <div style={s.body} className="r-edit-body">
                <div style={s.grid} className="r-edit-grid" >
                    <div style={s.col}>
                        <div style={s.card}>
                            <h3 style={s.cardTitle}>Інформація про курс</h3>
                            <Field label="Назва">
                                <input value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} style={inp} />
                            </Field>
                            <Field label="Опис">
                                <textarea value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp, height: 90, resize: 'vertical' as const }} />
                            </Field>
                            <div style={{ display: 'grid', gap: 12 }} className="r-two-col-equal">
                                <Field label="Категорія">
                                    <input value={courseForm.category} onChange={e => setCourseForm(f => ({ ...f, category: e.target.value }))} style={inp} placeholder="Програмування" />
                                </Field>
                                <Field label="Ціна (₴)">
                                    <input type="number" min={0} value={courseForm.price} onChange={e => setCourseForm(f => ({ ...f, price: Number(e.target.value) }))} style={inp} />
                                </Field>
                            </div>
                            <Field label="Рівень">
                                <select value={courseForm.level} onChange={e => setCourseForm(f => ({ ...f, level: e.target.value }))} style={inp}>
                                    <option value="beginner">Початківець</option>
                                    <option value="intermediate">Середній</option>
                                    <option value="advanced">Просунутий</option>
                                </select>
                            </Field>
                        </div>

                        {isDraft && (
                            <div style={{ ...s.card, background: '#fffbeb', borderColor: '#fde68a' }}>
                                <h3 style={{ ...s.cardTitle, color: '#92400e' }}>Публікація</h3>
                                <p style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: 14, lineHeight: 1.5 }}>
                                    Курс у статусі <strong>чернетка</strong> — студенти не бачать його в каталозі.
                                    {totalLessons === 0
                                        ? ' Додайте хоча б один урок щоб опублікувати.'
                                        : ` Готово (${totalLessons} уроків). Натисніть «Опублікувати» вгорі.`}
                                </p>
                            </div>
                        )}
                    </div>

                    <div style={s.col}>
                        <div style={s.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={s.cardTitle}>Програма курсу</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{totalLessons} уроків</span>
                            </div>

                            {course?.modules?.map(mod => (
                                <div key={mod.id} style={s.modBlock}>
                                    <div style={s.modHead} onClick={() => setExpandedMod(e => e === mod.id ? null : mod.id)}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginRight: 6 }}>{expandedMod === mod.id ? '▼' : '▶'}</span>
                                        <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem' }}>{mod.title}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginRight: 10 }}>{mod.lessons.length} ур.</span>
                                        <button onClick={e => { e.stopPropagation(); deleteModule(mod.id); }} style={s.btnDel} title="Видалити модуль">✕</button>
                                    </div>

                                    {expandedMod === mod.id && (
                                        <div style={{ padding: '4px 0 8px 16px' }}>
                                            {mod.lessons.map(l => (
                                                <div key={l.id} style={s.lessonRow}>
                                                    <span style={s.lessonIcon}>{l.type === 'video' ? '▶' : l.type === 'text' ? '文' : '?'}</span>
                                                    <span style={{ flex: 1, fontSize: '0.85rem' }}>{l.title}</span>
                                                    {l.isFree && <span style={s.freeBadge}>free</span>}
                                                    {l.durationSec > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{Math.round(l.durationSec / 60)}хв</span>}
                                                    <button onClick={() => deleteLesson(l.id)} style={{ ...s.btnDel, marginLeft: 8 }} title="Видалити урок">✕</button>
                                                </div>
                                            ))}

                                            <div style={s.addLessonBox}>
                                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                                    + Новий урок
                                                </p>
                                                <input
                                                    placeholder="Назва уроку"
                                                    value={lessonForms[mod.id]?.title ?? ''}
                                                    onChange={e => setLessonForms(f => ({ ...f, [mod.id]: { ...(f[mod.id] ?? { ...EMPTY_LESSON }), title: e.target.value } }))}
                                                    style={{ ...inp, marginBottom: 8 }}
                                                />
                                                <div style={{ display: 'grid', gap: 8, marginBottom: 8 }} className="r-two-col-equal">
                                                    <select
                                                        value={lessonForms[mod.id]?.type ?? 'video'}
                                                        onChange={e => setLessonForms(f => ({ ...f, [mod.id]: { ...(f[mod.id] ?? { ...EMPTY_LESSON }), type: e.target.value } }))}
                                                        style={inp}
                                                    >
                                                        <option value="video">Відео</option>
                                                        <option value="text">Текст</option>
                                                        <option value="quiz">Квіз</option>
                                                    </select>
                                                    <div style={{ position: 'relative' as const }}>
                                                        <input
                                                            type="number" placeholder="0"
                                                            value={lessonForms[mod.id]?.durationSec ? Math.round(lessonForms[mod.id].durationSec / 60) : ''}
                                                            min={0}
                                                            onChange={e => setLessonForms(f => ({ ...f, [mod.id]: { ...(f[mod.id] ?? { ...EMPTY_LESSON }), durationSec: Number(e.target.value) * 60 } }))}
                                                            style={{ ...inp, paddingRight: 36 }}
                                                        />
                                                        <span style={{ position: 'absolute' as const, right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-tertiary)', pointerEvents: 'none' as const }}>хв</span>
                                                    </div>
                                                </div>
                                                {(lessonForms[mod.id]?.type ?? 'video') === 'video' && (
                                                    <input
                                                        placeholder="URL відео (необов'язково)"
                                                        value={lessonForms[mod.id]?.contentUrl ?? ''}
                                                        onChange={e => setLessonForms(f => ({ ...f, [mod.id]: { ...(f[mod.id] ?? { ...EMPTY_LESSON }), contentUrl: e.target.value } }))}
                                                        style={{ ...inp, marginBottom: 8 }}
                                                    />
                                                )}
                                                {(lessonForms[mod.id]?.type ?? 'video') === 'text' && (
                                                    <textarea
                                                        placeholder="Текст уроку (HTML)"
                                                        value={lessonForms[mod.id]?.textContent ?? ''}
                                                        onChange={e => setLessonForms(f => ({ ...f, [mod.id]: { ...(f[mod.id] ?? { ...EMPTY_LESSON }), textContent: e.target.value } }))}
                                                        style={{ ...inp, height: 80, marginBottom: 8, resize: 'vertical' as const }}
                                                    />
                                                )}
                                                {(lessonForms[mod.id]?.type ?? 'video') === 'quiz' && (
                                                    <div style={{ marginBottom: 8 }}>
                                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                                                            Питання квізу ({(quizQuestions[mod.id] ?? []).length})
                                                        </p>
                                                        {(quizQuestions[mod.id] ?? []).map((q, qi) => (
                                                            <div key={qi} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', flexShrink: 0 }}>Q{qi + 1}</span>
                                                                    <input
                                                                        placeholder="Текст питання"
                                                                        value={q.question}
                                                                        onChange={e => setQuizQuestions(prev => {
                                                                            const arr = [...(prev[mod.id] ?? [])];
                                                                            arr[qi] = { ...arr[qi], question: e.target.value };
                                                                            return { ...prev, [mod.id]: arr };
                                                                        })}
                                                                        style={{ ...inp, marginBottom: 0, flex: 1 }}
                                                                    />
                                                                    <button
                                                                        onClick={() => setQuizQuestions(prev => {
                                                                            const arr = (prev[mod.id] ?? []).filter((_, i) => i !== qi);
                                                                            return { ...prev, [mod.id]: arr };
                                                                        })}
                                                                        style={{ background: 'none', border: 'none', color: 'var(--border-strong)', cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0 }}
                                                                    >✕</button>
                                                                </div>
                                                                {q.options.map((opt, oi) => (
                                                                    <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                                        <input
                                                                            type="radio"
                                                                            name={`correct-${mod.id}-${qi}`}
                                                                            checked={q.correctIndex === oi}
                                                                            onChange={() => setQuizQuestions(prev => {
                                                                                const arr = [...(prev[mod.id] ?? [])];
                                                                                arr[qi] = { ...arr[qi], correctIndex: oi };
                                                                                return { ...prev, [mod.id]: arr };
                                                                            })}
                                                                            title="Правильна відповідь"
                                                                        />
                                                                        <input
                                                                            placeholder={`Варіант ${oi + 1}`}
                                                                            value={opt}
                                                                            onChange={e => setQuizQuestions(prev => {
                                                                                const arr = [...(prev[mod.id] ?? [])];
                                                                                const opts = [...arr[qi].options];
                                                                                opts[oi] = e.target.value;
                                                                                arr[qi] = { ...arr[qi], options: opts };
                                                                                return { ...prev, [mod.id]: arr };
                                                                            })}
                                                                            style={{
                                                                                ...inp, marginBottom: 0, flex: 1,
                                                                                borderColor: q.correctIndex === oi ? '#86efac' : 'var(--border)',
                                                                                background: q.correctIndex === oi ? '#f0fdf4' : 'var(--bg-elevated)',
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => setQuizQuestions(prev => ({
                                                                ...prev,
                                                                [mod.id]: [...(prev[mod.id] ?? []), { ...EMPTY_QUESTION, options: ['', '', '', ''] }],
                                                            }))}
                                                            style={{ ...inp, textAlign: 'center', cursor: 'pointer', color: 'var(--text-secondary)', borderStyle: 'dashed', marginBottom: 0 }}
                                                        >
                                                            + Додати питання
                                                        </button>
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={lessonForms[mod.id]?.isFree ?? false}
                                                            onChange={e => setLessonForms(f => ({ ...f, [mod.id]: { ...(f[mod.id] ?? { ...EMPTY_LESSON }), isFree: e.target.checked } }))}
                                                        />
                                                        Безкоштовний перегляд
                                                    </label>
                                                    <button
                                                        onClick={() => addLesson(mod.id)}
                                                        disabled={addingLesson[mod.id]}
                                                        style={s.btnAdd}
                                                    >
                                                        {addingLesson[mod.id] ? '...' : 'Додати урок'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div style={s.addModBox}>
                                <input
                                    placeholder="Назва нового модуля"
                                    value={newModTitle}
                                    onChange={e => setNewModTitle(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addModule()}
                                    style={{ ...inp, flex: 1 }}
                                />
                                <button onClick={addModule} disabled={addingMod || !newModTitle.trim()} style={s.btnAdd}>
                                    {addingMod ? '...' : '+ Модуль'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                {label}
            </label>
            {children}
        </div>
    );
}

const inp: React.CSSProperties = {
    display: 'block', width: '100%', padding: '9px 12px',
    border: '1.5px solid var(--border)', borderRadius: 7,
    fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none',
    background: 'var(--bg-elevated)', color: 'var(--text)',
};

const s: Record<string, React.CSSProperties> = {
    page:    { minHeight: '100vh', background: 'var(--bg-subtle)' },
    center:  { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-tertiary)' },
    topBar:  { background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', padding: '12px 0', position: 'sticky', top: 0, zIndex: 10 },
    topInner:{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    body:    { maxWidth: 1100, margin: '24px auto', padding: '0 24px 40px' },
    grid:    { display: 'grid', gap: 20 },
    col:     { display: 'flex', flexDirection: 'column', gap: 16 },
    card:    { background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', borderRadius: 12, padding: 20 },
    cardTitle: { fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, color: 'var(--text)' },
    modBlock:{ border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8, overflow: 'hidden' },
    modHead: { display: 'flex', alignItems: 'center', padding: '10px 14px', cursor: 'pointer', background: 'var(--bg)', gap: 4 },
    lessonRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, marginBottom: 2, background: 'var(--bg-elevated)' },
    lessonIcon: { fontSize: '0.65rem', width: 18, textAlign: 'center', flexShrink: 0, color: 'var(--text-tertiary)' },
    freeBadge: { fontSize: '0.65rem', padding: '1px 6px', borderRadius: 4, background: '#dcfce7', color: '#16a34a', fontWeight: 500 },
    addLessonBox: { background: 'var(--bg)', border: '1px dashed #d6d6d6', borderRadius: 8, padding: 12, marginTop: 6 },
    addModBox: { display: 'flex', gap: 8, marginTop: 12 },
    btnSave:   { padding: '8px 18px', background: 'var(--accent)', color: 'var(--bg-elevated)', border: 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' },
    btnPublish:{ padding: '8px 18px', background: '#16a34a', color: 'var(--bg-elevated)', border: 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' },
    btnSecondary: { padding: '8px 16px', background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem', cursor: 'pointer' },
    btnAdd:    { padding: '8px 14px', background: 'var(--accent)', color: 'var(--bg-elevated)', border: 'none', borderRadius: 7, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' },
    btnDel:    { padding: '2px 6px', background: 'transparent', color: 'var(--border-strong)', border: 'none', borderRadius: 4, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 },
};