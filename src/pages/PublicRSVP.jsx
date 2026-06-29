import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  getPublicWeddingData,
  submitRsvpResponse,
} from '../services/rsvpService';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, DIETARY_OPTIONS, APP_NAME } from '../config/constants';
import { Search, Check, X, ChevronRight, Heart, Users } from 'lucide-react';

export default function PublicRSVP() {
  const { weddingId } = useParams();
  const [weddingData, setWeddingData] = useState(null);
  const [allGuests, setAllGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Flow states
  const [step, setStep] = useState('search'); // search → family → done
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState([]);
  const [eventResponses, setEventResponses] = useState({});
  const [dietaryChoices, setDietaryChoices] = useState({});
  const [message, setMessage] = useState('');
  const [respondentName, setRespondentName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPublicWeddingData(weddingId);
        if (!data) { setError('Wedding not found'); setLoading(false); return; }
        setWeddingData(data);
        const guestsSnap = await getDocs(
          collection(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.GUESTS)
        );
        setAllGuests(guestsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        setError('Unable to load wedding details');
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [weddingId]);

  // Search — match by name/phone/family, then group by family
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, '');

    const matches = allGuests.filter((g) => {
      const full = `${g.firstName} ${g.lastName}`.toLowerCase();
      const phone = (g.phone || '').replace(/\D/g, '');
      return full.includes(q) || q.includes(full)
        || (g.familyName && g.familyName.toLowerCase().includes(q))
        || (qDigits.length >= 4 && phone.includes(qDigits));
    });

    setSearchResults(matches);
  };

  // Select a guest → pull whole family
  const handleSelectGuest = (guest) => {
    let family = guest.familyName
      ? allGuests.filter((g) => g.familyName === guest.familyName)
      : [guest];

    // Sort: adults first, then alphabetical
    family.sort((a, b) => {
      const aKid = (a.tags || []).includes('Kids') ? 1 : 0;
      const bKid = (b.tags || []).includes('Kids') ? 1 : 0;
      return aKid !== bKid ? aKid - bKid : a.firstName.localeCompare(b.firstName);
    });

    setSelectedFamily(family);
    setRespondentName(`${guest.firstName} ${guest.lastName}`);

    // Pre-fill existing data
    const responses = {};
    const dietary = {};
    family.forEach((g) => {
      responses[g.id] = { ...(g.rsvpStatus || {}) };
      dietary[g.id] = g.dietary || 'vegetarian';
    });
    setEventResponses(responses);
    setDietaryChoices(dietary);
    setStep('family');
  };

  // Toggle a single guest+event
  const toggleRsvp = (guestId, eventId, status) => {
    setEventResponses((prev) => ({
      ...prev,
      [guestId]: {
        ...(prev[guestId] || {}),
        [eventId]: (prev[guestId] || {})[eventId] === status ? null : status,
      },
    }));
  };

  // Accept/decline all events for a guest
  const setAllEvents = (guestId, status) => {
    const evts = getEventsForGuest(guestId);
    const responses = {};
    evts.forEach((evt) => { responses[evt.id] = status; });
    setEventResponses((prev) => ({ ...prev, [guestId]: responses }));
  };

  // Only show events a guest is invited to (like WithJoy)
  const getEventsForGuest = (guestId) => {
    return (weddingData?.events || []).filter((evt) => {
      if (evt.inviteAll) return true;
      return (evt.guestIds || []).includes(guestId);
    });
  };

  // Submit
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      for (const guest of selectedFamily) {
        await submitRsvpResponse(weddingId, {
          guestId: guest.id,
          familyName: guest.familyName || '',
          respondentName,
          phone: guest.phone || '',
          email: guest.email || '',
          eventResponses: eventResponses[guest.id] || {},
          dietary: dietaryChoices[guest.id] || 'vegetarian',
          message,
          method: 'web',
        });

        // Update guest doc directly
        await updateDoc(
          doc(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.GUESTS, guest.id),
          {
            rsvpStatus: eventResponses[guest.id] || {},
            dietary: dietaryChoices[guest.id] || guest.dietary,
            rsvpMethod: 'web',
          }
        );
      }
      setStep('done');
    } catch (err) {
      console.error('RSVP submit error:', err);
      setError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  const events = weddingData?.events || [];
  const wedding = weddingData?.wedding || {};
  const settings = weddingData?.rsvpSettings || {};

  // ─── Loading / Error / Closed states ─────────────────────────────
  if (loading) {
    return <CenteredPage><div className="animate-pulse text-wine-700 text-lg">Loading...</div></CenteredPage>;
  }
  if (error && !weddingData) {
    return <CenteredPage><p className="text-red-600 text-lg mb-2">{error}</p><p className="text-gray-500 text-sm">This link may be invalid or expired.</p></CenteredPage>;
  }
  if (settings.isOpen === false) {
    return (
      <CenteredPage>
        <Heart className="mx-auto text-wine-400 mb-4" size={48} />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{wedding.coupleName}</h1>
        <p className="text-gray-600">RSVPs are currently closed.</p>
      </CenteredPage>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wine-50 via-white to-amber-50">
      {/* Header */}
      <header className="text-center pt-10 pb-6 px-4">
        <div className="w-12 h-12 rounded-full bg-wine-100 text-wine-700 flex items-center justify-center mx-auto mb-3">
          <Heart size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{wedding.coupleName || 'Wedding RSVP'}</h1>
        {settings.customMessage && (
          <p className="text-gray-600 mt-2 max-w-lg mx-auto leading-relaxed">{settings.customMessage}</p>
        )}
        {settings.deadline && (
          <p className="text-sm text-wine-700 mt-2 font-medium">
            Please respond by {new Date(settings.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </header>

      <main className="max-w-xl mx-auto px-4 pb-20">
        {/* ── STEP: Search ──────────────────────────────────────────── */}
        {step === 'search' && (
          <RsvpCard>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Find Your Invitation</h2>
            <p className="text-sm text-gray-500 mb-5">
              Search for any family member — we'll pull up your whole household.
            </p>

            <div className="flex gap-2 mb-5">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="First name, last name, or phone..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-wine-600 focus:ring-2 focus:ring-wine-100 transition-all"
                  autoFocus
                />
              </div>
              <button onClick={handleSearch} className="px-5 py-3 bg-wine-700 text-white rounded-xl text-sm font-medium hover:bg-wine-800 transition-colors flex-shrink-0">
                Search
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Select your household</p>
                {groupByFamily(searchResults, allGuests).map(({ familyName, members }) => (
                  <button
                    key={(familyName || '') + members[0].id}
                    onClick={() => handleSelectGuest(members[0])}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-wine-50 hover:border-wine-300 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-wine-100 text-wine-700 flex items-center justify-center flex-shrink-0">
                      {members.length > 1 ? <Users size={18} /> : <span className="text-sm font-bold">{members[0].firstName[0]}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {familyName ? `The ${familyName} Family` : `${members[0].firstName} ${members[0].lastName}`}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {members.map((m) => `${m.firstName} ${m.lastName}`).join(', ')}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchQuery.trim().length > 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-1">We couldn't find that name.</p>
                <p className="text-xs text-gray-400">Try the exact name from your invitation, or contact the couple.</p>
              </div>
            )}
          </RsvpCard>
        )}

        {/* ── STEP: Family RSVP (card per person, like Joy/Zola) ──── */}
        {step === 'family' && (
          <div className="space-y-4">
            {/* Back button */}
            <button
              onClick={() => { setStep('search'); setSearchResults([]); setSearchQuery(''); }}
              className="text-sm text-wine-700 hover:text-wine-800 font-medium"
            >
              ← Search again
            </button>

            {/* Greeting */}
            <RsvpCard>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedFamily[0]?.familyName
                  ? `Welcome, ${selectedFamily[0].familyName} Family! 🎉`
                  : `Welcome, ${selectedFamily[0]?.firstName}! 🎉`
                }
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedFamily.length > 1
                  ? `RSVP for each person below. They may be invited to different events.`
                  : `Let us know which events you'll be attending.`
                }
              </p>
            </RsvpCard>

            {/* One card per family member */}
            {selectedFamily.map((guest) => {
              const guestEvents = getEventsForGuest(guest.id);
              const responses = eventResponses[guest.id] || {};
              const allAccepted = guestEvents.length > 0 && guestEvents.every((e) => responses[e.id] === 'accepted');
              const allDeclined = guestEvents.length > 0 && guestEvents.every((e) => responses[e.id] === 'declined');

              return (
                <RsvpCard key={guest.id}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {guest.firstName} {guest.lastName}
                      </h3>
                      {(guest.tags || []).includes('Kids') && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">Child</span>
                      )}
                    </div>
                    {/* Quick accept/decline all */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => setAllEvents(guest.id, 'accepted')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          allAccepted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        Accept All
                      </button>
                      <button
                        onClick={() => setAllEvents(guest.id, 'declined')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          allDeclined ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700'
                        }`}
                      >
                        Decline All
                      </button>
                    </div>
                  </div>

                  {/* Events this guest is invited to */}
                  <div className="space-y-2">
                    {guestEvents.map((evt) => {
                      const s = responses[evt.id];
                      return (
                        <div key={evt.id} className="flex items-center gap-3 py-2 border-t border-gray-100 first:border-0">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800">{evt.name}</div>
                            <div className="text-xs text-gray-400">
                              {[evt.date && formatDate(evt.date), evt.startTime, evt.venue].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => toggleRsvp(guest.id, evt.id, 'accepted')}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                s === 'accepted'
                                  ? 'bg-green-500 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-700'
                              }`}
                            >
                              <Check size={12} /> Yes
                            </button>
                            <button
                              onClick={() => toggleRsvp(guest.id, evt.id, 'declined')}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                s === 'declined'
                                  ? 'bg-red-500 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-700'
                              }`}
                            >
                              <X size={12} /> No
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dietary — only show if guest accepted at least one event */}
                  {settings.allowDietary !== false && guestEvents.some((e) => responses[e.id] === 'accepted') && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <label className="text-xs font-medium text-gray-500 block mb-1">Dietary Preference</label>
                      <select
                        value={dietaryChoices[guest.id] || 'vegetarian'}
                        onChange={(e) => setDietaryChoices((prev) => ({ ...prev, [guest.id]: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-wine-600"
                      >
                        {DIETARY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </RsvpCard>
              );
            })}

            {/* Message */}
            {settings.allowMessage !== false && (
              <RsvpCard>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Leave a message for the couple (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Congratulations! We can't wait to celebrate with you..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-wine-600 focus:ring-2 focus:ring-wine-100"
                />
              </RsvpCard>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 bg-wine-700 text-white rounded-2xl font-semibold hover:bg-wine-800 transition-colors disabled:opacity-50 shadow-sm"
            >
              {submitting ? 'Submitting...' : 'Submit RSVP'}
            </button>
          </div>
        )}

        {/* ── STEP: Done ────────────────────────────────────────────── */}
        {step === 'done' && (
          <RsvpCard className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
              <Check size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              Your RSVP has been submitted
              {selectedFamily[0]?.familyName
                ? ` for the ${selectedFamily[0].familyName} family`
                : ` for ${selectedFamily[0]?.firstName}`
              }.
            </p>

            {/* Summary */}
            <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 space-y-1">
              {selectedFamily.map((guest) => {
                const responses = eventResponses[guest.id] || {};
                const accepted = Object.entries(responses)
                  .filter(([, s]) => s === 'accepted')
                  .map(([eid]) => events.find((e) => e.id === eid)?.name)
                  .filter(Boolean);
                return (
                  <div key={guest.id} className="flex items-baseline gap-2 py-0.5">
                    <span className="text-sm font-medium text-gray-800 w-28 truncate">{guest.firstName}</span>
                    <span className="text-sm text-gray-500">
                      {accepted.length > 0 ? accepted.join(', ') : 'Not attending any events'}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => { setStep('search'); setSearchQuery(''); setSearchResults([]); setSelectedFamily([]); setMessage(''); }}
              className="text-sm text-wine-700 hover:text-wine-800 font-medium"
            >
              RSVP for another family →
            </button>
          </RsvpCard>
        )}
      </main>

      <footer className="text-center pb-6 text-xs text-gray-400">
        Powered by <span className="font-medium text-gray-500">{APP_NAME}</span>
      </footer>
    </div>
  );
}

// ─── Reusable components ────────────────────────────────────────────────────

function CenteredPage({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wine-50 to-amber-50 px-4">
      <div className="text-center max-w-md">{children}</div>
    </div>
  );
}

function RsvpCard({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {children}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function groupByFamily(matches, allGuests) {
  const families = {};
  matches.forEach((g) => {
    if (!g.familyName) {
      families[`__solo_${g.id}`] = { familyName: null, members: [g] };
      return;
    }

    const key = g.familyName;
    if (!families[key]) {
      const members = allGuests
        .filter((ag) => ag.familyName === g.familyName)
        .sort((a, b) => a.firstName.localeCompare(b.firstName));
      families[key] = { familyName: g.familyName, members };
    }
  });
  return Object.values(families);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}
