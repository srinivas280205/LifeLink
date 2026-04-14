import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
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
        <Route path="/home"      element={<Navigate to="/dashboard" replace />} />
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
  return (
    <ErrorBoundary>
    <ThemeProvider>
      <InstallPrompt />
      <OfflineBanner />
      <SplashGate>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </SplashGate>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
