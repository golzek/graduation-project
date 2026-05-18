import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../components/Toast';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourse, useCourseProgress, useCourseActions, Lesson, CourseModule } from '../hooks/useCourses';
import { useAuth, apiFetch } from '../context/AuthContext';

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

  useEffect(() => {
    if (course?.modules?.length) {
      const first = course.modules[0]?.lessons?.[0];
      if (first && (first.isFree || course.isEnrolled)) setActiveLesson(first);
    }
  }, [course]);
  const handleProgressSaved = async () => {
    refreshProgress();
    try {
      const updated = await apiFetch<{ percent: number }>(`/courses/${id}/progress`);
      if (updated.percent === 100) {
        console.log('100% — викликаємо issue...');
        try {
          const cert = await issueCertificate(id!);
          setCertModal({ pdfUrl: cert.pdfUrl, verifyCode: cert.verifyCode });
        }  catch (e: any) {
          console.error('issue cert error:', e?.message);
          setCertModal({ pdfUrl: '', verifyCode: '' });
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
                <span>{course.author?.name}</span>
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
              ) : (
                  <button style={s.btnPrimary} onClick={handleEnroll} disabled={enrolling}>
                    {enrolling ? 'Записуємось...' : Number(course.price) === 0 ? 'Записатись' : 'Придбати'}
                  </button>
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