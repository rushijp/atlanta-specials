import EventList from '../components/events/EventList';

export default function EventManager() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your wedding events — Mehndi, Sangeet, Ceremony, Reception & more</p>
      </div>
      <EventList />
    </div>
  );
}
