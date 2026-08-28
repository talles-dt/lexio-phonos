#!/usr/bin/env -S npx tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Phonemes — IPA dictionary with formant targets
  const phonemes = [
    { id: 'i:', ipaSymbol: 'iː', category: 'vowel_high_front', f1TargetHz: 270, f2TargetHz: 2290, description: 'Close front unrounded vowel. Tense, high tongue position, lips spread.' },
    { id: 'ɪ', ipaSymbol: 'ɪ', category: 'vowel_lax', f1TargetHz: 390, f2TargetHz: 1990, description: 'Near-close near-front unrounded vowel. Lax, slightly lower tongue than /iː/.' },
    { id: 'e', ipaSymbol: 'ɛ', category: 'vowel_mid_front', f1TargetHz: 530, f2TargetHz: 1840, description: 'Open-mid front unrounded vowel. Mid tongue height, jaws slightly open.' },
    { id: 'æ', ipaSymbol: 'æ', category: 'vowel_low_front', f1TargetHz: 660, f2TargetHz: 1720, description: 'Near-open front unrounded vowel. Low tongue, wide mouth, common in "cat", "bad".' },
    { id: 'ɑː', ipaSymbol: 'ɑː', category: 'vowel_low_back', f1TargetHz: 750, f2TargetHz: 1100, description: 'Open back unrounded vowel. Low back tongue, lips neutral, as in "father", "bath".' },
    { id: 'ɔː', ipaSymbol: 'ɔː', category: 'vowel_low_back', f1TargetHz: 500, f2TargetHz: 850, description: 'Open-mid back rounded vowel. Back tongue, rounded lips, as in "thought", "law".' },
    { id: 'oː', ipaSymbol: 'oː', category: 'vowel_low_back', f1TargetHz: 450, f2TargetHz: 850, description: 'Close-mid back rounded vowel. Mid-back tongue, rounded lips, as in "go", "boat".' },
    { id: 'ʊ', ipaSymbol: 'ʊ', category: 'vowel_lax', f1TargetHz: 440, f2TargetHz: 1020, description: 'Near-close near-back rounded vowel. Lax, slightly centralized, as in "good", "book".' },
    { id: 'uː', ipaSymbol: 'uː', category: 'vowel_high_back', f1TargetHz: 300, f2TargetHz: 870, description: 'Close back rounded vowel. High back tongue, strongly rounded lips, as in "food", "blue".' },
    { id: 'ʌ', ipaSymbol: 'ʌ', category: 'vowel_mid_central', f1TargetHz: 600, f2TargetHz: 1170, description: 'Open-mid back unrounded vowel. Central-back tongue, neutral lips, as in "cup", "run".' },
    { id: '@', ipaSymbol: 'ə', category: 'vowel_schwa', f1TargetHz: 500, f2TargetHz: 1500, description: 'Mid-central vowel (schwa). Unstressed, neutral tongue, most common vowel in English.' },
    { id: 'ɜː', ipaSymbol: 'ɜː', category: 'vowel_mid_central', f1TargetHz: 490, f2TargetHz: 1350, description: 'Open-mid central unrounded vowel. Stressed schwa, as in "bird", "her".' },
    { id: 'eɪ', ipaSymbol: 'eɪ', category: 'diphthong', f1TargetHz: 500, f2TargetHz: 1700, description: 'Closing diphthong: mid-front to close front. As in "face", "day".' },
    { id: 'aɪ', ipaSymbol: 'aɪ', category: 'diphthong', f1TargetHz: 600, f2TargetHz: 1900, description: 'Closing diphthong: open front to close front. As in "price", "my".' },
    { id: 'ɔɪ', ipaSymbol: 'ɔɪ', category: 'diphthong', f1TargetHz: 500, f2TargetHz: 1200, description: 'Closing diphthong: open back to close front. As in "choice", "boy".' },
    { id: 'aʊ', ipaSymbol: 'aʊ', category: 'diphthong', f1TargetHz: 600, f2TargetHz: 1400, description: 'Closing diphthong: open front to close back. As in "mouth", "now".' },
    { id: 'oʊ', ipaSymbol: 'oʊ', category: 'diphthong', f1TargetHz: 450, f2TargetHz: 1000, description: 'Closing diphthong: close-mid back to close back. As in "goat", "show".' },
    { id: 'ɪə', ipaSymbol: 'ɪə', category: 'diphthong', f1TargetHz: 380, f2TargetHz: 1500, description: 'Centering diphthong: near-close front to schwa. As in "near", "here".' },
    { id: 'eə', ipaSymbol: 'eə', category: 'diphthong', f1TargetHz: 500, f2TargetHz: 1500, description: 'Centering diphthong: open-mid front to schwa. As in "square", "care".' },
    { id: 'ʊə', ipaSymbol: 'ʊə', category: 'diphthong', f1TargetHz: 430, f2TargetHz: 1350, description: 'Centering diphthong: near-close back to schwa. As in "cure", "tour".' },
    { id: 'p', ipaSymbol: 'p', category: 'stop_bilabial_voiceless', f1TargetHz: null, f2TargetHz: null, description: 'Voiceless bilabial plosive. Lips close then release with a puff of air, as in "pat", "spin".' },
    { id: 'b', ipaSymbol: 'b', category: 'stop_bilabial_voiced', f1TargetHz: null, f2TargetHz: null, description: 'Voiced bilabial plosive. Lips close, vocal cords vibrate, as in "bat", "rib".' },
    { id: 't', ipaSymbol: 't', category: 'stop_alveolar_voiceless', f1TargetHz: null, f2TargetHz: null, description: 'Voiceless alveolar plosive. Tongue tip against alveolar ridge, as in "top", "stop".' },
    { id: 'd', ipaSymbol: 'd', category: 'stop_alveolar_voiced', f1TargetHz: null, f2TargetHz: null, description: 'Voiced alveolar plosive. Tongue tip against ridge, vocal cords on, as in "dog", "red".' },
    { id: 'k', ipaSymbol: 'k', category: 'stop_velar_voiceless', f1TargetHz: null, f2TargetHz: null, description: 'Voiceless velar plosive. Back of tongue against soft palate, as in "cat", "book".' },
    { id: 'g', ipaSymbol: 'g', category: 'stop_velar_voiced', f1TargetHz: null, f2TargetHz: null, description: 'Voiced velar plosive. Back tongue against palate, vocal cords on, as in "go", "bag".' },
    { id: 'f', ipaSymbol: 'f', category: 'fricative_labiodental_voiceless', f1TargetHz: null, f2TargetHz: null, description: 'Voiceless labiodental fricative. Lower lip against upper teeth, air squeezed through, as in "fun", "if".' },
    { id: 'v', ipaSymbol: 'v', category: 'fricative_labiodental_voiced', f1TargetHz: null, f2TargetHz: null, description: 'Voiced labiodental fricative. Lower lip against teeth, vocal cords on, as in "very", "have".' },
    { id: 'θ', ipaSymbol: 'θ', category: 'fricative_dental_voiceless', f1TargetHz: null, f2TargetHz: null, description: 'Voiceless dental fricative. Tongue tip between teeth, air flows, as in "think", "bath".' },
    { id: 'ð', ipaSymbol: 'ð', category: 'fricative_dental_voiced', f1TargetHz: null, f2TargetHz: null, description: 'Voiced dental fricative. Tongue between teeth, vocal cords on, as in "this", "mother".' },
    { id: 's', ipaSymbol: 's', category: 'fricative_alveolar_voiceless', f1TargetHz: null, f2TargetHz: null, description: 'Voiceless alveolar fricative. Tongue close to ridge, narrow channel, as in "sun", "pass".' },
    { id: 'z', ipaSymbol: 'z', category: 'fricative_alveolar_voiced', f1TargetHz: null, f2TargetHz: null, description: 'Voiced alveolar fricative. Same place as /s/ but vocal cords vibrate, as in "zip", "rose".' },
    { id: 'ʃ', ipaSymbol: 'ʃ', category: 'fricative_post_alveolar_voiceless', f1TargetHz: null, f2TargetHz: null, description: 'Voiceless post-alveolar fricative. Tongue blade near ridge, lips slightly rounded, as in "ship", "rush".' },
    { id: 'ʒ', ipaSymbol: 'ʒ', category: 'fricative_post_alveolar_voiced', f1TargetHz: null, f2TargetHz: null, description: 'Voiced post-alveolar fricative. Same as /ʃ/ with voicing, as in "measure", "vision".' },
    { id: 'h', ipaSymbol: 'h', category: 'glottal_fricative', f1TargetHz: null, f2TargetHz: null, description: 'Voiceless glottal fricative. Air passes through open vocal cords, as in "hat", "who".' },
  ];

  console.log('Seeding phonemes...');
  for (const p of phonemes) {
    await prisma.phoneme.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }

  const drills = [
    {
      id: 'sheep-ship',
      title: 'Sheep vs Ship',
      drillType: 'MINIMAL_PAIR',
      targetText: 'Sheep',
      targetIpa: 'ʃ iː p',
      description: 'Distinguish the tense /iː/ from the lax /ɪ/. Hold the front vowel longer for /iː/.',
      difficulty: 1,
      phonemeSequence: [
        { phonemeId: 'ʃ', position: 0, startTimeMs: 0, endTimeMs: 200, phoneme: {} },
        { phonemeId: 'i:', position: 1, startTimeMs: 200, endTimeMs: 500, phoneme: { f1TargetHz: 270, f2TargetHz: 2290 } },
        { phonemeId: 'p', position: 2, startTimeMs: 500, endTimeMs: 700, phoneme: {} },
      ],
    },
    {
      id: 'ship-sheep',
      title: 'Ship vs Sheep',
      drillType: 'MINIMAL_PAIR',
      targetText: 'Ship',
      targetIpa: 'ʃ ɪ p',
      description: 'Shorten the vowel and relax the tongue for /ɪ/. Keep it quick.',
      difficulty: 1,
      phonemeSequence: [
        { phonemeId: 'ʃ', position: 0, startTimeMs: 0, endTimeMs: 200, phoneme: {} },
        { phonemeId: 'ɪ', position: 1, startTimeMs: 200, endTimeMs: 400, phoneme: { f1TargetHz: 390, f2TargetHz: 1990 } },
        { phonemeId: 'p', position: 2, startTimeMs: 400, endTimeMs: 600, phoneme: {} },
      ],
    },
    {
      id: 'beat-bit',
      title: 'Beat vs Bit',
      drillType: 'MINIMAL_PAIR',
      targetText: 'Beat',
      targetIpa: 'b iː t',
      description: 'Tense /iː/ with spread lips. Hold the vowel noticeably longer than /ɪ/.',
      difficulty: 1,
      phonemeSequence: [
        { phonemeId: 'b', position: 0, startTimeMs: 0, endTimeMs: 200, phoneme: {} },
        { phonemeId: 'i:', position: 1, startTimeMs: 200, endTimeMs: 500, phoneme: { f1TargetHz: 270, f2TargetHz: 2290 } },
        { phonemeId: 't', position: 2, startTimeMs: 500, endTimeMs: 700, phoneme: {} },
      ],
    },
    {
      id: 'bat-bet',
      title: 'Bat vs Bet',
      drillType: 'MINIMAL_PAIR',
      targetText: 'Bat',
      targetIpa: 'b æ t',
      description: 'Open your jaw wide for /æ/. The vowel is low and front — similar to "cat".',
      difficulty: 2,
      phonemeSequence: [
        { phonemeId: 'b', position: 0, startTimeMs: 0, endTimeMs: 200, phoneme: {} },
        { phonemeId: 'æ', position: 1, startTimeMs: 200, endTimeMs: 550, phoneme: { f1TargetHz: 660, f2TargetHz: 1720 } },
        { phonemeId: 't', position: 2, startTimeMs: 550, endTimeMs: 750, phoneme: {} },
      ],
    },
    {
      id: 'full-fool',
      title: 'Full vs Fool',
      drillType: 'MINIMAL_PAIR',
      targetText: 'Full',
      targetIpa: 'f ʊ l',
      description: 'Relaxed /ʊ/ with slightly spread lips. Do not round as much as in /uː/.',
      difficulty: 2,
      phonemeSequence: [
        { phonemeId: 'f', position: 0, startTimeMs: 0, endTimeMs: 200, phoneme: {} },
        { phonemeId: 'ʊ', position: 1, startTimeMs: 200, endTimeMs: 500, phoneme: { f1TargetHz: 440, f2TargetHz: 1020 } },
        { phonemeId: 'l', position: 2, startTimeMs: 500, endTimeMs: 700, phoneme: {} },
      ],
    },
    {
      id: 'cot-caught',
      title: 'Cot vs Caught',
      drillType: 'MINIMAL_PAIR',
      targetText: 'Cot',
      targetIpa: 'k ɑː t',
      description: 'Open back /ɑː/ with neutral lips. Do not round — contrast with /ɔː/ in "caught".',
      difficulty: 3,
      phonemeSequence: [
        { phonemeId: 'k', position: 0, startTimeMs: 0, endTimeMs: 250, phoneme: {} },
        { phonemeId: 'ɑː', position: 1, startTimeMs: 250, endTimeMs: 700, phoneme: { f1TargetHz: 750, f2TargetHz: 1100 } },
        { phonemeId: 't', position: 2, startTimeMs: 700, endTimeMs: 900, phoneme: {} },
      ],
    },
    {
      id: 'thought-though',
      title: 'Thought vs Though',
      drillType: 'MINIMAL_PAIR',
      targetText: 'Thought',
      targetIpa: 'θ ɔː t',
      description: 'Rounded /ɔː/ with a steady back tongue position. Keep the dental /θ/ clean.',
      difficulty: 3,
      phonemeSequence: [
        { phonemeId: 'θ', position: 0, startTimeMs: 0, endTimeMs: 300, phoneme: {} },
        { phonemeId: 'ɔː', position: 1, startTimeMs: 300, endTimeMs: 750, phoneme: { f1TargetHz: 500, f2TargetHz: 850 } },
        { phonemeId: 't', position: 2, startTimeMs: 750, endTimeMs: 950, phoneme: {} },
      ],
    },
    {
      id: 'word-stress-example',
      title: 'Word Stress Practice',
      drillType: 'WORD_STRESS',
      targetText: 'Photograph',
      targetIpa: 'f ə ʊ t ə ɡ r ɑː f',
      description: 'Stress the first syllable /ˈfəʊ/. Reduce the following syllables toward schwa.',
      difficulty: 2,
      phonemeSequence: [
        { phonemeId: 'f', position: 0, startTimeMs: 0, endTimeMs: 200, phoneme: {} },
        { phonemeId: '@', position: 1, startTimeMs: 200, endTimeMs: 400, phoneme: { f1TargetHz: 500, f2TargetHz: 1500 } },
        { phonemeId: 'ʊ', position: 2, startTimeMs: 400, endTimeMs: 600, phoneme: { f1TargetHz: 440, f2TargetHz: 1020 } },
        { phonemeId: 't', position: 3, startTimeMs: 600, endTimeMs: 750, phoneme: {} },
        { phonemeId: '@', position: 4, startTimeMs: 750, endTimeMs: 900, phoneme: { f1TargetHz: 500, f2TargetHz: 1500 } },
        { phonemeId: 'g', position: 5, startTimeMs: 900, endTimeMs: 1050, phoneme: {} },
        { phonemeId: 'r', position: 6, startTimeMs: 1050, endTimeMs: 1200, phoneme: {} },
        { phonemeId: 'ɑː', position: 7, startTimeMs: 1200, endTimeMs: 1500, phoneme: { f1TargetHz: 750, f2TargetHz: 1100 } },
        { phonemeId: 'f', position: 8, startTimeMs: 1500, endTimeMs: 1700, phoneme: {} },
      ],
    },
    {
      id: 'vowel-reduction',
      title: 'Vowel Reduction Drill',
      drillType: 'VOWEL_REDUCTION',
      targetText: 'To be or not to be',
      targetIpa: 't ə b iː ɔː n ɒ t t ə b iː',
      description: 'Reduce function words "to" to /tə/. Keep content vowels full.',
      difficulty: 3,
      phonemeSequence: [
        { phonemeId: 't', position: 0, startTimeMs: 0, endTimeMs: 200, phoneme: {} },
        { phonemeId: '@', position: 1, startTimeMs: 200, endTimeMs: 350, phoneme: { f1TargetHz: 500, f2TargetHz: 1500 } },
        { phonemeId: 'b', position: 2, startTimeMs: 350, endTimeMs: 500, phoneme: {} },
        { phonemeId: 'i:', position: 3, startTimeMs: 500, endTimeMs: 800, phoneme: { f1TargetHz: 270, f2TargetHz: 2290 } },
        { phonemeId: 'ɔː', position: 4, startTimeMs: 800, endTimeMs: 1100, phoneme: { f1TargetHz: 500, f2TargetHz: 850 } },
        { phonemeId: 'n', position: 5, startTimeMs: 1100, endTimeMs: 1250, phoneme: {} },
        { phonemeId: 'ɒ', position: 6, startTimeMs: 1250, endTimeMs: 1500, phoneme: { f1TargetHz: 600, f2TargetHz: 900 } },
        { phonemeId: 't', position: 7, startTimeMs: 1500, endTimeMs: 1650, phoneme: {} },
        { phonemeId: 't', position: 8, startTimeMs: 1650, endTimeMs: 1800, phoneme: {} },
        { phonemeId: '@', position: 9, startTimeMs: 1800, endTimeMs: 1950, phoneme: { f1TargetHz: 500, f2TargetHz: 1500 } },
        { phonemeId: 'b', position: 10, startTimeMs: 1950, endTimeMs: 2100, phoneme: {} },
        { phonemeId: 'i:', position: 11, startTimeMs: 2100, endTimeMs: 2400, phoneme: { f1TargetHz: 270, f2TargetHz: 2290 } },
      ],
    },
    {
      id: 'connected-speech',
      title: 'Connected Speech Flow',
      drillType: 'CONNECTED_SPEECH',
      targetText: 'Turn it off',
      targetIpa: 't ɜː n ɪ t ɒ f',
      description: 'Link the final /n/ of "turn" into the vowel of "it". Avoid a glottal stop break.',
      difficulty: 3,
      phonemeSequence: [
        { phonemeId: 't', position: 0, startTimeMs: 0, endTimeMs: 200, phoneme: {} },
        { phonemeId: 'ɜː', position: 1, startTimeMs: 200, endTimeMs: 500, phoneme: { f1TargetHz: 490, f2TargetHz: 1350 } },
        { phonemeId: 'n', position: 2, startTimeMs: 500, endTimeMs: 700, phoneme: {} },
        { phonemeId: 'ɪ', position: 3, startTimeMs: 700, endTimeMs: 900, phoneme: { f1TargetHz: 390, f2TargetHz: 1990 } },
        { phonemeId: 't', position: 4, startTimeMs: 900, endTimeMs: 1050, phoneme: {} },
        { phonemeId: 'ɒ', position: 5, startTimeMs: 1050, endTimeMs: 1350, phoneme: { f1TargetHz: 600, f2TargetHz: 900 } },
        { phonemeId: 'f', position: 6, startTimeMs: 1350, endTimeMs: 1550, phoneme: {} },
      ],
    },
  ];

  console.log('Seeding drills...');
  for (const drill of drills) {
    await prisma.drill.upsert({
      where: { id: drill.id },
      update: {
        ...drill,
        phonemeSequence: {
          deleteMany: {},
          create: drill.phonemeSequence.map((ps) => ({
            phonemeId: ps.phonemeId,
            position: ps.position,
            startTimeMs: ps.startTimeMs,
            endTimeMs: ps.endTimeMs,
            f1Target: ps.phoneme?.f1TargetHz ?? null,
            f2Target: ps.phoneme?.f2TargetHz ?? null,
          })),
        },
      },
      create: {
        ...drill,
        phonemeSequence: {
          create: drill.phonemeSequence.map((ps) => ({
            phonemeId: ps.phonemeId,
            position: ps.position,
            startTimeMs: ps.startTimeMs,
            endTimeMs: ps.endTimeMs,
            f1Target: ps.phoneme?.f1TargetHz ?? null,
            f2Target: ps.phoneme?.f2TargetHz ?? null,
          })),
        },
      },
    });
  }

  console.log('Seed completed.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
