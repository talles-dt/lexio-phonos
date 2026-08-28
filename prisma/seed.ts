import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Phonemes — IPA dictionary with formant targets
  const phonemes: Array<{
    id: string;
    ipaSymbol: string;
    category: string;
    f1TargetHz: number | null;
    f2TargetHz: number | null;
    description: string;
  }> = [
    // High front vowels
    { id: 'i:', ipaSymbol: 'iː', category: 'vowel_tense', f1TargetHz: 270, f2TargetHz: 2290, description: 'Close front unrounded vowel. Tongue high and front, lips spread.' },
    { id: 'I', ipaSymbol: 'ɪ', category: 'vowel_lax', f1TargetHz: 390, f2TargetHz: 1990, description: 'Near-close near-front unrounded vowel. More central and lax than /iː/.' },
    // Mid front vowels
    { id: 'e', ipaSymbol: 'ɛ', category: 'vowel_mid_front', f1TargetHz: 530, f2TargetHz: 1840, description: 'Open-mid front unrounded vowel. Tongue mid and front.' },
    { id: 'ae', ipaSymbol: 'æ', category: 'vowel_low_front', f1TargetHz: 660, f2TargetHz: 1720, description: 'Near-open front unrounded vowel. Jaw dropped, tongue low and front.' },
    // Central vowels
    { id: '@', ipaSymbol: 'ə', category: 'vowel_schwa', f1TargetHz: 500, f2TargetHz: 1500, description: 'Schwa — mid central vowel. Unstressed, relaxed tongue position.' },
    { id: 'uh', ipaSymbol: 'ʌ', category: 'vowel_mid_central', f1TargetHz: 600, f2TargetHz: 1170, description: 'Open-mid back unrounded vowel. Tongue mid and slightly back.' },
    { id: 'ɜ:', ipaSymbol: 'ɜː', category: 'vowel_mid_central_long', f1TargetHz: 490, f2TargetHz: 1350, description: 'Open-mid central unrounded vowel, long. As in "bird" (RP).' },
    // High back vowels
    { id: 'u:', ipaSymbol: 'uː', category: 'vowel_back_tense', f1TargetHz: 300, f2TargetHz: 870, description: 'Close back rounded vowel. Lips rounded, tongue high and back.' },
    { id: 'ʊ', ipaSymbol: 'ʊ', category: 'vowel_back_lax', f1TargetHz: 440, f2TargetHz: 1020, description: 'Near-close near-back rounded vowel. More central and lax than /uː/.' },
    // Mid back vowels
    { id: 'ɔ:', ipaSymbol: 'ɔː', category: 'vowel_back_open_mid', f1TargetHz: 500, f2TargetHz: 850, description: 'Open-mid back rounded vowel. Lips rounded, jaw moderately open.' },
    { id: 'o:', ipaSymbol: 'oː', category: 'vowel_back_close_mid', f1TargetHz: 450, f2TargetHz: 850, description: 'Close-mid back rounded vowel.' },
    // Low back vowel
    { id: 'ɑ:', ipaSymbol: 'ɑː', category: 'vowel_low_back', f1TargetHz: 750, f2TargetHz: 1100, description: 'Open back unrounded vowel. Jaw wide open, tongue low and back.' },
    // Consonants (placeholder formants)
    { id: 'p', ipaSymbol: 'p', category: 'stop_bilabial_voiceless', f1TargetHz: null, f2TargetHz: null, description: 'Voiceless bilabial plosive.' },
    { id: 'b', ipaSymbol: 'b', category: 'stop_bilabial_voiced', f1TargetHz: null, f2TargetHz: null, description: 'Voiced bilabial plosive.' },
    { id: 't', ipaSymbol: 't', category: 'stop_alveolar_voiceless', f1TargetHz: null, f2TargetHz: null, description: 'Voiceless alveolar plosive.' },
    { id: 'd', ipaSymbol: 'd', category: 'stop_alveolar_voiced', f1TargetHz: null, f2TargetHz: null, description: 'Voiced alveolar plosive.' },
    { id: 'k', ipaSymbol: 'k', category: 'stop_velar_voiceless', f1TargetHz: null, f2TargetHz: null, description: 'Voiceless velar plosive.' },
    { id: 'g', ipaSymbol: 'g', category: 'stop_velar_voiced', f1TargetHz: null, f2TargetHz: null, description: 'Voiced velar plosive.' },
    { id: 'f', ipaSymbol: 'f', category: 'fricative_labiodental_voiceless', f1TargetHz: null, f2TargetHz: null, description: 'Voiceless labiodental fricative.' },
    { id: 'v', ipaSymbol: 'v', category: 'fricative_labiodental_voiced', f1TargetHz: null, f2TargetHz: null, description: 'Voiced labiodental fricative.' },
    { id: 'θ', ipaSymbol: 'θ', category: 'fricative_dental_voiceless', f1TargetHz: null, f2TargetHz: null, description: 'Voiceless dental fricative. Tongue between teeth.' },
    { id: 'ð', ipaSymbol: 'ð', category: 'fricative_dental_voiced', f1TargetHz: null, f2TargetHz: null, description: 'Voiced dental fricative. As in "this".' },
    { id: 's', ipaSymbol: 's', category: 'fricative_alveolar_voiceless', f1TargetHz: null, f2TargetHz: null, description: 'Voiceless alveolar fricative.' },
    { id: 'z', ipaSymbol: 'z', category: 'fricative_alveolar_voiced', f1TargetHz: null, f2TargetHz: null, description: 'Voiced alveolar fricative.' },
    { id: 'ʃ', ipaSymbol: 'ʃ', category: 'fricative_palato_alveolar_voiceless', f1TargetHz: null, f2TargetHz: null, description: 'Voiceless palato-alveolar fricative. As in "ship".' },
    { id: 'ʒ', ipaSymbol: 'ʒ', category: 'fricative_palato_alveolar_voiced', f1TargetHz: null, f2TargetHz: null, description: 'Voiced palato-alveolar fricative. As in "vision".' },
    { id: 'h', ipaSymbol: 'h', category: 'glottal_fricative', f1TargetHz: null, f2TargetHz: null, description: 'Voiceless glottal fricative.' },
    { id: 'm', ipaSymbol: 'm', category: 'nasal_bilabial', f1TargetHz: null, f2TargetHz: null, description: 'Bilabial nasal.' },
    { id: 'n', ipaSymbol: 'n', category: 'nasal_alveolar', f1TargetHz: null, f2TargetHz: null, description: 'Alveolar nasal.' },
    { id: 'ŋ', ipaSymbol: 'ŋ', category: 'nasal_velar', f1TargetHz: null, f2TargetHz: null, description: 'Velar nasal. As in "sing".' },
    { id: 'l', ipaSymbol: 'l', category: 'lateral_alveolar', f1TargetHz: null, f2TargetHz: null, description: 'Alveolar lateral approximant.' },
    { id: 'r', ipaSymbol: 'r', category: 'approximant_alveolar', f1TargetHz: null, f2TargetHz: null, description: 'Alveolar approximant. As in "red".' },
    { id: 'w', ipaSymbol: 'w', category: 'approximant_labial_velar', f1TargetHz: null, f2TargetHz: null, description: 'Labial-velar approximant.' },
    { id: 'j', ipaSymbol: 'j', category: 'approximant_palatal', f1TargetHz: null, f2TargetHz: null, description: 'Palatal approximant. As in "yes".' },
  ];

  for (const p of phonemes) {
    await prisma.phoneme.upsert({
      where: { ipaSymbol: p.ipaSymbol },
      update: p,
      create: p,
    });
  }

  // DrillPhoneme helper
  type Dp = { phonemeId: string; position: number; startTimeMs?: number | null; endTimeMs?: number | null };
  function seq(items: Dp[]) {
    return items.map((p) => ({
      phonemeId: p.phonemeId,
      position: p.position,
      startTimeMs: p.startTimeMs ?? null,
      endTimeMs: p.endTimeMs ?? null,
    }));
  }

  const drillsData = [
    { id: 'sheep-ship', title: 'Sheep vs Ship', drillType: 'MINIMAL_PAIR', targetText: 'Sheep', targetIpa: 'ʃ iː p', description: 'Distinguish the tense /iː/ from the lax /ɪ/. Hold the /iː/ longer and keep the tongue high front.', difficulty: 1, phonemeSequence: seq([{ phonemeId: 'i:', position: 0, startTimeMs: 0, endTimeMs: 400 }]) },
    { id: 'think-sink', title: 'Think vs Sink', drillType: 'MINIMAL_PAIR', targetText: 'Think', targetIpa: 'θ ɪ ŋ k', description: 'Practice the dental fricative /θ/ — place the tongue between the teeth and blow air. Do not substitute /s/.', difficulty: 2, phonemeSequence: seq([{ phonemeId: 'θ', position: 0, startTimeMs: 0, endTimeMs: 150 }, { phonemeId: 'I', position: 1, startTimeMs: 150, endTimeMs: 350 }, { phonemeId: 'ŋ', position: 2, startTimeMs: 350, endTimeMs: 450 }, { phonemeId: 'k', position: 3, startTimeMs: 450, endTimeMs: 550 }]) },
    { id: 'bed-bad', title: 'Bed vs Bad', drillType: 'MINIMAL_PAIR', targetText: 'Bed', targetIpa: 'b e d', description: 'Practice the mid-front /ɛ/. Jaw slightly open, tongue mid front. Do not raise to /ɪ/ or lower to /æ/.', difficulty: 1, phonemeSequence: seq([{ phonemeId: 'b', position: 0, startTimeMs: 0, endTimeMs: 100 }, { phonemeId: 'e', position: 1, startTimeMs: 100, endTimeMs: 300 }, { phonemeId: 'd', position: 2, startTimeMs: 300, endTimeMs: 400 }]) },
    { id: 'cat-cut', title: 'Cat vs Cut', drillType: 'MINIMAL_PAIR', targetText: 'Cat', targetIpa: 'k æ t', description: 'Practice the low front /æ/. Drop the jaw more than for /ʌ/. Tongue low and front.', difficulty: 1, phonemeSequence: seq([{ phonemeId: 'k', position: 0, startTimeMs: 0, endTimeMs: 100 }, { phonemeId: 'ae', position: 1, startTimeMs: 100, endTimeMs: 300 }, { phonemeId: 't', position: 2, startTimeMs: 300, endTimeMs: 400 }]) },
    { id: 'pool-pull', title: 'Pool vs Pull', drillType: 'MINIMAL_PAIR', targetText: 'Pool', targetIpa: 'p uː l', description: 'Practice the tense back /uː/. Round the lips, keep the tongue high and back.', difficulty: 1, phonemeSequence: seq([{ phonemeId: 'p', position: 0, startTimeMs: 0, endTimeMs: 100 }, { phonemeId: 'u:', position: 1, startTimeMs: 100, endTimeMs: 350 }, { phonemeId: 'l', position: 2, startTimeMs: 350, endTimeMs: 450 }]) },
    { id: 'full-fool', title: 'Full vs Fool', drillType: 'MINIMAL_PAIR', targetText: 'Full', targetIpa: 'f ʊ l', description: 'Practice the lax back /ʊ/. Less rounded and more central than /uː/.', difficulty: 2, phonemeSequence: seq([{ phonemeId: 'f', position: 0, startTimeMs: 0, endTimeMs: 100 }, { phonemeId: 'ʊ', position: 1, startTimeMs: 100, endTimeMs: 300 }, { phonemeId: 'l', position: 2, startTimeMs: 300, endTimeMs: 400 }]) },
    { id: 'top-stop', title: 'Top — Consonant Cluster', drillType: 'CONSONANT_CLUSTER', targetText: 'Stop', targetIpa: 's t ɒ p', description: 'Practice the /st/ cluster. Keep the /s/ short and transition quickly to /t/ without an epenthetic vowel.', difficulty: 2, phonemeSequence: seq([{ phonemeId: 's', position: 0, startTimeMs: 0, endTimeMs: 120 }, { phonemeId: 't', position: 1, startTimeMs: 120, endTimeMs: 200 }, { phonemeId: 'ɔ:', position: 2, startTimeMs: 200, endTimeMs: 350 }, { phonemeId: 'p', position: 3, startTimeMs: 350, endTimeMs: 500 }]) },
    { id: 'street-stress', title: 'Street — Word Stress', drillType: 'WORD_STRESS', targetText: 'Street', targetIpa: 's t r iː t', description: 'Primary stress on the only syllable. Keep the /iː/ long and strong, with clear aspiration on /t/.', difficulty: 1, phonemeSequence: seq([{ phonemeId: 's', position: 0, startTimeMs: 0, endTimeMs: 80 }, { phonemeId: 't', position: 1, startTimeMs: 80, endTimeMs: 140 }, { phonemeId: 'r', position: 2, startTimeMs: 140, endTimeMs: 200 }, { phonemeId: 'i:', position: 3, startTimeMs: 200, endTimeMs: 400 }, { phonemeId: 't', position: 4, startTimeMs: 400, endTimeMs: 520 }]) },
    { id: 'banana-vowel-reduction', title: 'Banana — Vowel Reduction', drillType: 'VOWEL_REDUCTION', targetText: 'Banana', targetIpa: 'b ə ˈn æ n ə', description: 'Reduce the first and last syllables to schwa /ə/. Stress the middle syllable /ˈnæ/.', difficulty: 2, phonemeSequence: seq([{ phonemeId: 'b', position: 0, startTimeMs: 0, endTimeMs: 80 }, { phonemeId: '@', position: 1, startTimeMs: 80, endTimeMs: 180 }, { phonemeId: 'n', position: 2, startTimeMs: 180, endTimeMs: 260 }, { phonemeId: 'ae', position: 3, startTimeMs: 260, endTimeMs: 380 }, { phonemeId: 'n', position: 4, startTimeMs: 380, endTimeMs: 440 }, { phonemeId: '@', position: 5, startTimeMs: 440, endTimeMs: 540 }]) },
    { id: 'today-reduction', title: 'Today — Vowel Reduction', drillType: 'VOWEL_REDUCTION', targetText: 'Today', targetIpa: 't ə ˈd e ɪ', description: 'Reduce "to" to schwa /tə/. Stress on "day": /ˈdeɪ/.', difficulty: 2, phonemeSequence: seq([{ phonemeId: 't', position: 0, startTimeMs: 0, endTimeMs: 80 }, { phonemeId: '@', position: 1, startTimeMs: 80, endTimeMs: 180 }, { phonemeId: 'd', position: 2, startTimeMs: 180, endTimeMs: 280 }, { phonemeId: 'e', position: 3, startTimeMs: 280, endTimeMs: 420 }, { phonemeId: 'I', position: 4, startTimeMs: 420, endTimeMs: 520 }]) },
    { id: 'question-intonation', title: 'Question — Intonation', drillType: 'INTONATION', targetText: 'Really?', targetIpa: 'r iː ə l i ˈ?', description: 'Rising intonation on yes/no questions. Pitch should rise from mid on "real-" to high on "-ly".', difficulty: 3, phonemeSequence: seq([{ phonemeId: 'r', position: 0, startTimeMs: 0, endTimeMs: 100 }, { phonemeId: 'i:', position: 1, startTimeMs: 100, endTimeMs: 300 }, { phonemeId: '@', position: 2, startTimeMs: 300, endTimeMs: 400 }, { phonemeId: 'l', position: 3, startTimeMs: 400, endTimeMs: 480 }, { phonemeId: 'I', position: 4, startTimeMs: 480, endTimeMs: 650 }]) },
  ];

  for (const d of drillsData) {
    await prisma.drill.upsert({
      where: { id: d.id },
      update: {
        title: d.title,
        drillType: d.drillType,
        targetText: d.targetText,
        targetIpa: d.targetIpa,
        description: d.description,
        difficulty: d.difficulty,
      },
      create: {
        ...d,
        phonemeSequence: {
          create: d.phonemeSequence,
        },
      },
    });
  }

  console.log(`Seed complete: ${phonemes.length} phonemes, ${drillsData.length} drills`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
