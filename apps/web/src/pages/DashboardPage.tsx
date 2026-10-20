import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="page-form auth-form">
      <h1>대시보드</h1>
      <p>{user?.username}님, 환영합니다.</p>
      <p>{user?.email}</p>
      <p className="estimate">보유 포인트: {Number(user?.points ?? 0).toLocaleString()}P</p>
      <p>
        <Link to="/points/charge">포인트 충전하기</Link>
      </p>
      <p>
        <Link to="/points/history">포인트 내역 보기</Link>
      </p>
      <p>
        <Link to="/shipments/mine">당첨 내역 / 배송지 입력</Link>
      </p>
      {user?.isOrganizer && (
        <p>
          <Link to="/organizer/shipments">배송 관리 (주최자)</Link>
        </p>
      )}
      <p>
        <Link to="/games">게임 모집 목록 보기</Link>
      </p>
      <button type="button" className="primary" onClick={handleLogout}>
        로그아웃
      </button>
    </div>
  );
}
