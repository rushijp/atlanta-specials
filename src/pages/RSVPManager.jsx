import RSVPAdmin from '../components/rsvp/RSVPAdmin';
import CollaboratorsPanel from '../components/collaboration/CollaboratorsPanel';
import { useWedding } from '../contexts/WeddingContext';

export default function RSVPManager() {
  const { isViewer } = useWedding();

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">RSVP</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track responses and manage guest RSVPs per event
            {isViewer && <span className="ml-2 text-amber-600 font-medium">(Read-only)</span>}
          </p>
        </div>
        <RSVPAdmin />
      </div>
      <div className="w-80 flex-shrink-0 hidden lg:block">
        <CollaboratorsPanel />
      </div>
    </div>
  );
}
