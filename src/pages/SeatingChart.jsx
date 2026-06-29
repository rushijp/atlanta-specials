import SeatingCanvas from '../components/seating/SeatingCanvas';

export default function SeatingChart() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Seating Chart</h1>
        <p className="text-sm text-gray-500 mt-1">Drag and drop guests to arrange tables</p>
      </div>
      <SeatingCanvas />
    </div>
  );
}
