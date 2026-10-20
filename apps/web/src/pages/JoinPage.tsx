import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { GameDetail } from '../types/game';

export function JoinPage() {
  const { id } = useParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/api/games/${id}`)
      .then((response) => setGame(response.data.game))
      .catch(() => setError('모집글을 찾을 수 없습니다.'));
  }, [id]);

  if (error && !game) return <p className="page-form auth-error">{error}</p>;
  if (!game) return <p className="page-form">불러오는 중...</p>;

  const entryFee = Number(game.entryFee);
  const points = Number(user?.points ?? 0);
  const canAfford = points >= entryFee;

  async function handleJoin() {
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post(`/api/games/${game!.id}/join`);
      await refreshUser();
      navigate(`/games/${game!.id}`);
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        '참여에 실패했습니다.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-form">
      <h1>{game.title} 참여하기</h1>
      <dl className="detail-list">
        <div>
          <dt>참가비</dt>
          <dd>{entryFee.toLocaleString()}P</dd>
        </div>
        <div>
          <dt>내 포인트</dt>
          <dd>{points.toLocaleString()}P</dd>
        </div>
      </dl>

      {error && <p className="auth-error">{error}</p>}

      {canAfford ? (
        <button type="button" className="primary" onClick={handleJoin} disabled={isSubmitting}>
          {isSubmitting ? '참여 처리 중...' : `${entryFee.toLocaleString()}P로 참여하기`}
        </button>
      ) : (
        <>
          <p className="auth-error">포인트가 부족합니다. 충전 후 다시 시도해주세요.</p>
          <Link to="/points/charge" className="button-link">
            포인트 충전하기
          </Link>
        </>
      )}
    </div>
  );
}
