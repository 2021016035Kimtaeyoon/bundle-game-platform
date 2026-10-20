import { useEffect, useState } from 'react';

function computeRemaining(targetIso: string | null): number {
  if (!targetIso) return 0;
  return Math.max(0, new Date(targetIso).getTime() - Date.now());
}

export function useCountdown(targetIso: string | null): number {
  const [remainingMs, setRemainingMs] = useState(() => computeRemaining(targetIso));

  useEffect(() => {
    setRemainingMs(computeRemaining(targetIso));
    if (!targetIso) return;
    const interval = setInterval(() => setRemainingMs(computeRemaining(targetIso)), 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  return remainingMs;
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return '마감';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}일 ${hours}시간 남음`;
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
  if (minutes > 0) return `${minutes}분 ${seconds}초 남음`;
  return `${seconds}초 남음`;
}
