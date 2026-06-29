import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { subscribeToEvents } from '../services/eventService';
import { subscribeToWebsite } from '../services/websiteService';
import WeddingWebsitePreview from '../components/website/WeddingWebsitePreview';
import { getCoupleDisplayName, normalizeWebsiteConfig } from '../components/website/websiteThemes';

function CenteredState({ title, message, error = false }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-wine-50 via-white to-amber-50 px-4">
      <div className="max-w-md rounded-[2rem] border border-white/60 bg-white/90 px-8 py-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${error ? 'bg-red-100 text-red-600' : 'bg-wine-100 text-wine-700'}`}>
          <Heart size={24} />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-gray-500">{message}</p>
      </div>
    </div>
  );
}

export default function PublicWeddingWebsite() {
  const { weddingId } = useParams();
  const [wedding, setWedding] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!weddingId) return undefined;

    let loadedWedding = false;
    const unsubscribeWebsite = subscribeToWebsite(weddingId, (data) => {
      loadedWedding = true;
      if (!data) {
        setNotFound(true);
        setWedding(null);
      } else {
        setNotFound(false);
        setWedding(data);
      }
      setLoading(false);
    });

    const unsubscribeEvents = subscribeToEvents(weddingId, setEvents);

    return () => {
      if (!loadedWedding) setLoading(false);
      unsubscribeWebsite();
      unsubscribeEvents();
    };
  }, [weddingId]);

  if (loading) {
    return <CenteredState title="Loading wedding website" message="Gathering all the celebration details for you..." />;
  }

  if (notFound || !wedding) {
    return <CenteredState title="Wedding website not found" message="This link may be incorrect, expired, or not available yet." error />;
  }

  const config = normalizeWebsiteConfig(wedding, events.map((event) => event.id));
  const coupleName = getCoupleDisplayName(wedding);

  if (!config.websitePublished) {
    return (
      <CenteredState
        title={`${coupleName} wedding website`}
        message="This wedding website is still being prepared. Please check back soon for celebration details and RSVP access."
      />
    );
  }

  return <WeddingWebsitePreview wedding={wedding} config={config} events={events} />;
}
