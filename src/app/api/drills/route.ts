import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  const where = type ? { drillType: type } : {};

  const drills = await prisma.drill.findMany({
    where,
    include: { phonemeSequence: { include: { phoneme: true } } },
    orderBy: { difficulty: 'asc' },
  });

  return Response.json(drills);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const drill = await prisma.drill.create({
    data: {
      id: body.id ?? crypto.randomUUID(),
      title: body.title,
      drillType: body.drillType,
      targetText: body.targetText,
      targetIpa: body.targetIpa,
      description: body.description ?? null,
      difficulty: body.difficulty ?? 1,
      referenceAudioUrl: body.referenceAudioUrl ?? null,
      phonemeSequence: body.phonemeSequence?.map((p: { phonemeId: string; position: number; startTimeMs?: number | null; endTimeMs?: number | null }) => ({
        phonemeId: p.phonemeId,
        position: p.position,
        startTimeMs: p.startTimeMs ?? null,
        endTimeMs: p.endTimeMs ?? null,
      })) ?? [],
    },
  });

  return Response.json(drill, { status: 201 });
}
