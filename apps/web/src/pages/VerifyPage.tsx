import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { sha256Hex } from '../lib/sha256';
import type { VerificationData } from '../types/verification';

type VerdictState = 'idle' | 'checking' | 'match' | 'mismatch';

function jsSnippet(seed: string) {
  return `const crypto = require('crypto');
const seed = ${JSON.stringify(seed)};
console.log(crypto.createHash('sha256').update(seed).digest('hex'));`;
}

function pySnippet(seed: string) {
  return `import hashlib
seed = ${JSON.stringify(seed)}
print(hashlib.sha256(seed.encode()).hexdigest())`;
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 권한이 없는 환경에서는 조용히 무시한다.
    }
  }

  return (
    <div className="code-block">
      <button type="button" className="code-copy-button" onClick={handleCopy}>
        {copied ? '복사됨!' : '복사'}
      </button>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function VerifyPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<VerdictState>('idle');

  useEffect(() => {
    api
      .get(`/api/games/${id}/verify`)
      .then((response) => setData(response.data))
      .catch((err) => {
        const message = err?.response?.data?.error ?? '검증 정보를 불러오지 못했습니다.';
        setError(message);
      });
  }, [id]);

  async function handleVerify() {
    if (!data?.originalSeed || !data.resultHash) return;
    setVerdict('checking');
    const computed = await sha256Hex(data.originalSeed);
    setVerdict(computed === data.resultHash ? 'match' : 'mismatch');
  }

  if (error) return <p className="page-form auth-error">{error}</p>;
  if (!data) return <p className="page-form">불러오는 중...</p>;

  return (
    <div className="page-form game-wide">
      <h1>결과 검증 — {data.title}</h1>
      <p className="detail-subtitle">{data.verificationInstructions}</p>

      <dl className="detail-list">
        <div>
          <dt>원본 시드 (originalSeed)</dt>
          <dd className="mono-value">{data.originalSeed ?? '아직 공개되지 않았습니다.'}</dd>
        </div>
        <div>
          <dt>결과 해시 (resultHash)</dt>
          <dd className="mono-value">{data.resultHash ?? '-'}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="primary"
        onClick={handleVerify}
        disabled={verdict === 'checking'}
      >
        {verdict === 'checking' ? '검증 중...' : '브라우저에서 직접 검증하기'}
      </button>

      {verdict === 'match' && (
        <p className="verify-result verify-match">
          ✓ 검증 완료: 원본 시드를 SHA-256으로 해싱한 값이 공개된 resultHash와 일치합니다. 결과가
          조작되지 않았습니다.
        </p>
      )}
      {verdict === 'mismatch' && (
        <p className="verify-result verify-mismatch">
          ✗ 검증 실패: 해시가 일치하지 않습니다. 이 게임의 결과를 신뢰할 수 없습니다.
        </p>
      )}

      <h2>순위 결과</h2>
      <table className="verify-table">
        <thead>
          <tr>
            <th>순위</th>
            <th>참가자</th>
            <th>결과</th>
            <th>보상</th>
          </tr>
        </thead>
        <tbody>
          {data.results.map((row) => (
            <tr key={row.rank} className={row.isWinner ? 'is-winner-row' : ''}>
              <td>{row.rank}위</td>
              <td>{row.username}</td>
              <td>{row.isWinner ? '상품 획득' : '포인트 환급'}</td>
              <td>{row.isWinner ? '-' : `+${Number(row.rewardAmount).toLocaleString()}P`}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.originalSeed && (
        <>
          <h2>직접 코드로 검증하기</h2>
          <p className="field-hint">
            아래 코드를 그대로 실행해서 나온 해시값이 위 resultHash와 같은지 비교해보세요.
          </p>
          <CodeBlock code={jsSnippet(data.originalSeed)} />
          <CodeBlock code={pySnippet(data.originalSeed)} />
        </>
      )}
    </div>
  );
}
