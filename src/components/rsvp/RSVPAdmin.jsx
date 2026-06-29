import { useState, useEffect, useMemo } from 'react';
import { useWedding } from '../../contexts/WeddingContext';
import { subscribeToGuests, updateGuest } from '../../services/guestService';
import { subscribeToEvents } from '../../services/eventService';
import {
  saveRsvpSettings,
  subscribeToRsvpSettings,
  subscribeToResponses,
  getRsvpLink,
  getWhatsAppRsvpLink,
} from '../../services/rsvpService';
import { Button, Modal, Input, Badge, Card } from '../ui';
import { RSVP_STATUS, DIETARY_OPTIONS } from '../../config/constants';
import {
  Copy, ExternalLink, Share2, Check, X, Clock, Users, Mail,
  MessageCircle, Link2, ChevronDown, Filter, Download,
} from 'lucide-react';

export default function RSVPAdmin() {
  const { activeWedding } = useWedding();
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [responses, setResponses] = useState([]);
  const [rsvpSettings, setRsvpSettings] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!activeWedding) return;
    const unsub1 = subscribeToGuests(activeWedding.id, setGuests);
    const unsub2 = subscribeToEvents(activeWedding.id, setEvents);
    const unsub3 = subscribeToRsvpSettings(activeWedding.id, setRsvpSettings);
    const unsub4 = subscribeToResponses(activeWedding.id, setResponses);
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [activeWedding]);

  // Compute RSVP stats
  const stats = useMemo(() => {
    const result = { total: guests.length, accepted: 0, declined: 0, pending: 0, noResponse: 0 };
    
    guests.forEach((g) => {
      const rsvp = g.rsvpStatus || {};
      if (selectedEvent === 'all') {
        // Overall: accepted if accepted to ANY event
        const statuses = Object.values(rsvp);
        if (statuses.length === 0) result.noResponse++;
        else if (statuses.includes('accepted')) result.accepted++;
        else if (statuses.every((s) => s === 'declined')) result.declined++;
        else result.pending++;
      } else {
        const s = rsvp[selectedEvent];
        if (!s) result.noResponse++;
        else if (s === 'accepted') result.accepted++;
        else if (s === 'declined') result.declined++;
        else result.pending++;
      }
    });
    return result;
  }, [guests, selectedEvent]);

  // Filter guests
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      // Search
      if (search) {
        const name = `${g.firstName} ${g.lastName} ${g.familyName}`.toLowerCase();
        if (!name.includes(search.toLowerCase())) return false;
      }

      // Status filter
      if (filterStatus !== 'all') {
        const rsvp = g.rsvpStatus || {};
        const status = selectedEvent === 'all'
          ? (Object.values(rsvp).length === 0 ? 'none' : Object.values(rsvp).includes('accepted') ? 'accepted' : Object.values(rsvp).every((s) => s === 'declined') ? 'declined' : 'pending')
          : (rsvp[selectedEvent] || 'none');
        if (filterStatus === 'no-response' && status !== 'none') return false;
        if (filterStatus !== 'no-response' && status !== filterStatus) return false;
      }

      return true;
    });
  }, [guests, search, filterStatus, selectedEvent]);

  // Update a guest's RSVP for an event
  const handleSetRsvp = async (guestId, eventId, status) => {
    const guest = guests.find((g) => g.id === guestId);
    if (!guest) return;
    const rsvpStatus = { ...(guest.rsvpStatus || {}), [eventId]: status };
    await updateGuest(activeWedding.id, guestId, { rsvpStatus });
  };

  // Bulk set RSVP for all events
  const handleBulkRsvp = async (guestId, status) => {
    const rsvpStatus = {};
    events.forEach((evt) => { rsvpStatus[evt.id] = status; });
    await updateGuest(activeWedding.id, guestId, { rsvpStatus });
  };

  // Toggle RSVP open/closed
  const handleToggleRsvp = async () => {
    const isOpen = rsvpSettings?.isOpen || false;
    await saveRsvpSettings(activeWedding.id, {
      isOpen: !isOpen,
      deadline: rsvpSettings?.deadline || '',
      allowPlusOne: rsvpSettings?.allowPlusOne ?? true,
      allowDietary: rsvpSettings?.allowDietary ?? true,
      allowMessage: rsvpSettings?.allowMessage ?? true,
      requirePhone: rsvpSettings?.requirePhone ?? false,
      familyRsvp: rsvpSettings?.familyRsvp ?? true,
    });
  };

  // Copy RSVP link
  const handleCopyLink = async () => {
    const link = getRsvpLink(activeWedding.id);
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rsvpLink = activeWedding ? getRsvpLink(activeWedding.id) : '';
  const whatsappLink = activeWedding
    ? getWhatsAppRsvpLink(activeWedding.id, activeWedding.coupleName || 'Our')
    : '';

  const isOpen = rsvpSettings?.isOpen || false;

  if (!activeWedding) return null;

  return (
    <div className="space-y-6">
      {/* Top bar — stats + actions */}
      <div className="flex flex-wrap items-center gap-3">
        <StatCard label="Total" count={stats.total} color="gray" icon={Users} />
        <StatCard label="Accepted" count={stats.accepted} color="green" icon={Check} />
        <StatCard label="Declined" count={stats.declined} color="red" icon={X} />
        <StatCard label="Pending" count={stats.pending} color="amber" icon={Clock} />
        <StatCard label="No Response" count={stats.noResponse} color="gray" icon={Mail} />

        <div className="flex-1" />

        <Button
          variant={isOpen ? 'primary' : 'outline'}
          size="sm"
          onClick={handleToggleRsvp}
        >
          {isOpen ? '🟢 RSVPs Open' : '🔴 RSVPs Closed'}
        </Button>

        <Button variant="outline" size="sm" onClick={() => setShowShare(true)}>
          <Share2 size={14} /> Share Link
        </Button>

        <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
          Settings
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm pl-9 focus:border-wine-600 focus:ring-1 focus:ring-wine-600"
          />
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">All Events</option>
          {events.map((evt) => <option key={evt.id} value={evt.id}>{evt.name}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
          <option value="pending">Pending</option>
          <option value="no-response">No Response</option>
        </select>
      </div>

      {/* Guest RSVP table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Guest</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Family</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Side</th>
                {(selectedEvent === 'all' ? events : events.filter((e) => e.id === selectedEvent)).map((evt) => (
                  <th key={evt.id} className="text-center px-3 py-3 font-medium text-gray-600 min-w-[100px]">
                    {evt.name}
                  </th>
                ))}
                <th className="text-center px-4 py-3 font-medium text-gray-600">Quick</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => (
                <tr key={guest.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-900">{guest.firstName} {guest.lastName}</div>
                    {guest.phone && <div className="text-xs text-gray-400">{guest.phone}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{guest.familyName || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium ${guest.side === 'bride' ? 'text-wine-700' : 'text-blue-600'}`}>
                      {guest.side === 'bride' ? 'Bride' : 'Groom'}
                    </span>
                  </td>
                  {(selectedEvent === 'all' ? events : events.filter((e) => e.id === selectedEvent)).map((evt) => {
                    const status = (guest.rsvpStatus || {})[evt.id];
                    return (
                      <td key={evt.id} className="text-center px-3 py-2.5">
                        <RsvpToggle
                          status={status}
                          onChange={(s) => handleSetRsvp(guest.id, evt.id, s)}
                        />
                      </td>
                    );
                  })}
                  <td className="text-center px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleBulkRsvp(guest.id, 'accepted')}
                        className="p-1 rounded hover:bg-green-50 text-green-600"
                        title="Accept all"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => handleBulkRsvp(guest.id, 'declined')}
                        className="p-1 rounded hover:bg-red-50 text-red-600"
                        title="Decline all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredGuests.length === 0 && (
                <tr>
                  <td colSpan={99} className="text-center py-8 text-gray-400">
                    {guests.length === 0 ? 'Add guests first to manage RSVPs' : 'No guests match your filters'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent responses */}
      {responses.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Responses</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {responses
              .sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0))
              .slice(0, 20)
              .map((r) => (
                <div key={r.id} className="flex items-center gap-3 text-xs px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-800">{r.respondentName}</span>
                  <span className="text-gray-400">via {r.method}</span>
                  {r.message && <span className="text-gray-500 truncate flex-1">"{r.message}"</span>}
                  <span className="text-gray-300">
                    {r.submittedAt?.seconds
                      ? new Date(r.submittedAt.seconds * 1000).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Share modal */}
      <Modal open={showShare} onClose={() => setShowShare(false)} title="Share RSVP Link" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Share this link with your guests. They can RSVP without creating an account.
          </p>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              readOnly
              value={rsvpLink}
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
            />
            <Button size="sm" variant="outline" onClick={handleCopyLink}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
            >
              <MessageCircle size={16} /> Share via WhatsApp
            </a>
            <a
              href={rsvpLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ExternalLink size={16} /> Preview RSVP Page
            </a>
          </div>
        </div>
      </Modal>

      {/* Settings modal */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="RSVP Settings" size="md">
        <RsvpSettingsForm
          settings={rsvpSettings}
          onSave={async (s) => {
            await saveRsvpSettings(activeWedding.id, s);
            setShowSettings(false);
          }}
        />
      </Modal>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, count, color, icon: Icon }) {
  const colors = {
    gray: 'bg-gray-50 text-gray-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${colors[color]}`}>
      <Icon size={14} />
      <span className="text-lg font-bold">{count}</span>
      <span className="text-xs opacity-70">{label}</span>
    </div>
  );
}

function RsvpToggle({ status, onChange }) {
  const options = [
    { value: 'accepted', label: '✓', bg: 'bg-green-500 text-white', hover: 'hover:bg-green-100' },
    { value: 'pending', label: '?', bg: 'bg-amber-500 text-white', hover: 'hover:bg-amber-100' },
    { value: 'declined', label: '✗', bg: 'bg-red-500 text-white', hover: 'hover:bg-red-100' },
  ];

  return (
    <div className="inline-flex rounded-full border border-gray-200 overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`w-7 h-7 text-xs font-bold transition-colors ${
            status === opt.value ? opt.bg : `bg-white text-gray-300 ${opt.hover}`
          }`}
          title={opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function RsvpSettingsForm({ settings, onSave }) {
  const [form, setForm] = useState({
    isOpen: settings?.isOpen || false,
    deadline: settings?.deadline || '',
    allowPlusOne: settings?.allowPlusOne ?? true,
    allowDietary: settings?.allowDietary ?? true,
    allowMessage: settings?.allowMessage ?? true,
    requirePhone: settings?.requirePhone ?? false,
    familyRsvp: settings?.familyRsvp ?? true,
    customMessage: settings?.customMessage || '',
  });

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={form.isOpen}
          onChange={(e) => setForm({ ...form, isOpen: e.target.checked })}
          className="rounded border-gray-300 text-wine-700 focus:ring-wine-600"
        />
        <span className="text-sm font-medium">RSVPs are open</span>
      </label>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">RSVP Deadline</label>
        <input
          type="date"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.familyRsvp}
            onChange={(e) => setForm({ ...form, familyRsvp: e.target.checked })}
            className="rounded border-gray-300 text-wine-700 focus:ring-wine-600"
          />
          <div>
            <span className="text-sm font-medium">Family Group RSVP</span>
            <p className="text-xs text-gray-400">One person can RSVP for the whole family</p>
          </div>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.allowPlusOne}
            onChange={(e) => setForm({ ...form, allowPlusOne: e.target.checked })}
            className="rounded border-gray-300 text-wine-700 focus:ring-wine-600"
          />
          <span className="text-sm font-medium">Allow plus-ones</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.allowDietary}
            onChange={(e) => setForm({ ...form, allowDietary: e.target.checked })}
            className="rounded border-gray-300 text-wine-700 focus:ring-wine-600"
          />
          <span className="text-sm font-medium">Ask dietary preferences</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.allowMessage}
            onChange={(e) => setForm({ ...form, allowMessage: e.target.checked })}
            className="rounded border-gray-300 text-wine-700 focus:ring-wine-600"
          />
          <span className="text-sm font-medium">Allow guest messages</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.requirePhone}
            onChange={(e) => setForm({ ...form, requirePhone: e.target.checked })}
            className="rounded border-gray-300 text-wine-700 focus:ring-wine-600"
          />
          <span className="text-sm font-medium">Require phone number</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Custom Welcome Message</label>
        <textarea
          value={form.customMessage}
          onChange={(e) => setForm({ ...form, customMessage: e.target.value })}
          placeholder="We'd love for you to join us..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <Button onClick={() => onSave(form)} className="w-full">Save Settings</Button>
    </div>
  );
}
