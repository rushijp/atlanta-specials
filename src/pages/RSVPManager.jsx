import { Card } from '../components/ui';

export default function RSVPManager() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">RSVP</h1>
        <p className="text-sm text-gray-500 mt-1">Track responses and manage guest RSVPs per event</p>
      </div>
      <Card title="Coming Soon">
        <p className="text-gray-500">Per-event RSVP tracking with WhatsApp-friendly links and real-time response dashboard.</p>
      </Card>
    </div>
  );
}
