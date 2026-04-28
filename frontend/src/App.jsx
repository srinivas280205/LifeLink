import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import API_BASE from './config/api.js';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import SplashScreen from './components/SplashScreen';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import Profile from './pages/Profile';
import DonorSearch from './pages/DonorSearch';
import History from './pages/History';
import Admin from './pages/Admin';
import Leaderboard from './pages/Leaderboard';
import Notifications from './pages/Notifications';
import Events from './pages/Events';
import InstallPrompt from './components/InstallPrompt';
import OfflineBanner from './components/OfflineBanner';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';
import PageFade from './components/PageFade';
import ForgotPassword from './pages/ForgotPassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

// Silently refresh the JWT if it expires within 24 hours
function useTokenRefresh() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      // Decode payload (base64 middle segment) — no verification needed client-side
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresIn = (payload.exp * 1000) - Date.now(); // ms until expiry
      const ONE_DAY = 24 * 60 * 60 * 1000;
      if (expiresIn > ONE_DAY) return; // plenty of time, skip
      // Token expires in < 24h — refresh silently
      fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.token) {
            localStorage.setItem('token', data.token);
            if (data.user) {
              const stored = JSON.parse(localStorage.getItem('user') || '{}');
              localStorage.setItem('user', JSON.stringify({ ...stored, ...data.user }));
            }
          }
        })
        .catch(() => { /* silent — never block the app */ });
    } catch { /* malformed token — ignore */ }
  }, []);
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" replace /> : children;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <PageFade key={location.pathname}>
      <Routes>
        <Route path="/"          element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login"     element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup"    element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/map"       element={<PrivateRoute><MapView /></PrivateRoute>} />
        <Route path="/profile"   element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/search"    element={<PrivateRoute><DonorSearch /></PrivateRoute>} />
        <Route path="/history"   element={<PrivateRoute><History /></PrivateRoute>} />
        <Route path="/admin"     element={<PrivateRoute><Admin /></PrivateRoute>} />
        <Route path="/leaderboard"   element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/events"        element={<PrivateRoute><Events /></PrivateRoute>} />
        <Route path="/home"            element={<Navigate to="/dashboard" replace />} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/terms"           element={<Terms />} />
        <Route path="/privacy"         element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageFade>
  );
}

// After splash, always start from root — PublicRoute/PrivateRoute redirect from there
function SplashGate({ children }) {
  const [splashDone, setSplashDone] = useState(false);
  if (!splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />;
  }
  return children;
}

export default function App() {
  useTokenRefresh();
  return (
    <ErrorBoundary>
    <ThemeProvider>
    <LanguageProvider>
      <InstallPrompt />
      <OfflineBanner />
      <SplashGate>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </SplashGate>
    </LanguageProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
