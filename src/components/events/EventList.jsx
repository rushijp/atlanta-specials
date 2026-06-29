import { useState, useEffect } from 'react';
import { useWedding } from '../../contexts/WeddingContext';
import { subscribeToEvents, addEvent, updateEvent, deleteEvent } from '../../services/eventService';
import { Button, Input, Modal, Badge } from '../ui';
import { Plus, Edit3, Trash2, Calendar, Clock, MapPin, Users, Sparkles, GripVertical } from 'lucide-react';
import { EVENT_TEMPLATES } from '../../config/constants';

// Subtle accent colors for each event type to give visual distinction
const EVENT_COLORS = {
  'Mehndi': { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Sangeet': { bg: 'bg-purple-50', border: 'border-purple-200', accent: 'text-purple-700', dot: 'bg-purple-500' },
  'Haldi': { bg: 'bg-yellow-50', border: 'border-yellow-200', accent: 'text-yellow-700', dot: 'bg-yellow-500' },
  'Garba': { bg: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-700', dot: 'bg-orange-500' },
  'Baraat': { bg: 'bg-red-50', border: 'border-red-200', accent: 'text-red-700', dot: 'bg-red-500' },
  'Wedding Ceremony': { bg: 'bg-wine-50', border: 'border-wine-200', accent: 'text-wine-700', dot: 'bg-wine-600' },
  'Reception': { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'text-blue-700', dot: 'bg-blue-500' },
  'Vidaai': { bg: 'bg-pink-50', border: 'border-pink-200', accent: 'text-pink-700', dot: 'bg-pink-500' },
};
const DEFAULT_COLOR = { bg: 'bg-gray-50', border: 'border-gray-200', accent: 'text-gray-700', dot: 'bg-gray-400' };

function getEventColor(name) {
  return EVENT_COLORS[name] || DEFAULT_COLOR;
}

export default function EventList() {
  const { activeWedding } = useWedding();
  const [events, setEvents] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [prefill, setPrefill] = useState(null);

  useEffect(() => {
    if (!activeWedding) return;
    return subscribeToEvents(activeWedding.id, setEvents);
  }, [activeWedding]);

  const handleDelete = async (eventId) => {
    if (!confirm('Delete this event? Guest assignments will be lost.')) return;
    try {
      await deleteEvent(activeWedding.id, eventId);
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert('Failed to delete event. Please try again.');
    }
  };

  if (!activeWedding) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold text-gray-900">Your Events</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {events.length === 0 ? 'Plan every celebration, from mehndi to reception.' : `${events.length} event${events.length !== 1 ? 's' : ''} planned`}
          </p>
        </div>
        {events.length > 0 && (
          <Button onClick={() => { setPrefill(null); setShowAdd(true); }} className="gap-1.5">
            <Plus size={16} /> Add Event
          </Button>
        )}
      </div>

      {/* Empty state */}
      {events.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-white to-ivory-100 p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-wine-50 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-wine-600" />
          </div>
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">Start building your timeline</h3>
          <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
            Indian weddings are multi-day celebrations. Add each event so you can manage guest lists, seating, and RSVPs separately.
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
            {EVENT_TEMPLATES.map((tmpl) => {
              const color = getEventColor(tmpl.name);
              return (
                <button
                  key={tmpl.name}
                  onClick={() => {
                    setEditing(null);
                    setPrefill({ name: tmpl.name, dressCode: tmpl.defaultDressCode });
                    setShowAdd(true);
                  }}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-all hover:shadow-sm hover:scale-[1.02] ${color.bg} ${color.border} ${color.accent}`}
                >
                  <span className={`w-2 h-2 rounded-full ${color.dot}`}></span>
                  {tmpl.name}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => { setPrefill(null); setShowAdd(true); }}
            className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            or create a custom event
          </button>
        </div>
      )}

      {/* Event cards — timeline style */}
      {events.length > 0 && (
        <div className="relative">
          {/* Timeline connector line */}
          {events.length > 1 && (
            <div className="absolute left-6 top-8 bottom-8 w-px bg-gray-200 hidden md:block"></div>
          )}

          <div className="space-y-4">
            {events.map((event, idx) => {
              const color = getEventColor(event.name);
              return (
                <div key={event.id} className={`relative rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-all ${color.border}`}>
                  {/* Timeline dot */}
                  {events.length > 1 && (
                    <div className={`absolute left-4 top-6 w-3 h-3 rounded-full ring-2 ring-white hidden md:block ${color.dot}`}></div>
                  )}

                  <div className="md:pl-8">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.bg}`}>
                          <span className={`text-lg font-display font-bold ${color.accent}`}>{idx + 1}</span>
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">{event.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            {event.inviteAll && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Users size={11} /> All guests
                              </span>
                            )}
                            {!event.inviteAll && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Users size={11} /> {(event.guestIds || []).length} invited
                              </span>
                            )}
                            {event.dressCode && (
                              <span className="text-xs text-gray-400">
                                &middot; {event.dressCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditing(event)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleDelete(event.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Details row */}
                    {(event.date || event.startTime || event.venue) && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 md:pl-13">
                        {event.date && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={13} className="text-gray-400" />
                            {new Date(event.date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {(event.startTime || event.endTime) && (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock size={13} className="text-gray-400" />
                            {event.startTime}{event.endTime ? ` \u2013 ${event.endTime}` : ''}
                          </span>
                        )}
                        {event.venue && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={13} className="text-gray-400" />
                            {event.venue}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form modal */}
      <EventFormModal
        open={showAdd || !!editing}
        onClose={() => { setShowAdd(false); setEditing(null); setPrefill(null); }}
        event={editing}
        prefill={prefill}
        weddingId={activeWedding.id}
        eventCount={events.length}
      />
    </div>
  );
}

function EventFormModal({ open, onClose, event, prefill, weddingId, eventCount }) {
  const isEdit = !!event;
  const [form, setForm] = useState({});

  useEffect(() => {
    if (event) {
      setForm({ ...event });
    } else if (prefill) {
      setForm({
        name: prefill.name || '', date: '', startTime: '', endTime: '',
        venue: '', address: '', dressCode: prefill.dressCode || '', description: '',
        inviteAll: true,
      });
    } else {
      setForm({
        name: '', date: '', startTime: '', endTime: '',
        venue: '', address: '', dressCode: '', description: '',
        inviteAll: true,
      });
    }
  }, [event, prefill, open]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEdit) {
      await updateEvent(weddingId, event.id, form);
    } else {
      await addEvent(weddingId, { ...form, order: eventCount });
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Event' : 'Add Event'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Pick</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {EVENT_TEMPLATES.map((t) => {
                const color = getEventColor(t.name);
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => { update('name', t.name); update('dressCode', t.defaultDressCode); }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      form.name === t.name
                        ? 'bg-wine-700 text-white shadow-sm'
                        : `${color.bg} ${color.accent} border ${color.border} hover:shadow-sm`
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Input label="Event Name" value={form.name || ''} onChange={(e) => update('name', e.target.value)} required placeholder="e.g. Sangeet Night" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date" type="date" value={form.date || ''} onChange={(e) => update('date', e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Start" type="time" value={form.startTime || ''} onChange={(e) => update('startTime', e.target.value)} />
            <Input label="End" type="time" value={form.endTime || ''} onChange={(e) => update('endTime', e.target.value)} />
          </div>
        </div>
        <Input label="Venue" value={form.venue || ''} onChange={(e) => update('venue', e.target.value)} placeholder="Hotel ballroom, garden, etc." />
        <Input label="Address" value={form.address || ''} onChange={(e) => update('address', e.target.value)} placeholder="Full address for guests" />
        <Input label="Dress Code" value={form.dressCode || ''} onChange={(e) => update('dressCode', e.target.value)} placeholder="e.g. Formal Indian Attire" />
        <Input label="Description (optional)" value={form.description || ''} onChange={(e) => update('description', e.target.value)} placeholder="Any details guests should know" />

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.inviteAll || false} onChange={(e) => update('inviteAll', e.target.checked)} className="rounded border-gray-300 text-wine-700 focus:ring-wine-500" />
          <span className="text-gray-700">Invite all guests to this event</span>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Save Changes' : 'Add Event'}</Button>
        </div>
      </form>
    </Modal>
  );
}
