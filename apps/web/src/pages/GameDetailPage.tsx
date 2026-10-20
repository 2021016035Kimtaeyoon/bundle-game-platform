import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, resolveAssetUrl } from '../lib/api';
import {
  CATEGORY_ICON,
  CATEGORY_LABELS,
  CATEGORY_TONE,
  GAME_TYPE_LABELS,
} from '../lib/gameOptions';
import { formatDuration, useCountdown } from '../lib/useCountdown';
import type { GameDetail } from '../types/game';

function ParticipantStars({ count, limit }: { count: number; limit: number }) {
  const shown = Math.min(count, 24);
  return (
    <div className="orbit-field">
      {Array.from({ length: shown }).map((_, i) => {
        const angle = (i / Math.max(shown, 1)) * Math.PI * 2;
        const radius = 46 + (i % 3) * 8;
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * radius;
        return (
          <span
            key={i}
            className="orbit-star"
            style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.15}s` }}
          />
        );
      })}
      {count > shown && <span className="orbit-more">+{count - shown}</span>}
      {count === 0 && <span className="orbit-empty">아직 모인 별이 없어요</span>}
      <span className="orbit-caption">
        {count}/{limit}개의 별이 모이는 중
      </span>
    </div>
  );
}

export function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api
      .get(`/api/games/${id}`)
      .then((response) => setGame(response.data.game))
      .catch(() => setError('모집글을 찾을 수 없습니다.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const remainingMs = useCountdown(game?.recruitmentEndsAt ?? null);

  async function handleCancel() {
    if (!game || !window.confirm('정말 이 모집글을 취소하시겠습니까?')) return;
    setIsCancelling(true);
    try {
      await api.delete(`/api/games/${game.id}`);
      navigate('/games');
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        '취소에 실패했습니다.';
      setError(message);
    } finally {
      setIsCancelling(false);
    }
  }

  if (isLoading)
    return (
      <div className="live-board">
        <div className="live-board-stars" />
        <p className="live-board-inner">불러오는 중...</p>
      </div>
    );
  if (error || !game)
    return (
      <div className="live-board">
        <div className="live-board-stars" />
        <p className="live-board-inner auth-error">{error ?? '모집글을 찾을 수 없습니다.'}</p>
      </div>
    );

  const isOrganizer = user?.id === game.organizerId;
  const progress = Math.min(100, Math.round((game.participantCount / game.participantLimit) * 100));
  const imageUrl = resolveAssetUrl(game.imageUrl);
  const tone = CATEGORY_TONE[game.category];

  return (
    <div className="live-board">
      <div className="live-board-glow" />
      <div className="live-board-stars" />
      <div className="live-board-inner">
        <div className="detail-hero">
          <div className="detail-planet-stage">
            {game.isPracticeRound && <span className="planet-ring planet-ring-lg" />}
            <ParticipantStars count={game.participantCount} limit={game.participantLimit} />
            <div className={`planet planet-lg ${tone}`}>
              {imageUrl ? (
                <img src={imageUrl} alt={game.productName} className="planet-image" />
              ) : (
                <span className="planet-icon planet-icon-lg">{CATEGORY_ICON[game.category]}</span>
              )}
            </div>
          </div>
          <span className="board-eyebrow">{CATEGORY_LABELS[game.category]}</span>
          <h1>{game.title}</h1>
          <p className="detail-subtitle">{GAME_TYPE_LABELS[game.gameType]}</p>
        </div>

        <div className="detail-panel">
          <p>{game.description}</p>

          <dl className="detail-list">
            <div>
              <dt>상품</dt>
              <dd>{game.productName}</dd>
            </div>
            <div>
              <dt>참가비</dt>
              <dd>{Number(game.entryFee).toLocaleString()}P</dd>
            </div>
            <div>
              <dt>참가 인원</dt>
              <dd>
                {game.participantCount}/{game.participantLimit}명
              </dd>
            </div>
            <div>
              <dt>주최자</dt>
              <dd>{game.organizer.username}</dd>
            </div>
            <div>
              <dt>상태</dt>
              <dd>{game.status}</dd>
            </div>
          </dl>

          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>

          {game.status === 'RECRUITING' && (
            <p className="detail-deadline">모집 마감까지 {formatDuration(remainingMs)}</p>
          )}

          {game.resultHash && (
            <p className="result-hash">
              결과 검증 해시: <code>{game.resultHash}</code>
            </p>
          )}

          <div className="detail-actions">
            {isOrganizer ? (
              game.status === 'RECRUITING' && (
                <button type="button" onClick={handleCancel} disabled={isCancelling}>
                  {isCancelling ? '취소 중...' : '모집글 취소'}
                </button>
              )
            ) : game.status === 'RECRUITING' ? (
              <Link to={`/games/${game.id}/join`} className="button-link">
                참여하기
              </Link>
            ) : game.status === 'IN_PROGRESS' ? (
              <Link to={`/games/${game.id}/play`} className="button-link">
                게임 입장
              </Link>
            ) : game.status === 'COMPLETED' ? (
              <Link to={`/games/${game.id}/verify`} className="button-link">
                결과 검증하기
              </Link>
            ) : (
              <button type="button" disabled>
                모집 취소됨
              </button>
            )}
            {!game.isPracticeRound && (
              <Link to={`/games/${game.id}/practice`} className="button-link secondary">
                연습하기 (소액 포인트)
              </Link>
            )}
          </div>

          <h2>모인 별들</h2>
          {game.participants.length === 0 ? (
            <p>아직 참여자가 없습니다.</p>
          ) : (
            <ul className="participant-list">
              {game.participants.map((p) => (
                <li key={p.id}>{p.user.username}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
