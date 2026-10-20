import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const isLanding = pathname === '/';

  return (
    <div className="app-shell">
      <header className={`app-header ${isLanding ? 'app-header--overlay' : ''}`}>
        <Link to="/games" className="brand">
          <span className="brand-mark">●</span>
          라운드박스
        </Link>

        <div className="app-header-actions">
          {user ? (
            <>
              <Link to="/points/charge" className="points-chip">
                {Number(user.points).toLocaleString()}P 충전
              </Link>
              <Link to="/dashboard" className="user-chip">
                {user.username.slice(0, 8)}
              </Link>
              <button type="button" className="link-button" onClick={logout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="link-button">
                로그인
              </Link>
              <Link to="/signup" className="button-primary">
                회원가입
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
