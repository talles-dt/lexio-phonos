# 🎤 Pronunciation Trainer

> **Master English Phonetics with Real-Time Feedback**

An interactive web application for improving English pronunciation through targeted drills, real-time audio analysis, and detailed feedback. Built with Next.js, Web Audio API, and modern speech processing techniques.

## ✨ Features

### 🎯 Core Functionality
- **Real-Time Audio Capture**: Low-latency recording using Web Audio API and AudioWorklet
- **Formant Analysis**: Visualize F1, F2, F3 formants and compare with target vowel positions
- **Pitch Contour**: See your pitch pattern and compare with target intonation
- **GOP Scoring**: Goodness of Pronunciation scoring for phoneme-level feedback
- **Vowel Reduction Detection**: Track function word reduction in connected speech

### 📚 Drill Categories
- **Minimal Pairs**: Distinguish similar sounds (e.g., sheep vs. ship, think vs. sink)
- **Vowel Reduction**: Practice function word reduction (to → /tə/, can → /kən/)
- **Intonation**: Master pitch patterns and stress contours
- **Consonant Clusters**: Improve pronunciation of consonant combinations
- **Word Stress**: Practice stress patterns that change word meaning

### 🎨 Visualizations
- **Vowel Formant Chart**: Interactive F1 vs F2 scatter plot with target positions
- **Pitch Contour**: Time vs frequency visualization with target overlay
- **Phoneme Mastery Chart**: Track progress across all phonemes

### 📱 Mobile-First Design
- Thumb-zone layout for easy mobile use
- Haptic feedback on record start/complete
- Swipe gestures for navigation
- Responsive design for all screen sizes

### 🔄 PWA Features
- Offline support with service worker
- Background sync for recordings
- Installable on mobile devices
- Fast loading with asset caching

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/pronunciation-trainer.git
cd pronunciation-trainer

# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push
npx prisma db seed

# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

For production with Supabase:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pronunciation-trainer"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

## 📦 Tech Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Audio**: [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), [AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)
- **Database**: [Prisma ORM](https://www.prisma.io/), [SQLite](https://www.sqlite.org/) (dev), [PostgreSQL](https://www.postgresql.org/) (prod)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **3D Visualization**: [Three.js](https://threejs.org/), [React Three Fiber](https://github.com/pmndrs/react-three-fiber)
- **Machine Learning**: [ONNX Runtime Web](https://onnxruntime.ai/), [TensorFlow.js](https://www.tensorflow.org/js)

## 🗂️ Project Structure

```
pronunciation-trainer/
├── prisma/
│   ├── schema.prisma      # Database schema (10 models)
│   └── seed.ts             # Seed data (50+ phonemes, 20+ drills)
├── src/
│   ├── app/
│   │   ├── api/            # API routes (5 endpoints)
│   │   ├── globals.css      # Custom styles
│   │   ├── layout.tsx       # Root layout with PWA
│   │   └── page.tsx        # Main page
│   ├── components/         # React components
│   │   ├── DrillCard.tsx    # Main drill interface
│   │   ├── VowelChart.tsx   # Formant visualization
│   │   ├── PitchContour.tsx # Pitch visualization
│   │   └── PhonemeMasteryChart.tsx
│   ├── hooks/              # Custom hooks
│   │   └── useAudioCapture.ts
│   ├── lib/                # Libraries
│   │   └── prisma.ts        # Prisma client
│   ├── types/              # TypeScript types
│   │   ├── audio.ts        # Audio processing types
│   │   └── pronunciation.ts # Pronunciation types
│   └── utils/              # Utility functions
│       ├── audio.ts        # Audio processing (15+ functions)
│       ├── audioWorklet.ts # AudioWorklet processor
│       └── scoring.ts      # GOP scoring engine
├── public/
│   ├── manifest.json      # PWA manifest
│   └── icons/             # PWA icons
├── package.json
├── next.config.ts
└── README.md
```

## 🎓 Pedagogical Approach

### Articulatory Phonetics
Each phoneme includes detailed articulatory placement guides:
- **Tongue position**: High/low, front/back, tense/lax
- **Lip configuration**: Rounded/unrounded, spread/compressed
- **Pharyngeal cavity**: Widened/narrowed
- **Muscle tension**: High/low

### Common L1 Interference Patterns
The system addresses common issues for non-native speakers:
- Merging /ɪ/ into /iː/ (e.g., "ship" → "sheep")
- Substituting /θ/ with /s/ or /t/ (e.g., "think" → "sink")
- Epenthesis in syllable codas (e.g., "stop" → "stoppy")
- Vowel reduction in function words (e.g., "to" → /tuː/ instead of /tə/)

### Correction Cues
- "Keep the jaw slightly dropped"
- "Avoid lip spreading"
- "Focus on short vowel duration"
- "Hold closure without epenthetic vowel"

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drills` | Get all drills with filtering |
| POST | `/api/drills` | Create new drill |
| GET | `/api/recordings` | Get user recordings |
| POST | `/api/recordings` | Save recording with scores |
| DELETE | `/api/recordings` | Delete recording |
| GET | `/api/phonemes` | Get phoneme dictionary |
| POST | `/api/phonemes` | Add phoneme |
| GET | `/api/mastery` | Get user mastery data |
| POST | `/api/mastery` | Update mastery |
| POST | `/api/analyze` | Analyze audio recording |

## 📊 Database Schema

### Core Models
- **Phoneme**: IPA symbols, categories, formant targets
- **Drill**: Exercises with phoneme sequences
- **UserRecording**: Audio sessions with scores
- **PhonemeScore**: Detailed phoneme-level scoring
- **UserPhonemeMastery**: Progress tracking
- **User**: User authentication

### Example Queries

```typescript
// Get all drills by category
const drills = await prisma.drill.findMany({
  where: { drillType: 'MINIMAL_PAIR' },
  include: { phonemeSequence: true }
});

// Get user's mastery data
const mastery = await prisma.userPhonemeMastery.findMany({
  where: { userId: 'user-123' },
  include: { phoneme: true },
  orderBy: { masteryLevel: 'desc' }
});

// Save a recording
const recording = await prisma.userRecording.create({
  data: {
    userId: 'user-123',
    drillId: 'sheep-ship',
    overallScore: 0.87,
    phonemeScores: {
      create: [
        { phonemeId: 'i:', gopScore: 0.92, isAcceptable: true },
        { phonemeId: 'I', gopScore: 0.78, isAcceptable: false }
      ]
    }
  }
});
```

## 🎯 Scoring Algorithm

### GOP (Goodness of Pronunciation)

```
GOP(p) = (1/Tp) * Σ log(P(ot|p) / Σ P(ot|q))
```

Where:
- `Tp` = Duration of phoneme p
- `P(ot|p)` = Posterior probability of observation at time t given phoneme p
- `q` = All competing phonemes

### Weighted Overall Score

```
Overall = 0.4 * GOP + 0.2 * Pitch + 0.2 * Timing + 0.2 * Formant
```

### Score Interpretation
- **Excellent**: ≥85%
- **Good**: 60-84%
- **Needs Improvement**: 40-59%
- **Poor**: <40%

## 🎨 Visualization

### Vowel Chart
- **X-axis**: F2 (front/back dimension)
- **Y-axis**: F1 (high/low dimension)
- **Target positions**: Blue markers for each vowel
- **User trajectory**: Red line showing formant movement
- **Category regions**: Color-coded vowel areas

### Pitch Contour
- **X-axis**: Time (seconds)
- **Y-axis**: Frequency (Hz)
- **User contour**: Red line showing pitch pattern
- **Target contour**: Green dashed line for comparison

## 📱 Mobile Features

### Thumb-Zone Layout
Primary actions anchored to bottom 25% of viewport:
- Record/Stop button
- Listen to reference
- Replay own recording

### Haptic Feedback
```javascript
// On record start
navigator.vibrate([15]);

// On recording complete
navigator.vibrate([10, 50, 10]);
```

### Gesture Navigation
- Swipe left/right: Next/previous drill
- Pull down: Reset recording

## 🔄 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add TypeScript types for all new features
- Write tests for new functionality
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Audio processing inspired by [Praat](https://www.fon.hum.uva.nl/praat/)
- Phonetic data from [IPA](https://www.internationalphoneticassociation.org/)
- Formant targets from phonetic research literature

## 📞 Contact

For questions or feedback, please open an issue on GitHub.

---

**Happy Pronouncing!** 🎤
