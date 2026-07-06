import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, pointerWithin } from '@dnd-kit/core';
import { QRCodeSVG } from 'qrcode.react';
import { useWedding } from '../../contexts/WeddingContext';
import { subscribeToGuests } from '../../services/guestService';
import { subscribeToEvents } from '../../services/eventService';
import { subscribeToSeating, saveSeating } from '../../services/seatingService';
import { Button, Modal } from '../ui';
import { Plus, ZoomIn, ZoomOut, RotateCcw, Save, Upload, Image, FileSpreadsheet, QrCode, AlertTriangle, Copy, Check, ShieldAlert, Grid3X3, Circle, Square, Minus } from 'lucide-react';
import { TABLE_DEFAULTS, TABLE_PRESETS } from '../../config/constants';
import TableComponent from './Table';
import GuestSidebar from './GuestSidebar';
import RulesPanel from './RulesPanel';
import { evaluateSeatingRules } from './seatingRules';

const uid = () => Math.random().toString(36).slice(2, 10);

export default function SeatingCanvas() {
  const { activeWedding } = useWedding();
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [tables, setTables] = useState([]);
  const [rules, setRules] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedGuest, setDraggedGuest] = useState(null);
  const [showAddTable, setShowAddTable] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [customTable, setCustomTable] = useState({ name: '', shape: 'round', capacity: 10, width: 120, height: 120 });
  const [venueImage, setVenueImage] = useState(null);
  const [venueOpacity, setVenueOpacity] = useState(0.3);
  const [zones, setZones] = useState([]); // non-seatable elements: dance floor, DJ, bar, etc.
  const [filterSide, setFilterSide] = useState('all');
  const [filterFamily, setFilterFamily] = useState('all');
  const [hasChanges, setHasChanges] = useState(false);
  const [copiedFinderLink, setCopiedFinderLink] = useState(false);
  const canvasScrollRef = useRef(null);
  const qrPrintRef = useRef(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Subscribe to data
  useEffect(() => {
    if (!activeWedding) return;
    const unsub1 = subscribeToGuests(activeWedding.id, setGuests);
    const unsub2 = subscribeToEvents(activeWedding.id, (evts) => {
      setEvents(evts);
      if (!selectedEventId && evts.length > 0) setSelectedEventId(evts[0].id);
    });
    return () => { unsub1(); unsub2(); };
  }, [activeWedding]);

  // Subscribe to seating for selected event
  useEffect(() => {
    if (!activeWedding || !selectedEventId) return;
    return subscribeToSeating(activeWedding.id, selectedEventId, (data) => {
      setTables(data.tables || []);
      setRules(data.rules || []);
      setZones(data.zones || []);
      setVenueImage(data.venueImage || null);
      setVenueOpacity(data.venueOpacity !== undefined ? data.venueOpacity : 0.3);
    });
  }, [activeWedding, selectedEventId]);

  // Compute assigned/unassigned guests
  const assignedGuestIds = useMemo(() => {
    const ids = new Set();
    tables.forEach((t) => (t.assignedGuests || []).forEach((id) => ids.add(id)));
    return ids;
  }, [tables]);

  const unassignedGuests = useMemo(() => {
    return guests.filter((g) => {
      if (assignedGuestIds.has(g.id)) return false;
      if (filterSide !== 'all' && g.side !== filterSide) return false;
      if (filterFamily !== 'all' && g.familyName !== filterFamily) return false;
      return true;
    });
  }, [guests, assignedGuestIds, filterSide, filterFamily]);

  const families = useMemo(() => {
    return [...new Set(guests.map((g) => g.familyName).filter(Boolean))].sort();
  }, [guests]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || null,
    [events, selectedEventId],
  );

  const finderLink = useMemo(() => {
    if (typeof window === 'undefined' || !activeWedding?.id || !selectedEventId) return '';
    return `${window.location.origin}/find-table/${activeWedding.id}/${selectedEventId}`;
  }, [activeWedding, selectedEventId]);

  const ruleEvaluation = useMemo(
    () => evaluateSeatingRules(rules, tables, guests),
    [rules, tables, guests],
  );

  // Save to Firestore
  const handleSave = useCallback(async () => {
    if (!activeWedding || !selectedEventId) return;
    await saveSeating(activeWedding.id, selectedEventId, { tables, rules, zones, venueImage: venueImage || null, venueOpacity });
    setHasChanges(false);
  }, [activeWedding, selectedEventId, tables, rules, zones, venueImage, venueOpacity]);

  const handleRulesChange = useCallback((nextRules) => {
    setRules(nextRules);
    setHasChanges(true);
  }, []);

  const handleCopyFinderLink = useCallback(async () => {
    if (!finderLink) return;
    await navigator.clipboard.writeText(finderLink);
    setCopiedFinderLink(true);
    setTimeout(() => setCopiedFinderLink(false), 2000);
  }, [finderLink]);

  const handlePrintQr = useCallback(() => {
    if (!finderLink || !qrPrintRef.current) return;

    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Table Finder QR</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; text-align: center; color: #111827; }
            .wrapper { max-width: 520px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 24px; padding: 32px; }
            .subtitle { color: #e11d48; font-size: 12px; letter-spacing: 0.25em; text-transform: uppercase; }
            .title { font-size: 28px; font-weight: 700; margin: 12px 0 8px; }
            .text { color: #6b7280; margin-bottom: 24px; }
            .url { font-size: 14px; word-break: break-all; margin-top: 20px; color: #374151; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="subtitle">${selectedEvent?.name || 'Table Finder'}</div>
            <div class="title">Find Your Table</div>
            <div class="text">Scan this QR code or visit the link below to see your table assignment.</div>
            ${qrPrintRef.current.innerHTML}
            <div class="url">${finderLink}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [finderLink, selectedEvent]);

  const handleFocusTable = useCallback((tableId) => {
    const table = tables.find((item) => item.id === tableId);
    if (!table || !canvasScrollRef.current) return;

    canvasScrollRef.current.scrollTo({
      left: Math.max(table.x * zoom - canvasScrollRef.current.clientWidth / 3, 0),
      top: Math.max(table.y * zoom - canvasScrollRef.current.clientHeight / 3, 0),
      behavior: 'smooth',
    });
    setShowRules(false);
  }, [tables, zoom]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (!hasChanges) return;
    const timer = setTimeout(handleSave, 2000);
    return () => clearTimeout(timer);
  }, [hasChanges, handleSave]);

  // Add table — accepts a preset or custom config
  const addTable = (config) => {
    const defaults = TABLE_DEFAULTS[config.shape] || TABLE_DEFAULTS.round;
    const newTable = {
      id: uid(),
      name: config.name || `Table ${tables.length + 1}`,
      shape: config.shape || 'round',
      capacity: config.capacity || defaults.capacity,
      width: config.width || defaults.width,
      height: config.height || defaults.height,
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 300,
      assignedGuests: [],
    };
    setTables((prev) => [...prev, newTable]);
    setHasChanges(true);
    setShowAddTable(false);
  };

  // Bulk add tables from import
  const addTablesBatch = (configs) => {
    const newTables = configs.map((config, i) => ({
      id: uid(),
      name: config.name || `Table ${tables.length + i + 1}`,
      shape: config.shape || 'round',
      capacity: config.capacity || 10,
      width: config.width || TABLE_DEFAULTS[config.shape]?.width || 120,
      height: config.height || TABLE_DEFAULTS[config.shape]?.height || 120,
      x: 80 + (i % 6) * 200,
      y: 80 + Math.floor(i / 6) * 200,
      assignedGuests: [],
    }));
    setTables((prev) => [...prev, ...newTables]);
    setHasChanges(true);
    setShowImport(false);
  };

  // Add zone (non-seatable element)
  const addZone = (zone) => {
    setZones((prev) => [...prev, {
      id: uid(),
      label: zone.label || 'Zone',
      type: zone.type || 'dancefloor', // dancefloor | dj | bar | gifts | stage | dessert | photo | custom
      width: zone.width || 200,
      height: zone.height || 200,
      x: 400 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      color: zone.color || '#f3f4f6',
    }]);
    setHasChanges(true);
  };

  const removeZone = (zoneId) => {
    setZones((prev) => prev.filter((z) => z.id !== zoneId));
    setHasChanges(true);
  };

  const updateZone = (zoneId, updates) => {
    setZones((prev) => prev.map((z) => z.id === zoneId ? { ...z, ...updates } : z));
    setHasChanges(true);
  };

  // Apply venue preset layout
  const applyPreset = (preset) => {
    setTables(preset.tables.map((t, i) => ({ ...t, id: uid(), assignedGuests: [] })));
    setZones(preset.zones.map((z) => ({ ...z, id: uid() })));
    setHasChanges(true);
    setShowPresets(false);
  };

  // Remove table
  const removeTable = (tableId) => {
    setTables((prev) => prev.filter((t) => t.id !== tableId));
    setHasChanges(true);
  };

  // Update table (position, capacity, name)
  const updateTable = (tableId, updates) => {
    setTables((prev) => prev.map((t) => t.id === tableId ? { ...t, ...updates } : t));
    setHasChanges(true);
  };

  // DnD handlers
  const handleDragStart = (event) => {
    const guestId = event.active.id;
    const guest = guests.find((g) => g.id === guestId);
    setDraggedGuest(guest);
    setIsDragging(true);
  };

  const handleDragEnd = (event) => {
    setIsDragging(false);
    setDraggedGuest(null);

    const { active, over } = event;
    if (!over) return;

    const guestId = active.id;
    const targetTableId = over.id;

    if (targetTableId === 'unassigned-zone') {
      // Remove from table
      setTables((prev) => prev.map((t) => ({
        ...t,
        assignedGuests: (t.assignedGuests || []).filter((id) => id !== guestId),
      })));
      setHasChanges(true);
      return;
    }

    // Find target table
    const targetTable = tables.find((t) => t.id === targetTableId);
    if (!targetTable) return;

    // Check capacity — allow up to capacity + 2 max overflow
    const currentCount = (targetTable.assignedGuests || []).length;
    const alreadySeated = (targetTable.assignedGuests || []).includes(guestId);
    if (!alreadySeated && currentCount >= targetTable.capacity + 2) {
      return; // Hard cap: no more than 2 over capacity
    }

    setTables((prev) => prev.map((t) => {
      // Remove guest from any current table
      const filtered = (t.assignedGuests || []).filter((id) => id !== guestId);
      // Add to target table
      if (t.id === targetTableId) {
        return { ...t, assignedGuests: [...filtered, guestId] };
      }
      return { ...t, assignedGuests: filtered };
    }));
    setHasChanges(true);
  };

  // Table position drag via grip handle
  const handleTableDrag = useCallback((tableId, deltaX, deltaY) => {
    setTables((prev) => prev.map((t) =>
      t.id === tableId
        ? { ...t, x: t.x + deltaX / zoom, y: t.y + deltaY / zoom }
        : t
    ));
    setHasChanges(true);
  }, [zoom]);

  if (!activeWedding) return null;

  // Mobile: view-only optimized layout
  const mobileViewContent = (
    <div className="md:hidden flex flex-col h-[calc(100vh-8rem)]">
      {/* Mobile header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <select
            value={selectedEventId || ''}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
          >
            {events.map((evt) => <option key={evt.id} value={evt.id}>{evt.name}</option>)}
          </select>
          <span className="text-xs text-gray-500">{tables.length} tables • {assignedGuestIds.size}/{guests.length} seated</span>
        </div>
        {hasChanges && (
          <Button size="sm" onClick={handleSave}><Save size={12} /> Save</Button>
        )}
      </div>

      {/* Info banner */}
      <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 flex items-center gap-2">
        <span>👁️</span>
        <span>View-only on mobile. Use desktop to drag tables and assign guests.</span>
      </div>

      {/* Zoomed-out canvas — read-only, pinch-friendly */}
      <div className="flex-1 overflow-auto bg-gray-50 relative">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            <p>Add events first to start seating</p>
          </div>
        ) : tables.length === 0 && zones.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center px-6">
            <p>No tables yet. Open on desktop to set up your venue layout.</p>
          </div>
        ) : (
          <div
            style={{
              transform: 'scale(0.35)',
              transformOrigin: '0 0',
              width: '3000px',
              height: '2000px',
              position: 'relative',
              minWidth: '3000px',
              minHeight: '2000px',
              pointerEvents: 'none',
            }}
          >
            {venueImage && (
              <img src={venueImage} alt="Venue layout"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: venueOpacity, pointerEvents: 'none', userSelect: 'none' }}
                draggable={false} />
            )}
            {zones.map((zone) => (
              <div key={zone.id} style={{
                position: 'absolute',
                left: zone.x || 400,
                top: zone.y || 200,
                width: zone.width,
                height: zone.height,
                backgroundColor: zone.color || '#f3f4f6',
                borderRadius: '12px',
                border: '2px dashed #d1d5db',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}>
                <span className="text-2xl">{(ZONE_PRESETS.find(z => z.type === zone.type)?.icon) || '📐'}</span>
                <span className="text-xs font-semibold text-gray-600">{zone.label}</span>
              </div>
            ))}
            {tables.map((table) => (
              <TableComponent
                key={table.id}
                table={table}
                guests={guests}
                warnings={ruleEvaluation.tableWarnings[table.id] || []}
                onUpdate={() => {}}
                onRemove={() => {}}
                onDrag={() => {}}
                onRemoveGuest={() => {}}
                zoom={0.35}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile summary footer */}
      <div className="px-3 py-2 border-t border-gray-200 bg-white flex items-center justify-between text-xs text-gray-600">
        <span>{unassignedGuests.length} unassigned</span>
        {ruleEvaluation.violationCount > 0 && (
          <span className="text-amber-700">⚠️ {ruleEvaluation.violationCount} violations</span>
        )}
      </div>
    </div>
  );

  return (
    <>
      {mobileViewContent}
      <div className="hidden md:block">
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Sidebar — unassigned guests */}
        <GuestSidebar
          guests={unassignedGuests}
          allGuests={guests}
          filterSide={filterSide}
          setFilterSide={setFilterSide}
          filterFamily={filterFamily}
          setFilterFamily={setFilterFamily}
          families={families}
          assignedCount={assignedGuestIds.size}
          totalCount={guests.length}
        />

        {/* Main canvas */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {/* Event selector */}
            <select
              value={selectedEventId || ''}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {events.map((evt) => <option key={evt.id} value={evt.id}>{evt.name}</option>)}
            </select>

            <div className="flex-1" />

            <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}>
              <ZoomIn size={14} />
            </Button>
            <span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.3))}>
              <ZoomOut size={14} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setZoom(1)}>
              <RotateCcw size={14} />
            </Button>

            <div className="w-px h-6 bg-gray-200" />

            <Button size="sm" onClick={() => setShowAddTable(true)}>
              <Plus size={14} /> Table
            </Button>

            {/* Zone dropdown */}
            <div className="relative group">
              <Button variant="outline" size="sm">
                <Plus size={14} /> Zone ▾
              </Button>
              <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 w-44">
                {ZONE_PRESETS.map((z) => (
                  <button key={z.type} onClick={() => addZone(z)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2">
                    <span>{z.icon}</span> {z.label}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => setShowPresets(true)}>
              Layout Presets
            </Button>

            {(tables.length > 0 || zones.length > 0) && (
              <Button variant="outline" size="sm" onClick={() => {
                if (window.confirm('Reset this layout? All tables and zones will be cleared.')) {
                  setTables([]);
                  setZones([]);
                  setHasChanges(true);
                }
              }}>
                <RotateCcw size={14} /> Reset
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={14} /> Import
            </Button>

            <Button variant="outline" size="sm" onClick={() => setShowRules(true)}>
              <ShieldAlert size={14} /> Rules
            </Button>

            <Button variant="outline" size="sm" onClick={() => setShowQrModal(true)} disabled={!selectedEventId}>
              <QrCode size={14} /> QR Code
            </Button>

            {/* Venue floor plan */}
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => { setVenueImage(ev.target.result); setHasChanges(true); };
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }}
              />
              <span className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                <Image size={14} /> {venueImage ? 'Change' : 'Floor Plan'}
              </span>
            </label>

            {venueImage && (
              <>
                <input type="range" min="5" max="80" value={venueOpacity * 100}
                  onChange={(e) => { setVenueOpacity(parseInt(e.target.value) / 100); setHasChanges(true); }}
                  className="w-16 h-1 accent-wine-600" title={`Opacity: ${Math.round(venueOpacity * 100)}%`} />
                <Button variant="outline" size="sm" onClick={() => { setVenueImage(null); setHasChanges(true); }}>
                  ✕ BG
                </Button>
              </>
            )}

            {hasChanges && (
              <Button size="sm" onClick={handleSave}>
                <Save size={14} /> Save
              </Button>
            )}
          </div>

          {/* Canvas */}
          {ruleEvaluation.violationCount > 0 && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <span>
                  {ruleEvaluation.violationCount} seating rule violation{ruleEvaluation.violationCount === 1 ? '' : 's'} across {ruleEvaluation.tablesWithWarnings} table{ruleEvaluation.tablesWithWarnings === 1 ? '' : 's'}.
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowRules(true)} className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
                Review Rules
              </Button>
            </div>
          )}

          <div ref={canvasScrollRef} className="flex-1 rounded-xl border border-gray-200 bg-white overflow-auto relative">
            {events.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Add events first to start seating</p>
              </div>
            ) : tables.length === 0 && zones.length === 0 && !venueImage ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <Grid3XIcon />
                <p className="font-medium">Set up your venue layout</p>
                <p className="text-xs max-w-sm text-center">Upload a venue floor plan, pick a preset layout, or add tables one by one.</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button size="sm" onClick={() => setShowPresets(true)}>Layout Presets</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddTable(true)}>
                    <Plus size={14} /> Add Table
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
                    <Upload size={14} /> Import
                  </Button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: '0 0',
                  width: '3000px',
                  height: '2000px',
                  position: 'relative',
                  minWidth: '3000px',
                  minHeight: '2000px',
                }}
              >
                {/* Venue floor plan background */}
                {venueImage && (
                  <img src={venueImage} alt="Venue layout"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: venueOpacity, pointerEvents: 'none', userSelect: 'none' }}
                    draggable={false} />
                )}

                {/* Zones (dance floor, DJ, bar, etc.) */}
                {zones.map((zone) => (
                  <ZoneElement key={zone.id} zone={zone}
                    onUpdate={(updates) => updateZone(zone.id, updates)}
                    onRemove={() => removeZone(zone.id)}
                    zoom={zoom} />
                ))}

                {/* Tables */}
                {tables.map((table) => (
                  <TableComponent
                    key={table.id}
                    table={table}
                    guests={guests}
                    warnings={ruleEvaluation.tableWarnings[table.id] || []}
                    onUpdate={(updates) => updateTable(table.id, updates)}
                    onRemove={() => removeTable(table.id)}
                    onDrag={(dx, dy) => handleTableDrag(table.id, dx, dy)}
                    onRemoveGuest={(guestId) => {
                      setTables((prev) => prev.map((t) =>
                        t.id === table.id
                          ? { ...t, assignedGuests: (t.assignedGuests || []).filter((id) => id !== guestId) }
                          : t
                      ));
                      setHasChanges(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>{tables.length} tables</span>
            {zones.length > 0 && <span>{zones.length} zones</span>}
            <span>{assignedGuestIds.size} / {guests.length} guests seated</span>
            <span>{guests.length - assignedGuestIds.size} unassigned</span>
            <span>{tables.reduce((s, t) => s + t.capacity, 0)} total capacity</span>
            {rules.length > 0 && <span>{rules.length} rules</span>}
            {ruleEvaluation.violationCount > 0 && <span className="text-amber-600">{ruleEvaluation.violationCount} warnings</span>}
            {hasChanges && <span className="text-amber-600">● Unsaved changes</span>}
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggedGuest && (
          <div className="rounded-lg bg-wine-700 text-white px-3 py-1.5 text-sm font-medium shadow-lg">
            {draggedGuest.firstName} {draggedGuest.lastName}
          </div>
        )}
      </DragOverlay>

      {/* Add Table modal — presets + custom */}
      <Modal open={showAddTable} onClose={() => setShowAddTable(false)} title="Add Table" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Choose a preset or create a custom table:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TABLE_PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => addTable(preset)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 p-3 hover:bg-wine-50 hover:border-wine-200 transition-colors text-left"
              >
                <TableShapeIcon shape={preset.shape} />
                <div>
                  <div className="text-sm font-medium text-gray-900">{preset.label}</div>
                  <div className="text-xs text-gray-400">{preset.capacity} seats · {preset.width}×{preset.height}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={() => { setShowAddTable(false); setShowCustom(true); }}
              className="w-full text-center text-sm text-wine-700 font-medium hover:text-wine-800 py-2"
            >
              + Create Custom Table
            </button>
          </div>
        </div>
      </Modal>

      {/* Custom Table modal */}
      <Modal open={showCustom} onClose={() => setShowCustom(false)} title="Custom Table" size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Table Name</label>
            <input
              value={customTable.name}
              onChange={(e) => setCustomTable({ ...customTable, name: e.target.value })}
              placeholder={`Table ${tables.length + 1}`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shape</label>
            <select
              value={customTable.shape}
              onChange={(e) => {
                const shape = e.target.value;
                const defaults = TABLE_DEFAULTS[shape] || TABLE_DEFAULTS.round;
                setCustomTable({ ...customTable, shape, width: defaults.width, height: defaults.height, capacity: defaults.capacity });
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="round">Round</option>
              <option value="rectangle">Rectangle</option>
              <option value="square">Square</option>
              <option value="oval">Oval</option>
              <option value="u-shape">U-Shape</option>
              <option value="head-table">Head Table</option>
              <option value="cocktail">Cocktail/Standing</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Seats</label>
              <input type="number" min="1" max="50" value={customTable.capacity}
                onChange={(e) => setCustomTable({ ...customTable, capacity: parseInt(e.target.value) || 1 })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Width</label>
              <input type="number" min="40" max="500" value={customTable.width}
                onChange={(e) => setCustomTable({ ...customTable, width: parseInt(e.target.value) || 100 })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Height</label>
              <input type="number" min="40" max="500" value={customTable.height}
                onChange={(e) => setCustomTable({ ...customTable, height: parseInt(e.target.value) || 100 })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <Button className="w-full" onClick={() => { addTable(customTable); setShowCustom(false); }}>
            Add Table
          </Button>
        </div>
      </Modal>

      {/* Import Layout modal */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="Import Seating Layout" size="md">
        <ImportLayoutPanel onImport={addTablesBatch} onClose={() => setShowImport(false)} existingCount={tables.length} />
      </Modal>

      {/* Venue Layout Presets modal */}
      <Modal open={showPresets} onClose={() => setShowPresets(false)} title="Venue Layout Presets" size="lg">
        <VenuePresetsPanel onApply={applyPreset} onClose={() => setShowPresets(false)} />
      </Modal>

      <RulesPanel
        open={showRules}
        onClose={() => setShowRules(false)}
        rules={rules}
        guests={guests}
        tables={tables}
        violations={ruleEvaluation.violations}
        onChange={handleRulesChange}
        onFocusTable={handleFocusTable}
      />

      <Modal open={showQrModal} onClose={() => setShowQrModal(false)} title="Table Finder QR Code" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Share this QR code so guests can search their name and find their assigned table{selectedEvent ? ` for ${selectedEvent.name}` : ''}.
          </p>

          <div ref={qrPrintRef} className="rounded-3xl border border-wine-100 bg-gradient-to-br from-wine-50 to-white p-6 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-wine-600">
              {selectedEvent?.name || 'Table Finder'}
            </div>
            <h3 className="mt-2 text-2xl font-bold text-gray-900">Find Your Table</h3>
            <p className="mt-2 text-sm text-gray-500">Scan to see your seat and tablemates instantly.</p>

            {finderLink && (
              <div className="mt-5 flex justify-center">
                <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                  <QRCodeSVG value={finderLink} size={220} includeMargin />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Shareable Link</label>
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 break-all">
              {finderLink || 'Select an event to generate the guest link.'}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={handleCopyFinderLink} disabled={!finderLink}>
              {copiedFinderLink ? <Check size={14} /> : <Copy size={14} />}
              {copiedFinderLink ? 'Copied' : 'Copy Link'}
            </Button>
            <Button className="flex-1" onClick={handlePrintQr} disabled={!finderLink}>
              Print QR Sign
            </Button>
          </div>
        </div>
      </Modal>
    </DndContext>
      </div>
    </>
  );
}

function ImportLayoutPanel({ onImport, onClose, existingCount }) {
  const [mode, setMode] = useState('quick'); // 'quick' | 'excel' | 'text'
  const [quickCount, setQuickCount] = useState(10);
  const [quickShape, setQuickShape] = useState('round');
  const [quickCapacity, setQuickCapacity] = useState(10);
  const [textInput, setTextInput] = useState('');
  const [fileData, setFileData] = useState(null);
  const [preview, setPreview] = useState([]);

  // Quick-add: generate N tables of same shape
  const handleQuickAdd = () => {
    const configs = Array.from({ length: quickCount }, (_, i) => ({
      name: `Table ${existingCount + i + 1}`,
      shape: quickShape,
      capacity: quickCapacity,
    }));
    onImport(configs);
  };

  // Parse text input (CSV-like: "Table 1, round, 10" per line)
  const handleTextParse = () => {
    const lines = textInput.trim().split('\n').filter(Boolean);
    const configs = lines.map((line) => {
      const parts = line.split(/[,\t]/).map((s) => s.trim());
      const name = parts[0] || '';
      const shape = (parts[1] || 'round').toLowerCase();
      const capacity = parseInt(parts[2]) || 10;
      const validShape = TABLE_DEFAULTS[shape] ? shape : 'round';
      return { name, shape: validShape, capacity };
    });
    setPreview(configs);
  };

  // Handle Excel file
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // Skip header row if it looks like headers
      const start = rows[0]?.some((c) => typeof c === 'string' && /name|table/i.test(c)) ? 1 : 0;
      const configs = rows.slice(start).filter((r) => r[0]).map((row) => {
        const name = String(row[0] || '').trim();
        const shape = (String(row[1] || 'round')).toLowerCase().trim();
        const capacity = parseInt(row[2]) || 10;
        const validShape = TABLE_DEFAULTS[shape] ? shape : 'round';
        return { name, shape: validShape, capacity };
      });

      setFileData(file.name);
      setPreview(configs);
    } catch (err) {
      console.error('File parse error:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'quick', label: 'Quick Add', icon: Plus },
          { id: 'text', label: 'Paste List', icon: FileSpreadsheet },
          { id: 'excel', label: 'Excel File', icon: Upload },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setMode(id); setPreview([]); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
              mode === id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Quick add */}
      {mode === 'quick' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Add multiple identical tables at once:</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Count</label>
              <input type="number" min="1" max="100" value={quickCount}
                onChange={(e) => setQuickCount(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Shape</label>
              <select value={quickShape} onChange={(e) => setQuickShape(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="round">Round</option>
                <option value="rectangle">Rectangle</option>
                <option value="square">Square</option>
                <option value="oval">Oval</option>
                <option value="u-shape">U-Shape</option>
                <option value="head-table">Head Table</option>
                <option value="cocktail">Cocktail</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Seats each</label>
              <input type="number" min="1" max="50" value={quickCapacity}
                onChange={(e) => setQuickCapacity(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <Button className="w-full" onClick={handleQuickAdd}>
            Add {quickCount} Tables
          </Button>
        </div>
      )}

      {/* Text paste */}
      {mode === 'text' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Paste your table list — one per line:</p>
          <p className="text-xs text-gray-400">Format: <code className="bg-gray-100 px-1 rounded">Name, Shape, Seats</code></p>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={`Head Table, head-table, 12\nTable 1, round, 10\nTable 2, round, 10\nBar Area, cocktail, 4`}
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleTextParse}>Preview</Button>
            {preview.length > 0 && (
              <Button className="flex-1" onClick={() => onImport(preview)}>
                Import {preview.length} Tables
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Excel upload */}
      {mode === 'excel' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Upload an Excel or CSV with columns: <strong>Name, Shape, Seats</strong></p>
          <p className="text-xs text-gray-400">
            Venues often provide table layouts as spreadsheets. Upload it and we'll import the tables.
            Valid shapes: round, rectangle, square, oval, u-shape, head-table, cocktail
          </p>
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-6 cursor-pointer hover:bg-gray-50 transition-colors">
            <Upload size={24} className="text-gray-400" />
            <span className="text-sm text-gray-500">{fileData || 'Drop file or click to upload'}</span>
            <span className="text-xs text-gray-400">.xlsx, .xls, .csv</span>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
          </label>
          {preview.length > 0 && (
            <Button className="w-full" onClick={() => onImport(preview)}>
              Import {preview.length} Tables
            </Button>
          )}
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-3 py-1.5 font-medium text-gray-600">Name</th>
                <th className="text-left px-3 py-1.5 font-medium text-gray-600">Shape</th>
                <th className="text-center px-3 py-1.5 font-medium text-gray-600">Seats</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((t, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-3 py-1.5 text-gray-800">{t.name}</td>
                  <td className="px-3 py-1.5 text-gray-500 capitalize">{t.shape}</td>
                  <td className="px-3 py-1.5 text-center text-gray-500">{t.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Grid3XIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

// ─── Zone presets ───────────────────────────────────────────────────────────

const ZONE_PRESETS = [
  { type: 'dancefloor', label: 'Dance Floor', icon: 'DF', width: 250, height: 250, color: '#fef3c7' },
  { type: 'dj',         label: 'DJ Booth',    icon: 'DJ', width: 100, height: 60,  color: '#e0e7ff' },
  { type: 'bar',        label: 'Bar',         icon: 'B',  width: 160, height: 60,  color: '#dbeafe' },
  { type: 'gifts',      label: 'Gifts & Cards', icon: 'G', width: 100, height: 80, color: '#fce7f3' },
  { type: 'desserts',   label: 'Desserts',    icon: 'D',  width: 120, height: 60,  color: '#fef9c3' },
  { type: 'cake',       label: 'Cake',        icon: 'C',  width: 80,  height: 80,  color: '#fff7ed' },
  { type: 'stage',      label: 'Stage / Mandap', icon: 'S', width: 300, height: 150, color: '#fee2e2' },
  { type: 'photo',      label: 'Photo Booth', icon: 'PB', width: 100, height: 80,  color: '#f3e8ff' },
  { type: 'entrance',   label: 'Entrance',    icon: 'E',  width: 80,  height: 40,  color: '#f1f5f9' },
  { type: 'custom',     label: 'Custom Zone',  icon: '+',  width: 150, height: 100, color: '#f3f4f6' },
];

// ─── Zone element (non-seatable, draggable) ─────────────────────────────────

function ZoneElement({ zone, onUpdate, onRemove, zoom }) {
  const dragStart = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(zone.label);

  const handleGripDown = useCallback((e) => {
    const isTouch = e.type === 'touchstart';
    if (isTouch) e.preventDefault();
    e.stopPropagation();
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX, y: clientY };
    const handleMove = (me) => {
      if (!dragStart.current) return;
      const cx = me.touches ? me.touches[0].clientX : me.clientX;
      const cy = me.touches ? me.touches[0].clientY : me.clientY;
      const dx = cx - dragStart.current.x;
      const dy = cy - dragStart.current.y;
      dragStart.current = { x: cx, y: cy };
      onUpdate({ x: (zone.x || 0) + dx / zoom, y: (zone.y || 0) + dy / zoom });
    };
    const handleUp = () => {
      dragStart.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
  }, [zone.x, zone.y, zoom, onUpdate]);

  const zoneIcon = ZONE_PRESETS.find((z) => z.type === zone.type)?.icon || '📐';

  return (
    <div
      style={{
        position: 'absolute',
        left: zone.x || 400,
        top: zone.y || 200,
        width: zone.width,
        height: zone.height,
      }}
      className="group"
    >
      <div
        style={{ backgroundColor: zone.color || '#f3f4f6' }}
        className="w-full h-full rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-colors hover:border-gray-400"
        onMouseDown={handleGripDown}
        onTouchStart={handleGripDown}
      >
        <span className="text-2xl mb-1 pointer-events-none">{zoneIcon}</span>
        {isEditing ? (
          <input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onBlur={() => { onUpdate({ label: editLabel }); setIsEditing(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onUpdate({ label: editLabel }); setIsEditing(false); } }}
            className="text-xs font-semibold text-gray-700 bg-white rounded px-1 py-0.5 border text-center w-24"
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-xs font-semibold text-gray-600 pointer-events-none">{zone.label}</span>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex gap-1 bg-white rounded-lg shadow-md border px-1 py-0.5 z-10">
        <button onClick={() => setIsEditing(true)} className="p-1 rounded hover:bg-gray-100 text-gray-500 text-[10px]" title="Rename">✏️</button>
        <button onClick={onRemove} className="p-1 rounded hover:bg-red-50 text-red-500 text-[10px]" title="Remove">🗑️</button>
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const startX = e.clientX;
          const startY = e.clientY;
          const startW = zone.width;
          const startH = zone.height;
          const handleMove = (me) => {
            const cx = me.touches ? me.touches[0].clientX : me.clientX;
            const cy = me.touches ? me.touches[0].clientY : me.clientY;
            onUpdate({
              width: Math.max(60, startW + (cx - startX) / zoom),
              height: Math.max(40, startH + (cy - startY) / zoom),
            });
          };
          const handleUp = () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
          };
          window.addEventListener('mousemove', handleMove);
          window.addEventListener('mouseup', handleUp);
          window.addEventListener('touchmove', handleMove, { passive: false });
          window.addEventListener('touchend', handleUp);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const startX = e.touches[0].clientX;
          const startY = e.touches[0].clientY;
          const startW = zone.width;
          const startH = zone.height;
          const handleMove = (me) => {
            const cx = me.touches ? me.touches[0].clientX : me.clientX;
            const cy = me.touches ? me.touches[0].clientY : me.clientY;
            onUpdate({
              width: Math.max(60, startW + (cx - startX) / zoom),
              height: Math.max(40, startH + (cy - startY) / zoom),
            });
          };
          const handleUp = () => {
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
          };
          window.addEventListener('touchmove', handleMove, { passive: false });
          window.addEventListener('touchend', handleUp);
        }}
      >
        <svg viewBox="0 0 10 10" className="w-3 h-3 text-gray-400">
          <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </div>
  );
}

// ─── Venue layout presets ───────────────────────────────────────────────────
// Each table element renders at (table.width + 80) x (table.height + 60) due to
// chip positioning padding. Spacing must account for this.

const VENUE_LAYOUTS = (() => {
  const S = 220; // tighter spacing for round tables (120w + 60 pad + 40gap)
  const round10 = { shape: 'round', capacity: 10, width: 120, height: 120 };
  const round8 = { shape: 'round', capacity: 8, width: 110, height: 110 };

  // Stagger helper: generates tables on left/right with alternating row offsets
  // for better viewing angles and intimate feel
  function staggeredSides(leftX, rightX, startY, rows, spacing, offset, config) {
    const t = []; let n = 0;
    for (let r = 0; r < rows; r++) {
      const stagger = r % 2 === 1 ? offset : 0;
      t.push({ ...config, name: `Table ${++n}`, x: leftX + stagger, y: startY + r * spacing });
      t.push({ ...config, name: `Table ${++n}`, x: rightX - stagger, y: startY + r * spacing });
    }
    return t;
  }

  return [
    {
      name: 'Large Reception (30 rounds)',
      description: 'Head table at top, stage at bottom, staggered tables left & right of dance floor',
      icon: '🏛️',
      tables: [
        { name: 'Head Table', shape: 'head-table', capacity: 12, width: 340, height: 60, x: 730, y: 60 },
        ...(() => {
          const t = []; let n = 0;
          // Left side — 2 staggered columns × 7 rows (close to dance floor)
          for (let r = 0; r < 7; r++) {
            const stagger = r % 2 === 1 ? 50 : 0;
            t.push({ ...round10, name: `Table ${++n}`, x: 80 + stagger, y: 220 + r * S });
            t.push({ ...round10, name: `Table ${++n}`, x: 280 + stagger, y: 220 + r * S });
          }
          // Right side — 2 staggered columns × 7 rows
          for (let r = 0; r < 7; r++) {
            const stagger = r % 2 === 1 ? -50 : 0;
            t.push({ ...round10, name: `Table ${++n}`, x: 1300 + stagger, y: 220 + r * S });
            t.push({ ...round10, name: `Table ${++n}`, x: 1500 + stagger, y: 220 + r * S });
          }
          return t.slice(0, 28);
        })(),
        { ...round10, name: 'Table 29', x: 450, y: 60 },
        { ...round10, name: 'Table 30', x: 1150, y: 60 },
      ],
      zones: [
        { type: 'stage', label: 'Stage / DJ', width: 400, height: 90, x: 700, y: 1800, color: '#e0e7ff' },
        { type: 'dancefloor', label: 'Dance Floor', width: 420, height: 420, x: 690, y: 600, color: '#fef3c7' },
        { type: 'bar', label: 'Bar', width: 180, height: 60, x: 80, y: 1800, color: '#dbeafe' },
        { type: 'desserts', label: 'Desserts', width: 150, height: 60, x: 1550, y: 1800, color: '#fef9c3' },
      ],
    },
    {
      name: 'Medium Reception (20 rounds)',
      description: 'Head table at top, stage at bottom, staggered rounds on each side',
      icon: '🎊',
      tables: [
        { name: 'Head Table', shape: 'head-table', capacity: 10, width: 300, height: 60, x: 650, y: 60 },
        ...(() => {
          const t = []; let n = 0;
          // Left side staggered (2 cols × 5 rows)
          for (let r = 0; r < 5; r++) {
            const stagger = r % 2 === 1 ? 40 : 0;
            t.push({ ...round8, name: `Table ${++n}`, x: 80 + stagger, y: 220 + r * S });
            t.push({ ...round8, name: `Table ${++n}`, x: 280 + stagger, y: 220 + r * S });
          }
          // Right side staggered (2 cols × 5 rows)
          for (let r = 0; r < 5; r++) {
            const stagger = r % 2 === 1 ? -40 : 0;
            t.push({ ...round8, name: `Table ${++n}`, x: 1180 + stagger, y: 220 + r * S });
            t.push({ ...round8, name: `Table ${++n}`, x: 1380 + stagger, y: 220 + r * S });
          }
          return t.slice(0, 20);
        })(),
      ],
      zones: [
        { type: 'stage', label: 'Stage / DJ', width: 350, height: 90, x: 630, y: 1350, color: '#e0e7ff' },
        { type: 'dancefloor', label: 'Dance Floor', width: 360, height: 360, x: 620, y: 450, color: '#fef3c7' },
      ],
    },
    {
      name: 'Estate Hall (mixed)',
      description: 'Head table at top, stage at bottom, staggered estate tables on sides',
      icon: '🍽️',
      tables: [
        { name: 'Head Table', shape: 'head-table', capacity: 14, width: 360, height: 60, x: 650, y: 60 },
        // Left side: 3 staggered estate tables
        { name: 'Estate 1', shape: 'rectangle', capacity: 16, width: 280, height: 70, x: 80, y: 250 },
        { name: 'Estate 2', shape: 'rectangle', capacity: 16, width: 280, height: 70, x: 130, y: 450 },
        { name: 'Estate 3', shape: 'rectangle', capacity: 16, width: 280, height: 70, x: 80, y: 650 },
        // Right side: 3 staggered estate tables
        { name: 'Estate 4', shape: 'rectangle', capacity: 16, width: 280, height: 70, x: 1280, y: 250 },
        { name: 'Estate 5', shape: 'rectangle', capacity: 16, width: 280, height: 70, x: 1230, y: 450 },
        { name: 'Estate 6', shape: 'rectangle', capacity: 16, width: 280, height: 70, x: 1280, y: 650 },
        // Round tables below dance floor
        ...Array.from({ length: 6 }, (_, i) => ({
          ...round10, name: `Table ${i + 1}`,
          x: 120 + i * 280, y: 950,
        })),
      ],
      zones: [
        { type: 'stage', label: 'Stage / DJ', width: 350, height: 90, x: 660, y: 1200, color: '#e0e7ff' },
        { type: 'dancefloor', label: 'Dance Floor', width: 400, height: 350, x: 630, y: 300, color: '#fef3c7' },
        { type: 'bar', label: 'Bar', width: 180, height: 60, x: 80, y: 1200, color: '#dbeafe' },
      ],
    },
    {
      name: 'Indian Wedding Reception (40 rounds)',
      description: 'Head table at top, stage/DJ at bottom, staggered tables left & right of dance floor',
      icon: '🪷',
      tables: [
        { name: 'Head Table', shape: 'head-table', capacity: 14, width: 400, height: 60, x: 750, y: 60 },
        ...(() => {
          const t = []; let n = 0;
          // Left side — 3 staggered columns × 7 rows
          for (let r = 0; r < 7; r++) {
            const stagger = r % 2 === 1 ? 45 : 0;
            t.push({ ...round10, name: `Table ${++n}`, x: 60 + stagger, y: 250 + r * 210 });
            t.push({ ...round10, name: `Table ${++n}`, x: 250 + stagger, y: 250 + r * 210 });
            t.push({ ...round10, name: `Table ${++n}`, x: 440 + stagger, y: 250 + r * 210 });
          }
          // Right side — 3 staggered columns × 7 rows
          for (let r = 0; r < 7; r++) {
            const stagger = r % 2 === 1 ? -45 : 0;
            t.push({ ...round10, name: `Table ${++n}`, x: 1360 + stagger, y: 250 + r * 210 });
            t.push({ ...round10, name: `Table ${++n}`, x: 1550 + stagger, y: 250 + r * 210 });
            t.push({ ...round10, name: `Table ${++n}`, x: 1740 + stagger, y: 250 + r * 210 });
          }
          return t.slice(0, 40);
        })(),
      ],
      zones: [
        { type: 'stage', label: 'Stage', width: 450, height: 100, x: 730, y: 1800, color: '#fee2e2' },
        { type: 'dj', label: 'DJ', width: 130, height: 60, x: 890, y: 1680, color: '#e0e7ff' },
        { type: 'dancefloor', label: 'Dance Floor', width: 460, height: 460, x: 720, y: 550, color: '#fef3c7' },
        { type: 'bar', label: 'Bar', width: 180, height: 60, x: 60, y: 1800, color: '#dbeafe' },
        { type: 'desserts', label: 'Desserts', width: 160, height: 60, x: 1750, y: 1800, color: '#fef9c3' },
        { type: 'gifts', label: 'Gifts & Cards', width: 140, height: 70, x: 1750, y: 60, color: '#fce7f3' },
        { type: 'photo', label: 'Photo Booth', width: 140, height: 80, x: 60, y: 60, color: '#f3e8ff' },
      ],
    },
    {
      name: 'Intimate Dinner (10 rounds)',
      description: 'Sweetheart table at top, staggered tables left & right of dance floor',
      icon: '💕',
      tables: [
        { name: 'Sweetheart', shape: 'round', capacity: 2, width: 70, height: 70, x: 650, y: 60 },
        // Left staggered (5)
        ...Array.from({ length: 5 }, (_, i) => ({
          ...round8, name: `Table ${i + 1}`,
          x: 150 + (i % 2 === 1 ? 40 : 0), y: 220 + i * S,
        })),
        // Right staggered (5)
        ...Array.from({ length: 5 }, (_, i) => ({
          ...round8, name: `Table ${i + 6}`,
          x: 1050 - (i % 2 === 1 ? 40 : 0), y: 220 + i * S,
        })),
      ],
      zones: [
        { type: 'dancefloor', label: 'Dance Floor', width: 320, height: 320, x: 540, y: 350, color: '#fef3c7' },
      ],
    },
    {
      name: 'Estate Tables + Stage (25 rounds)',
      description: 'Head table at top, stage/DJ at bottom, 3 estate tables in U around stage, staggered rounds on sides',
      icon: '👑',
      tables: [
        { name: 'Head Table', shape: 'head-table', capacity: 14, width: 400, height: 60, x: 700, y: 60 },
        // 3 estate tables in U-shape around stage at bottom
        { name: 'Estate Left', shape: 'rectangle', capacity: 14, width: 70, height: 300, x: 550, y: 1200 },
        { name: 'Estate Center', shape: 'rectangle', capacity: 16, width: 360, height: 70, x: 720, y: 1550 },
        { name: 'Estate Right', shape: 'rectangle', capacity: 14, width: 70, height: 300, x: 1180, y: 1200 },
        // Left side staggered rounds (2 cols × 5 rows = 10)
        ...(() => {
          const t = []; let n = 0;
          for (let r = 0; r < 5; r++) {
            const stagger = r % 2 === 1 ? 40 : 0;
            t.push({ ...round10, name: `Table ${++n}`, x: 60 + stagger, y: 220 + r * S });
            t.push({ ...round10, name: `Table ${++n}`, x: 260 + stagger, y: 220 + r * S });
          }
          return t;
        })(),
        // Right side staggered rounds (2 cols × 5 rows = 10)
        ...(() => {
          const t = []; let n = 10;
          for (let r = 0; r < 5; r++) {
            const stagger = r % 2 === 1 ? -40 : 0;
            t.push({ ...round10, name: `Table ${++n}`, x: 1400 + stagger, y: 220 + r * S });
            t.push({ ...round10, name: `Table ${++n}`, x: 1600 + stagger, y: 220 + r * S });
          }
          return t;
        })(),
        { ...round8, name: 'Table 21', x: 400, y: 60 },
      ],
      zones: [
        { type: 'stage', label: 'Stage / DJ', width: 360, height: 100, x: 720, y: 1680, color: '#e0e7ff' },
        { type: 'dancefloor', label: 'Dance Floor', width: 420, height: 380, x: 690, y: 420, color: '#fef3c7' },
        { type: 'bar', label: 'Bar', width: 180, height: 60, x: 60, y: 1550, color: '#dbeafe' },
      ],
    },
    {
      name: 'Ceremony — Mandap with Row Seating',
      description: 'Mandap at center, rows of chairs on both sides with center aisle',
      icon: '🔥',
      tables: (() => {
        const rows = [];
        const rowCount = 7;
        const seatsPerRow = 8;
        const centerX = 1200;
        const aisleGap = 100;
        const rowWidth = 400;
        const rowHeight = 40;
        const startY = 600;
        const rowSpacing = 140; // 40h + 60pad + 40gap

        for (let r = 0; r < rowCount; r++) {
          rows.push({
            name: `L${r + 1}`, shape: 'rectangle', capacity: seatsPerRow,
            width: rowWidth, height: rowHeight,
            x: centerX - aisleGap - rowWidth, y: startY + r * rowSpacing,
          });
          rows.push({
            name: `R${r + 1}`, shape: 'rectangle', capacity: seatsPerRow,
            width: rowWidth, height: rowHeight,
            x: centerX + aisleGap, y: startY + r * rowSpacing,
          });
        }
        return rows;
      })(),
      zones: [
        { type: 'stage', label: 'Mandap', width: 300, height: 220, x: 1050, y: 100, color: '#fee2e2' },
        { type: 'custom', label: 'Floral Arch', width: 200, height: 60, x: 1100, y: 400, color: '#fce7f3' },
        { type: 'custom', label: 'Aisle', width: 60, height: 980, x: 1170, y: 560, color: '#f1f5f9' },
        { type: 'entrance', label: 'Entrance', width: 140, height: 50, x: 1130, y: 1600, color: '#f1f5f9' },
      ],
    },
  ];
})();

// Small shape indicator for table presets (replaces emojis)
function TableShapeIcon({ shape }) {
  const base = "w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center bg-gray-100";
  switch (shape) {
    case 'round': return <div className={base}><Circle size={16} className="text-gray-500" /></div>;
    case 'rectangle': return <div className={base}><Minus size={16} className="text-gray-500" /></div>;
    case 'square': return <div className={base}><Square size={14} className="text-gray-500" /></div>;
    case 'oval': return <div className={base}><Circle size={16} className="text-gray-500 scale-x-150" /></div>;
    case 'head-table': return <div className={base}><Minus size={18} className="text-gray-500" /></div>;
    default: return <div className={base}><Grid3X3 size={14} className="text-gray-500" /></div>;
  }
}

function VenuePresetsPanel({ onApply, onClose }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Pick a layout that matches your venue. You can move, resize, add, or remove tables after.
      </p>
      <p className="text-xs text-amber-600 font-medium">⚠️ This will replace your current layout.</p>

      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
        {VENUE_LAYOUTS.map((layout, i) => (
          <button
            key={i}
            onClick={() => {
              if (confirm(`Apply "${layout.name}"? This replaces your current tables and zones.`)) {
                onApply(layout);
              }
            }}
            className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 hover:bg-wine-50 hover:border-wine-200 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-wine-50 flex items-center justify-center">
              <Grid3X3 size={18} className="text-wine-700" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{layout.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{layout.description}</div>
              <div className="text-xs text-gray-400 mt-1">
                {layout.tables.length} tables · {layout.tables.reduce((s, t) => s + t.capacity, 0)} seats
                {layout.zones.length > 0 && ` · ${layout.zones.length} zones`}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
