import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, apiFetch } from '../context/AuthContext';

interface PaymentButtonProps {
  courseId: string;
  price:    number;
  title:    string;
  onSuccess?: () => void;
}

export function PaymentButton({ courseId, price, title, onSuccess }: PaymentButtonProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState('');

  const handlePay = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setLoading(true); setError('');

    try {
      const res = await apiFetch<any>(`/payments/create/${courseId}`, { method: 'POST' });

      if (res.free) {
        onSuccess?.();
        return;
      }

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = res.action;
      form.target = '_blank';

      const dataInput = document.createElement('input');
      dataInput.type  = 'hidden';
      dataInput.name  = 'data';
      dataInput.value = res.data;

      const sigInput = document.createElement('input');
      sigInput.type  = 'hidden';
      sigInput.name  = 'signature';
      sigInput.value = res.signature;

      form.appendChild(dataInput);
      form.appendChild(sigInput);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      form.submit();
      document.body.removeChild(form);
      setLoading(false);
      alert('Завершіть оплату у відкритому вікні. Після успішної оплати поверніться на цю сторінку.');

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 10, padding: '8px 12px', background: '#fef2f2', borderRadius: 8 }}>
          {error}
        </div>
      )}
      <button
        onClick={handlePay}
        disabled={loading}
        style={{
          width: '100%', padding: '14px',
          background: loading ? '#9ca3af' : '#4f46e5',
          color: '#fff', border: 'none', borderRadius: 10,
          fontSize: 15, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {loading
          ? 'Обробка...'
          : price === 0
            ? 'Записатись безкоштовно'
            : `Оплатити ${price} ₴`}
      </button>

      {price > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
          <img
            src="https://static.liqpay.ua/buttons/logo-small.png"
            alt="LiqPay"
            style={{ height: 20 }}
          />
          <span style={{ fontSize: 11, color: '#9ca3af' }}>Безпечна оплата через LiqPay</span>
        </div>
      )}
    </div>
  );
}
