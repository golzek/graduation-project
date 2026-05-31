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
  const [loading, setLoading]         = useState(false);
  const [error,   setError  ]         = useState('');
  const [promoInput, setPromoInput]   = useState('');
  const [promoCode, setPromoCode]     = useState('');
  const [promoState, setPromoState]   = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [promoMsg, setPromoMsg]       = useState('');
  const [discountPct, setDiscountPct] = useState<number | null>(null);
  const [finalPrice, setFinalPrice]   = useState<number | null>(null);

  const checkPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoState('checking');
    try {
      const res = await apiFetch<{ valid: boolean; discountPercent?: number; finalPrice?: number; message?: string }>(
          `/promo-codes/validate?code=${encodeURIComponent(promoInput.trim())}&courseId=${courseId}`
      );
      if (res.valid) {
        setPromoState('valid');
        setPromoCode(promoInput.trim());
        setDiscountPct(res.discountPercent ?? null);
        setFinalPrice(res.finalPrice ?? null);
        setPromoMsg(`Знижка ${res.discountPercent}% застосована`);
      } else {
        setPromoState('invalid');
        setPromoCode('');
        setDiscountPct(null);
        setFinalPrice(null);
        setPromoMsg(res.message ?? 'Невірний промокод');
      }
    } catch {
      setPromoState('invalid');
      setPromoMsg('Помилка перевірки промокоду');
    }
  };

  const clearPromo = () => {
    setPromoCode(''); setPromoInput('');
    setPromoState('idle'); setPromoMsg('');
    setDiscountPct(null); setFinalPrice(null);
  };

  const handlePay = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setLoading(true); setError('');
    try {
      const res = await apiFetch<any>(`/payments/create/${courseId}`, {
        method: 'POST',
        body: JSON.stringify({ promoCode: promoCode || undefined }),
      });

      if (res.free) { onSuccess?.(); return; }
      if (res.subscriptionAccess) { onSuccess?.(); return; }

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = res.action;

      Object.entries(res.formData as Record<string, string>).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type  = 'hidden';
        input.name  = name;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      setLoading(false);
    } catch (err: any) { setError(err.message); setLoading(false); }
  };

  const displayPrice = finalPrice !== null ? finalPrice : price;

  return (
      <div>
        {error && (
            <div style={{ color:'#dc2626', fontSize:13, marginBottom:10, padding:'8px 12px', background:'#fef2f2', borderRadius:8 }}>{error}</div>
        )}

        {price > 0 && (
            <div style={{ marginBottom:12 }}>
              {promoState === 'valid' ? (
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f0fdf4', borderRadius:8, border:'1px solid #bbf7d0' }}>
                    <span style={{ fontSize:13, color:'#16a34a', flex:1 }}>🏷 {promoMsg}</span>
                    <button onClick={clearPromo} style={{ background:'none', border:'none', cursor:'pointer', color: 'var(--text-tertiary)', fontSize:16, lineHeight:1, padding:0 }}>×</button>
                  </div>
              ) : (
                  <div style={{ display:'flex', gap:6, width:'100%' }}>
                    <input
                        placeholder="Промокод"
                        value={promoInput}
                        onChange={e => { setPromoInput(e.target.value); setPromoState('idle'); setPromoMsg(''); }}
                        onKeyDown={e => e.key==='Enter' && checkPromo()}
                        style={{ flex:1, minWidth:0, padding:'9px 8px', border:'1.5px solid', borderColor: promoState==='invalid' ? '#fca5a5' : 'var(--border)', borderRadius:8, fontSize:13, outline:'none', background: 'var(--bg-elevated)', fontFamily:'inherit' }}
                    />
                    <button
                        onClick={checkPromo}
                        disabled={promoState==='checking' || !promoInput.trim()}
                        style={{ padding:'9px 10px', borderRadius:8, border:'1.5px solid #9ca3af', background: 'var(--bg)', fontSize:12, cursor:'pointer', fontFamily:'inherit', color: 'var(--text-secondary)', whiteSpace:'nowrap', flexShrink:0 }}
                    >{promoState==='checking' ? '...' : 'Застосувати'}</button>
                  </div>
              )}
              {promoState==='invalid' && <p style={{ fontSize:12, color:'#dc2626', marginTop:4 }}>{promoMsg}</p>}
            </div>
        )}

        {promoState==='valid' && discountPct && (
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10, fontSize:13 }}>
              <span style={{ color: 'var(--text-secondary)', textDecoration:'line-through' }}>{price} ₴</span>
              <span style={{ color:'#16a34a', fontWeight:600 }}>→ {displayPrice} ₴ (−{discountPct}%)</span>
            </div>
        )}

        <button
            onClick={handlePay}
            disabled={loading}
            style={{ width:'100%', padding:'14px', background: loading ? 'var(--text-tertiary)' : '#4f46e5', color:'var(--bg-elevated)', border:'none', borderRadius:10, fontSize:15, fontWeight:600, cursor: loading ? 'default' : 'pointer', transition:'background 0.15s' }}
        >
          {loading ? 'Обробка...' : price===0 ? 'Записатись безкоштовно' : `Оплатити ${displayPrice} ₴`}
        </button>

        {price > 0 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:12 }}>
              <img src="https://cdn.wayforpay.com/icons/wfp-logo.png" alt="WayForPay" style={{ height:20 }} onError={e => (e.currentTarget.style.display='none')} />
              <span style={{ fontSize:11, color: 'var(--text-tertiary)' }}>Безпечна оплата через WayForPay</span>
            </div>
        )}
      </div>
  );
}