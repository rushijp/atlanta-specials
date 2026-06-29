import { useState } from 'react';
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-sm">P</div>
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
          Built for Indian Weddings, From the Ground Up
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

      {/* How It Works — Example Scenarios */}
      <section className="px-6 py-16 max-w-6xl mx-auto bg-white">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          See How It Works
        </h2>
        <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
          Real scenarios from Indian weddings — and how Phera handles them effortlessly.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ScenarioCard
            emoji="👨‍👩‍👧‍👦"
            title="The 400-Guest Patel Wedding"
            problem="Guest list spread across 5 WhatsApp groups, 3 Excel sheets, and Mom's notebook."
            solution="Import all lists into one place. Auto-detect duplicates. Group by family. Assign 80 people to Mehndi, 400 to Reception — in minutes."
          />
          <ScenarioCard
            emoji="🪑"
            title="Seating 50 Tables at the Reception"
            problem="Uncle Raj and Uncle Mohan can't be at the same table. The Shahs need a table of 12, not 10."
            solution="Drag-and-drop seating with custom table sizes (8, 10, 12+). Set 'keep apart' rules. Print place cards instantly — no Canva needed."
          />
          <ScenarioCard
            emoji="📱"
            title="Getting RSVPs from Nani"
            problem="Grandmother doesn't use apps, email, or even WhatsApp well. How do you get her RSVP?"
            solution="Send a simple WhatsApp link — one tap to respond. Large text, no login required. Works for everyone from Gen Z cousins to grandparents."
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <FAQItem
            question="How is Phera different from other wedding websites?"
            answer="Phera is built specifically for Indian weddings. We handle multiple events (Mehndi, Sangeet, Haldi, Ceremony, Reception), support 500+ guest lists, family-group RSVPs, variable table sizes for seating, and cultural dietary options like Jain and vegetarian — things generic wedding sites don't do well."
          />
          <FAQItem
            question="Can I import my existing guest list?"
            answer="Yes! Upload any Excel (.xlsx) or CSV file. Phera auto-detects columns like Name, Family, Side, Dietary, and Table #. You get a preview before importing, and we catch duplicates automatically. You can also download our pre-made template with example data."
          />
          <FAQItem
            question="How does the seating chart work?"
            answer="Drag and drop guests onto tables. Choose round, rectangle, or square tables with custom capacities (8, 10, 11, 12+). Phera highlights family members seated together, warns you about over-capacity tables, and lets you print place cards and table assignment sheets directly."
          />
          <FAQItem
            question="Can different events have different guest lists?"
            answer="Absolutely. Your Mehndi might have 80 guests while your Reception has 500. Each event has its own invite list, RSVP tracking, and seating arrangement. Guests only see the events they're invited to."
          />
          <FAQItem
            question="Do my guests need to create an account?"
            answer="No. Guests RSVP through a simple link — no login, no app download, no account needed. They search their name, see their events, and respond. It's designed to work for everyone, including elderly family members."
          />
          <FAQItem
            question="Is Phera free?"
            answer="Phera is free for up to 50 guests and 2 events — perfect for smaller functions or trying it out. For larger weddings, our premium plan removes all limits and unlocks features like Excel import, print exports, and the full seating chart."
          />
          <FAQItem
            question="Can I print place cards and table assignments?"
            answer="Yes. Once your seating chart is set, you can generate printable place cards (guest name + table number), a table-by-table assignment list, and an alphabetical guest lookup sheet — all ready for printing, no other tools needed."
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

function ScenarioCard({ emoji, title, problem, solution }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
      <span className="text-3xl mb-3 block">{emoji}</span>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="mb-3">
        <p className="text-xs font-medium text-red-500 uppercase tracking-wider mb-1">The Problem</p>
        <p className="text-sm text-gray-600">{problem}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">With Phera</p>
        <p className="text-sm text-gray-700">{solution}</p>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="text-sm font-semibold text-gray-900">{question}</span>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
