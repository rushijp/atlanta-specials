import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WeddingProvider } from './contexts/WeddingContext';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import PublicRSVP from './pages/PublicRSVP';
import Dashboard from './pages/Dashboard';
import GuestManager from './pages/GuestManager';
import EventManager from './pages/EventManager';
import SeatingChart from './pages/SeatingChart';
import RSVPManager from './pages/RSVPManager';
import PhotoGroupManager from './pages/PhotoGroupManager';
import BetsManager from './pages/BetsManager';
import WeddingWebsite from './pages/WeddingWebsite';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/rsvp/:weddingId" element={<PublicRSVP />} />

          {/* Protected app routes */}
          <Route
            element={
              <ProtectedRoute>
                <WeddingProvider>
                  <AppShell />
                </WeddingProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/guests" element={<GuestManager />} />
            <Route path="/events" element={<EventManager />} />
            <Route path="/seating" element={<SeatingChart />} />
            <Route path="/rsvp" element={<RSVPManager />} />
            <Route path="/photos" element={<PhotoGroupManager />} />
            <Route path="/bets" element={<BetsManager />} />
            <Route path="/website" element={<WeddingWebsite />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
