import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const drillId = searchParams.get('drillId');

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (drillId) where.drillId = drillId;

  const recordings = await prisma.userRecording.findMany({
    where,
    include: {
      drill: { include: { phonemeSequence: { include: { phoneme: true } } } },
      phonemeScores: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return Response.json(recordings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const recording = await prisma.userRecording.create({
    data: {
      userId: body.userId ?? null,
      drillId: body.drillId,
      audioBlobUrl: body.audioBlobUrl,
      durationMs: body.durationMs,
      overallScore: body.overallScore,
      pitchAccuracyScore: body.pitchAccuracyScore ?? null,
      timingScore: body.timingScore ?? null,
      formantScore: body.formantScore ?? null,
      phonemeScores: body.phonemeScores?.map((s: { phonemeId: string; positionIndex: number; startTimeMs: number; endTimeMs: number; gopScore: number; detectedF1?: number | null; detectedF2?: number | null; isAcceptable: boolean; confidence?: number | null }) => ({
        phonemeId: s.phonemeId,
        positionIndex: s.positionIndex,
        startTimeMs: s.startTimeMs,
        endTimeMs: s.endTimeMs,
        gopScore: s.gopScore,
        detectedF1: s.detectedF1 ?? null,
        detectedF2: s.detectedF2 ?? null,
        isAcceptable: s.isAcceptable,
        confidence: s.confidence ?? null,
      })) ?? [],
    },
    include: { phonemeScores: true },
  });

  // Upsert mastery
  for (const ps of recording.phonemeScores) {
    const existing = await prisma.userPhonemeMastery.findUnique({
      where: { userId_phonemeId: { userId: body.userId ?? 'anonymous', phonemeId: ps.phonemeId } },
    });

    if (existing) {
      await prisma.userPhonemeMastery.update({
        where: { userId_phonemeId: { userId: body.userId ?? 'anonymous', phonemeId: ps.phonemeId } },
        data: {
          attemptsCount: { increment: 1 },
          averageGopScore:
            (existing.averageGopScore * existing.attemptsCount + ps.gopScore) /
            (existing.attemptsCount + 1),
          masteryLevel:
            (existing.averageGopScore * existing.attemptsCount + ps.gopScore) /
            (existing.attemptsCount + 1),
          lastPracticedAt: new Date(),
        },
      });
    } else {
      await prisma.userPhonemeMastery.create({
        data: {
          userId: body.userId ?? 'anonymous',
          phonemeId: ps.phonemeId,
          attemptsCount: 1,
          averageGopScore: ps.gopScore,
          masteryLevel: ps.gopScore,
          lastPracticedAt: new Date(),
        },
      });
    }
  }

  return Response.json(recording, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return Response.json({ error: 'Missing id' }, { status: 400 });
  }

  await prisma.userRecording.delete({ where: { id } });
  return Response.json({ success: true });
}
