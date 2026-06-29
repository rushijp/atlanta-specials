import { Card } from '../components/ui';

export default function SeatingChart() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Seating Chart</h1>
        <p className="text-sm text-gray-500 mt-1">Drag and drop guests to arrange tables</p>
      </div>
      <Card title="Coming Soon">
        <p className="text-gray-500">Interactive seating chart with variable table sizes, family grouping, and print-ready exports.</p>
      </Card>
    </div>
  );
}
