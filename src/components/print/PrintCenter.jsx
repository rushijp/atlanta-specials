import { useState, useEffect } from 'react';
import { useWedding } from '../../contexts/WeddingContext';
import { subscribeToGuests } from '../../services/guestService';
import { subscribeToEvents } from '../../services/eventService';
import { subscribeToSeating } from '../../services/seatingService';
import { generatePlaceCardsPDF, generateTableAssignmentPDF, generateGuestListPDF } from './pdfGenerators';
import { Button, Card } from '../ui';
import { Printer, Download, CreditCard, List, Grid3X3, Eye } from 'lucide-react';

export default function PrintCenter() {
  const { activeWedding } = useWedding();
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [tables, setTables] = useState([]);
  const [generating, setGenerating] = useState('');

  // Place card options
  const [showTable, setShowTable] = useState(true);
  const [showDietary, setShowDietary] = useState(true);
  const [showFamily, setShowFamily] = useState(false);
  const [cardStyle, setCardStyle] = useState('elegant');

  useEffect(() => {
    if (!activeWedding) return;
    const unsub1 = subscribeToGuests(activeWedding.id, setGuests);
    const unsub2 = subscribeToEvents(activeWedding.id, (evts) => {
      setEvents(evts);
      if (!selectedEventId && evts.length > 0) setSelectedEventId(evts[0].id);
    });
    return () => { unsub1(); unsub2(); };
  }, [activeWedding]);

  // Load seating for selected event
  useEffect(() => {
    if (!activeWedding || !selectedEventId) return;
    return subscribeToSeating(activeWedding.id, selectedEventId, (data) => {
      setTables(data.tables || []);
    });
  }, [activeWedding, selectedEventId]);

  // Build guest list with table assignments for the selected event
  const guestsWithTables = guests.map((g) => {
    const table = tables.find((t) => (t.assignedGuests || []).includes(g.id));
    return { ...g, tableName: table?.name || '' };
  });

  const seatedGuests = guestsWithTables.filter((g) => g.tableName);

  const handleGeneratePlaceCards = () => {
    setGenerating('placecards');
    try {
      const doc = generatePlaceCardsPDF(seatedGuests, {
        eventName: events.find((e) => e.id === selectedEventId)?.name || '',
        showTable,
        showDietary,
        showFamily,
        cardStyle,
      });
      doc.save(`place-cards-${selectedEventId || 'all'}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
    setGenerating('');
  };

  const handleGenerateTableSheet = () => {
    setGenerating('tables');
    try {
      const doc = generateTableAssignmentPDF(tables, guests, {
        eventName: events.find((e) => e.id === selectedEventId)?.name || '',
        showDietary,
      });
      doc.save(`table-assignments-${selectedEventId || 'all'}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
    setGenerating('');
  };

  const handleGenerateGuestList = () => {
    setGenerating('guestlist');
    try {
      const doc = generateGuestListPDF(guests, events);
      doc.save('guest-list.pdf');
    } catch (err) {
      console.error('PDF generation error:', err);
    }
    setGenerating('');
  };

  if (!activeWedding) return null;

  return (
    <div className="space-y-6">
      {/* Event selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Event:</label>
        <select
          value={selectedEventId || ''}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {events.map((evt) => <option key={evt.id} value={evt.id}>{evt.name}</option>)}
        </select>
        <span className="text-xs text-gray-400">
          {seatedGuests.length} guests seated at {tables.length} tables
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Place Cards */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-lg bg-wine-50 flex items-center justify-center">
              <CreditCard size={20} className="text-wine-700" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Place Cards</h3>
              <p className="text-xs text-gray-400">Tent-fold cards for each guest</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <label className="text-xs font-medium text-gray-600 block">Style</label>
            <div className="flex gap-1">
              {['elegant', 'modern', 'minimal'].map((s) => (
                <button
                  key={s}
                  onClick={() => setCardStyle(s)}
                  className={`px-3 py-1 rounded-full text-xs capitalize transition-colors ${
                    cardStyle === s ? 'bg-wine-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={showTable} onChange={(e) => setShowTable(e.target.checked)} className="rounded border-gray-300 text-wine-700 focus:ring-wine-600" />
                Show table name
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={showDietary} onChange={(e) => setShowDietary(e.target.checked)} className="rounded border-gray-300 text-wine-700 focus:ring-wine-600" />
                Show dietary (Veg/Jain)
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={showFamily} onChange={(e) => setShowFamily(e.target.checked)} className="rounded border-gray-300 text-wine-700 focus:ring-wine-600" />
                Show family name
              </label>
            </div>
          </div>

          <Button
            size="sm"
            className="w-full"
            onClick={handleGeneratePlaceCards}
            disabled={seatedGuests.length === 0 || generating === 'placecards'}
          >
            <Download size={14} />
            {generating === 'placecards' ? 'Generating...' : `Download (${seatedGuests.length} cards)`}
          </Button>
        </div>

        {/* Table Assignments */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Grid3X3 size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Table Assignments</h3>
              <p className="text-xs text-gray-400">List per table for venue staff</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Clean printout showing each table's guest list with seating count,
            family names, and dietary indicators. Perfect for venue coordinators.
          </p>

          <Button
            size="sm"
            className="w-full"
            variant="outline"
            onClick={handleGenerateTableSheet}
            disabled={tables.length === 0 || generating === 'tables'}
          >
            <Download size={14} />
            {generating === 'tables' ? 'Generating...' : `Download (${tables.length} tables)`}
          </Button>
        </div>

        {/* Guest List */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <List size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Full Guest List</h3>
              <p className="text-xs text-gray-400">All guests with RSVP status</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Landscape PDF with all guests sorted alphabetically. Includes family,
            side, dietary, phone, and RSVP status per event. Great for check-in at the door.
          </p>

          <Button
            size="sm"
            className="w-full"
            variant="outline"
            onClick={handleGenerateGuestList}
            disabled={guests.length === 0 || generating === 'guestlist'}
          >
            <Download size={14} />
            {generating === 'guestlist' ? 'Generating...' : `Download (${guests.length} guests)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
