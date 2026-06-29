import { useState, useRef, useCallback } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Trash2, Edit3, GripVertical } from 'lucide-react';

export default function TableComponent({ table, guests, onUpdate, onRemove, onDrag }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(table.name);
  const [editCapacity, setEditCapacity] = useState(table.capacity);
  const dragStart = useRef(null);

  const { setNodeRef, isOver } = useDroppable({ id: table.id });

  const assignedGuests = (table.assignedGuests || [])
    .map((id) => guests.find((g) => g.id === id))
    .filter(Boolean);

  const isOverCapacity = assignedGuests.length > table.capacity;

  // Table position dragging via dedicated handle
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

  const handleSaveEdit = () => {
    onUpdate({ name: editName, capacity: parseInt(editCapacity) || table.capacity });
    setIsEditing(false);
  };

  const shapeStyles = {
    round: 'rounded-full',
    rectangle: 'rounded-xl',
    square: 'rounded-xl',
  };

  // Compute chip positions around the table
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
      {/* Table shape — centered within the larger hit area */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 30,
          width: table.width,
          height: table.height,
        }}
        className={`
          border-2 flex flex-col items-center justify-center transition-colors
          ${shapeStyles[table.shape]}
          ${isOver ? 'border-rose-500 bg-rose-50 shadow-lg ring-2 ring-rose-300' : isOverCapacity ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}
        `}
      >
        {isEditing ? (
          <div className="flex flex-col items-center gap-1 p-1" onMouseDown={(e) => e.stopPropagation()}>
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
      </div>

      {/* Hover actions — positioned above the table shape */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 hidden group-hover:flex gap-1 bg-white rounded-lg shadow-md border px-1 py-0.5 z-10">
        <button
          onMouseDown={handleGripMouseDown}
          className="p-1 rounded hover:bg-gray-100 cursor-move"
          title="Move table"
        >
          <GripVertical size={12} className="text-gray-500" />
        </button>
        <button onClick={() => { setEditName(table.name); setEditCapacity(table.capacity); setIsEditing(true); }} className="p-1 rounded hover:bg-gray-100" title="Edit">
          <Edit3 size={12} className="text-gray-500" />
        </button>
        <button onClick={onRemove} className="p-1 rounded hover:bg-red-50" title="Remove">
          <Trash2 size={12} className="text-red-500" />
        </button>
      </div>

      {/* Guest chips around the table — each is draggable */}
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
