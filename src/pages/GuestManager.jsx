import { Card } from '../components/ui';

export default function GuestManager() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Guest List</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your guests, families, and invitations</p>
      </div>
      <Card title="Coming Soon">
        <p className="text-gray-500">Guest management with Excel import, family grouping, and bulk operations.</p>
      </Card>
    </div>
  );
}
