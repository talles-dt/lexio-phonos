"use client";

import DrillCard from '@/components/DrillCard';
import PhonemeMasteryChart from '@/components/PhonemeMasteryChart';
import { useEffect, useState } from 'react';
import type { Drill } from '@/types/pronunciation';
import { registerSW } from '@/utils/registerSW';

async function fetchDrills(type?: string): Promise<Drill[]> {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  const res = await fetch(`/api/drills?${params}`);
  if (!res.ok) throw new Error('Failed to load drills');
  return res.json();
}

async function fetchMastery(): Promise<import('@/types/pronunciation').UserPhonemeMastery[]> {
  const res = await fetch('/api/mastery?userId=anonymous');
  if (!res.ok) return [];
  return (await res.json()) as import('@/types/pronunciation').UserPhonemeMastery[];
}

export default function Home() {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [mastery, setMastery] = useState<import('@/types/pronunciation').UserPhonemeMastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    registerSW();
    Promise.all([fetchDrills(), fetchMastery()])
      .then(([d, m]) => {
        setDrills(d);
        setMastery(m);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D0D0F]">
        <div className="animate-pulse lexio-mono lexio-zinc">Loading drills…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D0D0F]">
        <div className="lexio-crimson lexio-mono">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 max-w-5xl mx-auto w-full px-4 py-8 gap-8">
      <header className="flex flex-col items-center gap-2">
        <h1 className="lexio-title text-3xl text-[#F5F0E8] tracking-tight">
          Lexio Phonos
        </h1>
        <p className="lexio-zinc max-w-lg text-center font-serif">
          Practice English pronunciation with real-time audio analysis and
          phoneme-level feedback.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-4">
        <PhonemeMasteryChart masteryData={mastery} className="max-w-md" />
      </section>

      <section className="flex-1 flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-[#F5F0E8] font-serif">
          Drills
        </h2>
        <div className="flex flex-col gap-3">
          {drills.map((drill) => (
            <DrillCard key={drill.id} drill={drill} />
          ))}
        </div>
      </section>
    </div>
  );
}
