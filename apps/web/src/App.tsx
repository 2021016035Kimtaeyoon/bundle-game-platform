import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { GameListPage } from './pages/GameListPage';
import { GameCreatePage } from './pages/GameCreatePage';
import { GameDetailPage } from './pages/GameDetailPage';
import { JoinPage } from './pages/JoinPage';
import { PracticePage } from './pages/PracticePage';
import { PlayPage } from './pages/PlayPage';
import { PointsChargePage } from './pages/PointsChargePage';
import { PointsHistoryPage } from './pages/PointsHistoryPage';
import { MyShipmentsPage } from './pages/MyShipmentsPage';
import { OrganizerShipmentsPage } from './pages/OrganizerShipmentsPage';
import { VerifyPage } from './pages/VerifyPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import './App.css';

// Three.js 랜딩 페이지는 무거워서 실제로 "/"에 들어올 때만 로드한다.
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })),
);

function App() {
  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<div className="landing-loading" />}>
              <LandingPage />
            </Suspense>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/games" element={<GameListPage />} />
        <Route
          path="/games/create"
          element={
            <ProtectedRoute>
              <GameCreatePage />
            </ProtectedRoute>
          }
        />
        <Route path="/games/:id" element={<GameDetailPage />} />
        <Route path="/games/:id/verify" element={<VerifyPage />} />
        <Route
          path="/games/:id/join"
          element={
            <ProtectedRoute>
              <JoinPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games/:id/practice"
          element={
            <ProtectedRoute>
              <PracticePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games/:id/play"
          element={
            <ProtectedRoute>
              <PlayPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/points/charge"
          element={
            <ProtectedRoute>
              <PointsChargePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/points/history"
          element={
            <ProtectedRoute>
              <PointsHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shipments/mine"
          element={
            <ProtectedRoute>
              <MyShipmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/shipments"
          element={
            <ProtectedRoute>
              <OrganizerShipmentsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;
