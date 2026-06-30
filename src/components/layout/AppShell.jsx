import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} className="text-gray-700" />
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-wine-700 to-wine-900 text-white font-display font-bold text-xs">P</div>
        <span className="text-sm font-display font-bold text-gray-900">Phera</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-60 h-full animate-fade-in">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
