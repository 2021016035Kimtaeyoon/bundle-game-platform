import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { GameDetail } from '../types/game';

export function PracticePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get(`/api/games/${id}`)
      .then((response) => {
        const game = response.data.game as GameDetail;
        return api.post('/api/games/practice/join', { gameType: game.gameType });
      })
      .then((response) => {
        if (!cancelled) {
          navigate(`/games/${response.data.gameId}`, { replace: true });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err?.response?.data?.error ?? '연습 라운드 매칭에 실패했습니다.';
        setError(message);
      });

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  return (
    <div className="page-form">
      <h1>연습전 매칭</h1>
      {error ? (
        <p className="auth-error">{error}</p>
      ) : (
        <p className="matchmaking-status">소액 포인트 연습 라운드를 찾고 있어요...</p>
      )}
    </div>
  );
}
