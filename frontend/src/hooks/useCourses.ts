import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../context/AuthContext';

export interface Course {
  id: string; title: string; description: string; price: number;
  thumbnailUrl: string | null; status: string;
  level: 'beginner' | 'intermediate' | 'advanced'; category: string;
  rating: number | null;
  author: { id: string; name: string; avatarUrl: string | null };
  modules: CourseModule[]; isEnrolled?: boolean; createdAt: string;
}
export interface CourseModule {
  id: string; title: string; orderIndex: number; lessons: Lesson[];
}
export interface Lesson {
  id: string; title: string; type: 'video' | 'text' | 'quiz';
  contentUrl: string | null; textContent: string | null;
  durationSec: number; orderIndex: number; isFree: boolean;
}
export interface Progress { percent: number; completedCount: number; totalCount: number; }

export function useCourses(params: Record<string, any> = {}) {
  const [result, setResult]   = useState<{ data: Course[]; total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
  ).toString();
  useEffect(() => {
    setLoading(true);
    apiFetch<any>(`/courses?${query}`).then(setResult).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [query]);
  return { courses: result?.data ?? [], total: result?.total ?? 0, totalPages: result?.totalPages ?? 0, loading, error };
}

export function useCourse(id: string) {
  const [course, setCourse]   = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch<Course>(`/courses/${id}`).then(setCourse).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [id]);
  return { course, loading, error };
}

export function useCourseProgress(courseId: string) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!courseId || !localStorage.getItem('accessToken')) return;
    apiFetch<Progress>(`/courses/${courseId}/progress`).then(setProgress).catch(() => {});
  }, [courseId, tick]);

  const refresh = useCallback(() => setTick(t => t + 1), []);
  return { progress, refresh };
}

export function useMyEnrollmentsProgress() {
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) return;
    setLoading(true);
    apiFetch<{ courseId: string; percent: number }[]>('/courses/my/enrollments-progress')
        .then(list => {
          const map: Record<string, number> = {};
          list.forEach(item => { map[item.courseId] = item.percent; });
          setProgressMap(map);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
  }, []);

  return { progressMap, loading };
}

export function useCourseActions() {
  const enroll = useCallback((courseId: string) =>
      apiFetch(`/courses/${courseId}/enroll`, { method: 'POST' }), []);

  const updateProgress = useCallback((lessonId: string, completed: boolean, watchedSec: number) =>
      apiFetch('/courses/progress/save', { method: 'PATCH', body: JSON.stringify({ lessonId, completed, watchedSec }) }), []);
  const issueCertificate = useCallback((courseId: string) =>
      apiFetch<{ id: string; verifyCode: string; pdfUrl: string; issuedAt: string }>(
          `/certificates/issue/${courseId}`, { method: 'POST' }
      ), []);

  return { enroll, updateProgress, issueCertificate };
}