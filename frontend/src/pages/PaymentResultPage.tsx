import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '../context/AuthContext';

// LiqPay перенаправляє на /payment/result?order_id=...&status=success
export function PaymentResultPage() {
  const [params] = useSearchParams();
  const status  = params.get('status');
  const orderId = params.get('order_id') ?? '';

  // Витягуємо courseId з orderId (формат: order_{courseId}_{userId}_{suffix})
  // courseId — UUID (без підкреслень), тому parts[1] завжди правильний
  const parts    = orderId.split('_');
  const courseId = parts.length >= 4 ? parts[1] : (parts[1] ?? '');

  type State = 'checking' | 'success' | 'failure';
  const [state, setState]       = useState<State>('checking');
  const [attempts, setAttempts] = useState(0);
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MAX_ATTEMPTS = 10;   // 10 спроб
  const INTERVAL_MS  = 3000; // кожні 3 секунди = до 30 сек очікування

  useEffect(() => {
    // Якщо LiqPay явно повідомив про помилку — одразу показуємо
    if (status === 'failure' || status === 'error') {
      setState('failure');
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
        // Якщо LiqPay сказав success але enrollment не з'явився —
        // показуємо success (webhook міг затриматись, але гроші вже списались)
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
  }, [courseId, status]);

  return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

          {state === 'success' && (
              <>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#065f46', marginBottom: 8 }}>
                  Оплата успішна!
                </h2>
                <p style={{ color: '#6b7280', marginBottom: 28 }}>
                  Ти записаний на курс. Можеш одразу починати навчання.
                </p>
                <Link
                    to={courseId ? `/courses/${courseId}` : '/courses'}
                    style={{ display: 'block', padding: '14px', background: '#4f46e5', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}
                >
                  Перейти до курсу →
                </Link>
              </>
          )}

          {state === 'failure' && (
              <>
                <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>
                  Оплата не вдалась
                </h2>
                <p style={{ color: '#6b7280', marginBottom: 28 }}>
                  Спробуй ще раз або використай інший спосіб оплати.
                </p>
                <Link
                    to={courseId ? `/courses/${courseId}` : '/courses'}
                    style={{ display: 'block', padding: '14px', background: '#4f46e5', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}
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
                <p style={{ color: '#6b7280', marginBottom: 8 }}>
                  Зачекай кілька секунд, підтверджуємо платіж
                </p>
                <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden', margin: '16px 0' }}>
                  <div style={{
                    height: '100%',
                    background: '#4f46e5',
                    borderRadius: 2,
                    width: `${(attempts / MAX_ATTEMPTS) * 100}%`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <p style={{ fontSize: 12, color: '#9ca3af' }}>
                  Спроба {attempts} з {MAX_ATTEMPTS}
                </p>
              </>
          )}

        </div>
      </div>
  );
}
