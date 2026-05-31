import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '../context/AuthContext';

export function PaymentResultPage() {
  const [params] = useSearchParams();
  const status  = params.get('status');
  const orderId = params.get('order_id') ?? '';
  const isSubscription = orderId.startsWith('sub_');
  const courseId       = !isSubscription ? (orderId.split('_')[1] ?? '') : '';

  type State = 'checking' | 'success' | 'failure';
  const [state, setState]       = useState<State>('checking');
  const [attempts, setAttempts] = useState(0);
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MAX_ATTEMPTS = 10;
  const INTERVAL_MS  = 3000;

  useEffect(() => {
    if (status === 'failure' || status === 'error') {
      setState('failure');
      return;
    }
    if (isSubscription) {
      if (status === 'success' || status === 'sandbox') {
        setState('success');
      } else {
        setState('failure');
      }
      return;
    }

    if (!courseId) {
      setState('failure');
      return;
    }

    let attempt = 0;

    const check = async () => {
      attempt++;
      setAttempts(attempt);
      try {
        const res = await apiFetch<{ enrolled: boolean }>(`/payments/status/${courseId}`);
        if (res.enrolled) {
          setState('success');
          return;
        }
      } catch {}

      if (attempt >= MAX_ATTEMPTS) {
        if (status === 'success' || status === 'sandbox') {
          setState('success');
        } else {
          setState('failure');
        }
        return;
      }

      timerRef.current = setTimeout(check, INTERVAL_MS);
    };

    check();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [courseId, status, isSubscription]);

  return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="r-payment-card" style={{ background: 'var(--bg-elevated)', borderRadius: 20, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

          {state === 'success' && (
              <>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#065f46', marginBottom: 8 }}>
                  Оплата успішна!
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
                  {isSubscription
                      ? 'Підписка активована! Тепер у тебе є доступ до всіх курсів.'
                      : 'Ти записаний на курс. Можеш одразу починати навчання.'}
                </p>
                <Link
                    to={isSubscription ? '/subscription' : (courseId ? `/courses/${courseId}` : '/courses')}
                    style={{ display: 'block', padding: '14px', background: '#4f46e5', color: 'var(--bg-elevated)', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}
                >
                  {isSubscription ? 'Моя підписка →' : 'Перейти до курсу →'}
                </Link>
              </>
          )}

          {state === 'failure' && (
              <>
                <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>
                  Оплата не вдалась
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
                  Спробуй ще раз або використай інший спосіб оплати.
                </p>
                <Link
                    to={courseId ? `/courses/${courseId}` : '/courses'}
                    style={{ display: 'block', padding: '14px', background: '#4f46e5', color: 'var(--bg-elevated)', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}
                >
                  Повернутись до курсу
                </Link>
              </>
          )}

          {state === 'checking' && (
              <>
                <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                  Перевіряємо оплату...
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Зачекай кілька секунд, підтверджуємо платіж
                </p>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', margin: '16px 0' }}>
                  <div style={{
                    height: '100%',
                    background: '#4f46e5',
                    borderRadius: 2,
                    width: `${(attempts / MAX_ATTEMPTS) * 100}%`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  Спроба {attempts} з {MAX_ATTEMPTS}
                </p>
              </>
          )}

        </div>
      </div>
  );
}