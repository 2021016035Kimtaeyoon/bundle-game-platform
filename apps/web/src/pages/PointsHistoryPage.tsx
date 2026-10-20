import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { PointsTransaction, PointsTransactionType } from '../types/points';

const TYPE_LABELS: Record<PointsTransactionType, string> = {
  EARNED: '적립',
  USED: '사용',
  REFUNDED: '환불',
  PURCHASED: '충전',
};

export function PointsHistoryPage() {
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/api/points/history')
      .then((response) => setTransactions(response.data.transactions))
      .catch(() => setError('내역을 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="page-form game-wide">
      <h1>포인트 내역</h1>
      {isLoading && <p>불러오는 중...</p>}
      {error && <p className="auth-error">{error}</p>}
      {!isLoading && !error && transactions.length === 0 && <p>거래 내역이 없습니다.</p>}
      <ul className="history-list">
        {transactions.map((tx) => (
          <li key={tx.id}>
            <div>
              <p className="history-reason">{tx.reason}</p>
              <p className="history-date">{new Date(tx.createdAt).toLocaleString()}</p>
            </div>
            <span
              className="history-amount"
              style={{ color: tx.transactionType === 'USED' ? 'var(--danger)' : 'var(--mint)' }}
            >
              {tx.transactionType === 'USED' ? '-' : '+'}
              {Number(tx.points).toLocaleString()}P
              <span className="history-type">{TYPE_LABELS[tx.transactionType]}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
