import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import { APP_NAME } from '../config/constants';
import {
  Users, Calendar, Grid3X3, Mail, Camera, Trophy,
  ArrowRight, Check, Sparkles, Play, ChevronRight,
  Upload, MousePointerClick, Send,
} from 'lucide-react';

const DEMO_VIDEO_URL = null; // Replace with video embed URL when ready

export default function Landing() {
  return (
    <div className="min-h-screen font-body">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-wine-700 to-wine-900 text-white font-display font-bold text-sm shadow-sm">P</div>
          <span className="text-xl font-display font-bold text-gray-900 tracking-tight">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"><Button variant="ghost" className="link-flourish" tabIndex={-1}>Sign in</Button></Link>
          <Link to="/register"><Button tabIndex={-1}>Start Planning</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative text-center px-6 pt-16 pb-8 max-w-4xl mx-auto animate-fade-in">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-b from-wine-50/80 via-phera-50/40 to-transparent blur-3xl" />
        </div>
        <p className="text-sm font-medium text-wine-600 tracking-wide uppercase mb-4">For weddings with 200 to 1000+ guests</p>
        <h1 className="text-5xl md:text-6xl font-display font-bold text-gray-900 leading-[1.1] mb-6">
          Plan your <span className="text-wine-700">Indian wedding</span><br />without the chaos
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
          Multiple events. Hundreds of guests. One calm place.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="shadow-glow hover:scale-[1.02] transition-transform" tabIndex={-1}>
              Start Free <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-3">No credit card required</p>
      </section>

      {/* Product Preview / Video */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <ProductShowcase />
      </section>

      {/* Trust bar */}
      <div className="border-y border-gray-200/60 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><Check size={14} className="text-wine-600" /> Multi-event</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-wine-600" /> Family RSVPs</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-wine-600" /> Drag & drop seating</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-wine-600" /> Place cards</span>
          <span className="flex items-center gap-1.5"><Check size={14} className="text-wine-600" /> Photo groups</span>
        </div>
      </div>

      {/* Visual Workflow Steps */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="text-3xl font-display font-bold text-gray-900 text-center mb-4">
          How it works
        </h2>
        <p className="text-gray-500 text-center mb-14 max-w-lg mx-auto">
          From guest list to place cards in four steps
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-wine-200 via-phera-200 to-wine-200" />
          <WorkflowStep step={1} icon={Upload} title="Import guests" visual={<GuestListMockup />} />
          <WorkflowStep step={2} icon={Calendar} title="Set up events" visual={<EventsMockup />} />
          <WorkflowStep step={3} icon={MousePointerClick} title="Arrange seating" visual={<SeatingMockup />} />
          <WorkflowStep step={4} icon={Send} title="Share & track" visual={<RSVPMockup />} />
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 py-20 max-w-6xl mx-auto section-warm">
        <h2 className="text-3xl font-display font-bold text-gray-900 text-center mb-14">
          Everything your shaadi needs
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <FeatureCard icon={Calendar} title="Multi-Event" desc="Mehndi, Sangeet, Ceremony, Reception — each with its own guest list" />
          <FeatureCard icon={Users} title="500+ Guests" desc="Import from Excel. Auto-group families. Filter by side or dietary." />
          <FeatureCard icon={Grid3X3} title="Seating Charts" desc="Drag & drop onto round or estate tables. Print place cards instantly." />
          <FeatureCard icon={Mail} title="Easy RSVPs" desc="One link. Guests tap their name and respond. No app, no login." />
          <FeatureCard icon={Camera} title="Photo Groups" desc="Build your photographer's shot list. Display live at the venue." />
          <FeatureCard icon={Trophy} title="Guest Games" desc="Predictions and bets with a live leaderboard for 400+ guests." />
        </div>
      </section>

      {/* Before/After Visual Comparison */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-3xl font-display font-bold text-gray-900 text-center mb-14">
          Without Phera vs. with Phera
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ComparisonCard
            type="before"
            items={[
              'Guest names scattered across WhatsApp groups',
              'Seating chart on a whiteboard that gets erased',
              'RSVPs tracked in your head',
              'Place cards designed at 2am in Canva',
              'Photographer guessing which family to shoot',
            ]}
          />
          <ComparisonCard
            type="after"
            items={[
              'One searchable, filterable guest list',
              'Drag-and-drop seating with conflict warnings',
              'Real-time RSVP dashboard per event',
              'Print-ready place cards in one click',
              'Photo group queue displayed on screen',
            ]}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 max-w-3xl mx-auto section-warm">
        <h2 className="text-3xl font-display font-bold text-gray-900 text-center mb-12">
          Questions
        </h2>
        <div className="space-y-3">
          <FAQItem question="How is this different from Zola or WithJoy?" answer="Those handle 150 guests and one event. Phera handles multiple events, 500+ guests, family-group RSVPs, and variable table sizes." />
          <FAQItem question="Do guests need an account or app?" answer="No. They get a link, tap their name, respond. No login, no download. Works for everyone." />
          <FAQItem question="Can I import my guest list?" answer="Yes. Drop any Excel or CSV. We detect columns, catch duplicates, and group by family." />
          <FAQItem question="Is it free?" answer="Free up to 100 guests and 3 events. Premium removes all limits." />
        </div>
      </section>

      {/* CTA */}
      <section className="relative text-center px-6 py-24 bg-gradient-to-br from-wine-800 via-wine-900 to-gray-900 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-phera-500/10 blur-3xl" />
        <div className="relative max-w-2xl mx-auto">
          <Sparkles className="mx-auto mb-4 text-phera-400" size={28} />
          <h2 className="text-3xl font-display font-bold text-white mb-3">Your wedding deserves better</h2>
          <p className="text-wine-200 mb-8 text-lg">Start free. Plan everything in one place.</p>
          <Link to="/register"><Button variant="secondary" size="lg" className="hover:scale-[1.02] transition-transform" tabIndex={-1}>Create Your Wedding <ArrowRight size={16} /></Button></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center px-6 py-8 text-sm text-gray-400 bg-gray-50 border-t border-gray-100">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. Built for Indian weddings.</p>
      </footer>
    </div>
  );
}

/* ─── Product Showcase / Video ─────────────────────────────────────────────── */

function ProductShowcase() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lifted border border-gray-200/60 bg-gradient-to-br from-gray-900 via-gray-800 to-wine-900 aspect-video max-w-4xl mx-auto">
      {DEMO_VIDEO_URL && playing ? (
        <iframe
          src={DEMO_VIDEO_URL}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          title="Phera Demo"
        />
      ) : (
        <button
          onClick={() => DEMO_VIDEO_URL && setPlaying(true)}
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center group cursor-pointer"
        >
          {/* Animated mockup preview */}
          <div className="absolute inset-0 overflow-hidden opacity-30">
            <DashboardPreviewSVG />
          </div>

          {/* Play overlay */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:bg-white/25 transition-all group-hover:scale-110 ring-2 ring-white/20">
              <Play size={32} className="text-white ml-1" fill="white" />
            </div>
            <span className="text-white/80 text-sm font-medium">
              {DEMO_VIDEO_URL ? 'Watch the 60-second walkthrough' : 'Product walkthrough coming soon'}
            </span>
          </div>
        </button>
      )}
    </div>
  );
}

/* ─── Dashboard Preview SVG ────────────────────────────────────────────────── */

function DashboardPreviewSVG() {
  return (
    <svg viewBox="0 0 800 450" className="w-full h-full" fill="none">
      {/* Sidebar */}
      <rect x="0" y="0" width="180" height="450" fill="#1a1a2e" />
      <rect x="20" y="20" width="140" height="8" rx="4" fill="#6b2140" opacity="0.6" />
      <rect x="20" y="50" width="140" height="32" rx="8" fill="#6b2140" opacity="0.4" />
      {[96,132,168,204,240].map((y) => (
        <rect key={y} x="20" y={y} width="140" height="28" rx="6" fill="#ffffff" opacity="0.06" />
      ))}

      {/* Main content */}
      <rect x="195" y="15" width="590" height="420" rx="12" fill="#ffffff" opacity="0.05" />

      {/* Stat cards */}
      {[0,1,2,3].map((i) => (
        <g key={`stat-${i}`}>
          <rect x={210+i*142} y="30" width="130" height="70" rx="10" fill="#ffffff" opacity="0.08" />
          <rect x={222+i*142} y="44" width="50" height="6" rx="3" fill="#ffffff" opacity="0.15" />
          <rect x={222+i*142} y="60" width="70" height="16" rx="4" fill="#6b2140" opacity="0.4" />
          <rect x={222+i*142} y="84" width="40" height="5" rx="2.5" fill="#ffffff" opacity="0.1" />
        </g>
      ))}

      {/* Table rows */}
      {[0,1,2,3,4,5,6].map((i) => (
        <g key={`row-${i}`}>
          <rect x="210" y={120+i*42} width="568" height="34" rx="6" fill="#ffffff" opacity={i%2===0?0.06:0.03} />
          <rect x="222" y={130+i*42} width="80" height="6" rx="3" fill="#ffffff" opacity="0.15" />
          <rect x="320" y={130+i*42} width="60" height="6" rx="3" fill="#ffffff" opacity="0.1" />
          <rect x="420" y={128+i*42} width="50" height="10" rx="5" fill="#6b2140" opacity="0.3" />
          <rect x="520" y={130+i*42} width="40" height="6" rx="3" fill="#ffffff" opacity="0.08" />
          <circle cx="740" cy={137+i*42} r="8" fill="#d4956a" opacity="0.3" />
        </g>
      ))}

      {/* Floating accent */}
      <circle cx="650" cy="380" r="35" fill="#d4956a" opacity="0.15">
        <animate attributeName="r" values="35;40;35" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ─── Workflow Step ────────────────────────────────────────────────────────── */

function WorkflowStep({ step, icon: Icon, title, visual }) {
  return (
    <div className="flex flex-col items-center text-center px-2">
      <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-wine-600 to-wine-800 flex items-center justify-center text-white font-display font-bold text-sm mb-4 shadow-md ring-4 ring-white">
        {step}
      </div>
      <div className="w-full aspect-[4/3] rounded-xl border border-gray-200/80 bg-white shadow-card overflow-hidden mb-3 group hover:shadow-lifted transition-all duration-300 hover:-translate-y-1">
        {visual}
      </div>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
        <Icon size={15} className="text-wine-600" />
        {title}
      </div>
    </div>
  );
}

/* ─── Mini Mockup Components ───────────────────────────────────────────────── */

function GuestListMockup() {
  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-16 rounded bg-wine-100" />
        <div className="h-5 flex-1 rounded bg-gray-100" />
      </div>
      {[0,1,2,3,4].map((i) => (
        <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-wine-100 to-phera-100 flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-2 rounded bg-gray-200" style={{ width: `${60+i*8}%` }} />
            <div className="h-1.5 rounded bg-gray-100" style={{ width: `${40+i*5}%` }} />
          </div>
          <div className={`h-4 w-12 rounded-full text-[6px] flex items-center justify-center font-medium ${
            i<3 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
          }`}>
            {i<3 ? 'RSVP' : 'Pending'}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventsMockup() {
  const colors = ['bg-emerald-400','bg-purple-400','bg-phera-400','bg-wine-400'];
  const names = ['Mehndi','Sangeet','Ceremony','Reception'];
  return (
    <div className="p-3 h-full flex flex-col justify-center gap-2">
      {colors.map((color,i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50">
          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <span className="text-[9px] font-semibold text-gray-700">{names[i]}</span>
          <div className="flex-1" />
          <span className="text-[8px] text-gray-400">{[80,200,350,500][i]} guests</span>
        </div>
      ))}
    </div>
  );
}

function SeatingMockup() {
  const tables = [
    { x:'20%', y:'25%', s:28 },
    { x:'55%', y:'20%', s:32 },
    { x:'78%', y:'35%', s:28 },
    { x:'30%', y:'65%', s:30 },
    { x:'65%', y:'70%', s:28 },
  ];
  return (
    <div className="p-3 h-full flex items-center justify-center bg-gray-50/50 relative">
      {tables.map((t,i) => (
        <div key={i} className="absolute" style={{ left:t.x, top:t.y, transform:'translate(-50%,-50%)' }}>
          <div className="rounded-full border-2 border-wine-200 bg-white shadow-sm flex items-center justify-center" style={{ width:t.s, height:t.s }}>
            <span className="text-[7px] font-bold text-wine-600">{i+1}</span>
          </div>
          {[...Array(6)].map((_,j) => {
            const a = (j*60-90)*(Math.PI/180);
            const r = t.s/2+6;
            return (
              <div key={j} className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-br from-wine-300 to-phera-300"
                style={{ left:`${Math.cos(a)*r+t.s/2-5}px`, top:`${Math.sin(a)*r+t.s/2-5}px` }} />
            );
          })}
        </div>
      ))}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded bg-phera-100 border border-phera-200 flex items-center justify-center opacity-60">
        <span className="text-[6px] text-phera-600 font-medium">Dance</span>
      </div>
    </div>
  );
}

function RSVPMockup() {
  return (
    <div className="p-3 h-full flex flex-col items-center justify-center">
      <div className="w-20 border-2 border-gray-300 rounded-xl bg-white shadow-md px-1.5 py-2">
        <div className="w-8 h-1 rounded-full bg-gray-200 mx-auto mb-2" />
        <div className="space-y-1.5">
          <div className="h-2 bg-wine-100 rounded w-full" />
          <div className="h-1.5 bg-gray-100 rounded w-3/4" />
          <div className="flex gap-1 mt-2">
            <div className="flex-1 h-4 rounded bg-green-500 flex items-center justify-center"><Check size={7} className="text-white" /></div>
            <div className="flex-1 h-4 rounded bg-gray-200" />
          </div>
          <div className="flex gap-1">
            <div className="flex-1 h-4 rounded bg-green-500 flex items-center justify-center"><Check size={7} className="text-white" /></div>
            <div className="flex-1 h-4 rounded bg-gray-200" />
          </div>
          <div className="h-3 bg-wine-600 rounded mt-1 flex items-center justify-center">
            <span className="text-[5px] text-white font-medium">Submit</span>
          </div>
        </div>
      </div>
      <span className="text-[8px] text-gray-400 mt-2">No app needed</span>
    </div>
  );
}

/* ─── Feature Card ─────────────────────────────────────────────────────────── */

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-card hover:shadow-lifted hover:-translate-y-1 transition-all duration-300">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-wine-50 to-phera-50 mb-3 group-hover:from-wine-100 group-hover:to-phera-100 transition-colors">
        <Icon size={18} className="text-wine-700" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ─── Before/After Comparison ─────────────────────────────────────────────── */

function ComparisonCard({ type, items }) {
  const isBefore = type === 'before';
  return (
    <div className={`rounded-2xl p-6 border ${
      isBefore ? 'bg-gray-50 border-gray-200/80' : 'bg-gradient-to-br from-wine-50 to-phera-50/30 border-wine-200/60'
    }`}>
      <div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-4 ${
        isBefore ? 'text-gray-400' : 'text-wine-600'
      }`}>
        {isBefore ? 'Without Phera' : <><Sparkles size={12} /> With Phera</>}
      </div>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            {isBefore ? (
              <span className="mt-0.5 w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              </span>
            ) : (
              <span className="mt-0.5 w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check size={10} className="text-green-600" />
              </span>
            )}
            <span className={isBefore ? 'text-gray-500' : 'text-gray-700'}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── FAQ ──────────────────────────────────────────────────────────────────── */

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900 pr-4">{question}</span>
        <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-5 animate-fade-in">
          <p className="text-sm text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
