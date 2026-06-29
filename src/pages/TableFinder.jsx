import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Heart, MapPin, Search, Users } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button, Input } from '../components/ui';
import { COLLECTIONS, APP_NAME } from '../config/constants';
import { db } from '../firebase';
import { getGuestTable } from '../services/seatingService';
import { getWedding } from '../services/weddingService';

export default function TableFinder() {
  const { weddingId, eventId } = useParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [wedding, setWedding] = useState(null);
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadPageMeta() {
      try {
        const [weddingData, eventsSnapshot] = await Promise.all([
          getWedding(weddingId),
          getDocs(collection(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.EVENTS)),
        ]);

        if (!mounted) return;

        setWedding(weddingData);
        const matchingEvent = eventsSnapshot.docs
          .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
          .find((event) => event.id === eventId);
        setEventName(matchingEvent?.name || '');
      } catch (err) {
        console.error('Unable to load table finder details', err);
        if (mounted) setError('We could not load this seating chart right now.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPageMeta();
    return () => { mounted = false; };
  }, [eventId, weddingId]);

  const coupleName = useMemo(() => {
    if (!wedding) return 'Phera';
    if (wedding.coupleName) return wedding.coupleName;
    return [wedding.coupleName1, wedding.coupleName2].filter(Boolean).join(' & ') || APP_NAME;
  }, [wedding]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    setError('');

    try {
      const matches = await getGuestTable(weddingId, eventId, query);
      setResults(matches);
    } catch (err) {
      console.error('Table finder search failed', err);
      setError('We could not search the seating chart. Please try again.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="rounded-[2rem] border border-white/70 bg-white/90 px-8 py-12 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full bg-wine-100" />
          <p className="text-sm font-medium text-wine-700">Loading seating details...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-wine-100 text-wine-700 shadow-sm">
            <MapPin size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Find your table</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Search your first name, last name, or full name to see where you are seated{eventName ? ` for ${eventName}` : ''}.
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-wine-600">{coupleName}</p>
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                placeholder="Enter your first or last name"
                className="py-3 text-base"
                autoFocus
              />
            </div>
            <Button size="lg" onClick={handleSearch} disabled={searching || !query.trim()} className="sm:px-8">
              <Search size={16} />
              {searching ? 'Searching...' : 'Find Table'}
            </Button>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {results.length > 0 && (
            <div className="mt-6 space-y-4">
              {results.map((result) => (
                <div key={result.guest.id} className="overflow-hidden rounded-[1.75rem] border border-wine-100 bg-gradient-to-br from-wine-50 to-white">
                  <div className="px-5 py-6 sm:px-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-wine-600">{result.guest.firstName} {result.guest.lastName}</p>
                    <h2 className="mt-2 text-3xl font-bold text-gray-900">
                      You&apos;re at <span className="text-wine-700">{result.table.name}</span>!
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      {eventName ? `For ${eventName}, ` : ''}head to {result.table.name} and look for your place setting.
                    </p>

                    <div className="mt-5 rounded-2xl border border-white/70 bg-white/80 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Users size={16} className="text-wine-600" />
                        Tablemates
                      </div>
                      {result.tablemates.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {result.tablemates.map((guest) => (
                            <span key={guest.id} className="rounded-full bg-wine-100 px-3 py-1 text-sm font-medium text-wine-800">
                              {guest.firstName} {guest.lastName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-gray-500">You have the table all to yourself right now.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searched && !searching && results.length === 0 && !error && (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
              <Heart className="mx-auto mb-3 text-wine-300" size={28} />
              <h2 className="text-lg font-semibold text-gray-900">We couldn&apos;t find a table yet</h2>
              <p className="mt-2 text-sm text-gray-500">
                Try your full name, a different spelling, or check with the couple if you&apos;re unsure.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,207,232,0.45),_transparent_32%),linear-gradient(135deg,#fff1f2_0%,#ffffff_45%,#fff7ed_100%)] px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        {children}
      </div>
    </div>
  );
}
