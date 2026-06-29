import { useState, useEffect } from 'react';
import { useWedding } from '../../contexts/WeddingContext';
import { subscribeToEvents, addEvent, updateEvent, deleteEvent } from '../../services/eventService';
import { Button, Input, Modal, Badge } from '../ui';
import { Plus, Edit3, Trash2, Calendar, Clock, MapPin } from 'lucide-react';
import { EVENT_TEMPLATES } from '../../config/constants';

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
    await deleteEvent(activeWedding.id, eventId);
  };

  if (!activeWedding) return null;

  return (
    <div className="space-y-6">
      {/* Quick-add templates */}
      {events.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add your wedding events</h3>
          <p className="text-sm text-gray-500 mb-6">Choose from common Indian wedding events or create your own.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EVENT_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                onClick={() => {
                  setEditing(null);
                  setPrefill({ name: tmpl.name, dressCode: tmpl.defaultDressCode });
                  setShowAdd(true);
                }}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-colors"
              >
                <span>{tmpl.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Event cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((event) => (
          <div key={event.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                {event.inviteAll && <Badge variant="success" className="mt-1">All Guests</Badge>}
                {!event.inviteAll && <Badge variant="info" className="mt-1">{(event.guestIds || []).length} Invited</Badge>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(event)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDelete(event.id)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-sm text-gray-600">
              {event.date && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  {event.date}
                </div>
              )}
              {(event.startTime || event.endTime) && (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  {event.startTime}{event.endTime ? ` – ${event.endTime}` : ''}
                </div>
              )}
              {event.venue && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  {event.venue}
                </div>
              )}
              {event.dressCode && (
                <div className="text-xs text-gray-400">Dress code: {event.dressCode}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add button */}
      {events.length > 0 && (
        <Button onClick={() => { setPrefill(null); setShowAdd(true); }}><Plus size={16} /> Add Event</Button>
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
              {EVENT_TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => { update('name', t.name); update('dressCode', t.defaultDressCode); }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    form.name === t.name ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t.name}
                </button>
              ))}
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
        <Input label="Venue" value={form.venue || ''} onChange={(e) => update('venue', e.target.value)} />
        <Input label="Address" value={form.address || ''} onChange={(e) => update('address', e.target.value)} />
        <Input label="Dress Code" value={form.dressCode || ''} onChange={(e) => update('dressCode', e.target.value)} />
        <Input label="Description" value={form.description || ''} onChange={(e) => update('description', e.target.value)} />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.inviteAll || false} onChange={(e) => update('inviteAll', e.target.checked)} className="rounded" />
          Invite all guests to this event
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Save' : 'Add Event'}</Button>
        </div>
      </form>
    </Modal>
  );
}
