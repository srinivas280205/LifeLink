import Demo from './pages/Demo';
import DemoBanner from './components/DemoBanner';
import Coordination from './pages/Coordination';
import BackNavigation from './components/BackNavigation';
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import SplashScreen from './components/SplashScreen';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import Profile from './pages/EssentialProfile';
import DonorSearch from './pages/EssentialBanks';
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

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <PageFade key={location.pathname}>
      <Routes>
        <Route path="/demo" element={<Demo />} />
        <Route path="/"          element={<Landing />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/signup"    element={<Signup />} />
        <Route path="/dashboard" element={<PrivateRoute><Coordination /></PrivateRoute>} />
        <Route path="/request" element={<PrivateRoute><Coordination /></PrivateRoute>} />
        <Route path="/donate" element={<PrivateRoute><Coordination /></PrivateRoute>} />
        <Route path="/coordination" element={<PrivateRoute><Coordination /></PrivateRoute>} />
        <Route path="/map"       element={<PrivateRoute><MapView /></PrivateRoute>} />
        <Route path="/profile"   element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/search"    element={<PrivateRoute><DonorSearch /></PrivateRoute>} />
        <Route path="/history"   element={<PrivateRoute><Coordination /></PrivateRoute>} />
        <Route path="/admin"     element={<PrivateRoute><Admin /></PrivateRoute>} />
        <Route path="/leaderboard"   element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/events"        element={<PrivateRoute><Events /></PrivateRoute>} />
        <Route path="/home"            element={<Navigate to="/dashboard" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terms"           element={<Terms />} />
        <Route path="/privacy"         element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageFade>
  );
}

// Preserve the requested route after the introductory splash.
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
    <LanguageProvider>
      <OfflineBanner />
      <SplashGate>
        <BrowserRouter>
          <DemoBanner />
          <BackNavigation />
          <AnimatedRoutes />
        </BrowserRouter>
      </SplashGate>
      <InstallPrompt />
    </LanguageProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
