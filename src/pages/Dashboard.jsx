import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWedding } from '../contexts/WeddingContext';
import { Button, Card, Modal, Input } from '../components/ui';
import { Plus, Users, Calendar, Grid3X3, Mail } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, EVENT_TEMPLATES } from '../config/constants';
import { subscribeToGuests } from '../services/guestService';
import { subscribeToEvents } from '../services/eventService';
import { subscribeToSeating } from '../services/seatingService';

export default function Dashboard() {
  const { user } = useAuth();
  const { activeWedding, weddings, loading } = useWedding();
  const [showCreate, setShowCreate] = useState(false);
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeWedding) return;
    const unsub1 = subscribeToGuests(activeWedding.id, setGuests);
    const unsub2 = subscribeToEvents(activeWedding.id, setEvents);
    return () => { unsub1(); unsub2(); };
  }, [activeWedding]);

  const guestCount = guests.length;
  const eventCount = events.length;
  const seatedCount = guests.filter((g) => g.tableNumber != null).length;
  const rsvpRate = guestCount > 0
    ? Math.round(guests.filter((g) => {
        const statuses = Object.values(g.rsvpStatus || {});
        return statuses.some((s) => s === 'accepted' || s === 'declined');
      }).length / guestCount * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-wine-700 border-t-transparent" />
      </div>
    );
  }

  if (!activeWedding) {
    return <CreateWeddingPrompt onOpen={() => setShowCreate(true)} showModal={showCreate} onClose={() => setShowCreate(false)} />;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-gray-900">
          {activeWedding.coupleName1} & {activeWedding.coupleName2}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Your wedding at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <QuickStat icon={Users} label="Guests" value={guestCount} to="/guests" />
        <QuickStat icon={Calendar} label="Events" value={eventCount} to="/events" />
        <QuickStat icon={Grid3X3} label="Seated" value={seatedCount} to="/seating" />
        <QuickStat icon={Mail} label="RSVP Rate" value={`${rsvpRate}%`} to="/rsvp" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Jump to">
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/guests')}>
              <Users size={18} /> Guest List
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/events')}>
              <Calendar size={18} /> Events
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/seating')}>
              <Grid3X3 size={18} /> Seating Chart
            </Button>
          </div>
        </Card>

        <Card title="Setup checklist">
          <div className="space-y-3">
            <ChecklistItem done={eventCount > 0} label="Add your events (Mehndi, Sangeet, Ceremony, etc.)" />
            <ChecklistItem done={guestCount > 0} label="Import or add your guest list" />
            <ChecklistItem done={guestCount > 0 && events.some((e) => !e.inviteAll && (e.guestIds || []).length > 0)} label="Assign guests to events" />
            <ChecklistItem done={seatedCount > 0} label="Arrange seating for at least one event" />
            <ChecklistItem done={activeWedding.settings?.rsvpOpen === true} label="Open RSVPs for guests" />
          </div>
        </Card>
      </div>

      <CreateWeddingModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, to }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="group flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-card hover:shadow-lifted hover:-translate-y-0.5 transition-all duration-200 text-left"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-wine-50 to-phera-50 group-hover:from-wine-100 group-hover:to-phera-100 transition-colors">
        <Icon size={20} className="text-wine-700" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </button>
  );
}

function ChecklistItem({ done, label }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${done ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
        {done && <span className="text-white text-xs">✓</span>}
      </div>
      <span className={`text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{label}</span>
    </div>
  );
}

function CreateWeddingPrompt({ onOpen, showModal, onClose }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-wine-100 to-phera-100">
        <Calendar size={28} className="text-wine-700" />
      </div>
      <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Let's get started</h2>
      <p className="text-gray-500 mb-6 max-w-md">
        Create your wedding to start managing guests, events, seating, and RSVPs in one place.
      </p>
      <Button onClick={onOpen}>
        <Plus size={18} /> Create Wedding
      </Button>
      <CreateWeddingModal open={showModal} onClose={onClose} />
    </div>
  );
}

function CreateWeddingModal({ open, onClose }) {
  const { user } = useAuth();
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const slug = `${name1}-and-${name2}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await addDoc(collection(db, COLLECTIONS.WEDDINGS), {
        ownerId: user.uid,
        coupleName1: name1,
        coupleName2: name2,
        weddingDate: date || null,
        slug,
        settings: { rsvpOpen: false, publicWebsite: false, theme: 'classic' },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to create wedding:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Wedding">
      <form onSubmit={handleCreate} className="space-y-4">
        <Input label="Partner 1 Name" value={name1} onChange={(e) => setName1(e.target.value)} placeholder="Brijal" required />
        <Input label="Partner 2 Name" value={name2} onChange={(e) => setName2(e.target.value)} placeholder="Rushi" required />
        <Input label="Wedding Date (optional)" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Wedding'}</Button>
        </div>
      </form>
    </Modal>
  );
}
