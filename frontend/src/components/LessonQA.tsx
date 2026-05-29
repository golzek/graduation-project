import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch, useAuth } from '../context/AuthContext';


interface QaAuthor {
    id: string;
    name: string;
}

interface QaAnswer {
    id: string;
    body: string;
    author: QaAuthor;
    isInstructor: boolean;
    createdAt: string;
}

interface QaQuestion {
    id: string;
    body: string;
    author: QaAuthor;
    answerCount: number;
    answers: QaAnswer[];
    createdAt: string;
}


function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'щойно';
    if (m < 60) return `${m} хв тому`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} год тому`;
    return `${Math.floor(h / 24)} дн тому`;
}


export function LessonQA({ lessonId, isEnrolled }: { lessonId: string; isEnrolled: boolean }) {
    const { user } = useAuth();
    const [questions,  setQuestions]  = useState<QaQuestion[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [newBody,    setNewBody]    = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error,      setError]      = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const data = await apiFetch<QaQuestion[]>(`/qa/lesson/${lessonId}`);
            setQuestions(data);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, [lessonId]);

    useEffect(() => { setLoading(true); load(); }, [load]);

    const submit = async () => {
        if (newBody.trim().length < 5) { setError('Питання має бути не менше 5 символів'); return; }
        setError(null);
        setSubmitting(true);
        try {
            await apiFetch('/qa/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, body: newBody.trim() }),
            });
            setNewBody('');
            await load();
        } catch (e: any) { setError(e.message ?? 'Помилка'); }
        finally { setSubmitting(false); }
    };

    const deleteQuestion = async (id: string) => {
        await apiFetch(`/qa/questions/${id}`, { method: 'DELETE' });
        setQuestions(q => q.filter(x => x.id !== id));
    };

    if (loading) return <div style={s.empty}>Завантаження Q&amp;A…</div>;

    return (
        <div style={s.wrap}>
            <p style={s.sectionLabel}>ПИТАННЯ ТА ВІДПОВІДІ</p>

            {isEnrolled ? (
                <div style={s.form}>
          <textarea
              style={s.textarea}
              placeholder="Маєш питання до цього уроку?"
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
              rows={3}
              maxLength={1000}
          />
                    {error && <p style={s.err}>{error}</p>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                        <button
                            style={submitting || newBody.trim().length < 5 ? s.btnDisabled : s.btnPrimary}
                            onClick={submit}
                            disabled={submitting || newBody.trim().length < 5}
                        >
                            {submitting ? 'Надсилання…' : 'Запитати'}
                        </button>
                    </div>
                </div>
            ) : (
                <div style={s.lockedNote}>Запишіться на курс, щоб задавати питання</div>
            )}

            {questions.length === 0
                ? <div style={s.empty}>Поки немає питань — будь першим!</div>
                : (
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
                        {questions.map((q, i) => (
                            <QuestionItem
                                key={q.id}
                                question={q}
                                currentUserId={user?.id}
                                isEnrolled={isEnrolled}
                                onDelete={() => deleteQuestion(q.id)}
                                onAnswered={load}
                                divider={i < questions.length - 1}
                            />
                        ))}
                    </div>
                )
            }
        </div>
    );
}

function QuestionItem({
                          question, currentUserId, isEnrolled, onDelete, onAnswered, divider,
                      }: {
    question: QaQuestion;
    currentUserId?: string;
    isEnrolled: boolean;
    onDelete: () => void;
    onAnswered: () => void;
    divider: boolean;
}) {
    const [open,      setOpen]      = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [replying,  setReplying]  = useState(false);
    const [showForm,  setShowForm]  = useState(false);
    const isOwner = currentUserId === question.author?.id;

    const submitAnswer = async () => {
        if (!replyBody.trim()) return;
        setReplying(true);
        try {
            await apiFetch('/qa/answers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionId: question.id, body: replyBody.trim() }),
            });
            setReplyBody('');
            setShowForm(false);
            onAnswered();
        } finally { setReplying(false); }
    };

    const ansCount = question.answerCount;
    const ansLabel = ansCount === 1 ? 'відповідь' : ansCount < 5 ? 'відповіді' : 'відповідей';

    return (
        <div style={{ borderBottom: divider ? '1px solid #ebebeb' : 'none' }}>
            <div style={s.qRow}>
                <div style={s.avatar}>{(question.author?.name ?? '?')[0].toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.qMeta}>
                        <span style={s.qAuthor}>{question.author?.name ?? 'Студент'}</span>
                        <span style={s.qTime}>{timeAgo(question.createdAt)}</span>
                        {isOwner && (
                            <button style={s.delBtn} onClick={onDelete} title="Видалити питання">✕</button>
                        )}
                    </div>
                    <p style={s.qBody}>{question.body}</p>

                    {ansCount > 0 && (
                        <button style={s.toggleBtn} onClick={() => setOpen(o => !o)}>
                            {open ? '▲' : '▼'} {ansCount} {ansLabel}
                        </button>
                    )}

                    {open && (
                        <div style={s.answersWrap}>
                            {question.answers.map(a => (
                                <AnswerItem
                                    key={a.id}
                                    answer={a}
                                    currentUserId={currentUserId}
                                    onDeleted={onAnswered}
                                />
                            ))}
                            {isEnrolled && !showForm && (
                                <button style={{ ...s.toggleBtn, marginTop: 8 }} onClick={() => setShowForm(true)}>
                                    + Написати відповідь
                                </button>
                            )}
                            {showForm && (
                                <div style={{ marginTop: 12 }}>
                  <textarea
                      style={s.textarea}
                      placeholder="Ваша відповідь…"
                      value={replyBody}
                      onChange={e => setReplyBody(e.target.value)}
                      rows={2}
                      maxLength={2000}
                  />
                                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                        <button
                                            style={replyBody.trim() ? s.btnSmall : s.btnSmallDisabled}
                                            onClick={submitAnswer}
                                            disabled={replying || !replyBody.trim()}
                                        >
                                            {replying ? '…' : 'Надіслати'}
                                        </button>
                                        <button
                                            style={s.btnSmallGhost}
                                            onClick={() => { setShowForm(false); setReplyBody(''); }}
                                        >
                                            Скасувати
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {isEnrolled && ansCount === 0 && !open && (
                        <button
                            style={s.toggleBtn}
                            onClick={() => { setOpen(true); setShowForm(true); }}
                        >
                            + Відповісти
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function AnswerItem({
                        answer, currentUserId, onDeleted,
                    }: {
    answer: QaAnswer;
    currentUserId?: string;
    onDeleted: () => void;
}) {
    const isOwner = currentUserId === answer.author?.id;

    const del = async () => {
        await apiFetch(`/qa/answers/${answer.id}`, { method: 'DELETE' });
        onDeleted();
    };

    return (
        <div style={s.answerRow}>
            <div style={answer.isInstructor ? s.avatarInstructor : s.avatar}>
                {(answer.author?.name ?? '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.qMeta}>
          <span style={answer.isInstructor ? s.instructorName : s.qAuthor}>
            {answer.author?.name ?? 'Користувач'}
          </span>
                    {answer.isInstructor && <span style={s.badge}>Викладач</span>}
                    <span style={s.qTime}>{timeAgo(answer.createdAt)}</span>
                    {isOwner && (
                        <button style={s.delBtn} onClick={del} title="Видалити відповідь">✕</button>
                    )}
                </div>
                <p style={s.qBody}>{answer.body}</p>
            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    wrap: { marginTop: 40, paddingTop: 32, borderTop: '1px solid #ebebeb' },

    sectionLabel: {
        fontSize: '0.7rem', fontWeight: 500,
        textTransform: 'uppercase' as const, letterSpacing: '0.07em',
        color: '#9a9a9a', marginBottom: 20,
    },

    form: {
        marginBottom: 28,
        border: '1.5px solid #ebebeb', borderRadius: 10,
        padding: '14px 16px', background: '#fff',
    },
    textarea: {
        width: '100%', border: 'none', outline: 'none',
        resize: 'vertical' as const, fontSize: '0.875rem',
        lineHeight: 1.6, color: '#0a0a0a', background: 'transparent',
        fontFamily: 'inherit', minHeight: 64,
        boxSizing: 'border-box' as const,
    },

    lockedNote: {
        padding: '12px 16px', marginBottom: 24,
        background: '#fafafa', border: '1px solid #ebebeb',
        borderRadius: 8, fontSize: '0.85rem', color: '#9a9a9a',
    },

    empty: {
        padding: '28px 0', textAlign: 'center' as const,
        fontSize: '0.875rem', color: '#9a9a9a',
    },

    qRow: {
        display: 'flex', gap: 12, padding: '16px 0', alignItems: 'flex-start',
    },
    answerRow: {
        display: 'flex', gap: 10, padding: '10px 0 4px 0', alignItems: 'flex-start',
    },
    answersWrap: {
        paddingLeft: 12, marginTop: 4,
        borderLeft: '2px solid #f0f0f0',
    },

    avatar: {
        width: 32, height: 32, borderRadius: '50%',
        background: '#ebebeb', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600,
        color: '#5a5a5a', flexShrink: 0,
    },
    avatarInstructor: {
        width: 32, height: 32, borderRadius: '50%',
        background: '#0a0a0a', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600,
        color: '#fafafa', flexShrink: 0,
    },

    qMeta: {
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 4, flexWrap: 'wrap' as const,
    },
    qAuthor:       { fontSize: '0.8rem', fontWeight: 600, color: '#0a0a0a' },
    instructorName: { fontSize: '0.8rem', fontWeight: 600, color: '#0a0a0a' },
    qTime:         { fontSize: '0.75rem', color: '#9a9a9a' },

    badge: {
        fontSize: '0.65rem', fontWeight: 500,
        padding: '1px 7px', borderRadius: 99,
        background: '#0a0a0a', color: '#fafafa',
        letterSpacing: '0.03em',
    },

    qBody: { fontSize: '0.875rem', lineHeight: 1.6, color: '#2a2a2a', margin: '0 0 8px 0' },

    toggleBtn: {
        background: 'none', border: 'none', padding: 0,
        fontSize: '0.78rem', color: '#9a9a9a',
        cursor: 'pointer', fontFamily: 'inherit',
    },
    delBtn: {
        background: 'none', border: 'none', padding: '0 4px',
        fontSize: '0.7rem', color: '#d6d6d6',
        cursor: 'pointer', marginLeft: 'auto', lineHeight: 1,
    },

    btnPrimary: {
        padding: '8px 20px', background: '#0a0a0a', color: '#fafafa',
        border: 'none', borderRadius: 7, fontSize: '0.85rem',
        fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
    },
    btnDisabled: {
        padding: '8px 20px', background: '#e5e7eb', color: '#9a9a9a',
        border: 'none', borderRadius: 7, fontSize: '0.85rem',
        fontWeight: 500, cursor: 'default', fontFamily: 'inherit',
    },
    btnSmall: {
        padding: '6px 14px', background: '#0a0a0a', color: '#fafafa',
        border: 'none', borderRadius: 6, fontSize: '0.8rem',
        fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
    },
    btnSmallDisabled: {
        padding: '6px 14px', background: '#e5e7eb', color: '#9a9a9a',
        border: 'none', borderRadius: 6, fontSize: '0.8rem',
        cursor: 'default', fontFamily: 'inherit',
    },
    btnSmallGhost: {
        padding: '6px 14px', background: 'transparent', color: '#5a5a5a',
        border: '1px solid #ebebeb', borderRadius: 6, fontSize: '0.8rem',
        cursor: 'pointer', fontFamily: 'inherit',
    },
    err: { fontSize: '0.78rem', color: '#dc2626', margin: '4px 0 0' },
};