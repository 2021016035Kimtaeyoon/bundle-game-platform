import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const PRESET_AMOUNTS = [5000, 10000, 30000, 50000];

export function PointsChargePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(10000);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'BANK_TRANSFER'>('CARD');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post('/api/points/charge', { amount, paymentMethod });
      await refreshUser();
      navigate('/games');
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        '충전에 실패했습니다.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-form">
      <h1>포인트 충전</h1>
      <p>현재 보유 포인트: {Number(user?.points ?? 0).toLocaleString()}P</p>
      <p className="field-hint">
        게임 참여는 현금이 아닌 포인트로만 가능합니다. 실제 결제 연동 전까지는 테스트용으로 즉시
        충전됩니다.
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          충전 금액
          <div className="radio-group">
            {PRESET_AMOUNTS.map((preset) => (
              <label key={preset} className="radio-option">
                <input
                  type="radio"
                  name="amount"
                  checked={amount === preset}
                  onChange={() => setAmount(preset)}
                />
                {preset.toLocaleString()}P
              </label>
            ))}
          </div>
          <input
            type="number"
            min={1000}
            max={1000000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </label>

        <label>
          결제 수단
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                name="method"
                checked={paymentMethod === 'CARD'}
                onChange={() => setPaymentMethod('CARD')}
              />
              카드
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="method"
                checked={paymentMethod === 'BANK_TRANSFER'}
                onChange={() => setPaymentMethod('BANK_TRANSFER')}
              />
              계좌이체
            </label>
          </div>
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '충전 중...' : `${amount.toLocaleString()}P 충전하기`}
        </button>
      </form>
    </div>
  );
}
