import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import { APP_NAME } from '../config/constants';
import { Users, Calendar, Grid3X3, Mail, Camera, Trophy, ArrowRight, Check, Sparkles } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-ivory-50 font-body">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-wine-700 to-wine-900 text-white font-display font-bold text-sm shadow-sm">P</div>
          <span className="text-xl font-display font-bold text-gray-900 tracking-tight">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/register"><Button>Start Planning</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center px-6 pt-20 pb-24 max-w-4xl mx-auto animate-fade-in">
        <p className="text-sm font-medium text-wine-600 tracking-wide uppercase mb-4">For weddings with 200, 500, or 1000+ guests</p>
        <h1 className="text-5xl md:text-6xl font-display font-bold text-gray-900 leading-[1.1] mb-6">
          The only planner built for<br />
          <span className="text-wine-700">Indian weddings</span>
        </h1>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Six events. Four hundred guests. Three Excel sheets taped together with WhatsApp forwards. 
          Sound familiar? Phera replaces the mess with one calm place to manage it all.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="shadow-glow">
              Start Planning Free <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">Free for up to 100 guests. No credit card.</p>
      </section>

      {/* Social proof bar */}
      <div className="border-y border-gray-200/60 bg-white/60 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center gap-8 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><Check size={14} className="text-green-600" /> Multi-event support</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-green-600" /> Family-group RSVPs</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-green-600" /> Drag & drop seating</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-green-600" /> Printable place cards</span>
        </div>
      </div>

      {/* Features */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-3">
            Every feature your shaadi actually needs
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            We studied what breaks during Indian wedding planning and built solutions for each one.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={Calendar}
            title="Multi-Event, Multi-Day"
            description="Mehndi with 80 guests, Sangeet with 200, Reception with 500. Each event gets its own invite list, timeline, and dress code."
          />
          <FeatureCard
            icon={Users}
            title="Built for Scale"
            description="Import 500 guests from Excel in one click. Auto-group by family. Filter by side, dietary, or tags. Search across the whole list instantly."
          />
          <FeatureCard
            icon={Grid3X3}
            title="Visual Seating Charts"
            description="Drag guests onto tables. Mix round and estate tables. Set keep-together and keep-apart rules. Print place cards without opening Canva."
          />
          <FeatureCard
            icon={Mail}
            title="One-Tap RSVPs"
            description="Send a link. Guests tap their name, see their events, and respond. No login, no app, no confusion. Works for Nani and Gen-Z cousins alike."
          />
          <FeatureCard
            icon={Camera}
            title="Photo Group Queue"
            description="Build your photographer's shot list. Display it live on a screen at the venue. Never miss a family combination again."
          />
          <FeatureCard
            icon={Trophy}
            title="Guest Games"
            description="Custom predictions and bets with a live leaderboard. Keep 400 guests entertained between the ceremony and reception."
          />
        </div>
      </section>

      {/* Real scenarios */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-3">
            Real problems we solve
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScenarioCard
            number="01"
            title="The scattered guest list"
            problem="Names in WhatsApp groups, Mom's notebook, and three different spreadsheets nobody can find."
            solution="One list. Import from anywhere. Duplicates caught automatically. Everyone can see it, nobody can break it."
          />
          <ScenarioCard
            number="02"
            title="Seating 50 tables"
            problem="Uncle Raj and Uncle Mohan at the same table means drama. The Shahs need 12 seats, not 10."
            solution="Drag-and-drop with custom table sizes. Set conflict rules. See warnings before they become problems."
          />
          <ScenarioCard
            number="03"
            title="Getting RSVPs from everyone"
            problem="Aunties ignore emails. Cousins forget apps. Dada doesn't know what a QR code is."
            solution="One WhatsApp link. Tap your name. Done. Large text, no login. Works for literally everyone."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-gray-900 text-center mb-14">
            Three steps to sanity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            <StepCard step="1" title="Add your events" description="Pick from templates or create custom ones. Set dates, venues, dress codes, and who's invited to each." />
            <StepCard step="2" title="Import your people" description="Upload an Excel sheet or paste names. We handle families, dietary preferences, and duplicates." />
            <StepCard step="3" title="Share and manage" description="Send RSVP links. Arrange seating. Print place cards. Track responses. All in one place." />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <h2 className="text-3xl font-display font-bold text-gray-900 text-center mb-12">
          Questions
        </h2>
        <div className="space-y-3">
          <FAQItem
            question="How is this different from Zola or WithJoy?"
            answer="Those are built for American weddings with 150 guests and one event. Phera handles multiple events with different guest lists, 500+ guests, family-group RSVPs, and seating charts with variable table sizes. If your wedding has a Mehndi, Sangeet, AND Reception, you need this."
          />
          <FAQItem
            question="Can I import my existing guest list?"
            answer="Yes. Drop in any Excel or CSV file. We detect columns automatically, catch duplicates, and group by family. You can also use our template for a clean start."
          />
          <FAQItem
            question="Do guests need to download an app or create an account?"
            answer="No. They get a link, search their name, and respond. No login, no download, no friction. Designed for everyone from tech-savvy cousins to grandparents."
          />
          <FAQItem
            question="What about different guest lists per event?"
            answer="That's exactly why we exist. Your Mehndi might be 80 people, your Reception 500. Each event has its own invite list, RSVP tracking, and seating chart."
          />
          <FAQItem
            question="Is it free?"
            answer="Free up to 100 guests and 3 events. More than enough to try everything. Premium removes all limits."
          />
          <FAQItem
            question="Can I print place cards and seating charts?"
            answer="Yes. Generate printable place cards, table assignment sheets, and alphabetical guest lookups. Per event. No Canva, no third-party tools."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-6 py-20 bg-gradient-to-br from-wine-800 to-wine-900">
        <div className="max-w-2xl mx-auto">
          <Sparkles className="mx-auto mb-4 text-phera-400" size={28} />
          <h2 className="text-3xl font-display font-bold text-white mb-3">Your wedding deserves better than spreadsheets</h2>
          <p className="text-wine-200 mb-8 text-lg">Start free. Plan everything in one place.</p>
          <Link to="/register"><Button variant="secondary" size="lg">Create Your Wedding <ArrowRight size={16} /></Button></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center px-6 py-8 text-sm text-gray-400 bg-gray-50">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. Built for Indian weddings.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-soft hover:shadow-md transition-all duration-200">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-50 mb-4 group-hover:bg-wine-100 transition-colors">
        <Icon size={20} className="text-wine-700" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function ScenarioCard({ number, title, problem, solution }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-soft">
      <span className="text-xs font-bold text-wine-300 tracking-wider">{number}</span>
      <h3 className="text-base font-semibold text-gray-900 mt-1 mb-4">{title}</h3>
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">The mess</p>
        <p className="text-sm text-gray-500">{problem}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-wine-600 uppercase tracking-wider mb-1">With Phera</p>
        <p className="text-sm text-gray-700 leading-relaxed">{solution}</p>
      </div>
    </div>
  );
}

function StepCard({ step, title, description }) {
  return (
    <div>
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-wine-50 text-wine-700 font-display font-bold text-lg mb-4">
        {step}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900 pr-4">{question}</span>
        <span className={`text-gray-300 transition-transform duration-200 text-lg ${open ? 'rotate-180' : ''}`}>&#9662;</span>
      </button>
      {open && (
        <div className="px-6 pb-5 animate-fade-in">
          <p className="text-sm text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
