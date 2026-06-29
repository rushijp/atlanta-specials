import { Card } from '../components/ui';

export default function WeddingWebsite() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Wedding Website</h1>
        <p className="text-sm text-gray-500 mt-1">Your public wedding page for guests</p>
      </div>
      <Card title="Coming Soon">
        <p className="text-gray-500">Beautiful public wedding website with event details, RSVP, and cultural themes.</p>
      </Card>
    </div>
  );
}
