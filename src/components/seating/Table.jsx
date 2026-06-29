import { useState, useRef, useCallback } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Trash2, Edit3, GripVertical, Check, Users, X } from 'lucide-react';

const SHAPE_OPTIONS = [
  { value: 'round', label: 'Round' },
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'square', label: 'Square' },
  { value: 'oval', label: 'Oval' },
  { value: 'u-shape', label: 'U-Shape' },
  { value: 'head-table', label: 'Head Table' },
  { value: 'cocktail', label: 'Cocktail' },
  { value: 'custom', label: 'Custom' },
];

const SHAPE_DEFAULTS = {
  round: { width: 120, height: 120, capacity: 10 },
  rectangle: { width: 200, height: 80, capacity: 10 },
  square: { width: 120, height: 120, capacity: 8 },
  oval: { width: 180, height: 120, capacity: 10 },
  'u-shape': { width: 200, height: 160, capacity: 18 },
  'head-table': { width: 300, height: 60, capacity: 12 },
  cocktail: { width: 60, height: 60, capacity: 4 },
  custom: { width: 150, height: 100, capacity: 10 },
};

const DIETARY_ICONS = {
  vegetarian: '🥬',
  vegan: '🌱',
  'non-veg': '🍗',
  jain: '🙏',
  other: '🍽️',
};

export default function TableComponent({ table, guests, onUpdate, onRemove, onDrag, onRemoveGuest }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showGuestPanel, setShowGuestPanel] = useState(false);
  const [editForm, setEditForm] = useState({});
  const dragStart = useRef(null);

  const { setNodeRef, isOver } = useDroppable({ id: table.id });

  const assignedGuests = (table.assignedGuests || [])
    .map((id) => guests.find((g) => g.id === id))
    .filter(Boolean);

  const isOverCapacity = assignedGuests.length > table.capacity;

  // Group guests by family for the panel
  const guestsByFamily = assignedGuests.reduce((acc, g) => {
    const key = g.familyName || '__individual';
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  const handleGripMouseDown = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    dragStart.current = { x: e.clientX, y: e.clientY };

    const handleMove = (me) => {
      if (!dragStart.current) return;
      const dx = me.clientX - dragStart.current.x;
      const dy = me.clientY - dragStart.current.y;
      dragStart.current = { x: me.clientX, y: me.clientY };
      onDrag(dx, dy);
    };

    const handleUp = () => {
      dragStart.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [onDrag]);

  const startEdit = () => {
    setEditForm({
      name: table.name,
      capacity: table.capacity,
      shape: table.shape,
      width: table.width,
      height: table.height,
    });
    setIsEditing(true);
    setShowGuestPanel(false);
  };

  const handleSaveEdit = () => {
    onUpdate({
      name: editForm.name,
      capacity: parseInt(editForm.capacity) || table.capacity,
      shape: editForm.shape,
      width: parseInt(editForm.width) || table.width,
      height: parseInt(editForm.height) || table.height,
    });
    setIsEditing(false);
  };

  const handleShapeChange = (newShape) => {
    const defaults = SHAPE_DEFAULTS[newShape] || SHAPE_DEFAULTS.round;
    setEditForm((f) => ({ ...f, shape: newShape, width: defaults.width, height: defaults.height, capacity: defaults.capacity }));
  };

  const handleTableClick = (e) => {
    if (isEditing) return;
    e.stopPropagation();
    setShowGuestPanel((prev) => !prev);
  };

  const handleRemoveGuest = (guestId) => {
    if (onRemoveGuest) {
      onRemoveGuest(guestId);
    } else {
      // Fallback: update table's assignedGuests directly
      onUpdate({ assignedGuests: (table.assignedGuests || []).filter((id) => id !== guestId) });
    }
  };

  const shapeStyles = {
    round: 'rounded-full',
    oval: 'rounded-full',
    rectangle: 'rounded-xl',
    square: 'rounded-xl',
    'u-shape': 'rounded-xl',
    'head-table': 'rounded-lg',
    cocktail: 'rounded-full',
    custom: 'rounded-xl',
  };

  const chipPositions = assignedGuests.map((guest, i) => {
    const angle = (i / Math.max(assignedGuests.length, 1)) * 2 * Math.PI - Math.PI / 2;
    const rx = table.width / 2 + 35;
    const ry = table.height / 2 + 25;
    const cx = table.width / 2;
    const cy = table.height / 2;
    return {
      guest,
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
      familyAtTable: guest.familyName && assignedGuests.some(
        (g) => g.id !== guest.id && g.familyName === guest.familyName
      ),
    };
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: table.x,
        top: table.y,
        width: table.width + 80,
        height: table.height + 60,
      }}
      className="group"
    >
      {/* Table shape */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 30,
          width: table.width,
          height: table.height,
        }}
        className={`
          border-2 flex flex-col items-center justify-center transition-colors cursor-pointer
          ${shapeStyles[table.shape]}
          ${isOver ? 'border-rose-500 bg-rose-50 shadow-lg ring-2 ring-rose-300' : isOverCapacity ? 'border-red-400 bg-red-50' : showGuestPanel ? 'border-rose-400 bg-rose-50/50 ring-1 ring-rose-200' : 'border-gray-300 bg-white hover:border-gray-400'}
        `}
        onClick={handleTableClick}
        onDoubleClick={(e) => { e.stopPropagation(); startEdit(); }}
      >
        {/* Edit panel */}
        {isEditing ? (
          <div className="absolute -left-2 -top-2 z-30 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-56" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Shape</label>
                <select
                  value={editForm.shape}
                  onChange={(e) => handleShapeChange(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                >
                  {SHAPE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Seats</label>
                  <input type="number" min="1" max="50" value={editForm.capacity}
                    onChange={(e) => setEditForm((f) => ({ ...f, capacity: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">W</label>
                  <input type="number" min="40" max="500" value={editForm.width}
                    onChange={(e) => setEditForm((f) => ({ ...f, width: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">H</label>
                  <input type="number" min="40" max="500" value={editForm.height}
                    onChange={(e) => setEditForm((f) => ({ ...f, height: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
                </div>
              </div>
              <div className="flex gap-1.5 pt-1">
                <button onClick={handleSaveEdit}
                  className="flex-1 flex items-center justify-center gap-1 rounded-md bg-rose-600 text-white text-xs py-1.5 font-medium hover:bg-rose-700">
                  <Check size={12} /> Save
                </button>
                <button onClick={() => setIsEditing(false)}
                  className="flex-1 rounded-md border border-gray-300 text-xs py-1.5 font-medium text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <span className="text-xs font-semibold text-gray-700 leading-tight">{table.name}</span>
        <span className={`text-xs ${isOverCapacity ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
          {assignedGuests.length}/{table.capacity}
        </span>
      </div>

      {/* Guest list popover — shows on click */}
      {showGuestPanel && !isEditing && assignedGuests.length > 0 && (
        <div
          className="absolute z-20 bg-white rounded-xl shadow-xl border border-gray-200 w-64 max-h-80 overflow-hidden"
          style={{ left: table.width + 50, top: 0 }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-rose-500" />
              <span className="text-xs font-semibold text-gray-700">{table.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isOverCapacity ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                {assignedGuests.length}/{table.capacity}
              </span>
            </div>
            <button onClick={() => setShowGuestPanel(false)} className="p-0.5 rounded hover:bg-gray-200 text-gray-400">
              <X size={12} />
            </button>
          </div>

          {/* Guest list grouped by family */}
          <div className="overflow-y-auto max-h-64 p-2 space-y-2">
            {Object.entries(guestsByFamily).map(([family, members]) => (
              <div key={family}>
                {family !== '__individual' && (
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      👨‍👩‍👧‍👦 {family}
                    </span>
                  </div>
                )}
                {members.map((guest) => (
                  <div key={guest.id} className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-gray-50 group/item">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate">
                        {guest.firstName} {guest.lastName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {guest.dietary && (
                          <span className="text-[10px] text-gray-500" title={guest.dietary}>
                            {DIETARY_ICONS[guest.dietary] || '🍽️'} {guest.dietary}
                          </span>
                        )}
                        {guest.side && (
                          <span className={`text-[10px] px-1 py-0.5 rounded ${guest.side === 'bride' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>
                            {guest.side}
                          </span>
                        )}
                        {(guest.tags || []).includes('VIP') && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-yellow-50 text-yellow-700">⭐ VIP</span>
                        )}
                        {(guest.tags || []).includes('Elderly') && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-purple-50 text-purple-600">👴 Elderly</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveGuest(guest.id)}
                      className="opacity-0 group-hover/item:opacity-100 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-opacity flex-shrink-0"
                      title="Remove from table"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Footer with quick stats */}
          <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex items-center gap-2 text-[10px] text-gray-500">
            {Object.keys(guestsByFamily).filter(k => k !== '__individual').length > 0 && (
              <span>{Object.keys(guestsByFamily).filter(k => k !== '__individual').length} families</span>
            )}
            {assignedGuests.filter(g => g.dietary === 'vegetarian' || g.dietary === 'jain' || g.dietary === 'vegan').length > 0 && (
              <span>🥬 {assignedGuests.filter(g => g.dietary === 'vegetarian' || g.dietary === 'jain' || g.dietary === 'vegan').length} veg</span>
            )}
            {assignedGuests.filter(g => g.dietary === 'non-veg').length > 0 && (
              <span>🍗 {assignedGuests.filter(g => g.dietary === 'non-veg').length} non-veg</span>
            )}
          </div>
        </div>
      )}

      {/* Empty table click hint */}
      {showGuestPanel && !isEditing && assignedGuests.length === 0 && (
        <div
          className="absolute z-20 bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2"
          style={{ left: table.width + 50, top: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs text-gray-500">No guests seated yet.</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Drag guests from the sidebar onto this table.</p>
        </div>
      )}

      {/* Hover actions */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 hidden group-hover:flex gap-1 bg-white rounded-lg shadow-md border px-1 py-0.5 z-10">
        <button
          onMouseDown={handleGripMouseDown}
          className="p-1 rounded hover:bg-gray-100 cursor-move"
          title="Move table"
        >
          <GripVertical size={12} className="text-gray-500" />
        </button>
        <button onClick={startEdit} className="p-1 rounded hover:bg-gray-100" title="Edit (or double-click table)">
          <Edit3 size={12} className="text-gray-500" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setShowGuestPanel(true); }} className="p-1 rounded hover:bg-gray-100" title="View guests">
          <Users size={12} className="text-gray-500" />
        </button>
        <button onClick={onRemove} className="p-1 rounded hover:bg-red-50" title="Remove table">
          <Trash2 size={12} className="text-red-500" />
        </button>
      </div>

      {/* Guest chips around the table */}
      {chipPositions.map(({ guest, x, y, familyAtTable }) => (
        <SeatedGuestChip
          key={guest.id}
          guest={guest}
          x={x}
          y={y}
          familyAtTable={familyAtTable}
        />
      ))}
    </div>
  );
}

function SeatedGuestChip({ guest, x, y, familyAtTable }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: guest.id,
    data: { fromTable: true },
  });

  const style = {
    position: 'absolute',
    left: x - 28,
    top: y - 10,
    ...(transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: 1000,
    } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap max-w-[60px] truncate font-medium cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-50 ring-2 ring-rose-400' : ''}
        ${familyAtTable ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300' : 'bg-gray-100 text-gray-700'}
      `}
      title={`${guest.firstName} ${guest.lastName}${guest.familyName ? ` (${guest.familyName})` : ''}`}
    >
      {guest.firstName}
    </div>
  );
}
