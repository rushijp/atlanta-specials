import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Grid3X3,
  Mail,
  Camera,
  Trophy,
  Globe,
  Printer,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWedding } from '../../contexts/WeddingContext';
import { APP_NAME } from '../../config/constants';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/guests', icon: Users, label: 'Guest List' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/seating', icon: Grid3X3, label: 'Seating' },
  { to: '/rsvp', icon: Mail, label: 'RSVPs' },
  { to: '/print', icon: Printer, label: 'Print & Export' },
  { to: '/photos', icon: Camera, label: 'Photo Groups' },
  { to: '/bets', icon: Trophy, label: 'Games' },
  { to: '/website', icon: Globe, label: 'Website' },
];

export default function Sidebar({ onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const { activeWedding } = useWedding();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`flex flex-col border-r border-gray-200/80 bg-white transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-wine-700 to-wine-900 text-white font-display font-bold text-sm shadow-sm">
          P
        </div>
        {!collapsed && <span className="text-lg font-display font-bold text-gray-900 tracking-tight">{APP_NAME}</span>}
      </div>

      {/* Wedding name */}
      {!collapsed && activeWedding && (
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Planning</p>
          <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">
            {activeWedding.coupleName1} & {activeWedding.coupleName2}
          </p>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-wine-50 text-wine-800 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 p-2 space-y-1">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <LogOut size={18} />
          {!collapsed && <span>Sign out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
