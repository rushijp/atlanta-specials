import { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import {
  Camera,
  Plus,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Play,
  RotateCcw,
  Eye,
  Clock,
  Trash2,
  Edit3,
  Heart,
  Wifi,
  Trophy,
  Lock,
  Unlock,
  Users,
} from 'lucide-react';

// ─── Firestore ─────────────────────────────────────────────────────────────
const QUEUE_DOC = doc(db, 'wedding', 'photoQueue');
const BETS_DOC  = doc(db, 'wedding', 'bets');

const DEFAULT_STATE = {
  groups: [],
  currentId: null,
  completedIds: [],
  coupleNames: 'Brijal & Rushi',
  initialized: true,
};

const DEFAULT_BETS = { votingLocked: false, correctAnswers: {}, votes: {} };

const ADMIN_PASSWORD = 'br2026';

async function persistState(newState) {
  await setDoc(QUEUE_DOC, newState, { merge: false });
}

const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Bets questions ────────────────────────────────────────────────────────
const BETS_QUESTIONS = [
  // ── Wedding ──
  { id: 'q10', section: 'Wedding',   text: 'What will the baraat car be?',                   options: ['Audi R8', 'Rolls Royce', 'Lamborghini', 'Corvette'] },
  { id: 'q1',  section: 'Wedding',   text: "What color will Brijal's dress be?",              options: ['Red', 'Pink', 'Cream'] },
  { id: 'q7',  section: 'Wedding',   text: 'Will a flower boy go rogue during the entrance?', options: ['Yes', 'No'] },
  { id: 'q12', section: 'Wedding',   text: "Will the Groom's shoes be stolen?",               options: ['Yes', 'No'] },
  // ── Reception ──
  { id: 'q3',  section: 'Reception', text: 'Will the first dance be choreographed?',          options: ['Yes', 'No'] },
  { id: 'q6',  section: 'Reception', text: 'How long will the first dance be?',               options: ['Over 100 seconds', 'Under 100 seconds'] },
  { id: 'q4',  section: 'Reception', text: "How long will Rushi's Parents' speech be?",       options: ['Over 4 mins', 'Under 4 mins'] },
  { id: 'q5',  section: 'Reception', text: "How long will Brijal's Parents' speech be?",      options: ['Over 4 mins', 'Under 4 mins'] },
  { id: 'q9',  section: 'Reception', text: 'Will anyone cry during the speeches?',            options: ['Yes', 'No'] },
  { id: 'q8',  section: 'Reception', text: 'Notable dance floor injuries?',                   options: ['Over 1.5', 'Under 1.5'] },
  { id: 'q2',  section: 'Reception', text: 'What will the late night snack be?',              options: ['Pizza', 'Taco Bell', 'Something local', 'Waffle House'] },
  { id: 'q11', section: 'Reception', text: 'Kids under 10 on the dance floor past 10:30pm?',  options: ['Over 8', 'Under 8'] },
];

const BAD_WORDS = [
  'fuck','shit','ass','bitch','cunt','dick','pussy','cock','bastard','piss',
  'damn','hell','slut','whore','fag','nigger','nigga','chink','spic','kike',
  'retard','crap','douche','moron','idiot',
];

function isCleanName(name) {
  const lower = name.toLowerCase();
  return !BAD_WORDS.some((w) => lower.includes(w));
}

// ─── Shared real-time hooks ────────────────────────────────────────────────
function useBetsState() {
  const [bets, setBets] = useState(DEFAULT_BETS);
  const [betsLoading, setBetsLoading] = useState(true);
  useEffect(() => {
    const unsub = onSnapshot(
      BETS_DOC,
      (snap) => {
        setBets(snap.exists() ? { ...DEFAULT_BETS, ...snap.data() } : DEFAULT_BETS);
        setBetsLoading(false);
      },
      () => setBetsLoading(false)
    );
    return unsub;
  }, []);
  return { bets, betsLoading };
}

function useQueueState() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      QUEUE_DOC,
      (snap) => {
        setState(snap.exists() ? { ...DEFAULT_STATE, ...snap.data() } : DEFAULT_STATE);
        setLoading(false);
        setConnected(true);
      },
      () => {
        setLoading(false);
        setConnected(false);
      }
    );
    return unsub;
  }, []);

  return { state, loading, connected };
}

// ─── Hash-based view routing ───────────────────────────────────────────────
function useView() {
  const getView = () => {
    const h = window.location.hash.replace('#', '').toLowerCase();
    if (h === 'admin') return 'admin';
    if (h === 'display') return 'display';
    if (h === 'bets') return 'bets';
    if (h === 'leaderboard') return 'leaderboard';
    return 'public'; // bare URL → guest view
  };
  const [view, setView] = useState(getView);
  useEffect(() => {
    const onHash = () => setView(getView());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return view;
}

// ─── Admin password gate ───────────────────────────────────────────────────
function useAdminAuth() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem('wq_admin') === '1'
  );
  const unlock = () => {
    sessionStorage.setItem('wq_admin', '1');
    setAuthed(true);
  };
  return { authed, unlock };
}

// ─── Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const view = useView();
  const { state, loading, connected } = useQueueState();
  const { authed, unlock } = useAdminAuth();

  if (view === 'bets') return <BetsView />;
  if (view === 'leaderboard') return <LeaderboardView />;
  if (loading) return <LoadingScreen />;
  if (view === 'display') return <DisplayView state={state} />;
  if (view === 'admin') {
    if (!authed) return <AdminPasswordScreen onUnlock={unlock} />;
    return <AdminView state={state} />;
  }
  return <PublicView state={state} connected={connected} />;
}

// ─── Shared frame ──────────────────────────────────────────────────────────
function PageFrame({ children, dark = false, className = '' }) {
  return (
    <div
      className={`min-h-screen w-full ${
        dark ? 'bg-stone-950 text-stone-100' : 'bg-[#f5efe6] text-stone-900'
      } ${className}`}
      style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@400;500;600&display=swap"
      />
      {children}
    </div>
  );
}

function LoadingScreen() {
  return (
    <PageFrame>
      <div className="flex items-center justify-center min-h-screen">
        <img src="/BR_Monogram Only_Black.png" alt="B&R" className="w-16 h-16 object-contain animate-pulse opacity-40" />
      </div>
    </PageFrame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC VIEW — mobile-first, read-only
// ═══════════════════════════════════════════════════════════════════════════
function PublicView({ state, connected }) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const current = state.groups.find((g) => g.id === state.currentId);
  const upcoming = state.groups.filter(
    (g) => g.id !== state.currentId && !state.completedIds.includes(g.id)
  );
  const completedCount = state.completedIds.length;
  const onDeck = upcoming[0];
  const afterOnDeck = upcoming.slice(1, 4);
  const remaining = upcoming.length - afterOnDeck.length - 1;
  const allDone = completedCount > 0 && !current && upcoming.length === 0;

  // Search: find ALL groups containing the searched name
  const q = search.trim().toLowerCase();
  const searchResults = q.length >= 2 ? state.groups
    .filter((g) =>
      g.name.toLowerCase().includes(q) ||
      g.members.some((m) => m.toLowerCase().includes(q))
    )
    .map((g) => {
      if (g.id === state.currentId) return { group: g, status: 'current', position: null };
      if (state.completedIds.includes(g.id)) return { group: g, status: 'done', position: null };
      const idx = upcoming.findIndex((u) => u.id === g.id);
      return { group: g, status: idx === 0 ? 'ondeck' : 'upcoming', position: idx + 1 };
    }) : [];

  return (
    <PageFrame>
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-[#f5efe6]/95 backdrop-blur-sm border-b border-stone-200 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <img src="/BR_Monogram Only_Black.png" alt="B&R" className="w-9 h-9 object-contain opacity-85" />
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.3em] text-stone-400"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Photo Queue
              </p>
              <h1 className="text-lg font-medium italic leading-tight">
                {state.coupleNames || 'Wedding Photos'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#bets"
              className="text-[10px] text-stone-400 hover:text-stone-700 transition"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              🎲 Bets
            </a>
            <div className="flex items-center gap-1.5">
              <Wifi className={`w-3.5 h-3.5 ${connected ? 'text-emerald-600' : 'text-stone-300'}`} />
              <span
                className={`text-[10px] ${connected ? 'text-emerald-600' : 'text-stone-400'}`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {connected ? 'Live' : 'Connecting…'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 pb-16">
        {/* ── SEARCH ── */}
        <div className="mb-6 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your name…"
            className="w-full bg-white/80 border border-stone-200 rounded-2xl px-4 py-3.5 text-base focus:outline-none focus:border-stone-400 focus:bg-white transition pr-10"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          {search ? (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 text-lg">🔍</span>
          )}
        </div>

        {/* ── SEARCH RESULTS ── */}
        {q.length >= 2 && (
          <section className="mb-6">
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.length > 1 && (
                  <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-1 px-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {searchResults.length} groups found
                  </p>
                )}
                {searchResults.map(({ group, status, position }) => (
                  <div
                    key={group.id}
                    className={`rounded-2xl px-5 py-4 border ${
                      status === 'current'
                        ? 'bg-stone-900 text-stone-50 border-stone-900'
                        : status === 'ondeck'
                        ? 'bg-amber-50 border-amber-300'
                        : status === 'done'
                        ? 'bg-stone-100 border-stone-200'
                        : 'bg-white border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p
                        className={`text-[10px] uppercase tracking-[0.3em] ${
                          status === 'current' ? 'text-stone-400' : 'text-stone-500'
                        }`}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {status === 'current' && '📸 Now on Stage'}
                        {status === 'ondeck' && "⏳ You're next!"}
                        {status === 'upcoming' && `⏱ Position #${position} in queue`}
                        {status === 'done' && '✓ Already photographed'}
                      </p>
                    </div>
                    <p className={`text-xl italic font-medium ${status === 'current' ? 'text-stone-50' : 'text-stone-800'}`}>
                      {group.name}
                    </p>
                    {group.members.length > 0 && (
                      <p
                        className={`text-sm mt-1 leading-relaxed ${status === 'current' ? 'text-stone-300' : 'text-stone-500'}`}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {group.members.join(' · ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-stone-200 px-5 py-5 text-center bg-white/60">
                <p className="text-stone-400 italic">No group found for "{search}"</p>
                <p className="text-stone-400 text-xs mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Try a different spelling or ask the coordinator
                </p>
              </div>
            )}
          </section>
        )}
        {/* ── NOW ON STAGE ── */}
        <section className="mb-6">
          <p
            className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-3 flex items-center gap-2"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Now on Stage
          </p>

          {current ? (
            <div className="bg-stone-900 text-stone-50 rounded-2xl px-6 py-8 relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at 25% 20%, rgba(212,175,116,0.25) 0%, transparent 60%)',
                }}
              />
              <div className="relative">
                <Camera className="w-7 h-7 mx-auto mb-4 text-stone-400" />
                <h2 className="text-4xl font-medium italic text-center leading-tight mb-3">
                  {current.name}
                </h2>
                {current.members.length > 0 && (
                  <p
                    className="text-center text-stone-300 text-base leading-relaxed"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {current.members.join(' · ')}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-300 px-6 py-10 text-center">
              {allDone ? (
                <>
                  <Heart className="w-8 h-8 mx-auto mb-3 text-rose-400" />
                  <p className="text-2xl italic text-stone-600">All photos complete</p>
                </>
              ) : (
                <p className="text-xl italic text-stone-500">Starting soon…</p>
              )}
            </div>
          )}
        </section>

        {/* ── ON DECK ── */}
        {onDeck && (
          <section className="mb-4">
            <p
              className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-3"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              On Deck
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-5">
              <div className="flex items-center gap-3 mb-1">
                <span
                  className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Next up
                </span>
              </div>
              <h3 className="text-3xl font-medium italic leading-tight">{onDeck.name}</h3>
              {onDeck.members.length > 0 && (
                <p
                  className="text-stone-600 text-base mt-1.5 leading-relaxed"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {onDeck.members.join(' · ')}
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── COMING UP ── */}
        {afterOnDeck.length > 0 && (
          <section className="mb-4">
            <p
              className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-3"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Coming Up
            </p>
            <div className="space-y-2">
              {afterOnDeck.map((g, i) => (
                <div
                  key={g.id}
                  className="bg-white/70 border border-stone-200 rounded-xl px-4 py-4 flex items-start gap-3"
                >
                  <span
                    className="text-xs text-stone-400 mt-0.5 w-5 text-right flex-shrink-0"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    #{i + 2}
                  </span>
                  <div>
                    <p className="text-xl italic font-medium leading-tight">{g.name}</p>
                    {g.members.length > 0 && (
                      <p
                        className="text-stone-500 text-sm mt-1 leading-relaxed"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {g.members.join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {remaining > 0 && (
                <p
                  className="text-center text-sm text-stone-400 italic py-2"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  + {remaining} more group{remaining === 1 ? '' : 's'} after that
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── PROGRESS ── */}
        {(completedCount > 0 || state.groups.length > 0) && (
          <div className="mt-6 pt-5 border-t border-stone-200 flex justify-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-medium italic">{completedCount}</p>
              <p
                className="text-[10px] uppercase tracking-wider text-stone-400"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Done
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-medium italic">{upcoming.length}</p>
              <p
                className="text-[10px] uppercase tracking-wider text-stone-400"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Waiting
              </p>
            </div>
          </div>
        )}

        {/* ── FULL QUEUE ── */}
        {state.groups.length > 0 && (
          <section className="mt-6">
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-white/70 border border-stone-200 rounded-2xl text-stone-600 hover:bg-white transition"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <span className="text-sm font-medium">
                {showAll ? 'Hide full queue' : `See full queue · ${state.groups.length} groups`}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-stone-400 transition-transform ${showAll ? 'rotate-180' : ''}`}
              />
            </button>

            {showAll && (
              <div className="mt-2 space-y-1">
                {state.groups.map((g) => {
                  const isDone = state.completedIds.includes(g.id);
                  const isCurrent = g.id === state.currentId;
                  const upcomingIndex = upcoming.findIndex((u) => u.id === g.id);
                  const isOnDeck = upcomingIndex === 0;

                  return (
                    <div
                      key={g.id}
                      className={`px-4 py-3 rounded-xl flex items-start gap-3 ${
                        isCurrent
                          ? 'bg-stone-900 text-stone-50'
                          : isOnDeck
                          ? 'bg-amber-50 border border-amber-200'
                          : isDone
                          ? 'bg-stone-50 border border-stone-100'
                          : 'bg-white/70 border border-stone-200'
                      }`}
                    >
                      <span
                        className={`text-xs mt-0.5 w-14 flex-shrink-0 ${
                          isCurrent ? 'text-stone-400' : isDone ? 'text-stone-300' : 'text-stone-400'
                        }`}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {isCurrent ? '📸 Now' : isOnDeck ? '⏳ Next' : isDone ? '✓ Done' : `#${upcomingIndex + 1}`}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <p
                            className={`text-base italic font-medium leading-tight ${
                              isDone && !isCurrent ? 'line-through text-stone-400' : ''
                            }`}
                          >
                            {g.name}
                          </p>
                        </div>
                        {g.members.length > 0 && (
                          <p
                            className={`text-xs mt-0.5 leading-relaxed ${
                              isCurrent ? 'text-stone-300' : 'text-stone-400'
                            }`}
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            {g.members.join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </PageFrame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BETS VIEW — guest predictions
// ═══════════════════════════════════════════════════════════════════════════
const POINTS_PER_QUESTION = 10;

function BetsView() {
  const { bets, betsLoading } = useBetsState();
  const [name, setName] = useState(() => localStorage.getItem('wq_bets_name') || '');
  const [picks, setPicks] = useState({});
  const [savedPicks, setSavedPicks] = useState({}); // what's already in Firestore
  const [step, setStep] = useState('name'); // 'name' | 'voting' | 'done'
  const [shoePopup, setShoePopup] = useState(null); // null | 'Yes' | 'No'
  const [flowerPopup, setFlowerPopup] = useState(null); // null | 'Yes' | 'No'
  const [nameError, setNameError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const normalizeName = (n) => n.trim().toLowerCase();

  const handleNameSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) { setNameError('Please enter your full name.'); return; }
    if (trimmed.length > 40) { setNameError('Name is too long.'); return; }
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) { setNameError('Please use letters only.'); return; }
    if (!isCleanName(trimmed)) { setNameError('Please enter your real name.'); return; }

    const key = normalizeName(trimmed);
    if (bets.votingLocked && !bets.votes[key]) {
      setStep('locked');
      return;
    }
    // Load existing picks (if any) — always go to voting so they can add more
    const existing = bets.votes[key] || {};
    const loaded = {};
    BETS_QUESTIONS.forEach((q) => { if (existing[q.id]) loaded[q.id] = existing[q.id]; });
    setPicks(loaded);
    setSavedPicks(loaded);
    localStorage.setItem('wq_bets_name', trimmed);
    setStep('voting');
  };

  const handleSubmit = async () => {
    if (changedPicksCount === 0) return;
    setSubmitting(true);
    try {
      const key = normalizeName(name.trim());
      // Merge locally: existing saved + new selections
      const merged = { ...savedPicks, ...picks };
      await setDoc(BETS_DOC, {
        votes: { [key]: { displayName: name.trim(), ...merged } },
      }, { merge: true });
      setSavedPicks(merged);
      setStep('done');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = BETS_QUESTIONS.filter((q) => bets.correctAnswers[q.id]).length;
  const myCorrect = BETS_QUESTIONS.filter(
    (q) => bets.correctAnswers[q.id] && picks[q.id] === bets.correctAnswers[q.id]
  ).length;
  const myScore = myCorrect * POINTS_PER_QUESTION;
  const changedPicksCount = Object.keys(picks).filter((qId) => picks[qId] !== savedPicks[qId]).length;

  const BetsHeader = () => (
    <header className="sticky top-0 z-10 bg-[#f5efe6]/95 backdrop-blur-sm border-b border-stone-200 px-5 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <img src="/BR_Monogram Only_Black.png" alt="B&R" className="w-9 h-9 object-contain opacity-85" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>Wedding Bets</p>
            <h1 className="text-lg font-medium italic leading-tight">Brijal & Rushi</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          <a href="#leaderboard" className="text-stone-400 hover:text-stone-700 transition">🏆 Scores</a>
          <a href="#" className="text-stone-400 hover:text-stone-700 transition">📷 Queue</a>
        </div>
      </div>
    </header>
  );

  if (betsLoading) return (
    <PageFrame>
      <BetsHeader />
      <div className="flex items-center justify-center min-h-[60vh]">
        <img src="/BR_Monogram Only_Black.png" alt="" className="w-10 animate-pulse opacity-30" />
      </div>
    </PageFrame>
  );

  return (
    <PageFrame>
      <BetsHeader />

      {/* Shoe popup */}
      {shoePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6" onClick={() => setShoePopup(null)}>
          <div className="bg-white rounded-3xl px-8 py-10 max-w-xs w-full text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-5xl mb-4">👟</p>
            <p className="text-2xl font-medium italic mb-2">
              {shoePopup === 'Yes' ? "It won't be easy!" : 'Good choice!'}
            </p>
            {shoePopup === 'No' && (
              <p className="text-sm text-stone-500 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                I got two cheesy bean and rice burritos with your name on it!
              </p>
            )}
            <button
              onClick={() => setShoePopup(null)}
              className="mt-4 px-6 py-2.5 bg-stone-900 text-stone-50 rounded-2xl text-sm hover:bg-stone-700 transition"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {shoePopup === 'Yes' ? "We'll see about that" : "Let's go!"}
            </button>
          </div>
        </div>
      )}

      {/* Flower boy popup */}
      {flowerPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6" onClick={() => setFlowerPopup(null)}>
          <div className="bg-white rounded-3xl px-8 py-10 max-w-xs w-full text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-2xl font-medium italic mb-2">
              {flowerPopup === 'Yes' ? 'Honestly fair 🤷' : 'I have faith as well'}
            </p>
            <button
              onClick={() => setFlowerPopup(null)}
              className="mt-4 px-6 py-2.5 bg-stone-900 text-stone-50 rounded-2xl text-sm hover:bg-stone-700 transition"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {flowerPopup === 'Yes' ? 'Ha, same' : "Let's hope so"}
            </button>
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 pt-6 pb-16">

        {/* ── NAME STEP ── */}
        {step === 'name' && (
          <div>
            <div className="mb-8 text-center">
              <Trophy className="w-10 h-10 mx-auto mb-3 text-stone-400" />
              <h2 className="text-3xl italic font-medium mb-2">Make your picks</h2>
              <p className="text-stone-500 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                Predict what happens at the wedding. Scores reveal live on the big night.
              </p>
            </div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Your name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              placeholder="First & last name"
              className={`w-full bg-white/80 border rounded-2xl px-4 py-3.5 text-base focus:outline-none transition mb-1 ${nameError ? 'border-rose-400' : 'border-stone-200 focus:border-stone-400'}`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            {nameError && <p className="text-rose-500 text-xs mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>{nameError}</p>}
            {!nameError && <div className="mb-3" />}
            <button
              onClick={handleNameSubmit}
              className="w-full py-3.5 bg-stone-900 text-stone-50 hover:bg-stone-700 rounded-2xl text-base transition"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Let's go →
            </button>
            <p className="text-center text-xs text-stone-400 mt-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Already voted? Enter the same name to see your picks.
            </p>
          </div>
        )}

        {/* ── VOTING LOCKED ── */}
        {step === 'locked' && (
          <div className="text-center py-16">
            <Lock className="w-10 h-10 mx-auto mb-4 text-stone-300" />
            <h2 className="text-2xl italic mb-2">Voting is closed</h2>
            <p className="text-stone-500 text-sm mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              Picks are locked. Check the leaderboard to see how everyone did.
            </p>
            <a href="#leaderboard" className="inline-block px-6 py-3 bg-stone-900 text-stone-50 rounded-2xl text-sm hover:bg-stone-700 transition" style={{ fontFamily: 'Inter, sans-serif' }}>
              View Leaderboard
            </a>
          </div>
        )}

        {/* ── VOTING STEP ── */}
        {step === 'voting' && (
          <div>
            <p className="text-sm text-stone-500 mb-6 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
              Voting as <span className="font-medium text-stone-800">{name.trim()}</span> · {Object.keys(picks).length}/{BETS_QUESTIONS.length} answered
            </p>
            <div className="space-y-4">
              {BETS_QUESTIONS.map((q, i) => {
                const isRevealed = !!bets.correctAnswers[q.id];
                const isSaved = !!savedPicks[q.id];
                const isChanged = isSaved && picks[q.id] !== savedPicks[q.id];
                return (
                  <div key={q.id}>
                    {(i === 0 || BETS_QUESTIONS[i - 1].section !== q.section) && (
                      <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 pt-2 pb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{q.section}</p>
                    )}
                    <div className={`border rounded-2xl px-5 py-4 ${isRevealed ? 'bg-stone-50 border-stone-200 opacity-70' : isSaved && !isChanged ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white/70 border-stone-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-lg italic font-medium">{q.text}</p>
                        {isSaved && !isRevealed && !isChanged && <span className="text-[10px] text-emerald-600 ml-2 flex-shrink-0" style={{ fontFamily: 'Inter, sans-serif' }}>✓ saved</span>}
                        {isChanged && <span className="text-[10px] text-amber-600 ml-2 flex-shrink-0" style={{ fontFamily: 'Inter, sans-serif' }}>● changed</span>}
                        {isRevealed && <span className="text-[10px] text-stone-400 ml-2 flex-shrink-0" style={{ fontFamily: 'Inter, sans-serif' }}>Answer revealed</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => { if (!isRevealed) { setPicks((p) => ({ ...p, [q.id]: opt })); if (q.id === 'q12') setShoePopup(opt); if (q.id === 'q7') setFlowerPopup(opt); } }}
                            disabled={isRevealed}
                            className={`px-4 py-2 rounded-xl text-sm transition border ${
                              picks[q.id] === opt
                                ? isSaved && !isChanged ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-stone-900 text-stone-50 border-stone-900'
                                : 'bg-white border-stone-200 text-stone-500'
                            } disabled:cursor-not-allowed`}
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleSubmit}
              disabled={changedPicksCount === 0 || submitting}
              className="w-full mt-6 py-3.5 bg-stone-900 text-stone-50 hover:bg-stone-700 disabled:opacity-40 rounded-2xl text-base transition"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {submitting ? 'Saving…' : changedPicksCount > 0 ? `Save ${changedPicksCount} pick${changedPicksCount > 1 ? 's' : ''} →` : 'Select a pick above'}
            </button>
            {Object.keys(savedPicks).length > 0 && (
              <button onClick={() => setStep('done')} className="w-full mt-2 py-2 text-sm text-stone-400 hover:text-stone-700 transition" style={{ fontFamily: 'Inter, sans-serif' }}>
                View my picks recap →
              </button>
            )}
          </div>
        )}

        {/* ── DONE STEP ── */}
        {step === 'done' && (
          <div>
            {answeredCount > 0 && (
              <div className="bg-stone-900 text-stone-50 rounded-2xl px-6 py-6 text-center mb-6">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-stone-400" />
                <p className="text-4xl font-medium italic mb-1">{myScore} pts</p>
                <p className="text-sm text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {myCorrect} of {answeredCount} correct · {POINTS_PER_QUESTION} pts each · {BETS_QUESTIONS.length - answeredCount} still pending
                </p>
              </div>
            )}
            {answeredCount === 0 && (
              <div className="bg-stone-100 rounded-2xl px-6 py-6 text-center mb-6">
                <p className="text-xl italic text-stone-600 mb-1">Picks locked in!</p>
                <p className="text-sm text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>Scores will appear as the night unfolds.</p>
              </div>
            )}
            <div className="space-y-3 mb-4">
              {BETS_QUESTIONS.map((q, i) => {
                const correct = bets.correctAnswers[q.id];
                const myPick = picks[q.id];
                const isRight = correct && myPick === correct;
                const isWrong = correct && myPick !== correct;
                return (
                  <div key={q.id}>
                    {(i === 0 || BETS_QUESTIONS[i - 1].section !== q.section) && (
                      <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 pt-2 pb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{q.section}</p>
                    )}
                    <div className={`rounded-xl px-4 py-3 border ${isRight ? 'bg-emerald-50 border-emerald-200' : isWrong ? 'bg-rose-50 border-rose-200' : myPick ? 'bg-white/70 border-stone-200' : 'bg-stone-50 border-dashed border-stone-200'}`}>
                      <p className="text-xs text-stone-500 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{q.text}</p>
                      <div className="flex items-center justify-between gap-2">
                        {myPick ? (
                          <>
                            <p className={`text-base italic font-medium ${isRight ? 'text-emerald-800' : isWrong ? 'text-rose-700 line-through' : 'text-stone-800'}`}>{myPick}</p>
                            {isRight && <span className="text-emerald-600 text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>+{POINTS_PER_QUESTION}pts</span>}
                            {isWrong && <span className="text-xs text-stone-500" style={{ fontFamily: 'Inter, sans-serif' }}>→ {correct}</span>}
                            {!correct && <span className="text-[10px] text-stone-300 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Pending</span>}
                          </>
                        ) : (
                          <p className="text-sm italic text-stone-400">Not answered yet</p>
                        )}
                      </div>
                      {correct && q.id === 'q1' && (
                        <p className="text-xs text-stone-500 mt-2 italic" style={{ fontFamily: 'Inter, sans-serif' }}>She is just Stunning isn't she! I'm very lucky!</p>
                      )}
                      {correct && q.id === 'q7' && correct === 'Yes' && (
                        <p className="text-xs text-stone-500 mt-2 italic" style={{ fontFamily: 'Inter, sans-serif' }}>It was Sahil I bet</p>
                      )}
                      {correct && q.id === 'q7' && correct === 'No' && (
                        <p className="text-xs text-stone-500 mt-2 italic" style={{ fontFamily: 'Inter, sans-serif' }}>The boys locked in! 😎</p>
                      )}
                      {correct && q.id === 'q12' && correct === 'Yes' && (
                        <p className="text-xs text-stone-500 mt-2 italic" style={{ fontFamily: 'Inter, sans-serif' }}>I'm broke ask my dad. He is semi-retired.</p>
                      )}
                      {correct && q.id === 'q12' && correct === 'No' && (
                        <p className="text-xs text-stone-500 mt-2 italic" style={{ fontFamily: 'Inter, sans-serif' }}>Honestly surprised</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {BETS_QUESTIONS.some((q) => !bets.correctAnswers[q.id]) && (
              <button
                onClick={() => setStep('voting')}
                className="w-full mb-3 py-3 border border-stone-300 hover:bg-stone-100 rounded-2xl text-sm text-stone-600 transition"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {Object.keys(savedPicks).length < BETS_QUESTIONS.filter(q => !bets.correctAnswers[q.id]).length ? '+ Add more picks' : '✏️ Edit picks'}
              </button>
            )}
            <a href="#leaderboard" className="block text-center w-full py-3.5 bg-stone-900 text-stone-50 hover:bg-stone-700 rounded-2xl text-sm transition" style={{ fontFamily: 'Inter, sans-serif' }}>
              🏆 View Leaderboard
            </a>
          </div>
        )}
      </main>
    </PageFrame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEADERBOARD VIEW
// ═══════════════════════════════════════════════════════════════════════════
function LeaderboardView() {
  const { bets, betsLoading } = useBetsState();

  const answeredQs = BETS_QUESTIONS.filter((q) => bets.correctAnswers[q.id]);
  const voters = Object.values(bets.votes)
    .map((v) => ({
      name: v.displayName,
      score: answeredQs.filter((q) => v[q.id] === bets.correctAnswers[q.id]).length * POINTS_PER_QUESTION,
      picks: v,
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return (
    <PageFrame>
      <header className="sticky top-0 z-10 bg-[#f5efe6]/95 backdrop-blur-sm border-b border-stone-200 px-5 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <img src="/BR_Monogram Only_Black.png" alt="B&R" className="w-9 h-9 object-contain opacity-85" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>Leaderboard</p>
              <h1 className="text-lg font-medium italic leading-tight">Wedding Bets</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <a href="#bets" className="text-stone-400 hover:text-stone-700 transition">🎲 My Picks</a>
            <a href="#" className="text-stone-400 hover:text-stone-700 transition">📷 Queue</a>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 pb-16">
        {betsLoading ? (
          <div className="flex justify-center py-20">
            <img src="/BR_Monogram Only_Black.png" alt="" className="w-10 animate-pulse opacity-30" />
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <div className="flex justify-center gap-8 mb-6 py-4 bg-white/60 rounded-2xl border border-stone-200">
              <div className="text-center">
                <p className="text-2xl font-medium italic">{answeredQs.length}<span className="text-stone-400 text-lg">/{BETS_QUESTIONS.length}</span></p>
                <p className="text-[10px] uppercase tracking-wider text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>Answered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-medium italic">{voters.length}</p>
                <p className="text-[10px] uppercase tracking-wider text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>Guests</p>
              </div>
            </div>

            {answeredQs.length === 0 && (
              <p className="text-center text-stone-400 italic text-sm mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                Scores will appear as the night unfolds 🎉
              </p>
            )}

            {/* Rankings */}
            {voters.length > 0 && (
              <section className="mb-8">
                <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Rankings</p>
                <div className="space-y-2">
                  {voters.map((v, i) => (
                    <div key={v.name} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${i === 0 && answeredQs.length > 0 ? 'bg-stone-900 text-stone-50 border-stone-900' : 'bg-white/70 border-stone-200'}`}>
                      <span className={`text-sm w-6 text-right flex-shrink-0 ${i === 0 && answeredQs.length > 0 ? 'text-stone-400' : 'text-stone-400'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                        {i === 0 && answeredQs.length > 0 ? '🏆' : `#${i + 1}`}
                      </span>
                      <span className="flex-1 text-base italic font-medium">{v.name}</span>
                      {answeredQs.length > 0 && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-sm font-medium ${i === 0 ? 'text-stone-300' : 'text-stone-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                            {v.score}pts
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-stone-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${i === 0 ? 'bg-stone-400' : 'bg-stone-700'}`}
                              style={{ width: `${(v.score / (answeredQs.length * POINTS_PER_QUESTION)) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Per-question breakdown (only for answered questions) */}
            {answeredQs.length > 0 && (
              <section>
                <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Results</p>
                <div className="space-y-3">
                  {answeredQs.map((q, i) => {
                    const total = voters.length || 1;
                    return (
                      <div key={q.id}>
                        {(i === 0 || answeredQs[i - 1].section !== q.section) && (
                          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 pt-2 pb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{q.section}</p>
                        )}
                        <div className="bg-white/70 border border-stone-200 rounded-xl px-4 py-4">
                          <p className="text-base italic font-medium mb-3">{q.text}</p>
                          <div className="space-y-2">
                            {q.options.map((opt) => {
                              const count = voters.filter((v) => v.picks[q.id] === opt).length;
                              const pct = Math.round((count / total) * 100);
                              const isCorrect = opt === bets.correctAnswers[q.id];
                              return (
                                <div key={opt}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm flex items-center gap-1.5 ${isCorrect ? 'font-medium text-emerald-700' : 'text-stone-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                                      {isCorrect && '✓ '}{opt}
                                    </span>
                                    <span className="text-xs text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>{count} · {pct}%</span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${isCorrect ? 'bg-emerald-500' : 'bg-stone-300'}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {voters.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-8 h-8 mx-auto mb-3 text-stone-300" />
                <p className="text-stone-400 italic">No votes yet</p>
                <a href="#bets" className="mt-3 inline-block text-sm text-stone-500 hover:text-stone-800 underline underline-offset-2" style={{ fontFamily: 'Inter, sans-serif' }}>Be the first to vote</a>
              </div>
            )}
          </>
        )}
      </main>
    </PageFrame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DISPLAY VIEW — venue TV / projector
// ═══════════════════════════════════════════════════════════════════════════
function DisplayView({ state }) {
  const current = state.groups.find((g) => g.id === state.currentId);
  const upcoming = state.groups.filter(
    (g) => g.id !== state.currentId && !state.completedIds.includes(g.id)
  );
  const nextThree = upcoming.slice(0, 3);

  return (
    <PageFrame dark>
      <div className="min-h-screen flex flex-col p-10 sm:p-16">
        <header className="text-center mb-10">
          <img
            src="/BR_Monogram Only_Black.png"
            alt="B&R"
            className="w-16 h-16 object-contain mx-auto mb-4"
            style={{ filter: 'invert(1)', opacity: 0.75 }}
          />
          <p
            className="text-xs uppercase tracking-[0.5em] text-stone-400 mb-3"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Photo Queue
          </p>
          <h1
            className="text-5xl sm:text-7xl italic font-medium"
            style={{ color: '#e8d9b8' }}
          >
            {state.coupleNames || 'Our Wedding'}
          </h1>
        </header>

        <section className="flex-1 flex items-center justify-center">
          {current ? (
            <div className="text-center">
              <div className="flex items-center gap-3 justify-center mb-6">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                <p
                  className="text-sm uppercase tracking-[0.5em] text-stone-400"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Now on Stage
                </p>
              </div>
              <h2
                className="text-6xl sm:text-8xl italic font-medium leading-tight mb-5"
                style={{ color: '#f5e9d3' }}
              >
                {current.name}
              </h2>
              {current.members.length > 0 && (
                <p
                  className="text-xl sm:text-2xl text-stone-300 max-w-3xl mx-auto leading-relaxed"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {current.members.join('  ·  ')}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <Heart className="w-16 h-16 mx-auto mb-6 text-rose-400" />
              <h2
                className="text-5xl sm:text-7xl italic"
                style={{ color: '#d6cfc4' }}
              >
                {state.completedIds.length > 0 && upcoming.length === 0
                  ? 'Thank you all'
                  : 'Beginning shortly'}
              </h2>
            </div>
          )}
        </section>

        {nextThree.length > 0 && (
          <section className="mt-10 pt-8 border-t border-stone-800">
            <p
              className="text-xs uppercase tracking-[0.5em] text-stone-500 text-center mb-6"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Coming Up
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {nextThree.map((g, i) => (
                <div
                  key={g.id}
                  className={`p-5 rounded-xl border ${
                    i === 0
                      ? 'border-amber-700/50 bg-amber-950/30'
                      : 'border-stone-800 bg-stone-900/40'
                  }`}
                >
                  <p
                    className={`text-xs uppercase tracking-wider mb-2 ${
                      i === 0 ? 'text-amber-300' : 'text-stone-500'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {i === 0 ? 'On Deck' : i === 1 ? 'Then' : 'After that'}
                  </p>
                  <h3
                    className="text-2xl italic font-medium leading-tight mb-1"
                    style={{ color: i === 0 ? '#f5e9d3' : '#d6cfc4' }}
                  >
                    {g.name}
                  </h3>
                  {g.members.length > 0 && (
                    <p
                      className="text-sm text-stone-400 leading-relaxed"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {g.members.slice(0, 4).join(' · ')}
                      {g.members.length > 4 && ` +${g.members.length - 4}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageFrame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN PASSWORD SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function AdminPasswordScreen({ onUnlock }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  const attempt = () => {
    if (pw === ADMIN_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setPw('');
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <PageFrame>
      <div className="flex items-center justify-center min-h-screen p-5">
        <div className="max-w-xs w-full bg-white/90 border border-stone-200 rounded-2xl p-8 text-center">
          <img src="/BR_Monogram Only_Black.png" alt="B&R" className="w-16 h-16 object-contain mx-auto mb-5 opacity-85" />
          <h1 className="text-2xl italic font-medium mb-1">Admin Access</h1>
          <p
            className="text-stone-400 text-sm mb-6"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Brijal & Rushi · Photo Queue
          </p>
          <input
            type="password"
            autoFocus
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && attempt()}
            placeholder="Password"
            className={`w-full text-center text-lg bg-transparent border-b-2 pb-2 mb-2 focus:outline-none transition-colors ${
              error ? 'border-rose-400 text-rose-600' : 'border-stone-200 focus:border-stone-700'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          {error && (
            <p
              className="text-rose-500 text-xs mb-4"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Incorrect password
            </p>
          )}
          {!error && <div className="mb-4" />}
          <button
            onClick={attempt}
            className="w-full py-2.5 bg-stone-900 text-stone-50 hover:bg-stone-700 rounded-xl text-sm transition"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Enter
          </button>
        </div>
      </div>
    </PageFrame>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN VIEW — full control
// ═══════════════════════════════════════════════════════════════════════════
function AdminView({ state }) {
  const [adminTab, setAdminTab] = useState('queue');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showLinks, setShowLinks] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const upcoming = state.groups.filter(
    (g) => g.id !== state.currentId && !state.completedIds.includes(g.id)
  );
  const current = state.groups.find((g) => g.id === state.currentId);
  const completed = state.completedIds
    .map((id) => state.groups.find((g) => g.id === id))
    .filter(Boolean);

  const save = async (next) => {
    setSaving(true);
    try {
      await persistState(next);
    } finally {
      setSaving(false);
    }
  };

  const addGroup = async (name, members) => {
    const g = {
      id: uid(),
      name: name.trim(),
      members: members
        .split(/[,\n]/)
        .map((m) => m.trim())
        .filter(Boolean),
    };
    await save({ ...state, groups: [...state.groups, g], initialized: true });
  };

  const editGroup = async (id, name, members) => {
    await save({
      ...state,
      groups: state.groups.map((g) =>
        g.id === id
          ? {
              ...g,
              name: name.trim(),
              members: members
                .split(/[,\n]/)
                .map((m) => m.trim())
                .filter(Boolean),
            }
          : g
      ),
    });
  };

  const deleteGroup = async (id) => {
    await save({
      ...state,
      groups: state.groups.filter((g) => g.id !== id),
      currentId: state.currentId === id ? null : state.currentId,
      completedIds: state.completedIds.filter((c) => c !== id),
    });
  };

  const startGroup = async (id) => {
    await save({ ...state, currentId: id });
  };

  const completeCurrent = async () => {
    if (!state.currentId) return;
    const nextUpcoming = state.groups.filter(
      (g) => g.id !== state.currentId && !state.completedIds.includes(g.id)
    );
    await save({
      ...state,
      currentId: nextUpcoming[0]?.id ?? null,
      completedIds: [...state.completedIds, state.currentId],
    });
  };

  const startQueue = async () => {
    if (state.groups.length === 0) return;
    await save({ ...state, currentId: state.groups[0].id, completedIds: [] });
  };

  const resetQueue = async () => {
    await save({ ...state, currentId: null, completedIds: [] });
    setConfirmReset(false);
  };

  const moveGroup = async (id, dir) => {
    const idx = state.groups.findIndex((g) => g.id === id);
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= state.groups.length) return;
    const gs = [...state.groups];
    [gs[idx], gs[newIdx]] = [gs[newIdx], gs[idx]];
    await save({ ...state, groups: gs });
  };

  const undoComplete = async (id) => {
    await save({ ...state, completedIds: state.completedIds.filter((c) => c !== id) });
  };

  return (
    <PageFrame>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-7 pb-20">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <img src="/BR_Monogram Only_Black.png" alt="B&R" className="w-10 h-10 object-contain opacity-80 flex-shrink-0" />
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-1"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Admin · Photo Queue
                </p>
                <h1 className="text-3xl sm:text-4xl font-medium italic">
                  {state.coupleNames || 'Our Wedding'}
                </h1>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setShowLinks(true)}
                className="flex items-center gap-1.5 px-3 py-2 border border-stone-300 hover:bg-stone-100 rounded-lg text-sm transition"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <Eye className="w-4 h-4" /> Share
              </button>
            </div>
          </div>
          {/* Tab switcher */}
          <div className="flex gap-1 mt-4 p-1 bg-stone-100 rounded-xl w-fit">
            {['queue', 'bets', 'leaderboard'].map((tab) => (
              <button
                key={tab}
                onClick={() => setAdminTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm transition capitalize ${adminTab === tab ? 'bg-white shadow-sm text-stone-900 font-medium' : 'text-stone-500 hover:text-stone-800'}`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {tab === 'queue' ? '📷 Queue' : tab === 'bets' ? '🎲 Bets' : '🏆 Scores'}
              </button>
            ))}
          </div>
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
        </header>

        {adminTab === 'bets' && <AdminBetsPanel />}

        {adminTab === 'leaderboard' && <LeaderboardView />}

        {adminTab === 'queue' && <>
        {saving && (
          <div
            className="mb-4 text-xs text-stone-500 italic text-right"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Saving…
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Upcoming', value: upcoming.length, icon: <Clock className="w-4 h-4" /> },
            { label: 'On Stage', value: current ? 1 : 0, icon: <Camera className="w-4 h-4" />, hi: true },
            { label: 'Done', value: completed.length, icon: <Check className="w-4 h-4" /> },
          ].map(({ label, value, icon, hi }) => (
            <div
              key={label}
              className={`p-4 rounded-xl border ${
                hi
                  ? 'bg-stone-900 text-stone-50 border-stone-900'
                  : 'bg-white/60 border-stone-200'
              }`}
            >
              <div
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-60 mb-1"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {icon} {label}
              </div>
              <div className="text-3xl font-medium italic">{value}</div>
            </div>
          ))}
        </div>

        {/* Current group */}
        {current ? (
          <section className="mb-8">
            <Label>Now on Stage</Label>
            <div className="bg-stone-900 text-stone-50 rounded-xl p-6 relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(212,175,116,0.7) 0%, transparent 70%)',
                }}
              />
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span
                  className="text-[10px] uppercase tracking-[0.3em] text-stone-400"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Photographing
                </span>
              </div>
              <h2 className="text-3xl italic font-medium mb-2">{current.name}</h2>
              {current.members.length > 0 && (
                <p
                  className="text-stone-300 text-sm mb-5 leading-relaxed"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {current.members.join(' · ')}
                </p>
              )}
              <button
                onClick={completeCurrent}
                className="flex items-center gap-2 px-5 py-2.5 bg-stone-50 text-stone-900 hover:bg-stone-200 rounded-lg text-sm font-medium transition"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <Check className="w-4 h-4" /> Mark Done & Call Next
              </button>
            </div>
          </section>
        ) : (
          state.groups.length > 0 &&
          completed.length === 0 && (
            <section className="mb-8">
              <button
                onClick={startQueue}
                className="w-full py-8 border-2 border-dashed border-stone-300 hover:border-stone-500 hover:bg-stone-100/50 rounded-xl transition text-stone-600"
              >
                <Play className="w-7 h-7 mx-auto mb-2" />
                <p className="text-lg italic">Start Queue</p>
                <p
                  className="text-xs text-stone-400 mt-1"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Calls the first group
                </p>
              </button>
            </section>
          )
        )}

        {/* Upcoming */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <Label>Upcoming · {upcoming.length}</Label>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <Plus className="w-4 h-4" /> Add Group
            </button>
          </div>

          {upcoming.length === 0 ? (
            <p className="text-center py-10 text-stone-400 italic text-sm">
              {state.groups.length === 0
                ? 'No groups yet — add your first one above.'
                : 'All groups completed.'}
            </p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((g, i) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  position={i + 1}
                  isEditing={editingId === g.id}
                  onEdit={() => setEditingId(g.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={async (name, members) => {
                    await editGroup(g.id, name, members);
                    setEditingId(null);
                  }}
                  onDelete={() => deleteGroup(g.id)}
                  onStart={() => startGroup(g.id)}
                  canMoveUp={state.groups.indexOf(g) > 0}
                  canMoveDown={state.groups.indexOf(g) < state.groups.length - 1}
                  onMoveUp={() => moveGroup(g.id, 'up')}
                  onMoveDown={() => moveGroup(g.id, 'down')}
                />
              ))}
            </div>
          )}
        </section>

        {/* Completed */}
        {completed.length > 0 && (
          <section className="mb-8">
            <Label>Completed · {completed.length}</Label>
            <div className="space-y-1">
              {completed.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between px-4 py-3 bg-stone-100/60 rounded-lg group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="italic line-through text-stone-400 text-sm truncate">
                      {g.name}
                    </span>
                  </div>
                  <button
                    onClick={() => undoComplete(g.id)}
                    className="text-xs text-stone-500 hover:text-stone-900 border border-stone-300 hover:border-stone-500 px-2 py-0.5 rounded-lg transition ml-3 flex-shrink-0"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
            {confirmReset ? (
              <div className="mt-4 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                <span className="text-xs text-stone-600">Reset everything?</span>
                <button
                  onClick={resetQueue}
                  className="text-xs px-2.5 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                >
                  Yes, reset
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="text-xs px-2.5 py-1 border border-stone-300 rounded-lg text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="mt-4 flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset entire queue
              </button>
            )}
          </section>
        )}
        </>}
      </div>

      {showAdd && (
        <AddGroupModal
          onClose={() => setShowAdd(false)}
          onAdd={async (name, members) => {
            await addGroup(name, members);
            setShowAdd(false);
          }}
        />
      )}
      {showLinks && <ShareLinksModal onClose={() => setShowLinks(false)} />}
    </PageFrame>
  );
}

// ─── Admin sub-components ──────────────────────────────────────────────────
function Label({ children }) {
  return (
    <p
      className="text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-3"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {children}
    </p>
  );
}

function AdminBetsPanel() {
  const { bets } = useBetsState();
  const [confirmClearAnswers, setConfirmClearAnswers] = useState(false);
  const [confirmClearVotes, setConfirmClearVotes] = useState(false);

  const voterEntries = Object.entries(bets.votes);
  const answeredCount = BETS_QUESTIONS.filter((q) => bets.correctAnswers[q.id]).length;

  const toggleLock = () =>
    setDoc(BETS_DOC, { votingLocked: !bets.votingLocked }, { merge: true });

  const setAnswer = (qId, opt) => {
    if (bets.correctAnswers[qId] === opt) {
      updateDoc(BETS_DOC, { [`correctAnswers.${qId}`]: deleteField() });
    } else {
      setDoc(BETS_DOC, { correctAnswers: { [qId]: opt } }, { merge: true });
    }
  };

  const clearAnswers = async () => {
    await setDoc(BETS_DOC, { correctAnswers: {} }, { merge: true });
    setConfirmClearAnswers(false);
  };

  const clearVotes = async () => {
    await setDoc(BETS_DOC, { votes: {} }, { merge: true });
    setConfirmClearVotes(false);
  };

  const removeVoter = (key) =>
    updateDoc(BETS_DOC, { [`votes.${key}`]: deleteField() });

  const totalVoters = voterEntries.length;

  return (
    <div className="space-y-6">
      {/* Controls row */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={toggleLock}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition ${
            bets.votingLocked
              ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
              : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
          }`}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {bets.votingLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          {bets.votingLocked ? 'Voting Locked' : 'Voting Open'}
        </button>

        {confirmClearAnswers ? (
          <span className="flex items-center gap-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
            <span className="text-xs text-stone-600">Clear all answers?</span>
            <button onClick={clearAnswers} className="text-xs px-2 py-1 bg-rose-600 text-white rounded-lg">Yes</button>
            <button onClick={() => setConfirmClearAnswers(false)} className="text-xs px-2 py-1 border border-stone-300 rounded-lg text-stone-500">No</button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmClearAnswers(true)}
            className="text-xs px-3 py-2 border border-stone-200 rounded-lg text-stone-500 hover:text-stone-800 hover:border-stone-400 transition"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Clear all answers
          </button>
        )}

        {confirmClearVotes ? (
          <span className="flex items-center gap-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
            <span className="text-xs text-stone-600">Delete ALL votes?</span>
            <button onClick={clearVotes} className="text-xs px-2 py-1 bg-rose-600 text-white rounded-lg">Yes, delete</button>
            <button onClick={() => setConfirmClearVotes(false)} className="text-xs px-2 py-1 border border-stone-300 rounded-lg text-stone-500">No</button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmClearVotes(true)}
            className="text-xs px-3 py-2 border border-rose-200 rounded-lg text-rose-500 hover:text-rose-700 hover:border-rose-400 transition"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Delete all votes
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-2xl font-medium italic">{totalVoters}</p>
          <p className="text-[10px] uppercase tracking-wider text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>Guests voted</p>
        </div>
        <div>
          <p className="text-2xl font-medium italic">{answeredCount}<span className="text-stone-400 text-lg">/{BETS_QUESTIONS.length}</span></p>
          <p className="text-[10px] uppercase tracking-wider text-stone-400" style={{ fontFamily: 'Inter, sans-serif' }}>Answered</p>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {BETS_QUESTIONS.map((q, i) => {
          const correct = bets.correctAnswers[q.id];
          return (
            <div key={q.id}>
              {(i === 0 || BETS_QUESTIONS[i - 1].section !== q.section) && (
                <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 pt-2 pb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{q.section}</p>
              )}
              <div className="bg-white/70 border border-stone-200 rounded-xl px-4 py-4">
                <p className="text-base italic font-medium mb-3">{q.text}</p>
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const count = voterEntries.filter(([, v]) => v[q.id] === opt).length;
                    const pct = totalVoters > 0 ? Math.round((count / totalVoters) * 100) : 0;
                    const isSelected = correct === opt;
                    return (
                      <div key={opt}>
                        <button
                          onClick={() => setAnswer(q.id, opt)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'
                          }`}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          <span className="text-sm">{opt} {isSelected && '✓'}</span>
                          <span className={`text-xs ${isSelected ? 'text-emerald-100' : 'text-stone-400'}`}>{count} · {pct}%</span>
                        </button>
                        <div className="h-1 rounded-full bg-stone-100 mt-0.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isSelected ? 'bg-emerald-400' : 'bg-stone-300'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {correct && (
                  <p className="text-[10px] text-stone-400 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Tap the selected answer again to un-reveal it.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Voter list with remove */}
      {voterEntries.length > 0 && (
        <div>
          <Label>Voters · {voterEntries.length}</Label>
          <div className="space-y-1">
            {voterEntries.map(([key, v]) => (
              <div key={key} className="flex items-center justify-between px-3 py-2 bg-stone-50 border border-stone-100 rounded-lg">
                <span className="text-sm italic text-stone-700">{v.displayName}</span>
                <button
                  onClick={() => removeVoter(key)}
                  className="text-stone-300 hover:text-rose-500 transition p-1"
                  title="Remove this voter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GroupCard({
  group,
  position,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onStart,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}) {
  const [name, setName] = useState(group.name);
  const [members, setMembers] = useState(group.members.join(', '));

  useEffect(() => {
    setName(group.name);
    setMembers(group.members.join(', '));
  }, [group, isEditing]);

  if (isEditing) {
    return (
      <div className="p-4 bg-white border border-stone-300 rounded-xl">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full text-lg italic bg-transparent border-b border-stone-200 pb-1 mb-3 focus:outline-none focus:border-stone-700"
          placeholder="Group name"
        />
        <textarea
          value={members}
          onChange={(e) => setMembers(e.target.value)}
          className="w-full text-sm bg-transparent border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-stone-500 mb-3 resize-none"
          rows={2}
          placeholder="Names (comma or line separated)"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancelEdit}
            className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-900"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSaveEdit(name, members)}
            className="px-4 py-1.5 text-sm bg-stone-900 text-stone-50 hover:bg-stone-700 rounded-lg"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white/70 border border-stone-200 rounded-xl flex items-start gap-2 hover:bg-white transition group">
      <div className="flex flex-col gap-0.5 pt-0.5">
        <button
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="text-stone-300 hover:text-stone-700 disabled:opacity-20"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="text-stone-300 hover:text-stone-700 disabled:opacity-20"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className="text-xs text-stone-400"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            #{position}
          </span>
          <h4 className="text-lg italic font-medium truncate">{group.name}</h4>
        </div>
        {group.members.length > 0 && (
          <p
            className="text-xs text-stone-400 mt-0.5 leading-relaxed"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {group.members.join(' · ')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={onStart}
          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
          title="Call this group now"
        >
          <Play className="w-4 h-4" />
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AddGroupModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [members, setMembers] = useState('');

  return (
    <Modal onClose={onClose}>
      <h2 className="text-2xl italic mb-5">Add a Group</h2>
      <label
        className="block text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-1.5"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        Group Name
      </label>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && name.trim() && onAdd(name, members)}
        placeholder="e.g. Bride's Immediate Family"
        className="w-full text-xl italic bg-transparent border-b border-stone-300 pb-1.5 mb-5 focus:outline-none focus:border-stone-700"
      />
      <label
        className="block text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-1.5"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        Names{' '}
        <span className="opacity-50 normal-case tracking-normal">
          (optional · comma or line separated)
        </span>
      </label>
      <textarea
        value={members}
        onChange={(e) => setMembers(e.target.value)}
        rows={3}
        placeholder="Mom, Dad, Sister…"
        className="w-full text-sm bg-transparent border border-stone-200 rounded-lg p-3 focus:outline-none focus:border-stone-500 resize-none"
        style={{ fontFamily: 'Inter, sans-serif' }}
      />
      <div className="flex justify-end gap-2 mt-5">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-stone-500 hover:text-stone-900"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Cancel
        </button>
        <button
          onClick={() => name.trim() && onAdd(name, members)}
          disabled={!name.trim()}
          className="px-5 py-2 text-sm bg-stone-900 text-stone-50 hover:bg-stone-700 disabled:opacity-40 rounded-lg"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Add Group
        </button>
      </div>
    </Modal>
  );
}


function ShareLinksModal({ onClose }) {
  const base = window.location.href.split('#')[0];
  const [copied, setCopied] = useState(null);

  const copy = async (url, key) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
    } catch {
      setCopied(`${key}_err`);
    }
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-2xl italic mb-1">Share Links</h2>
      <p
        className="text-sm text-stone-500 mb-5"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        Send to guests or display on a venue screen.
      </p>

      {[
        {
          key: 'guest',
          label: 'Guest View',
          desc: 'Mobile-friendly, read-only queue for guests',
          url: base,
        },
        {
          key: 'display',
          label: 'Venue Display',
          desc: 'Large text for a TV or projector',
          url: `${base}#display`,
        },
        {
          key: 'bets',
          label: 'Wedding Bets',
          desc: 'Vote on wedding predictions',
          url: `${base}#bets`,
        },
        {
          key: 'leaderboard',
          label: 'Leaderboard',
          desc: 'Live scores as answers are revealed',
          url: `${base}#leaderboard`,
        },
      ].map(({ key, label, desc, url }) => (
        <div key={key} className="mb-3 p-4 border border-stone-200 rounded-xl bg-white/60">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className="text-sm font-medium"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {label}
            </span>
            <button
              onClick={() => copy(url, key)}
              className={`text-xs px-3 py-1 rounded-lg transition ${
                copied === key ? 'bg-emerald-600 text-white'
                : copied === `${key}_err` ? 'bg-red-500 text-white'
                : 'bg-stone-900 text-stone-50 hover:bg-stone-700'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {copied === key ? 'Copied!' : copied === `${key}_err` ? 'Failed' : 'Copy'}
            </button>
          </div>
          <p
            className="text-xs text-stone-400 mb-2"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {desc}
          </p>
          <code className="block text-xs text-stone-600 bg-stone-100 px-2 py-1 rounded-lg break-all">
            {url}
          </code>
        </div>
      ))}

      <div className="flex justify-end mt-5">
        <button
          onClick={onClose}
          className="px-5 py-2 text-sm bg-stone-900 text-stone-50 hover:bg-stone-700 rounded-lg"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Done
        </button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose }) {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-stone-950/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#faf6ee] border border-stone-200 rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-stone-400 hover:text-stone-900"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
