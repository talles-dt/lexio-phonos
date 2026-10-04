# Known limitations

- No validated pronunciation, phoneme, stress or intonation score. LPC/formant tracking and autocorrelation pitch are exploratory heuristics without speaker normalization or forced alignment.
- Catalogue IPA and articulation vary by accent. Browser synthesis is optional, synthetic and limited to locally installed English voices; it does not guarantee a particular teaching accent.
- The quality gate detects only gross short/quiet/clipped recordings; noise can pass. It does not confirm speech or the target phrase.
- Audio is temporary unless downloaded. Backups and history contain metadata only. No account, cloud sync or automatic migration from the former server-side anonymous records.
- Local storage is limited to 1,000 entries. Storage corruption/full/quota errors are visible. Export before deleting data; private browsing may not retain it.
- Cross-tab updates are serialized with Web Locks where available; older browsers without Web Locks can have last-writer-wins races.
- Offline requires a successful first online preparation and browser retention of cached assets. An available service worker alone does not guarantee a prepared shell. Updates wait for old tabs to close.
- Fake-microphone browser tests validate application plumbing, not every microphone, mobile OS or speech model. Hardware, Safari/iOS and pedagogical validation remain separate validation activities.
- The optional database seed is not a data migration and does not delete legacy rows. Retired endpoints are an intentional breaking API change.
