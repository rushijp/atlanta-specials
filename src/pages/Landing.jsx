import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import { APP_NAME, APP_TAGLINE } from '../config/constants';
import { Users, Calendar, Grid3X3, Mail, Camera, Trophy } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-sm">V</div>
          <span className="text-xl font-bold text-gray-900">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/register"><Button>Get Started</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center px-6 py-24 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Plan Your Indian Wedding,<br />
          <span className="text-rose-600">Without the Chaos</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          {APP_TAGLINE}. Built for multi-day celebrations with hundreds of guests, 
          multiple events, and complex family dynamics.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register"><Button size="lg">Start Planning Free</Button></Link>
          <Link to="/login"><Button variant="outline" size="lg">Sign In</Button></Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Everything Zola & WithJoy Can't Do
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={Calendar}
            title="Multi-Event Management"
            description="Mehndi, Sangeet, Haldi, Baraat, Ceremony, Reception — manage all your events with different guest lists for each."
          />
          <FeatureCard
            icon={Users}
            title="500+ Guest Scale"
            description="Built for Indian wedding guest counts. Family grouping, bulk import from Excel, and WhatsApp-friendly RSVP links."
          />
          <FeatureCard
            icon={Grid3X3}
            title="Smart Seating Chart"
            description="Drag-and-drop with variable table sizes (8-12+), family-aware seating, conflict rules, and instant printable place cards."
          />
          <FeatureCard
            icon={Mail}
            title="WhatsApp RSVP"
            description="No-login, single-tap RSVP via WhatsApp. Per-event responses. Automated reminders for non-responders."
          />
          <FeatureCard
            icon={Camera}
            title="Photo Group Manager"
            description="Real-time photo queue for your photographer. Display screen with QR code. Never miss a family photo combination."
          />
          <FeatureCard
            icon={Trophy}
            title="Wedding Games"
            description="Custom wedding bets and games with live leaderboard. Keep guests entertained between events."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-6 py-20 bg-rose-600">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to plan stress-free?</h2>
        <p className="text-rose-100 mb-8 text-lg">Free for up to 50 guests and 2 events. No credit card required.</p>
        <Link to="/register"><Button variant="secondary" size="lg">Create Your Wedding</Button></Link>
      </section>

      {/* Footer */}
      <footer className="text-center px-6 py-8 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} {APP_NAME}. Made with ❤️ for Indian weddings.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 mb-4">
        <Icon size={20} className="text-rose-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
