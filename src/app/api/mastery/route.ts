import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') ?? 'anonymous';

  const mastery = await prisma.userPhonemeMastery.findMany({
    where: { userId },
    include: { phoneme: true },
    orderBy: { masteryLevel: 'desc' },
  });

  return Response.json(mastery);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const mastery = await prisma.userPhonemeMastery.upsert({
    where: { userId_phonemeId: { userId: body.userId ?? 'anonymous', phonemeId: body.phonemeId } },
    update: {
      masteryLevel: body.masteryLevel,
      lastPracticedAt: new Date(),
    },
    create: {
      userId: body.userId ?? 'anonymous',
      phonemeId: body.phonemeId,
      masteryLevel: body.masteryLevel,
      attemptsCount: 0,
      averageGopScore: 0,
      lastPracticedAt: new Date(),
    },
  });

  return Response.json(mastery, { status: 200 });
}
