import { useState, useEffect, useCallback, useMemo } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, pointerWithin } from '@dnd-kit/core';
import { useWedding } from '../../contexts/WeddingContext';
import { subscribeToGuests } from '../../services/guestService';
import { subscribeToEvents } from '../../services/eventService';
import { subscribeToSeating, saveSeating } from '../../services/seatingService';
import { Button, Badge, Modal, Input } from '../ui';
import { Plus, ZoomIn, ZoomOut, Printer, Users, RotateCcw, Filter, Save } from 'lucide-react';
import { TABLE_DEFAULTS, TABLE_SHAPES } from '../../config/constants';
import TableComponent from './Table';
import GuestSidebar from './GuestSidebar';

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
  const [filterSide, setFilterSide] = useState('all');
  const [filterFamily, setFilterFamily] = useState('all');
  const [hasChanges, setHasChanges] = useState(false);

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

  // Save to Firestore
  const handleSave = useCallback(async () => {
    if (!activeWedding || !selectedEventId) return;
    await saveSeating(activeWedding.id, selectedEventId, { tables, rules });
    setHasChanges(false);
  }, [activeWedding, selectedEventId, tables, rules]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (!hasChanges) return;
    const timer = setTimeout(handleSave, 2000);
    return () => clearTimeout(timer);
  }, [hasChanges, handleSave]);

  // Add table
  const addTable = (shape) => {
    const defaults = TABLE_DEFAULTS[shape];
    const newTable = {
      id: uid(),
      name: `Table ${tables.length + 1}`,
      shape,
      capacity: defaults.capacity,
      width: defaults.width,
      height: defaults.height,
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 300,
      assignedGuests: [],
    };
    setTables((prev) => [...prev, newTable]);
    setHasChanges(true);
    setShowAddTable(false);
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

    // Check capacity
    const currentCount = (targetTable.assignedGuests || []).length;
    if (currentCount >= targetTable.capacity && !(targetTable.assignedGuests || []).includes(guestId)) {
      return; // Over capacity
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

  return (
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
        <div className="flex-1 flex flex-col">
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
              <Plus size={14} /> Add Table
            </Button>

            {hasChanges && (
              <Button size="sm" onClick={handleSave}>
                <Save size={14} /> Save
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer size={14} />
            </Button>
          </div>

          {/* Canvas */}
          <div
            className="flex-1 rounded-xl border border-gray-200 bg-white overflow-auto relative"
          >
            {events.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Add events first to start seating</p>
              </div>
            ) : tables.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <Grid3XIcon />
                <p>Add tables to get started</p>
                <Button size="sm" onClick={() => setShowAddTable(true)}>
                  <Plus size={14} /> Add Table
                </Button>
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
                {tables.map((table) => (
                  <TableComponent
                    key={table.id}
                    table={table}
                    guests={guests}
                    onUpdate={(updates) => updateTable(table.id, updates)}
                    onRemove={() => removeTable(table.id)}
                    onDrag={(dx, dy) => handleTableDrag(table.id, dx, dy)}
                    rules={rules}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>{tables.length} tables</span>
            <span>{assignedGuestIds.size} / {guests.length} guests seated</span>
            <span>{guests.length - assignedGuestIds.size} unassigned</span>
            {hasChanges && <span className="text-amber-600">● Unsaved changes</span>}
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggedGuest && (
          <div className="rounded-lg bg-rose-600 text-white px-3 py-1.5 text-sm font-medium shadow-lg">
            {draggedGuest.firstName} {draggedGuest.lastName}
          </div>
        )}
      </DragOverlay>

      {/* Add table modal */}
      <Modal open={showAddTable} onClose={() => setShowAddTable(false)} title="Add Table" size="sm">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Choose a table shape:</p>
          <div className="grid grid-cols-3 gap-3">
            <TableShapeButton shape="round" label="Round" seats="10" onClick={() => addTable('round')} />
            <TableShapeButton shape="rectangle" label="Rectangle" seats="8" onClick={() => addTable('rectangle')} />
            <TableShapeButton shape="square" label="Square" seats="4" onClick={() => addTable('square')} />
          </div>
        </div>
      </Modal>
    </DndContext>
  );
}

function TableShapeButton({ shape, label, seats, onClick }) {
  const shapeStyles = {
    round: 'rounded-full w-16 h-16',
    rectangle: 'rounded-lg w-20 h-12',
    square: 'rounded-lg w-14 h-14',
  };

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 hover:bg-rose-50 hover:border-rose-200 transition-colors"
    >
      <div className={`border-2 border-gray-400 ${shapeStyles[shape]}`} />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-gray-400">{seats} seats</span>
    </button>
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
