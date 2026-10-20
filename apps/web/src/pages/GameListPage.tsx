import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GameType, ProductCategory } from '@bgp/shared-types';
import { api, resolveAssetUrl } from '../lib/api';
import {
  CATEGORY_ICON,
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  CATEGORY_TONE,
  GAME_TYPE_LABELS,
  GAME_TYPE_OPTIONS,
} from '../lib/gameOptions';
import { formatDuration, useCountdown } from '../lib/useCountdown';
import type { Game, PaginationInfo } from '../types/game';

type SortOption = 'latest' | 'deadline' | 'popular';

function GameCard({ game }: { game: Game }) {
  const remainingMs = useCountdown(game.recruitmentEndsAt);
  const progress = Math.min(100, Math.round((game.participantCount / game.participantLimit) * 100));
  const imageUrl = resolveAssetUrl(game.imageUrl);
  const isAlmostFull = progress >= 70;
  const tone = CATEGORY_TONE[game.category];

  return (
    <Link to={`/games/${game.id}`} className="game-card">
      {game.isPracticeRound ? (
        <span className="corner-tag corner-tag-practice">연습</span>
      ) : (
        isAlmostFull && <span className="corner-tag corner-tag-almost">마감임박</span>
      )}

      <div className="planet-stage">
        {game.isPracticeRound && <span className="planet-ring" />}
        <div className={`planet ${tone}`}>
          {imageUrl ? (
            <img src={imageUrl} alt={game.productName} className="planet-image" />
          ) : (
            <span className="planet-icon">{CATEGORY_ICON[game.category]}</span>
          )}
        </div>
      </div>

      <div className="game-card-body">
        <div className="game-card-title-row">
          <span className="game-card-title">{game.title}</span>
          <span className="game-card-price">{Number(game.entryFee).toLocaleString()}P</span>
        </div>
        <p className="game-card-meta">
          {CATEGORY_LABELS[game.category]} · {GAME_TYPE_LABELS[game.gameType]}
        </p>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="game-card-meta">{formatDuration(remainingMs)}</p>
        <div className="game-card-footer">
          <span className="players">
            {game.participantCount} / {game.participantLimit}명 참여
          </span>
          <span className="join">참여하기 →</span>
        </div>
      </div>
    </Link>
  );
}

export function GameListPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [gameType, setGameType] = useState<GameType | ''>('');
  const [sort, setSort] = useState<SortOption>('latest');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    api
      .get('/api/games', {
        params: {
          category: category || undefined,
          gameType: gameType || undefined,
          status: 'RECRUITING',
          sort,
          page,
          limit: 20,
        },
      })
      .then((response) => {
        setGames(response.data.games);
        setPagination(response.data.pagination);
      })
      .catch(() => setError('모집글을 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false));
  }, [category, gameType, sort, page]);

  return (
    <div className="live-board">
      <div className="live-board-glow" />
      <div className="live-board-stars" />
      <div className="live-board-inner">
        <div className="board-header">
          <div className="board-header-text">
            <span className="board-eyebrow">round box</span>
            <h1>오픈된 라운드</h1>
            <p>
              참여하고 싶은 상품을 고른 뒤 게임을 시작하세요. 참가비는 현금이 아닌 포인트로만
              결제됩니다.
            </p>
          </div>
          <Link to="/games/create" className="button-primary">
            라운드 만들기
          </Link>
        </div>

        <p className="board-stats">
          현재 <strong>{pagination?.total ?? 0}개</strong>의 라운드가 열려 있어요
        </p>

        <div className="tabs">
          <button
            type="button"
            className={`tab ${category === '' ? 'active' : ''}`}
            onClick={() => {
              setPage(1);
              setCategory('');
            }}
          >
            전체
          </button>
          {CATEGORY_OPTIONS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`tab ${category === value ? 'active' : ''}`}
              onClick={() => {
                setPage(1);
                setCategory(value);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="toolbar">
          <select
            value={gameType}
            onChange={(e) => {
              setPage(1);
              setGameType(e.target.value as GameType | '');
            }}
          >
            <option value="">게임 종류: 전체</option>
            {GAME_TYPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setPage(1);
              setSort(e.target.value as SortOption);
            }}
          >
            <option value="latest">최신순</option>
            <option value="deadline">마감임박순</option>
            <option value="popular">인기순</option>
          </select>
        </div>

        {isLoading && <p>불러오는 중...</p>}
        {error && <p className="auth-error">{error}</p>}
        {!isLoading && !error && games.length === 0 && <p>모집 중인 게임이 없습니다.</p>}

        <div className="game-grid">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              이전
            </button>
            <span>
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
