import { Card } from '../components/ui';

export default function PhotoGroupManager() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Photo Groups</h1>
        <p className="text-sm text-gray-500 mt-1">Manage photo group queues for your events</p>
      </div>
      <Card title="Coming Soon">
        <p className="text-gray-500">Rebuilt photo group manager with real-time sync and QR code display.</p>
      </Card>
    </div>
  );
}
