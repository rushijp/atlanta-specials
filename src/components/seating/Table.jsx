import { useState, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Trash2, Edit3, Settings } from 'lucide-react';
import { Badge } from '../ui';

export default function TableComponent({ table, guests, onUpdate, onRemove, onDrag, rules }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(table.name);
  const [editCapacity, setEditCapacity] = useState(table.capacity);
  const dragRef = useRef(null);
  const dragStart = useRef(null);

  const { setNodeRef, isOver } = useDroppable({ id: table.id });

  const assignedGuests = (table.assignedGuests || [])
    .map((id) => guests.find((g) => g.id === id))
    .filter(Boolean);

  const isOverCapacity = assignedGuests.length > table.capacity;
  const fillPercent = Math.min(assignedGuests.length / table.capacity, 1);

  // Table dragging (not DnD kit — we use native mouse events)
  const handleMouseDown = (e) => {
    if (e.target.closest('[data-no-drag]')) return;
    e.stopPropagation();
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
  };

  const handleSaveEdit = () => {
    onUpdate({ name: editName, capacity: parseInt(editCapacity) || table.capacity });
    setIsEditing(false);
  };

  const shapeStyles = {
    round: 'rounded-full',
    rectangle: 'rounded-xl',
    square: 'rounded-xl',
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: table.x,
        top: table.y,
        width: table.width,
        height: table.height,
      }}
      className="group"
      onMouseDown={handleMouseDown}
    >
      {/* Table shape */}
      <div
        className={`
          relative w-full h-full border-2 flex flex-col items-center justify-center cursor-move transition-colors
          ${shapeStyles[table.shape]}
          ${isOver ? 'border-rose-500 bg-rose-50 shadow-lg' : isOverCapacity ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}
          ${isOver ? 'ring-2 ring-rose-300' : ''}
        `}
      >
        {/* Table name and count */}
        {isEditing ? (
          <div data-no-drag className="flex flex-col items-center gap-1 p-1">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-20 text-center text-xs border rounded px-1 py-0.5"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
            />
            <input
              type="number"
              value={editCapacity}
              onChange={(e) => setEditCapacity(e.target.value)}
              className="w-16 text-center text-xs border rounded px-1 py-0.5"
              min="1"
              max="20"
            />
            <button onClick={handleSaveEdit} className="text-xs text-rose-600 font-medium">Save</button>
          </div>
        ) : (
          <>
            <span className="text-xs font-semibold text-gray-700 leading-tight">{table.name}</span>
            <span className={`text-xs ${isOverCapacity ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
              {assignedGuests.length}/{table.capacity}
            </span>
          </>
        )}

        {/* Hover actions */}
        <div data-no-drag className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex gap-1 bg-white rounded-lg shadow-md border px-1 py-0.5">
          <button onClick={() => { setEditName(table.name); setEditCapacity(table.capacity); setIsEditing(true); }} className="p-1 rounded hover:bg-gray-100" title="Edit">
            <Edit3 size={12} className="text-gray-500" />
          </button>
          <button onClick={onRemove} className="p-1 rounded hover:bg-red-50" title="Remove">
            <Trash2 size={12} className="text-red-500" />
          </button>
        </div>
      </div>

      {/* Guest chips around the table */}
      <div className="absolute inset-0 pointer-events-none">
        {assignedGuests.map((guest, i) => {
          const angle = (i / Math.max(assignedGuests.length, 1)) * 2 * Math.PI - Math.PI / 2;
          const rx = table.width / 2 + 30;
          const ry = table.height / 2 + 20;
          const cx = table.width / 2;
          const cy = table.height / 2;
          const x = cx + rx * Math.cos(angle);
          const y = cy + ry * Math.sin(angle);

          // Check if guest has family members at same table
          const familyAtTable = guest.familyName && assignedGuests.some(
            (g) => g.id !== guest.id && g.familyName === guest.familyName
          );

          return (
            <div
              key={guest.id}
              style={{ position: 'absolute', left: x - 28, top: y - 10 }}
              className={`
                pointer-events-auto text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap max-w-[60px] truncate font-medium
                ${familyAtTable ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300' : 'bg-gray-100 text-gray-700'}
              `}
              title={`${guest.firstName} ${guest.lastName}${guest.familyName ? ` (${guest.familyName})` : ''}`}
            >
              {guest.firstName}
            </div>
          );
        })}
      </div>
    </div>
  );
}
