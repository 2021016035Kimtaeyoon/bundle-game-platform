import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { GameDetail } from '../types/game';

const LANE_COLORS = [
  '#ffd23f',
  '#2fb8a3',
  '#ff8a5c',
  '#8fd9ff',
  '#e0e0e0',
  '#c9a76b',
  '#7fd67f',
  '#ff9ecf',
  '#a3a8ff',
  '#f2f2f2',
];

export function PlayPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    function fetchGame() {
      api
        .get(`/api/games/${id}`)
        .then((response) => {
          if (cancelled) return;
          const data: GameDetail = response.data.game;
          setGame(data);
          if (data.status === 'IN_PROGRESS') {
            pollRef.current = window.setTimeout(fetchGame, 2000);
          }
        })
        .catch(() => {
          if (!cancelled) setError('라운드를 불러오지 못했습니다.');
        });
    }

    fetchGame();

    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [id]);

  if (error) return <p className="page-form auth-error">{error}</p>;
  if (!game) return <p className="page-form">불러오는 중...</p>;

  if (game.status === 'RECRUITING') {
    return (
      <div className="page-form game-wide">
        <h1>{game.title}</h1>
        <p>아직 모집 중인 라운드입니다.</p>
      </div>
    );
  }

  if (game.status === 'CANCELLED') {
    return (
      <div className="page-form game-wide">
        <h1>{game.title}</h1>
        <p>취소된 라운드입니다.</p>
      </div>
    );
  }

  const lanes = game.participants;
  const laneCount = Math.max(lanes.length, 1);
  const isCompleted = game.status === 'COMPLETED';
  const sortedResults = isCompleted
    ? [...lanes].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
    : lanes;

  return (
    <div className="page-form game-wide">
      <h1>{game.title}</h1>
      <p className="detail-subtitle">공이 동시에 낙하해 가장 먼저 도착하는 참가자가 승리합니다.</p>

      <div className="ball-race-board">
        <div className="ball-race-finish-line" />
        {lanes.map((participant, index) => {
          const left = `${((index + 0.5) / laneCount) * 100}%`;
          const isWinnerBall = isCompleted && participant.isWinner;
          const duration = isCompleted ? 2.2 : 18 + (index % 3);
          return (
            <div
              key={`${participant.id}-${game.status}`}
              className={`ball-race-lane ${isWinnerBall ? 'winner-ball' : ''}`}
              style={{
                left,
                marginLeft: '-17px',
                background: LANE_COLORS[index % LANE_COLORS.length],
                animationDuration: `${duration}s`,
              }}
              title={participant.user.username}
            >
              {participant.user.username.slice(0, 2)}
            </div>
          );
        })}
      </div>

      {isCompleted ? (
        <div className="round-result">
          <p>우승</p>
          <p className="winner-name">{game.winner?.username ?? '알 수 없음'}</p>
          {user?.id === game.winnerId && !game.isPracticeRound && (
            <p>
              <Link to="/shipments/mine">배송지 입력하러 가기 →</Link>
            </p>
          )}
          <ul className="result-rank-list">
            {sortedResults.map((participant) => (
              <li key={participant.id} className={participant.isWinner ? 'is-winner' : ''}>
                <span>
                  {participant.rank ? `${participant.rank}위` : '-'} {participant.user.username}
                </span>
                <span>{participant.isWinner ? '상품 획득' : '포인트 환급'}</span>
              </li>
            ))}
          </ul>
          {game.seedRevealed && (
            <p>
              <Link to={`/games/${game.id}/verify`}>결과가 조작되지 않았는지 검증하기 →</Link>
            </p>
          )}
        </div>
      ) : (
        <p className="matchmaking-status">결과를 계산하는 중입니다...</p>
      )}
    </div>
  );
}
