import { Card } from '../components/ui';

export default function BetsManager() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bets & Games</h1>
        <p className="text-sm text-gray-500 mt-1">Create fun wedding bets and games for your guests</p>
      </div>
      <Card title="Coming Soon">
        <p className="text-gray-500">Customizable wedding bets with leaderboard and real-time voting.</p>
      </Card>
    </div>
  );
}
