import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../components/Toast';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCourse, useCourseProgress, useCourseActions, Lesson, CourseModule } from '../hooks/useCourses';
import { useAuth, apiFetch } from '../context/AuthContext';
import { WishlistButton } from '../components/WishlistButton';
import { LessonQA } from '../components/LessonQA';
import { PaymentButton } from '../components/PaymentButton';

export function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { course, loading, error } = useCourse(id!);
  const { progress, refresh: refreshProgress } = useCourseProgress(id!);
  const { enroll, issueCertificate } = useCourseActions();
  const [enrolling, setEnrolling] = useState(false);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [certModal, setCertModal] = useState<{ pdfUrl: string; verifyCode: string } | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (course?.modules?.length) {
      const first = course.modules[0]?.lessons?.[0];
      if (first && (first.isFree || course.isEnrolled)) setActiveLesson(first);
    }
  }, [course]);
    const issuingRef = React.useRef(false);
    const handleProgressSaved = async () => {
        refreshProgress();
        try {
            const updated = await apiFetch<{ percent: number }>(`/courses/${id}/progress`);
            if (updated.percent === 100 && !issuingRef.current) {
                issuingRef.current = true;
                try {
                    const cert = await issueCertificate(id!);
                    setCertModal({ pdfUrl: cert.pdfUrl, verifyCode: cert.verifyCode });
                } catch (e: any) {
                    if (!e?.message?.includes('вже виданий')) {
                        setCertModal({ pdfUrl: '', verifyCode: '' });
                    }
                } finally {
                    issuingRef.current = false;
                }
            }
        } catch { /* ignore */ }
    };

  const handleEnroll = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setEnrolling(true);
    try { await enroll(id!); window.location.reload(); }
    catch (e: any) { toast.error(e.message ?? 'Помилка запису на курс'); }
    finally { setEnrolling(false); }
  };

  if (loading) return <div style={s.centered}>Завантаження...</div>;
  if (error || !course) return <div style={s.centered}>Курс не знайдено</div>;

  const totalLessons  = course.modules.reduce((a, m) => a + m.lessons.length, 0);
  const totalDuration = course.modules.flatMap(m => m.lessons).reduce((a, l) => a + l.durationSec, 0);

  return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.headerInner}>
            <div style={s.headerLeft}>
              <p style={s.breadcrumb}>
                <a href="/courses" style={{ color: '#9a9a9a' }}>Каталог</a>
                {' / '}<span style={{ color: '#5a5a5a' }}>{course.category}</span>
              </p>
              <h1 style={s.title}>{course.title}</h1>
              <p style={s.desc}>{course.description}</p>
              <div style={s.meta}>
                <span>
                    <Link to={`/instructors/${course.author?.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {course.author?.name}
                    </Link>
                  </span>
                <span style={s.dot}>·</span>
                <span>{totalLessons} уроків</span>
                <span style={s.dot}>·</span>
                <span>{Math.round(totalDuration / 60)} хв</span>
                <span style={s.dot}>·</span>
                <span style={s.levelBadge}>{course.level}</span>
              </div>
            </div>

            <div style={s.card}>
              <p style={s.cardPrice}>
                {Number(course.price) === 0 ? 'Безкоштовно' : `${course.price} ₴`}
              </p>

              {progress && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#9a9a9a', marginBottom: 6 }}>
                      <span>Прогрес</span><strong style={{ color: '#0a0a0a' }}>{progress.percent}%</strong>
                    </div>
                    <div style={s.progressTrack}>
                      <div style={{ ...s.progressFill, width: `${progress.percent}%` }} />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#9a9a9a', marginTop: 4 }}>
                      {progress.completedCount} / {progress.totalCount} уроків
                    </p>
                  </div>
              )}

              {course.isEnrolled ? (
                  <button style={s.btnOutline}>Продовжити навчання</button>
              ) : Number(course.price) === 0 ? (
                  <button style={s.btnPrimary} onClick={handleEnroll} disabled={enrolling}>
                    {enrolling ? 'Записуємось...' : 'Записатись'}
                  </button>
              ) : (
                  <PaymentButton
                      courseId={course.id}
                      price={Number(course.price)}
                      title={course.title}
                      onSuccess={() => window.location.reload()}
                  />
              )}

              {!course.isEnrolled && (
                  <div style={{ marginTop: 10 }}>
                    <WishlistButton courseId={course.id} variant="full" />
                  </div>
              )}
            </div>
          </div>
        </div>

        <div style={s.body}>
          <aside style={s.sidebar}>
            <p style={s.sideTitle}>Програма</p>
            {course.modules.map(mod => (
                <ModuleBlock key={mod.id} mod={mod}
                             isEnrolled={!!course.isEnrolled}
                             activeId={activeLesson?.id}
                             onSelect={setActiveLesson} />
            ))}
          </aside>

          <div style={s.player}>
            {activeLesson
                ? <LessonPlayer
                    lesson={activeLesson}
                    isEnrolled={!!course.isEnrolled}
                    onProgressSaved={handleProgressSaved}
                />
                : <div style={s.playerEmpty}>
                  <p style={{ color: '#9a9a9a', fontSize: '0.9rem' }}>
                    {course.isEnrolled ? '← Вибери урок' : 'Запишись на курс для доступу до уроків'}
                  </p>
                </div>
            }
          </div>
        </div>
        {certModal && (
            <div style={modal.overlay} onClick={() => setCertModal(null)}>
              <div style={modal.box} onClick={e => e.stopPropagation()}>
                <div style={modal.emoji}>🎓</div>
                <h2 style={modal.title}>Вітаємо! Курс завершено</h2>
                <p style={modal.sub}>Ви пройшли всі уроки курсу <strong>«{course.title}»</strong></p>
                {certModal.pdfUrl && (
                    <a href={certModal.pdfUrl} target="_blank" rel="noreferrer" style={modal.btnPrimary}>
                      Завантажити сертифікат (PDF)
                    </a>
                )}
                <a href="/certificates" style={modal.btnOutline}>Мої сертифікати</a>
                {certModal.verifyCode && (
                    <p style={modal.code}>Код верифікації: <code>{certModal.verifyCode}</code></p>
                )}
                {!reviewSubmitted ? (
                    <ReviewForm courseId={id!} onSubmitted={() => setReviewSubmitted(true)} />
                ) : (
                    <div style={{ marginTop: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: '0.82rem', color: '#16a34a' }}>
                      ✓ Дякуємо за відгук! Він з'явиться після модерації.
                    </div>
                )}
                <button style={modal.close} onClick={() => setCertModal(null)}>✕</button>
              </div>
            </div>
        )}
      </div>
  );
}

function ModuleBlock({ mod, isEnrolled, activeId, onSelect }: {
  mod: CourseModule; isEnrolled: boolean;
  activeId?: string; onSelect: (l: Lesson) => void;
}) {
  const [open, setOpen] = useState(true);
  const icons: Record<string, string> = { video: '▶', text: '文', quiz: '?' };
  return (
      <div style={ms.block}>
        <div style={ms.modHeader} onClick={() => setOpen(o => !o)}>
          <span style={ms.modTitle}>{mod.title}</span>
          <span style={ms.modCount}>{mod.lessons.length}</span>
        </div>
        {open && mod.lessons.map(l => {
          const locked  = !l.isFree && !isEnrolled;
          const isActive = l.id === activeId;
          return (
              <div key={l.id}
                   style={{ ...ms.lesson, ...(isActive ? ms.lessonActive : {}), ...(locked ? ms.lessonLocked : {}) }}
                   onClick={() => !locked && onSelect(l)}>
                <span style={ms.icon}>{locked ? '○' : icons[l.type]}</span>
                <span style={ms.lessonTitle}>{l.title}</span>
                {l.durationSec > 0 && <span style={ms.dur}>{Math.round(l.durationSec/60)}хв</span>}
              </div>
          );
        })}
      </div>
  );
}

const ms: Record<string, React.CSSProperties> = {
  block:       { marginBottom: 4 },
  modHeader:   { display: 'flex', alignItems: 'center', padding: '8px 0', cursor: 'pointer', gap: 8 },
  modTitle:    { flex: 1, fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: '#5a5a5a' },
  modCount:    { fontSize: '0.75rem', color: '#9a9a9a' },
  lesson:      { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, cursor: 'pointer', transition: 'background 0.1s' },
  lessonActive:{ background: '#0a0a0a', color: '#fafafa' },
  lessonLocked:{ opacity: 0.4, cursor: 'default' },
  icon:        { fontSize: '0.65rem', width: 16, textAlign: 'center' as const, flexShrink: 0 },
  lessonTitle: { flex: 1, fontSize: '0.85rem', lineHeight: 1.4 },
  dur:         { fontSize: '0.7rem', color: '#9a9a9a', flexShrink: 0 },
};

interface QuizQuestion { question: string; options: string[]; correctIndex: number; }

function QuizPlayer({ lesson, isEnrolled, onDone, completed }: {
  lesson: Lesson; isEnrolled: boolean; onDone: () => void; completed: boolean;
}) {
  let questions: QuizQuestion[] = [];
  try { questions = JSON.parse(lesson.textContent ?? '[]'); } catch {}

  const [answers, setAnswers]   = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore]       = useState(0);

  useEffect(() => { setAnswers({}); setSubmitted(false); setScore(0); }, [lesson.id]);

  if (!questions.length) {
    return (
        <div style={ps.box}>
          <h2 style={ps.title}>{lesson.title}</h2>
          <p style={{ color: '#9a9a9a', fontSize: '0.9rem' }}>Квіз не має питань.</p>
          {isEnrolled && !completed && (
              <button style={ps.btnMark} onClick={onDone}>Позначити як завершений</button>
          )}
          {completed && <button style={ps.btnDone} disabled>✓ Завершено</button>}
          <LessonQA lessonId={lesson.id} isEnrolled={isEnrolled} />
        </div>
    );
  }

  const handleSubmit = () => {
    const correct = questions.filter((q, i) => answers[i] === q.correctIndex).length;
    setScore(correct);
    setSubmitted(true);
    if (isEnrolled && !completed) onDone();
  };

  const allAnswered = questions.every((_, i) => answers[i] !== undefined);

  return (
      <div style={ps.box}>
        <h2 style={ps.title}>{lesson.title}</h2>
        {!isEnrolled && (
            <div style={{ padding: '12px 16px', background: '#fafafa', border: '1px solid #ebebeb', borderRadius: 8, color: '#9a9a9a', fontSize: '0.85rem', marginBottom: 20 }}>
              Запишіться на курс щоб пройти квіз
            </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
          {questions.map((q, qi) => (
              <div key={qi} style={{ background: '#fafafa', border: '1.5px solid #ebebeb', borderRadius: 10, padding: '16px 18px' }}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 12, color: '#0a0a0a' }}>
                  {qi + 1}. {q.question}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {q.options.map((opt, oi) => {
                    const selected  = answers[qi] === oi;
                    const isCorrect = submitted && oi === q.correctIndex;
                    const isWrong   = submitted && selected && oi !== q.correctIndex;
                    return (
                        <button
                            key={oi}
                            disabled={submitted || !isEnrolled}
                            onClick={() => setAnswers(a => ({ ...a, [qi]: oi }))}
                            style={{
                              textAlign: 'left' as const, padding: '10px 14px',
                              borderRadius: 8, cursor: submitted || !isEnrolled ? 'default' : 'pointer',
                              border: `1.5px solid ${isCorrect ? '#86efac' : isWrong ? '#fca5a5' : selected ? '#0a0a0a' : '#ebebeb'}`,
                              background: isCorrect ? '#f0fdf4' : isWrong ? '#fff5f5' : selected ? '#f5f5f5' : '#fff',
                              fontSize: '0.875rem', color: '#0a0a0a',
                              fontFamily: 'inherit',
                            }}
                        >
                          {isCorrect && '✓ '}{isWrong && '✗ '}{opt}
                        </button>
                    );
                  })}
                </div>
              </div>
          ))}
        </div>

        {submitted ? (
            <div style={{ marginTop: 20, padding: '14px 18px', borderRadius: 10, textAlign: 'center' as const,
              background: score === questions.length ? '#f0fdf4' : score >= questions.length / 2 ? '#fffbeb' : '#fff5f5',
              border: `1.5px solid ${score === questions.length ? '#86efac' : score >= questions.length / 2 ? '#fde68a' : '#fca5a5'}`,
            }}>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>
                {score === questions.length ? '🎉 Відмінно!' : score >= questions.length / 2 ? '👍 Непогано!' : '😔 Спробуй ще'}
              </p>
              <p style={{ color: '#5a5a5a', fontSize: '0.875rem' }}>
                {score} / {questions.length} правильних відповідей
              </p>
              {completed && <p style={{ marginTop: 8, fontSize: '0.8rem', color: '#16a34a' }}>✓ Урок завершено</p>}
            </div>
        ) : (
            isEnrolled && (
                <button
                    onClick={handleSubmit}
                    disabled={!allAnswered}
                    style={{
                      marginTop: 20, width: '100%', padding: '11px',
                      background: allAnswered ? '#0a0a0a' : '#e5e7eb',
                      color: allAnswered ? '#fafafa' : '#9a9a9a',
                      border: 'none', borderRadius: 8, fontSize: '0.9rem',
                      fontWeight: 600, cursor: allAnswered ? 'pointer' : 'default',
                      fontFamily: 'inherit',
                    }}
                >
                  Перевірити відповіді
                </button>
            )
        )}
      </div>
  );
}

function LessonPlayer({ lesson, isEnrolled, onProgressSaved }: {
  lesson: Lesson; isEnrolled: boolean; onProgressSaved: () => void;
}) {
  const { updateProgress } = useCourseActions();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => { setCompleted(false); }, [lesson.id]);

  const markDone = async (watchedSec: number) => {
    if (completed || !isEnrolled) return;
    setCompleted(true);
    try {
      await updateProgress(lesson.id, true, watchedSec);
      onProgressSaved();
    } catch {
    }
  };

  const handleTime = () => {
    const v = videoRef.current;
    if (!v || completed || !isEnrolled) return;
    if (v.currentTime / v.duration > 0.8) {
      markDone(Math.round(v.currentTime));
    }
  };

  if (lesson.type === 'quiz') {
    return <QuizPlayer lesson={lesson} isEnrolled={isEnrolled} onDone={() => markDone(0)} completed={completed} />;
  }

  return (
      <div style={ps.box}>
        <h2 style={ps.title}>{lesson.title}</h2>
        {lesson.type === 'video' && lesson.contentUrl && (
            <video ref={videoRef} controls onTimeUpdate={handleTime}
                   style={{ width: '100%', borderRadius: 8, background: '#0a0a0a', marginBottom: 20 }}>
              <source src={lesson.contentUrl} />
            </video>
        )}
        {lesson.type === 'text' && lesson.textContent && (
            <div style={ps.textContent}
                 dangerouslySetInnerHTML={{ __html: lesson.textContent }} />
        )}
        {isEnrolled && (
            <button
                style={completed ? ps.btnDone : ps.btnMark}
                onClick={() => markDone(lesson.durationSec)}
                disabled={completed}>
              {completed ? '✓ Завершено' : 'Позначити як завершений'}
            </button>
        )}
        <LessonQA lessonId={lesson.id} isEnrolled={isEnrolled} />
      </div>
  );
}

const ps: Record<string, React.CSSProperties> = {
  box:  { padding: 0 },
  title: { fontSize: '1.1rem', fontWeight: 600, marginBottom: 20, letterSpacing: '-0.01em' },
  textContent: { fontSize: '0.9rem', lineHeight: 1.8, color: '#2a2a2a', marginBottom: 20 },
  btnMark: {
    padding: '8px 20px', borderRadius: 6, border: '1.5px solid #ebebeb',
    background: 'transparent', fontSize: '0.85rem', cursor: 'pointer',
  },
  btnDone: {
    padding: '8px 20px', borderRadius: 6, border: '1.5px solid #0a0a0a',
    background: '#0a0a0a', color: '#fafafa', fontSize: '0.85rem', cursor: 'default',
  },
};

function ReviewForm({ courseId, onSubmitted }: { courseId: string; onSubmitted: () => void }) {
  const [rating, setRating]     = useState(0);
  const [hovered, setHovered]   = useState(0);
  const [body, setBody]         = useState('');
  const [submitting, setSub]    = useState(false);
  const [err, setErr]           = useState('');

  const handleSubmit = async () => {
    if (!rating) { setErr('Оберіть оцінку'); return; }
    setSub(true); setErr('');
    try {
      await apiFetch(`/reviews/${courseId}`, {
        method: 'POST',
        body: JSON.stringify({ rating, body: body.trim() || undefined }),
      });
      onSubmitted();
    } catch (e: any) {
      setErr(e.message ?? 'Помилка відправки');
    } finally { setSub(false); }
  };

  return (
      <div style={{ marginTop: 20, borderTop: '1px solid #f0f0f0', paddingTop: 18, textAlign: 'left' }}>
        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0a0a0a', marginBottom: 10 }}>
          Залишити відгук про курс
        </p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, justifyContent: 'center' }}>
          {[1,2,3,4,5].map(s => (
              <button
                  key={s}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(s)}
                  style={{
                    fontSize: '1.6rem', background: 'none', border: 'none',
                    cursor: 'pointer', lineHeight: 1, padding: '2px 4px',
                    color: s <= (hovered || rating) ? '#f59e0b' : '#d1d5db',
                    transition: 'color 0.1s',
                  }}
              >★</button>
          ))}
        </div>
        <textarea
            placeholder="Напишіть свій відгук (необов'язково)..."
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box' as const,
              padding: '9px 12px', border: '1.5px solid #ebebeb',
              borderRadius: 8, fontSize: '0.82rem', fontFamily: 'inherit',
              resize: 'vertical' as const, outline: 'none', marginBottom: 8,
            }}
        />
        {err && <p style={{ fontSize: '0.75rem', color: '#dc2626', marginBottom: 6 }}>{err}</p>}
        <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%', padding: '10px', borderRadius: 8,
              background: submitting ? '#9a9a9a' : '#0a0a0a',
              color: '#fff', border: 'none', fontSize: '0.85rem',
              fontWeight: 500, cursor: submitting ? 'default' : 'pointer',
              fontFamily: 'inherit',
            }}
        >{submitting ? 'Відправка...' : 'Надіслати відгук'}</button>
      </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:    { minHeight: '100vh', background: '#fafafa' },
  centered:{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#9a9a9a' },
  header:  { borderBottom: '1px solid #ebebeb', padding: '40px 0 32px', background: '#fff' },
  headerInner: { maxWidth: 1160, margin: '0 auto', padding: '0 32px', display: 'flex', gap: 40, alignItems: 'flex-start' },
  headerLeft: { flex: 1 },
  breadcrumb: { fontSize: '0.8rem', color: '#9a9a9a', marginBottom: 12 },
  title:   { fontSize: '1.6rem', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 10 },
  desc:    { color: '#5a5a5a', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 16, maxWidth: 560 },
  meta:    { display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#5a5a5a', flexWrap: 'wrap' as const },
  dot:     { color: '#d6d6d6' },
  levelBadge: {
    fontSize: '0.7rem', fontWeight: 500, padding: '2px 8px',
    borderRadius: 99, border: '1px solid #ebebeb', color: '#5a5a5a',
    textTransform: 'uppercase' as const, letterSpacing: '0.04em',
  },
  card: {
    width: 280, flexShrink: 0,
    border: '1.5px solid #ebebeb', borderRadius: 12,
    padding: 24, background: '#fff',
  },
  cardPrice: { fontSize: '1.6rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 20 },
  btnPrimary: {
    width: '100%', padding: '11px', background: '#0a0a0a', color: '#fafafa',
    border: 'none', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer',
  },
  btnOutline: {
    width: '100%', padding: '11px', background: 'transparent', color: '#0a0a0a',
    border: '1.5px solid #ebebeb', borderRadius: 8, fontSize: '0.9rem', cursor: 'pointer',
  },
  progressTrack: { height: 4, background: '#f5f5f5', borderRadius: 99, overflow: 'hidden' },
  progressFill:  { height: '100%', background: '#0a0a0a', borderRadius: 99, transition: 'width 0.5s' },
  body:    { maxWidth: 1160, margin: '32px auto', padding: '0 32px', display: 'flex', gap: 32 },
  sidebar: { width: 280, flexShrink: 0 },
  sideTitle: {
    fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase' as const,
    letterSpacing: '0.07em', color: '#9a9a9a', marginBottom: 12,
  },
  player: { flex: 1 },
  playerEmpty: {
    border: '1.5px solid #ebebeb', borderRadius: 12,
    height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};
const modal: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  box: {
    background: '#fff', borderRadius: 16, padding: '48px 40px', maxWidth: 440, width: '90%',
    textAlign: 'center', position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
  },
  emoji:      { fontSize: '3rem', marginBottom: 12 },
  title:      { fontSize: '1.4rem', fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' },
  sub:        { color: '#5a5a5a', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 28 },
  btnPrimary: {
    display: 'block', width: '100%', padding: '12px', background: '#0a0a0a', color: '#fafafa',
    borderRadius: 8, fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none',
    marginBottom: 10, boxSizing: 'border-box' as const,
  },
  btnOutline: {
    display: 'block', width: '100%', padding: '12px', background: 'transparent', color: '#0a0a0a',
    border: '1.5px solid #ebebeb', borderRadius: 8, fontSize: '0.9rem', textDecoration: 'none',
    marginBottom: 20, boxSizing: 'border-box' as const,
  },
  code:  { fontSize: '0.75rem', color: '#9a9a9a' },
  close: {
    position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
    fontSize: '1.1rem', cursor: 'pointer', color: '#9a9a9a',
  },
};