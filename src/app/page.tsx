"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import GuidedSessions from "@/components/GuidedSessions";
import { guidedDrills, sessions } from "@/lib/sessions";
import DrillCard from "@/components/DrillCard";
import { categoryLabels, drills } from "@/lib/catalog";
import {
  addAttempt,
  emptyProgress,
  localDay,
  mergeProgress,
  parseProgress,
  readProgress,
  reviewDrillIds,
  STORAGE_KEY,
  MIGRATION_BACKUP_KEY,
  updateProgress,
  type Progress,
  type Reflection,
} from "@/lib/progress";

export default function Home() {
  const [guidedOpen, setGuidedOpen] = useState(false);
  const t = (en: string, pt: string) => (guidedOpen ? pt : en);
  const [guideLaunchId, setGuideLaunchId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState(drills[0].id);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [view, setView] = useState("all");
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(true);
  const [offlineReady, setOfflineReady] = useState(false);
  const [today, setToday] = useState("");
  const [historyLimit, setHistoryLimit] = useState(10);
  const practiceHeading = useRef<HTMLDivElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const selected = drills.find((d) => d.id === selectedId) ?? drills[0];
  const load = useCallback(() => {
    try {
      const data = readProgress();
      setProgress(data);
      setStorageError("");
      setReady(true);
      return data;
    } catch {
      setReady(false);
      setStorageError(
        "Practice history could not be read. Browser storage may be blocked, full or damaged. Existing data has not been overwritten. You can still record and download audio.",
      );
      return null;
    }
  }, []);
  useEffect(() => {
    Promise.resolve().then(() => {
      const data = load();
      if (data?.lastDrillId && drills.some((d) => d.id === data.lastDrillId))
        setSelectedId(data.lastDrillId);
      if (data?.lastSessionId) setGuidedOpen(true);
      setOnline(navigator.onLine);
      setToday(localDay(new Date()));
    });
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) load();
    };
    const network = () => setOnline(navigator.onLine);
    const offlineStatus = (event: MessageEvent) => {
      if (event.data?.type === "offline-ready") setOfflineReady(true);
    };
    window.addEventListener("storage", sync);
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    navigator.serviceWorker?.addEventListener("message", offlineStatus);
    // Do not claim readiness just because a service worker was registered.
    navigator.serviceWorker?.ready.then((reg) =>
      reg.active?.postMessage("check-offline"),
    );
    const dayTimer = setInterval(() => setToday(localDay(new Date())), 60000);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
      navigator.serviceWorker?.removeEventListener("message", offlineStatus);
      clearInterval(dayTimer);
    };
  }, [load]);
  const change = useCallback(
    async (fn: (p: Progress) => Progress): Promise<boolean> => {
      setMessage("");
      try {
        const next = await updateProgress(fn);
        setProgress(next);
        setReady(true);
        setStorageError("");
        return true;
      } catch (error) {
        setStorageError(
          `Not saved. ${error instanceof Error ? error.message : "Browser storage is unavailable."} Your existing history has not been replaced.`,
        );
        return false;
      }
    },
    [],
  );
  async function completed(durationSeconds: number): Promise<string | null> {
    const id = crypto.randomUUID();
    const saved = await change((p) =>
      addAttempt(p, {
        id,
        drillId: selected.id,
        createdAt: new Date().toISOString(),
        durationSeconds,
        reflection: "unreviewed",
      }),
    );
    if (saved) {
      setMessage("Practice saved on this device.");
      return id;
    }
    return null;
  }
  async function reflect(id: string, reflection: Reflection) {
    const saved = await change((p) => {
      if (!p.attempts.some((attempt) => attempt.id === id)) {
        throw new Error(
          "This practice entry was removed. Record again to save a new reflection.",
        );
      }
      return {
        ...p,
        attempts: p.attempts.map((a) =>
          a.id === id ? { ...a, reflection } : a,
        ),
      };
    });
    if (saved) setMessage("Reflection saved.");
    return saved;
  }
  function select(id: string) {
    const session = sessions.find(
      (s) => id === `${s.id}-words` || id === `${s.id}-phrase`,
    );
    if (session) {
      setGuideLaunchId(session.id);
      setGuidedOpen(true);
      void change((p) => ({ ...p, lastSessionId: session.id }));
      requestAnimationFrame(() => practiceHeading.current?.focus());
      return;
    }
    setGuidedOpen(false);
    setSelectedId(id);
    setMessage("");
    void change((p) => ({ ...p, lastDrillId: id }));
    requestAnimationFrame(() => practiceHeading.current?.focus());
  }
  function download(text: string, name: string) {
    const url = URL.createObjectURL(
      new Blob([text], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportHistory() {
    try {
      const latest = readProgress();
      download(
        JSON.stringify(latest, null, 2),
        `lexio-practice-${new Date().toISOString().slice(0, 10)}.json`,
      );
      setMessage("Backup downloaded. It contains practice notes, not audio.");
    } catch {
      setStorageError(
        "Could not export a valid backup. Use Download raw storage to preserve damaged data before resetting.",
      );
    }
  }
  async function importHistory(file?: File) {
    if (!file) return;
    try {
      if (file.size > 1_000_000)
        throw new Error("Backup must be smaller than 1 MB.");
      const imported = parseProgress(await file.text());
      if (await change((current) => mergeProgress(current, imported)))
        setMessage(
          "Backup merged. Existing entries and your daily goal were kept.",
        );
    } catch (error) {
      setStorageError(
        `Import rejected: ${error instanceof Error ? error.message : "Invalid backup."} Nothing was changed.`,
      );
    }
    if (importInput.current) importInput.current.value = "";
  }
  async function resetHistory() {
    if (
      !window.confirm(
        guidedOpen
          ? "Apagar todo o histórico, sessões, reflexões, favoritos e cópia de migração deste navegador? Exporte um backup antes, se quiser guardá-los."
          : "Delete all practice history, reflections and favorites from this browser? Export a backup first if you want to keep them.",
      )
    )
      return;
    try {
      localStorage.removeItem(MIGRATION_BACKUP_KEY);
      localStorage.removeItem(STORAGE_KEY);
      setGuideLaunchId(null);
      setGuidedOpen(false);
      load();
      setMessage(
        "Local history cleared. Downloaded files and any legacy server data were not changed.",
      );
    } catch {
      setStorageError(
        "Browser storage could not be cleared. Check site settings.",
      );
    }
  }
  const review = reviewDrillIds(progress);
  const filtered = drills.filter(
    (d) =>
      (!query ||
        `${d.title} ${d.targetText} ${d.targetIpa}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())) &&
      (!category || d.drillType === category) &&
      (!difficulty || d.difficulty === Number(difficulty)) &&
      (view === "all" ||
        (view === "favorites"
          ? progress.favorites.includes(d.id)
          : review.has(d.id))),
  );
  const todayCount = progress.attempts.filter(
    (a) => localDay(new Date(a.createdAt)) === today,
  ).length;
  const seconds = progress.attempts.reduce(
    (sum, a) => sum + a.durationSeconds,
    0,
  );
  return (
    <main
      lang={guidedOpen ? "pt-BR" : "en"}
      className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8"
    >
      <a className="skip-link" href="#practice">
        {t("Skip to practice", "Ir para a prática")}
      </a>
      <header className="space-y-3">
        <p className="eyebrow">Lexio Underground · Listen. Try. Reflect.</p>
        <h1 className="lexio-title text-4xl sm:text-5xl">Lexio Phonos</h1>
        <p className="text-lg max-w-2xl muted">
          {t(
            "A small daily space for English pronunciation. Choose a sound, record yourself and listen for one change at a time.",
            "Um espaço diário para praticar pronúncia em inglês. Escolha uma família de sons, grave e observe uma mudança por vez.",
          )}
        </p>
        <p className="text-sm muted" role="status">
          {online
            ? t("On this device", "Neste dispositivo")
            : t("You are offline", "Você está offline")}{" "}
          ·{" "}
          {offlineReady
            ? t("Ready for offline revisits", "Pronto para revisitas offline")
            : t(
                "Offline preparation pending",
                "Preparação offline pendente",
              )}{" "}
          · {t("No account needed", "Sem necessidade de conta")}
        </p>
        <a className="primary inline-block" href="#practice">
          {t("Go to current exercise", "Ir à sessão atual")}
        </a>
      </header>
      <nav
        aria-label="Modo de prática"
        lang="pt-BR"
        className="flex flex-wrap gap-3"
      >
        <button
          className="primary"
          aria-pressed={guidedOpen}
          disabled={busy}
          onClick={() => {
            setGuideLaunchId(null);
            setGuidedOpen(true);
          }}
        >
          Sessões guiadas · 20 sessões
        </button>
        <button
          className="secondary"
          aria-pressed={!guidedOpen}
          disabled={busy}
          onClick={() => {
            setGuidedOpen(false);
            void change((p) => ({ ...p, lastSessionId: null }));
          }}
        >
          Prática livre
        </button>
      </nav>
      <section className="panel" aria-labelledby="progress-title">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h2 id="progress-title" className="step-title">
              {t("Your practice", "Sua prática")}
            </h2>
            <p className="muted">
              {progress.attempts.length
                ? t(
                    `${progress.attempts.length} recordings · ${(seconds / 60).toFixed(1)} recorded minutes · ${new Set(progress.attempts.map((a) => a.drillId)).size} exercises explored`,
                    `${progress.attempts.length} gravações · ${(seconds / 60).toFixed(1)} minutos gravados · ${Object.values(progress.sessions).filter((s) => s.completedAt).length} sessões concluídas`,
                  )
                : t(
                    "Start with one exercise. Progress here measures practice, not proficiency.",
                    "Comece com uma sessão. O progresso mede prática, não proficiência.",
                  )}
            </p>
          </div>
          <label className="field">
            {t("Daily recording goal", "Meta diária de gravações")}
            <select
              value={progress.dailyGoal}
              disabled={!ready}
              onChange={(e) => {
                const dailyGoal = Number(e.target.value);
                void change((p) => ({ ...p, dailyGoal }));
              }}
            >
              {Array.from({ length: 20 }, (_, i) => (
                <option value={i + 1} key={i}>
                  {i + 1} {t("recordings", "gravações")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4">
          <label htmlFor="daily-progress">
            {t("Today", "Hoje")}: {todayCount} / {progress.dailyGoal}{" "}
            {t("recordings", "gravações")}
            {todayCount >= progress.dailyGoal
              ? t(" · Daily goal reached", " · Meta diária alcançada")
              : ""}
          </label>
          <progress
            id="daily-progress"
            max={progress.dailyGoal}
            value={Math.min(todayCount, progress.dailyGoal)}
            className="w-full h-2 mt-2"
          />
        </div>
        <p className="muted text-sm mt-3">
          {t(
            "History and reflections stay in this browser. Clearing site data removes them. Audio is not stored in history or uploaded. Export a backup to move your practice notes.",
            "Histórico e reflexões ficam neste navegador. Limpar os dados do site remove o progresso. O áudio não fica no histórico nem é enviado. Exporte um backup para levar suas anotações a outro dispositivo.",
          )}
        </p>
      </section>
      {storageError && (
        <div role="alert" className="error-box space-y-3">
          <p lang={guidedOpen ? "pt-BR" : "en"}>
            {guidedOpen
              ? "Não foi possível salvar ou ler o progresso. O armazenamento pode estar bloqueado, cheio ou danificado. Os dados existentes não foram substituídos. Você pode gravar, ouvir e baixar o áudio; a conclusão só será registrada quando o salvamento funcionar."
              : storageError}
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="secondary" onClick={() => load()}>
              {guidedOpen ? "Tentar armazenamento novamente" : "Retry storage"}
            </button>
            <button
              className="secondary"
              onClick={() => {
                try {
                  download(
                    localStorage.getItem(STORAGE_KEY) ?? "{}",
                    "lexio-raw-storage.json",
                  );
                } catch {
                  setStorageError(
                    "Storage access is blocked. Enable site storage in your browser settings.",
                  );
                }
              }}
            >
              {guidedOpen
                ? "Baixar armazenamento bruto"
                : "Download raw storage"}
            </button>
          </div>
        </div>
      )}
      <p role="status" className="text-sm min-h-5">
        {guidedOpen && message
          ? "Operação concluída neste dispositivo."
          : message}
      </p>
      {guidedOpen ? (
        <div id="practice" ref={practiceHeading} tabIndex={-1}>
          <GuidedSessions
            key={guideLaunchId ?? "resume"}
            initialSessionId={guideLaunchId}
            progress={progress}
            change={change}
            onBusy={setBusy}
          />
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(240px,320px)_1fr] gap-6 items-start">
          <section className="panel space-y-4" aria-labelledby="library-title">
            <h2 id="library-title" className="step-title">
              Choose an exercise
            </h2>
            <label className="field">
              Search
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Words, sounds or IPA"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="field">
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All categories</option>
                  {[...new Set(drills.map((d) => d.drillType))].map((c) => (
                    <option key={c} value={c}>
                      {categoryLabels[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Level
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="">All levels</option>
                  {[...new Set(drills.map((d) => d.difficulty))]
                    .sort()
                    .map((level) => (
                      <option key={level} value={level}>
                        Level {level}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <label className="field">
              Show
              <select value={view} onChange={(e) => setView(e.target.value)}>
                <option value="all">All exercises</option>
                <option value="favorites">Favorites</option>
                <option value="review">Practise again</option>
              </select>
            </label>
            <p className="muted text-sm" role="status">
              {filtered.length} exercises
            </p>
            {filtered.length === 0 && (
              <div className="space-y-3">
                <p>
                  No exercises match. Save a favorite or mark a recording
                  “Practise again later” to build your own list.
                </p>
                <button
                  className="secondary"
                  onClick={() => {
                    setQuery("");
                    setCategory("");
                    setDifficulty("");
                    setView("all");
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
            <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {filtered.map((d) => (
                <li
                  key={d.id}
                  className={`exercise-row ${selectedId === d.id ? "selected" : ""}`}
                >
                  <button
                    className="text-left flex-1 min-w-0 p-3"
                    aria-current={selectedId === d.id ? "true" : undefined}
                    disabled={busy}
                    onClick={() => select(d.id)}
                  >
                    <span className="block font-semibold">{d.title}</span>
                    <span className="block text-sm muted">
                      Level {d.difficulty} · {categoryLabels[d.drillType]}
                    </span>
                  </button>
                  <button
                    className="favorite"
                    aria-label={`Favorite ${d.title}`}
                    aria-pressed={progress.favorites.includes(d.id)}
                    disabled={!ready}
                    onClick={() =>
                      void change((p) => ({
                        ...p,
                        favorites: p.favorites.includes(d.id)
                          ? p.favorites.filter((id) => id !== d.id)
                          : [...p.favorites, d.id],
                      }))
                    }
                  >
                    {progress.favorites.includes(d.id) ? "★" : "☆"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <div
            id="practice"
            tabIndex={-1}
            ref={practiceHeading}
            className="min-w-0"
          >
            <DrillCard
              key={selected.id}
              drill={selected}
              onComplete={completed}
              onReflect={reflect}
              onBusy={setBusy}
              onNext={() => {
                const list = filtered.length > 1 ? filtered : drills;
                const i = list.findIndex((d) => d.id === selected.id);
                select(list[(i + 1) % list.length].id);
              }}
            />
          </div>
        </div>
      )}
      <section
        lang={guidedOpen ? "pt-BR" : "en"}
        className="panel space-y-4"
        aria-labelledby="history-title"
      >
        <h2 id="history-title" className="step-title">
          {guidedOpen ? "Diário de prática" : "Practice journal"}
        </h2>
        <p className="muted text-sm">
          {guidedOpen
            ? "Somente gravações com som suficiente e sem distorção importante entram no diário. Esta verificação de qualidade não avalia pronúncia. O áudio não fica salvo no histórico."
            : "Only recordings with enough sound and without major clipping enter the journal. This quality check does not assess pronunciation."}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            className="secondary"
            disabled={!ready}
            onClick={exportHistory}
          >
            {guidedOpen
              ? "Exportar backup de prática"
              : "Export practice backup"}
          </button>
          <button
            className="secondary"
            disabled={!ready || busy}
            onClick={() => importInput.current?.click()}
          >
            {guidedOpen ? "Importar backup" : "Import backup"}
          </button>
          <input
            ref={importInput}
            aria-label="Import practice backup"
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => void importHistory(e.target.files?.[0])}
          />
          <button
            className="secondary"
            disabled={busy}
            onClick={() => void resetHistory()}
          >
            {guidedOpen ? "Apagar histórico local" : "Clear local history"}
          </button>
        </div>
        {progress.attempts.length === 0 ? (
          <p className="muted">
            {guidedOpen
              ? "Sua primeira gravação salva aparecerá aqui."
              : "Your first saved recording will appear here."}
          </p>
        ) : (
          <ul className="divide-y divide-[#353539]">
            {progress.attempts.slice(0, historyLimit).map((a) => (
              <li
                key={a.id}
                className="py-3 flex flex-wrap gap-3 justify-between"
              >
                <div>
                  <button
                    className="underline text-left"
                    disabled={busy}
                    onClick={() => select(a.drillId)}
                  >
                    {
                      [...drills, ...guidedDrills].find(
                        (d) => d.id === a.drillId,
                      )?.title
                    }
                  </button>
                  <p className="text-sm muted">
                    <time dateTime={a.createdAt}>
                      {new Date(a.createdAt).toLocaleString()}
                    </time>{" "}
                    · {a.durationSeconds.toFixed(1)}s ·{" "}
                    {a.reflection === "again"
                      ? t("Practise again", "Praticar novamente")
                      : a.reflection === "comfortable"
                        ? t(
                            "Self-reflection: comfortable",
                            "Autorreflexão: confortável",
                          )
                        : t(
                            "Not reflected on yet",
                            "Sem reflexão desta gravação",
                          )}
                  </p>
                </div>
                <button
                  className="secondary"
                  onClick={() => {
                    if (
                      window.confirm(
                        guidedOpen
                          ? "Apagar esta entrada? Se ela comprova uma tarefa de sessão, será necessário gravar essa tarefa novamente para concluir."
                          : "Delete this practice entry?",
                      )
                    )
                      void change((p) => ({
                        ...p,
                        attempts: p.attempts.filter((x) => x.id !== a.id),
                      }));
                  }}
                >
                  {guidedOpen ? "Apagar entrada" : "Delete entry"}
                </button>
              </li>
            ))}
          </ul>
        )}
        {progress.attempts.length > historyLimit && (
          <button
            className="secondary"
            onClick={() => setHistoryLimit((n) => n + 20)}
          >
            {guidedOpen ? "Mostrar mais histórico" : "Show more history"}
          </button>
        )}
      </section>
      <footer className="muted text-sm border-t border-[#353539] pt-5">
        <p>
          {t(
            "Experimental acoustic tools support listening and reflection. They do not provide a pronunciation grade, CEFR level or clinical assessment.",
            "As ferramentas acústicas são experimentais. Não fornecem nota de pronúncia, nível CEFR ou avaliação clínica.",
          )}
        </p>
        <p className="mt-2">
          {t(
            "The catalogue includes accent-dependent IPA examples. Work with a teacher or trusted recordings when choosing an accent model.",
            "As sessões guiadas usam uma referência americana. A voz sintética é provisória; procure um professor ou gravações revisadas para uma referência pedagógica.",
          )}
        </p>
      </footer>
    </main>
  );
}
