# Lexio Phonos

Private English pronunciation practice: listen, record and reflect. Built with Next.js, React and Web Audio.

## Student experience

- 12 guided exercises: exact target text, IPA explanation and articulatory tips.
- Search, category/level filters, favorites and a personal review list.
- Optional on-device English speech synthesis, clearly labelled as a synthetic model.
- Microphone recording (maximum 15 seconds), inline playback and WAV download.
- Recording-quality checks for very short, quiet or clipped input.
- Experimental pitch and vowel-resonance charts, with text summaries.
- Local journal, daily recording goal, self-reflection and resume.
- JSON backup export/import; individual or complete history deletion.
- Offline revisits after the application reports readiness.

**There is no validated pronunciation grade.** Acoustic estimates do not recognize words, align phonemes, assess stress correctness or establish CEFR/mastery. Use listening, reflection and teacher feedback. A recording accepted by the quality check may contain noise instead of speech.

## Run locally

Node 22.12+ or Node 24:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Microphone use requires localhost or HTTPS. No account, environment variable or database is required for student practice. The production service worker is intentionally disabled during development.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests start the production server on port 3100 and exercise the real AudioWorklet with a browser-provided fake microphone. They are not evidence of pronunciation-model accuracy or universal hardware compatibility.

## Data and privacy

Practice metadata lives in `localStorage` under `lexio-phonos-practice-v1`, limited to 1,000 entries. Export regularly: clearing site data or changing browsers does not synchronize history. Audio stays in memory while the exercise is open; download it to retain it. Backups contain metadata and reflections, not voice recordings. Import merges validated entries by ID and keeps existing entries when IDs collide.

Only local English synthesis voices are offered; if none is installed, the model is unavailable and practice remains usable. OS/browser behavior and available accents vary.

The service worker caches only same-origin public application files. APIs and non-GET requests are excluded. Preparation may fail with restricted storage/network access; readiness is shown only after shell dependencies have been cached. Browser cache eviction can remove offline files later. Revisit online to refresh them. Updates activate after old tabs close.

## Catalogue and API changes

`src/data/catalog.json` is the single source for 41 phonemes and 12 exercises. Phoneme boundaries are unknown (`null`); no synthetic timing is treated as forced alignment. IPA examples are accent-dependent.

- `GET /api/drills`: public catalogue, optional `type` and `difficulty` filters.
- `GET /api/phonemes`: public dictionary.
- Catalogue writes: unsupported (405).
- Legacy `/api/recordings`, `/api/mastery`, `/api/analyze`: retired (410, no-store).

**Breaking change:** personal data APIs no longer read or write the server database. Existing remote data is untouched and is not automatically imported. The former anonymous cookie was not secure authorization for migration. Existing operators should review their retention policy and export any legitimately held data through an authorized maintenance process.

## Optional legacy database maintenance

The Prisma schema is retained for an existing PostgreSQL database. These commands are unnecessary for running student practice and can modify a configured database:

```sh
# Set DATABASE_URL locally using .env.example; never commit credentials.
npm run db:generate
npm run db:push
npm run db:seed
```

The optional seed uses the same catalogue, valid relation fields and a transaction. It updates matching catalogue IDs; it does not remove unrelated legacy drills. Do not point maintenance commands at production unintentionally.

## Delivery and limitations

See [audit](docs/AUDIT.md), [roadmap](docs/ROADMAP.md) and [known limitations](KNOWN_ISSUES.md). A branch/PR implementation is distinct from a production deployment. Tests and deployment status are recorded in the audit report.

MIT license. Contributions: [talles-dt/lexio-phonos](https://github.com/talles-dt/lexio-phonos).
