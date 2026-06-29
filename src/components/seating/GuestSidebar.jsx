import { useDraggable } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { Search, Users } from 'lucide-react';
import { useState } from 'react';

export default function GuestSidebar({
  guests,
  allGuests,
  filterSide,
  setFilterSide,
  filterFamily,
  setFilterFamily,
  families,
  assignedCount,
  totalCount,
}) {
  const [search, setSearch] = useState('');

  const filtered = guests.filter((g) => {
    if (!search) return true;
    const name = `${g.firstName} ${g.lastName} ${g.familyName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  // Group by family
  const grouped = {};
  filtered.forEach((g) => {
    const key = g.familyName || '(No Family)';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(g);
  });

  const { setNodeRef: setUnassignedRef } = useDroppable({ id: 'unassigned-zone' });

  return (
    <div className="w-72 flex-shrink-0 flex flex-col border border-gray-200 rounded-xl bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Unassigned Guests</h3>
          <span className="text-xs text-gray-400">{guests.length} left</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3">
          <div
            className="h-full bg-rose-500 rounded-full transition-all"
            style={{ width: `${totalCount > 0 ? (assignedCount / totalCount) * 100 : 0}%` }}
          />
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-1.5 text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterSide}
            onChange={(e) => setFilterSide(e.target.value)}
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs"
          >
            <option value="all">All Sides</option>
            <option value="bride">Bride</option>
            <option value="groom">Groom</option>
          </select>
          <select
            value={filterFamily}
            onChange={(e) => setFilterFamily(e.target.value)}
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs"
          >
            <option value="all">All Families</option>
            {families.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Guest list */}
      <div ref={setUnassignedRef} className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-8">
            {totalCount === 0 ? 'Add guests first' : 'All guests are seated! 🎉'}
          </div>
        ) : (
          Object.entries(grouped).map(([family, members]) => (
            <div key={family}>
              {family !== '(No Family)' && (
                <div className="flex items-center gap-1.5 px-2 mb-1">
                  <Users size={10} className="text-gray-400" />
                  <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{family}</span>
                  <span className="text-[10px] text-gray-300">({members.length})</span>
                </div>
              )}
              <div className="space-y-0.5">
                {members.map((guest) => (
                  <DraggableGuest key={guest.id} guest={guest} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DraggableGuest({ guest }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: guest.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-grab active:cursor-grabbing transition-colors
        ${isDragging ? 'opacity-50 bg-rose-100' : 'hover:bg-gray-50'}
      `}
    >
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${guest.side === 'bride' ? 'bg-rose-400' : 'bg-blue-400'}`} />
      <span className="font-medium text-gray-800 truncate">
        {guest.firstName} {guest.lastName}
      </span>
      {guest.tags?.includes('VIP') && (
        <span className="text-[9px] text-amber-600 font-bold">VIP</span>
      )}
    </div>
  );
}
