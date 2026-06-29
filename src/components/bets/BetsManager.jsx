import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  BarChart3,
  Copy,
  Lock,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Trophy,
  Unlock,
  Users,
} from 'lucide-react';
import { db } from '../../firebase';
import { COLLECTIONS } from '../../config/constants';
import { useWedding } from '../../contexts/WeddingContext';
import { Badge, Button, Card, Modal } from '../ui';
import {
  calculateLeaderboard,
  DEFAULT_BETS_CONFIG,
  getBetsGuestLink,
  getBetsLeaderboardLink,
  lockVoting,
  POINTS_PER_QUESTION,
  saveBetsConfig,
  setCorrectAnswers,
  submitVote,
  subscribeToBets,
  subscribeToVotes,
  validateGuestName,
} from '../../services/betsService';

function getWeddingLabel(wedding) {
  return wedding?.coupleName || [wedding?.coupleName1, wedding?.coupleName2].filter(Boolean).join(' & ') || 'Wedding Bets';
}

function useWeddingPublicData(weddingId) {
  const [wedding, setWedding] = useState(null);

  useEffect(() => {
    if (!weddingId) {
      setWedding(null);
      return undefined;
    }

    return onSnapshot(doc(db, COLLECTIONS.WEDDINGS, weddingId), (snap) => {
      setWedding(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  }, [weddingId]);

  return wedding;
}

function useBetsData(weddingId) {
  const [betsConfig, setBetsConfig] = useState(DEFAULT_BETS_CONFIG);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!weddingId) {
      setBetsConfig(DEFAULT_BETS_CONFIG);
      setVotes([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribeBets = subscribeToBets(weddingId, (nextConfig) => {
      setBetsConfig(nextConfig);
      setLoading(false);
    });
    const unsubscribeVotes = subscribeToVotes(weddingId, (nextVotes) => {
      setVotes(nextVotes);
    });

    return () => {
      unsubscribeBets();
      unsubscribeVotes();
    };
  }, [weddingId]);

  return { betsConfig, votes, loading };
}

function groupBySection(questions) {
  return questions.reduce((sections, question) => {
    const section = question.section || 'General';
    if (!sections[section]) sections[section] = [];
    sections[section].push(question);
    return sections;
  }, {});
}

function QuestionFormModal({ open, question, onClose, onSave }) {
  const [section, setSection] = useState(question?.section || 'General');
  const [text, setText] = useState(question?.text || '');
  const [options, setOptions] = useState(question?.options?.join('\n') || '');

  useEffect(() => {
    setSection(question?.section || 'General');
    setText(question?.text || '');
    setOptions(question?.options?.join('\n') || '');
  }, [question]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextOptions = options.split('\n').map((option) => option.trim()).filter(Boolean);
    if (!text.trim() || nextOptions.length < 2) return;

    await onSave({
      ...question,
      section: section.trim() || 'General',
      text: text.trim(),
      options: nextOptions,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={question ? 'Edit question' : 'Add question'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Section</label>
          <input
            autoFocus
            value={section}
            onChange={(event) => setSection(event.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-wine-600 focus:outline-none focus:ring-1 focus:ring-wine-600"
            placeholder="Reception"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Question</label>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-wine-600 focus:outline-none focus:ring-1 focus:ring-wine-600"
            placeholder="Who starts dancing first?"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Options</label>
          <textarea
            value={options}
            onChange={(event) => setOptions(event.target.value)}
            rows={5}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-wine-600 focus:outline-none focus:ring-1 focus:ring-wine-600"
            placeholder={'Bride\nGroom\nBoth at once'}
          />
          <p className="mt-1 text-xs text-gray-500">Enter one option per line.</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">{question ? 'Save changes' : 'Add question'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ShareLinkCard({ title, description, url }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Unable to copy link', error);
    }
  };

  return (
    <div className="rounded-xl border border-wine-100 bg-wine-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
          <p className="mt-2 truncate text-xs text-wine-800">{url}</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleCopy}>
          <Copy size={14} />
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}

function AdminBetsManager({ wedding }) {
  const { betsConfig, votes, loading } = useBetsData(wedding?.id);
  const { canEdit, isViewer } = useWedding();
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const leaderboard = useMemo(
    () => calculateLeaderboard(betsConfig.questions, betsConfig.correctAnswers, votes),
    [betsConfig.correctAnswers, betsConfig.questions, votes]
  );
  const sections = useMemo(() => groupBySection(betsConfig.questions), [betsConfig.questions]);

  const guestLink = wedding?.id ? getBetsGuestLink(wedding.id) : '';
  const leaderboardLink = wedding?.id ? getBetsLeaderboardLink(wedding.id) : '';

  const persistQuestions = async (questions, nextCorrectAnswers = betsConfig.correctAnswers) => {
    await saveBetsConfig(wedding.id, {
      ...betsConfig,
      questions,
      correctAnswers: nextCorrectAnswers,
    });
  };

  const handleSaveQuestion = async (question) => {
    const nextQuestions = editingQuestion
      ? betsConfig.questions.map((existing) => existing.id === editingQuestion.id ? { ...existing, ...question } : existing)
      : [
          ...betsConfig.questions,
          {
            ...question,
            id: `question-${Date.now()}`,
            order: betsConfig.questions.length,
          },
        ];

    await persistQuestions(nextQuestions);
    setQuestionModalOpen(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = async (questionId) => {
    const nextQuestions = betsConfig.questions
      .filter((question) => question.id !== questionId)
      .map((question, index) => ({ ...question, order: index }));

    const nextCorrectAnswers = { ...betsConfig.correctAnswers };
    delete nextCorrectAnswers[questionId];

    await persistQuestions(nextQuestions, nextCorrectAnswers);
  };

  const handleCorrectAnswerChange = async (questionId, option) => {
    const nextCorrectAnswers = { ...betsConfig.correctAnswers };

    if (nextCorrectAnswers[questionId] === option) {
      delete nextCorrectAnswers[questionId];
    } else {
      nextCorrectAnswers[questionId] = option;
    }

    await setCorrectAnswers(wedding.id, nextCorrectAnswers);
  };

  if (!wedding) {
    return (
      <Card title="Bets & Games">
        <p className="text-sm text-gray-500">Select a wedding to manage bets and games.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bets & Games</h1>
          <p className="mt-1 text-sm text-gray-500">Create custom questions, collect live votes, and reveal answers in real time.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(guestLink, '_blank')}>
            <Users size={16} />
            Guest voting
          </Button>
          <Button variant="outline" onClick={() => window.open(leaderboardLink, '_blank')}>
            <BarChart3 size={16} />
            Leaderboard
          </Button>
          <Button onClick={() => { setEditingQuestion(null); setQuestionModalOpen(true); }} disabled={!canEdit}>
            <Plus size={16} />
            Add question
          </Button>
        </div>
      </div>

      {isViewer && (
        <Card>
          <p className="text-sm text-amber-700">You have viewer access. Live stats are visible, but editing is disabled.</p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-wine-100">
          <p className="text-sm text-gray-500">Questions</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{betsConfig.questions.length}</p>
        </Card>
        <Card className="border-wine-100">
          <p className="text-sm text-gray-500">Votes</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{votes.length}</p>
        </Card>
        <Card className="border-wine-100">
          <p className="text-sm text-gray-500">Answered</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{Object.keys(betsConfig.correctAnswers || {}).length}</p>
        </Card>
        <Card className="border-wine-100">
          <p className="text-sm text-gray-500">Voting</p>
          <div className="mt-3">
            <Button
              size="sm"
              variant={betsConfig.votingLocked ? 'danger' : 'primary'}
              onClick={() => lockVoting(wedding.id, !betsConfig.votingLocked)}
              disabled={!canEdit}
            >
              {betsConfig.votingLocked ? <Lock size={15} /> : <Unlock size={15} />}
              {betsConfig.votingLocked ? 'Locked' : 'Open'}
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card title="Questions" className="border-wine-100">
            {loading ? (
              <p className="text-sm text-gray-500">Loading questions…</p>
            ) : betsConfig.questions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="font-medium text-gray-900">No questions yet.</p>
                <p className="mt-1 text-sm text-gray-500">Add a few ceremony or reception questions to get the game started.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(sections).map(([section, questions]) => (
                  <div key={section}>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-wine-600">{section}</h2>
                      <Badge>{questions.length} questions</Badge>
                    </div>
                    <div className="space-y-3">
                      {questions.map((question) => (
                        <div key={question.id} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900">{question.text}</h3>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {question.options.map((option) => {
                                  const voteCount = votes.filter((vote) => vote.answers?.[question.id] === option).length;
                                  const isCorrect = betsConfig.correctAnswers?.[question.id] === option;

                                  return (
                                    <button
                                      key={option}
                                      type="button"
                                      onClick={() => handleCorrectAnswerChange(question.id, option)}
                                      disabled={!canEdit}
                                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                                        isCorrect
                                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                          : 'border-gray-200 bg-white text-gray-600 hover:border-wine-300 hover:text-wine-700'
                                      } disabled:cursor-not-allowed`}
                                    >
                                      {option} <span className="text-xs opacity-70">({voteCount})</span>
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="mt-3 text-xs text-gray-500">
                                {betsConfig.correctAnswers?.[question.id]
                                  ? `Correct answer: ${betsConfig.correctAnswers[question.id]}`
                                  : 'Tap an option to mark it correct after the event.'}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingQuestion(question);
                                  setQuestionModalOpen(true);
                                }}
                                disabled={!canEdit}
                              >
                                <Pencil size={15} />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteQuestion(question.id)} disabled={!canEdit} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                                <Trash2 size={15} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Shareable links" className="border-wine-100">
            <div className="space-y-3">
              <ShareLinkCard
                title="Guest voting page"
                description="Public voting form for guests—no login required."
                url={guestLink}
              />
              <ShareLinkCard
                title="Live leaderboard"
                description="Real-time scoreboard for TV screens, DJ booths, or MC devices."
                url={leaderboardLink}
              />
            </div>
          </Card>

          <Card title="Top players" className="border-wine-100">
            <div className="space-y-3">
              {leaderboard.slice(0, 5).map((entry, index) => (
                <div key={entry.id} className={`rounded-xl border px-4 py-3 ${index === 0 ? 'border-wine-200 bg-wine-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{entry.guestName}</p>
                      <p className="text-sm text-gray-500">{entry.correctCount}/{entry.totalAnswered} correct</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{entry.score}</p>
                      <p className="text-xs uppercase tracking-wide text-gray-400">pts</p>
                    </div>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && <p className="text-sm text-gray-500">No votes yet.</p>}
            </div>
          </Card>
        </div>
      </div>

      <QuestionFormModal
        open={questionModalOpen}
        question={editingQuestion}
        onClose={() => {
          setQuestionModalOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveQuestion}
      />
    </div>
  );
}

function GuestBetsView({ weddingId, leaderboardMode = false }) {
  const wedding = useWeddingPublicData(weddingId);
  const { betsConfig, votes, loading } = useBetsData(weddingId);
  const [guestName, setGuestName] = useState(() => localStorage.getItem(`bets-name-${weddingId}`) || '');
  const [nameError, setNameError] = useState('');
  const [activeName, setActiveName] = useState(() => localStorage.getItem(`bets-name-${weddingId}`) || '');
  const [answers, setAnswers] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeName) {
      setAnswers({});
      return;
    }

    const normalizedName = activeName.trim().toLowerCase().replace(/\s+/g, ' ');
    const existingVote = votes.find((vote) => vote.normalizedName === normalizedName);
    setAnswers(existingVote?.answers || {});
  }, [activeName, votes]);

  const leaderboard = useMemo(
    () => calculateLeaderboard(betsConfig.questions, betsConfig.correctAnswers, votes),
    [betsConfig.correctAnswers, betsConfig.questions, votes]
  );
  const myVote = useMemo(() => {
    if (!activeName) return null;
    const normalizedName = activeName.trim().toLowerCase().replace(/\s+/g, ' ');
    return votes.find((vote) => vote.normalizedName === normalizedName) || null;
  }, [activeName, votes]);
  const myStanding = useMemo(
    () => leaderboard.find((entry) => entry.guestName?.toLowerCase() === activeName.trim().toLowerCase()),
    [activeName, leaderboard]
  );
  const answeredCount = useMemo(
    () => betsConfig.questions.filter((question) => betsConfig.correctAnswers?.[question.id]).length,
    [betsConfig.correctAnswers, betsConfig.questions]
  );

  const handleNameStart = () => {
    const validationError = validateGuestName(guestName);
    setNameError(validationError);
    if (validationError) return;

    const cleanName = guestName.trim();
    localStorage.setItem(`bets-name-${weddingId}`, cleanName);
    setActiveName(cleanName);
    setSubmitError('');
  };

  const handleVoteSave = async () => {
    setSaving(true);
    setSubmitError('');

    try {
      await submitVote(weddingId, activeName, answers);
    } catch (error) {
      setSubmitError(error.message || 'Unable to save votes.');
    } finally {
      setSaving(false);
    }
  };

  if (leaderboardMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-rose-950 to-gray-950 text-white">
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-wine-100">
              <Sparkles size={16} className="animate-pulse" />
              Live leaderboard
            </div>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">{getWeddingLabel(wedding)}</h1>
            <p className="mt-3 text-sm text-wine-100/80">Scores update instantly as answers are revealed.</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Card className="border-white/10 bg-white/5 text-white">
              <p className="text-sm text-wine-100/70">Guests</p>
              <p className="mt-2 text-3xl font-bold">{votes.length}</p>
            </Card>
            <Card className="border-white/10 bg-white/5 text-white">
              <p className="text-sm text-wine-100/70">Answered</p>
              <p className="mt-2 text-3xl font-bold">{answeredCount}/{betsConfig.questions.length}</p>
            </Card>
            <Card className="border-white/10 bg-white/5 text-white">
              <p className="text-sm text-wine-100/70">Points each</p>
              <p className="mt-2 text-3xl font-bold">{POINTS_PER_QUESTION}</p>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-white/10 bg-white/5 text-white">
              <h2 className="text-xl font-semibold">Rankings</h2>
              <div className="mt-5 space-y-3">
                {leaderboard.map((entry, index) => {
                  const maxScore = Math.max(1, answeredCount * POINTS_PER_QUESTION);
                  const width = `${(entry.score / maxScore) * 100}%`;

                  return (
                    <div
                      key={entry.id}
                      className={`rounded-2xl border px-4 py-4 transition-transform ${
                        index === 0 ? 'animate-pulse border-wine-300/40 bg-wine-400/10' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${index === 0 ? 'bg-wine-400 text-white' : 'bg-white/10 text-wine-100'}`}>
                          {index === 0 ? '🏆' : `#${index + 1}`}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-lg font-semibold">{entry.guestName}</p>
                            <p className="text-lg font-bold text-wine-100">{entry.score} pts</p>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-white/10">
                            <div className="h-2 rounded-full bg-gradient-to-r from-wine-400 to-amber-300 transition-all duration-700" style={{ width }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {leaderboard.length === 0 && <p className="text-sm text-wine-100/70">Waiting for the first vote…</p>}
              </div>
            </Card>

            <Card className="border-white/10 bg-white/5 text-white">
              <h2 className="text-xl font-semibold">Revealed answers</h2>
              <div className="mt-5 space-y-4">
                {betsConfig.questions.filter((question) => betsConfig.correctAnswers?.[question.id]).map((question) => (
                  <div key={question.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm uppercase tracking-wide text-wine-100/70">{question.section}</p>
                    <p className="mt-2 font-semibold">{question.text}</p>
                    <p className="mt-3 text-sm text-emerald-300">✓ {betsConfig.correctAnswers[question.id]}</p>
                  </div>
                ))}
                {answeredCount === 0 && <p className="text-sm text-wine-100/70">Answers will appear here after the event starts.</p>}
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wine-50 via-white to-amber-50">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-wine-600">Wedding Bets</p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">{getWeddingLabel(wedding)}</h1>
          <p className="mt-3 text-sm text-gray-500">Cast your picks, then watch the leaderboard change live throughout the celebration.</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-wine-100">
            {loading ? (
              <p className="text-sm text-gray-500">Loading bets…</p>
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Your name</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={guestName}
                      onChange={(event) => {
                        setGuestName(event.target.value);
                        setNameError('');
                      }}
                      placeholder="First and last name"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-wine-600 focus:outline-none focus:ring-1 focus:ring-wine-600"
                    />
                    <Button onClick={handleNameStart}>Start voting</Button>
                  </div>
                  {nameError && <p className="mt-2 text-xs text-red-600">{nameError}</p>}
                  {activeName && !nameError && (
                    <p className="mt-2 text-xs text-gray-500">Voting as <span className="font-medium text-gray-700">{activeName}</span>.</p>
                  )}
                </div>

                {betsConfig.votingLocked && !myVote && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Voting is locked for new guests. You can still open the leaderboard to watch results live.
                  </div>
                )}

                {betsConfig.questions.length === 0 && (
                  <p className="text-sm text-gray-500">Questions have not been published yet.</p>
                )}

                {betsConfig.questions.length > 0 && activeName && (!betsConfig.votingLocked || myVote) && (
                  <>
                    <div className="space-y-5">
                      {Object.entries(groupBySection(betsConfig.questions)).map(([section, questions]) => (
                        <div key={section}>
                          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-wine-600">{section}</h2>
                          <div className="mt-3 space-y-3">
                            {questions.map((question) => {
                              const answerRevealed = Boolean(betsConfig.correctAnswers?.[question.id]);
                              const selectedOption = answers[question.id];
                              const isLocked = betsConfig.votingLocked || answerRevealed;

                              return (
                                <div key={question.id} className={`rounded-2xl border p-4 ${answerRevealed ? 'border-emerald-200 bg-emerald-50/60' : 'border-gray-200 bg-white'}`}>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-semibold text-gray-900">{question.text}</h3>
                                    {answerRevealed && <Badge variant="success">Revealed</Badge>}
                                  </div>
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {question.options.map((option) => {
                                      const isSelected = selectedOption === option;
                                      const isCorrect = betsConfig.correctAnswers?.[question.id] === option;

                                      return (
                                        <button
                                          key={option}
                                          type="button"
                                          onClick={() => !isLocked && setAnswers((current) => ({ ...current, [question.id]: option }))}
                                          disabled={isLocked}
                                          className={`rounded-full border px-4 py-2 text-sm transition ${
                                            isCorrect
                                              ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
                                              : isSelected
                                                ? 'border-wine-600 bg-wine-700 text-white'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-wine-300 hover:text-wine-700'
                                          } disabled:cursor-not-allowed`}
                                        >
                                          {option}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {answerRevealed && (
                                    <p className="mt-3 text-sm text-gray-600">
                                      Correct answer: <span className="font-medium text-emerald-700">{betsConfig.correctAnswers[question.id]}</span>
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-gray-500">{Object.keys(answers).length} of {betsConfig.questions.length} questions answered</p>
                      <Button onClick={handleVoteSave} disabled={saving || betsConfig.votingLocked}>
                        {saving ? 'Saving…' : 'Save my picks'}
                      </Button>
                    </div>
                    {betsConfig.votingLocked && myVote && (
                      <p className="text-sm text-gray-500">Voting is now locked, but your saved picks remain on the board.</p>
                    )}
                    {submitError && <p className="text-sm text-red-600">{submitError}</p>}
                  </>
                )}
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card title="Live stats" className="border-wine-100">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Guests playing</span>
                  <span className="text-lg font-bold text-gray-900">{votes.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Answers revealed</span>
                  <span className="text-lg font-bold text-gray-900">{answeredCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Voting status</span>
                  <Badge variant={betsConfig.votingLocked ? 'danger' : 'rose'}>
                    {betsConfig.votingLocked ? 'Locked' : 'Open'}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card title="Your standing" className="border-wine-100">
              {myStanding ? (
                <div>
                  <div className="flex items-center gap-2 text-wine-700">
                    <Trophy size={18} />
                    <span className="font-medium">Live score</span>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-gray-900">{myStanding.score} pts</p>
                  <p className="mt-1 text-sm text-gray-500">{myStanding.correctCount}/{myStanding.totalAnswered} correct so far</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Save your picks to join the live standings.</p>
              )}
            </Card>

            <Card title="Leaderboard preview" className="border-wine-100">
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div key={entry.id} className={`rounded-xl border px-4 py-3 ${index === 0 ? 'border-wine-200 bg-wine-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-900">{index === 0 ? '🏆 ' : `#${index + 1} `}{entry.guestName}</p>
                      <p className="font-semibold text-gray-900">{entry.score}</p>
                    </div>
                  </div>
                ))}
                {leaderboard.length === 0 && <p className="text-sm text-gray-500">Leaderboard will appear once guests vote.</p>}
                <Button variant="outline" className="w-full" onClick={() => window.location.assign(getBetsLeaderboardLink(weddingId))}>
                  View full leaderboard
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BetsManager() {
  const { activeWedding } = useWedding();
  return <AdminBetsManager wedding={activeWedding} />;
}

export function PublicBetsManager() {
  const { weddingId } = useParams();
  return <GuestBetsView weddingId={weddingId} />;
}

export function BetsLeaderboardView() {
  const { weddingId } = useParams();
  return <GuestBetsView weddingId={weddingId} leaderboardMode />;
}
