import { useState, useEffect, useMemo } from 'react';
import { useWedding } from '../../contexts/WeddingContext';
import { subscribeToGuests, addGuest, updateGuest, deleteGuest, deleteGuestsBatch, importGuestsBatch } from '../../services/guestService';
import { subscribeToEvents } from '../../services/eventService';
import { Button, Input, Badge, Modal, useToast } from '../ui';
import { Search, Plus, Upload, Download, Trash2, Edit3, Filter, Users, ChevronDown } from 'lucide-react';
import { parseFile, autoMapColumns, mapRowsToGuests, findDuplicates, exportGuestsToExcel, downloadGuestTemplate } from '../../utils/excelImport';
import { DIETARY_OPTIONS, SIDES, GUEST_TAGS, RSVP_STATUS } from '../../config/constants';

export default function GuestList() {
  const { activeWedding } = useWedding();
  const toast = useToast();
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterSide, setFilterSide] = useState('all');
  const [filterDietary, setFilterDietary] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);

  useEffect(() => {
    if (!activeWedding) return;
    const unsub1 = subscribeToGuests(activeWedding.id, setGuests);
    const unsub2 = subscribeToEvents(activeWedding.id, setEvents);
    return () => { unsub1(); unsub2(); };
  }, [activeWedding]);

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      const name = `${g.firstName} ${g.lastName} ${g.familyName}`.toLowerCase();
      if (search && !name.includes(search.toLowerCase())) return false;
      if (filterSide !== 'all' && g.side !== filterSide) return false;
      if (filterDietary !== 'all' && g.dietary !== filterDietary) return false;
      if (filterTag !== 'all' && !(g.tags || []).includes(filterTag)) return false;
      return true;
    });
  }, [guests, search, filterSide, filterDietary, filterTag]);

  const stats = useMemo(() => ({
    total: guests.length,
    bride: guests.filter((g) => g.side === 'bride').length,
    groom: guests.filter((g) => g.side === 'groom').length,
    families: new Set(guests.map((g) => g.familyName).filter(Boolean)).size,
  }), [guests]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((g) => g.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} guests?`)) return;
    try {
      await deleteGuestsBatch(activeWedding.id, [...selected]);
      setSelected(new Set());
    } catch (err) {
      console.error('Bulk delete failed:', err);
      toast.error('Failed to delete some guests. Please try again.');
    }
  };

  if (!activeWedding) return null;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Guests" value={stats.total} />
        <StatCard label="Bride's Side" value={stats.bride} />
        <StatCard label="Groom's Side" value={stats.groom} />
        <StatCard label="Families" value={stats.families} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-wine-600 focus:ring-1 focus:ring-wine-600"
          />
        </div>

        <select value={filterSide} onChange={(e) => setFilterSide(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="all">All Sides</option>
          <option value="bride">Bride's Side</option>
          <option value="groom">Groom's Side</option>
        </select>

        <div className="hidden md:contents">
          <select value={filterDietary} onChange={(e) => setFilterDietary(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="all">All Dietary</option>
            {DIETARY_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>

          <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="all">All Tags</option>
            {GUEST_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <Button onClick={() => setShowAddModal(true)} size="sm" className="md:hidden"><Plus size={16} /></Button>
        <Button onClick={() => setShowAddModal(true)} className="hidden md:inline-flex"><Plus size={16} /> Add Guest</Button>
        <Button variant="outline" onClick={() => setShowImportModal(true)} className="hidden md:inline-flex"><Upload size={16} /> Import</Button>
        <Button variant="outline" onClick={downloadGuestTemplate} className="hidden md:inline-flex">
          <Download size={16} /> Template
        </Button>
        <Button variant="outline" onClick={() => exportGuestsToExcel(guests)} className="hidden md:inline-flex">
          <Download size={16} /> Export
        </Button>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-wine-50 px-4 py-2">
          <span className="text-sm font-medium text-wine-800">{selected.size} selected</span>
          <Button variant="danger" size="sm" onClick={handleBulkDelete}>
            <Trash2 size={14} /> Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {/* Guest list — table on desktop, cards on mobile */}
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Family</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Side</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Dietary</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tags</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  {guests.length === 0 ? 'No guests yet. Add your first guest or import from Excel.' : 'No guests match your filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(guest.id)} onChange={() => toggleSelect(guest.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {guest.firstName} {guest.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{guest.familyName || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={guest.side === 'bride' ? 'rose' : 'info'}>{guest.side}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{guest.dietary || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(guest.tags || []).map((tag) => <Badge key={tag}>{tag}</Badge>)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setEditingGuest(guest)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => { if (confirm('Delete this guest?')) deleteGuest(activeWedding.id, guest.id); }} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-12 text-center text-gray-400 text-sm">
            {guests.length === 0 ? 'No guests yet. Tap + to add your first guest.' : 'No guests match your filters.'}
          </div>
        ) : (
          filtered.map((guest) => (
            <div key={guest.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-center gap-3">
              <input type="checkbox" checked={selected.has(guest.id)} onChange={() => toggleSelect(guest.id)} className="rounded flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{guest.firstName} {guest.lastName}</p>
                <p className="text-xs text-gray-500 truncate">
                  {guest.familyName || 'No family'} · <span className="capitalize">{guest.side}</span>
                  {guest.dietary && guest.dietary !== 'vegetarian' ? ` · ${guest.dietary}` : ''}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setEditingGuest(guest)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => { if (confirm('Delete?')) deleteGuest(activeWedding.id, guest.id); }} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <GuestFormModal
        open={showAddModal || !!editingGuest}
        onClose={() => { setShowAddModal(false); setEditingGuest(null); }}
        guest={editingGuest}
        weddingId={activeWedding.id}
        events={events}
      />
      <ImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        weddingId={activeWedding.id}
        existingGuests={guests}
      />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

// ─── Guest Form Modal ──────────────────────────────────────────────────────

function GuestFormModal({ open, onClose, guest, weddingId, events }) {
  const isEdit = !!guest;
  const toast = useToast();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (guest) {
      setForm({ ...guest });
    } else {
      setForm({
        firstName: '', lastName: '', email: '', phone: '',
        familyName: '', side: 'bride', relation: '', dietary: 'vegetarian',
        dietaryNotes: '', plusOne: false, plusOneName: '', tags: [],
        needsHotel: false, travelFrom: '', notes: '',
      });
    }
  }, [guest, open]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateGuest(weddingId, guest.id, form);
      } else {
        await addGuest(weddingId, form);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save guest:', err);
      toast.error('Failed to save guest. Please try again.');
    }
  };

  const toggleTag = (tag) => {
    const tags = form.tags || [];
    update('tags', tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]);
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Guest' : 'Add Guest'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" value={form.firstName || ''} onChange={(e) => update('firstName', e.target.value)} required />
          <Input label="Last Name" value={form.lastName || ''} onChange={(e) => update('lastName', e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} />
          <Input label="Phone" value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Family Name" value={form.familyName || ''} onChange={(e) => update('familyName', e.target.value)} placeholder="e.g. The Patel Family" />
          <Input label="Relation" value={form.relation || ''} onChange={(e) => update('relation', e.target.value)} placeholder="e.g. Cousin, Uncle" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Side</label>
            <select value={form.side || 'bride'} onChange={(e) => update('side', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="bride">Bride's Side</option>
              <option value="groom">Groom's Side</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dietary</label>
            <select value={form.dietary || 'vegetarian'} onChange={(e) => update('dietary', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {DIETARY_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.plusOne || false} onChange={(e) => update('plusOne', e.target.checked)} className="rounded" />
            Plus One
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.needsHotel || false} onChange={(e) => update('needsHotel', e.target.checked)} className="rounded" />
            Needs Hotel
          </label>
        </div>

        {form.plusOne && (
          <Input label="Plus One Name" value={form.plusOneName || ''} onChange={(e) => update('plusOneName', e.target.value)} />
        )}

        <Input label="Traveling From" value={form.travelFrom || ''} onChange={(e) => update('travelFrom', e.target.value)} placeholder="City" />

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <div className="flex flex-wrap gap-2">
            {GUEST_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  (form.tags || []).includes(tag) ? 'bg-wine-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <Input label="Notes" value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} />

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Save Changes' : 'Add Guest'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Import Modal ──────────────────────────────────────────────────────────

function ImportModal({ open, onClose, weddingId, existingGuests }) {
  const toast = useToast();
  const [step, setStep] = useState('upload'); // upload → map → preview → done
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [mappedGuests, setMappedGuests] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const guestFields = [
    { value: '', label: '— Skip —' },
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: '_fullName', label: 'Full Name (split auto)' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'familyName', label: 'Family' },
    { value: 'side', label: 'Side (Bride/Groom)' },
    { value: 'relation', label: 'Relation' },
    { value: 'tableNumber', label: 'Table #' },
    { value: 'dietary', label: 'Dietary' },
    { value: 'notes', label: 'Notes' },
    { value: 'plusOne', label: 'Plus One (Yes/No)' },
    { value: '_tags', label: 'Tags (comma-sep)' },
  ];

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    try {
      const result = await parseFile(f);
      setParsed(result);
      const autoMap = autoMapColumns(result.headers);
      setColumnMapping(autoMap);
      setStep('map');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleMapDone = () => {
    const guests = mapRowsToGuests(parsed.rows, columnMapping);
    setMappedGuests(guests);
    const dupes = findDuplicates(existingGuests, guests);
    setDuplicates(dupes);
    setStep('preview');
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      // Filter out duplicates
      const dupeIndices = new Set(duplicates.map((d) => d.index));
      const toImport = mappedGuests.filter((_, i) => !dupeIndices.has(i));
      const count = await importGuestsBatch(weddingId, toImport);
      setResult({ success: true, count });
      setStep('done');
    } catch (err) {
      setResult({ success: false, error: err.message });
      setStep('done');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setParsed(null);
    setColumnMapping({});
    setMappedGuests([]);
    setDuplicates([]);
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import Guests" size="xl">
      {step === 'upload' && (
        <div className="text-center py-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-wine-50">
            <Upload size={28} className="text-wine-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Excel or CSV</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Upload your guest list from Excel (.xlsx) or CSV. We'll auto-detect columns like Name, Email, Family, Side, and Table #.
          </p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-wine-700 px-6 py-3 text-sm font-medium text-white hover:bg-wine-800">
            <Upload size={16} /> Choose File
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
          </label>
        </div>
      )}

      {step === 'map' && parsed && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Found <strong>{parsed.rows.length}</strong> guests with <strong>{parsed.headers.length}</strong> columns.
            Map each column to a guest field:
          </p>
          <div className="max-h-[50vh] overflow-y-auto space-y-2">
            {parsed.headers.map((header) => (
              <div key={header} className="flex items-center gap-4">
                <span className="w-40 text-sm font-medium text-gray-700 truncate">{header}</span>
                <span className="text-gray-400">→</span>
                <select
                  value={columnMapping[header] || ''}
                  onChange={(e) => setColumnMapping((m) => ({ ...m, [header]: e.target.value || undefined }))}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {guestFields.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={reset}>Back</Button>
            <Button onClick={handleMapDone}>Preview Import</Button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Ready to import <strong>{mappedGuests.length - duplicates.length}</strong> guests.
            {duplicates.length > 0 && <span className="text-amber-600"> {duplicates.length} duplicates will be skipped.</span>}
          </p>
          <div className="max-h-[50vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Family</th>
                  <th className="px-3 py-2 text-left">Side</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mappedGuests.slice(0, 50).map((g, i) => {
                  const isDupe = duplicates.some((d) => d.index === i);
                  return (
                    <tr key={i} className={isDupe ? 'bg-amber-50' : ''}>
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2">{g.firstName} {g.lastName}</td>
                      <td className="px-3 py-2 text-gray-600">{g.familyName || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{g.side || '—'}</td>
                      <td className="px-3 py-2">
                        {isDupe ? <Badge variant="warning">Duplicate</Badge> : <Badge variant="success">New</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {mappedGuests.length > 50 && (
              <p className="text-xs text-gray-400 text-center py-2">Showing first 50 of {mappedGuests.length}</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep('map')}>Back</Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? 'Importing...' : `Import ${mappedGuests.length - duplicates.length} Guests`}
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="text-center py-8">
          {result.success ? (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Complete</h3>
              <p className="text-sm text-gray-500 mb-6">{result.count} guests imported successfully.</p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <span className="text-2xl">❌</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Failed</h3>
              <p className="text-sm text-red-600 mb-6">{result.error}</p>
            </>
          )}
          <Button onClick={handleClose}>Done</Button>
        </div>
      )}
    </Modal>
  );
}
