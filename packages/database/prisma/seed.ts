import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from 'dotenv';
import bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = await Promise.all(
    [
      { email: 'organizer@example.com', username: 'organizer_kim', isOrganizer: true },
      { email: 'player1@example.com', username: 'player_lee' },
      { email: 'player2@example.com', username: 'player_park' },
      { email: 'player3@example.com', username: 'player_choi' },
      { email: 'player4@example.com', username: 'player_jung' },
    ].map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { ...u, passwordHash },
      }),
    ),
  );

  const [organizer, player1, player2, player3, player4] = users;

  const gameSeeds = [
    {
      title: '스타벅스 기프티콘 5장 핀볼 대결',
      description: '3분간 핀볼로 최고 점수를 낸 사람이 스타벅스 기프티콘 5장을 가져갑니다.',
      category: 'GIFTICON' as const,
      productName: '스타벅스 아메리카노 기프티콘 5장',
      gameType: 'PINBALL' as const,
      participantLimit: 10,
      entryFee: '3000',
    },
    {
      title: '넨도로이드 피규어 경마 게임',
      description: '경마 게임 1등에게 넨도로이드 한정판 피규어를 드립니다.',
      category: 'FIGURE' as const,
      productName: '넨도로이드 한정판 피규어',
      gameType: 'HORSE_RACE' as const,
      participantLimit: 8,
      entryFee: '5000',
    },
    {
      title: '에어팟 프로 슬롯 게임',
      description: '슬롯 게임으로 에어팟 프로를 노려보세요.',
      category: 'ELECTRONICS' as const,
      productName: '에어팟 프로 2세대',
      gameType: 'SLOT' as const,
      participantLimit: 20,
      entryFee: '10000',
    },
  ];

  const now = new Date();

  for (const seed of gameSeeds) {
    const game = await prisma.game.create({
      data: {
        organizerId: organizer.id,
        title: seed.title,
        description: seed.description,
        category: seed.category,
        productName: seed.productName,
        gameType: seed.gameType,
        participantLimit: seed.participantLimit,
        entryFee: seed.entryFee,
        recruitmentStartsAt: now,
        recruitmentEndsAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3),
        status: 'RECRUITING',
      },
    });

    const seedValue = `${game.id}:${game.createdAt.getTime()}:${process.env.GAME_SECRET ?? 'dev-secret'}`;
    const resultHash = createHash('sha256').update(seedValue).digest('hex');
    await prisma.game.update({ where: { id: game.id }, data: { resultHash } });

    const participants = [player1, player2, player3, player4];
    for (const participant of participants) {
      await prisma.gameParticipant.create({
        data: {
          gameId: game.id,
          userId: participant.id,
          entryFee: seed.entryFee,
          paymentMethod: 'POINT',
          paymentStatus: 'COMPLETED',
        },
      });
    }

    await prisma.game.update({
      where: { id: game.id },
      data: {
        participantCount: participants.length,
        totalPool: { increment: Number(seed.entryFee) * participants.length },
      },
    });
  }

  console.log(`Seeded ${users.length} users and ${gameSeeds.length} games.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
