import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  const where = category ? { category } : {};

  const phonemes = await prisma.phoneme.findMany({
    where,
    orderBy: { ipaSymbol: 'asc' },
  });

  return Response.json(phonemes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const phoneme = await prisma.phoneme.create({
    data: {
      id: body.id ?? crypto.randomUUID(),
      ipaSymbol: body.ipaSymbol,
      category: body.category,
      f1TargetHz: body.f1TargetHz ?? null,
      f2TargetHz: body.f2TargetHz ?? null,
      description: body.description ?? null,
    },
  });

  return Response.json(phoneme, { status: 201 });
}
