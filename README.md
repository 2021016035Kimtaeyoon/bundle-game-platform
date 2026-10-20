# bundle-game-platform

게임 기반 공동 구매 플랫폼. 사용자가 상품(기프티콘/피규어/전자제품/하이엔드/기타)을 등록하면,
다른 사용자들이 **포인트**로 참가비를 내고 게임(핀볼 등)에 참여해 1등을 가려 상품을 받는
서비스입니다. 사행성 방지를 위해 현금 결제가 아닌 포인트 충전 → 포인트 참여 구조입니다.

## 핀볼 게임 방식

참가자마다 공 하나씩 배정되어 모집 마감과 동시에 전원이 동시에 낙하합니다(플레이어 조작 없음).
순위는 게임 생성 시점에 공개된 시드(`gameId + createdAt + GAME_SECRET`)로 결정되는 공정한
셔플로 정해지며, 라운드 종료 후 시드가 공개되어 누구나 SHA-256으로 재계산해 결과가 조작되지
않았음을 검증할 수 있습니다.

## 랜딩 페이지 (`/`)

Three.js 기반 3D 우주 배경 랜딩 페이지. 스크롤에 따라 장면 전체가 회전하며, 흩어져 있던
빛 입자들이 점점 중앙으로 모여 마지막에 하나의 큰 빛이 탄생합니다. "라운드 보러가기" 버튼으로
`/games`(실제 서비스)로 연결됩니다. 무거운 Three.js 번들은 이 라우트에서만 지연 로딩됩니다.

## 기술 스택

- **프론트엔드**: React 18 + TypeScript + Vite
- **3D/애니메이션**: Three.js (랜딩 페이지 전용, 코드 스플리팅)
- **백엔드**: Node.js + Express + TypeScript
- **데이터베이스**: PostgreSQL (Prisma ORM)
- **캐시**: Redis
- **인증**: JWT
- **이미지 업로드**: Multer (로컬 디스크, `apps/api/uploads`)

## 프로젝트 구조

```
bundle-game-platform/
├── apps/
│   ├── web/            React 프론트엔드 (Vite)
│   └── api/             Express 백엔드
├── packages/
│   ├── shared-types/    프론트/백엔드 공유 타입
│   └── database/        Prisma 스키마 & 클라이언트
├── docker-compose.yml   로컬 PostgreSQL + Redis
└── package.json         npm workspaces 루트
```

## 설치 방법

```bash
npm install
cp .env.example .env
```

`.env`의 값을 필요에 맞게 수정하세요 (JWT 시크릿, DB URL 등).

## 로컬 개발 환경 실행

1. PostgreSQL / Redis 기동 (Docker 필요):

```bash
docker compose up -d
```

2. Prisma 클라이언트 생성 및 마이그레이션:

```bash
npm run prisma:generate
npm run prisma:migrate
```

3. 프론트엔드 + 백엔드 동시 실행:

```bash
npm run dev
```

- 프론트엔드: http://localhost:5173
- 백엔드: http://localhost:4000 (헬스체크: `/api/health`)

개별 실행은 `npm run dev:web`, `npm run dev:api`로 가능합니다.

## 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 웹 + API 동시 개발 서버 실행 |
| `npm run build` | 전체 워크스페이스 빌드 |
| `npm run lint` | ESLint 검사 |
| `npm run format` | Prettier 포맷팅 |
| `npm run prisma:generate` | Prisma 클라이언트 생성 |
| `npm run prisma:migrate` | Prisma 마이그레이션 실행 |
| `npm run prisma:studio` | Prisma Studio 실행 |
| `npm run prisma:seed` | 테스트 데이터 시딩 (사용자 5명, 게임 3개) |

## 진행 상황

- [x] STEP 0: 프로젝트 초기 설정
- [x] STEP 1: 데이터베이스 스키마 설계
- [x] STEP 2: 인증 시스템
- [x] STEP 3: 게임 모집글 CRUD
- [x] STEP 4: 게임 엔진 (핀볼 → 동시 낙하 추첨 방식으로 재설계)
- [x] STEP 5: 결제 시스템 (포인트 충전 + 포인트 참여로 대체, 실제 PG 미연동)
- [x] STEP 6: 배송 & 정산 (송장번호 등록 시 택배사 API로 배송완료 자동 확인 → 포인트 자동 정산, 수동 처리는 폴백)
- [x] STEP 7: 신뢰성 검증 시스템
- [ ] STEP 8: 테스트
- [ ] STEP 9: 배포 준비
