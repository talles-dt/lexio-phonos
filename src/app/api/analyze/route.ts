import { analyzeDrill } from '@/utils/scoring';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    drillId,
    targetText,
    targetIpa,
    phonemeSequence,
    audioSamples,
    sampleRate,
  } = body;

  if (!audioSamples || !phonemeSequence || !drillId) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const samples = new Float32Array(audioSamples);
  const sequence = phonemeSequence.map((p: unknown) => {
    const pAny = p as Record<string, unknown>;
    return {
      phonemeId: String(pAny.phonemeId ?? ''),
      position: Number(pAny.position ?? 0),
      startTimeMs: Number(pAny.startTimeMs ?? 0),
      endTimeMs: Number(pAny.endTimeMs ?? 0),
      f1Target: pAny.f1Target != null ? Number(pAny.f1Target) : null,
      f2Target: pAny.f2Target != null ? Number(pAny.f2Target) : null,
    };
  });

  const analysis = analyzeDrill(
    drillId,
    targetText ?? '',
    targetIpa ?? '',
    sequence,
    samples,
    sampleRate ?? 16000,
  );

  return Response.json(analysis);
}
