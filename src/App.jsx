import { BrowserRouter as Router, Routes, Route, Navigate as RouterNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/lib/AppContext.jsx';
import AppLayout from '@/components/layout/AppLayout';
import { Toaster } from 'react-hot-toast';

// Pages
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import Report from '@/pages/Report';
import Navigate from '@/pages/Navigate';
import Settings from '@/pages/Settings';
import Notifications from '@/pages/Notifications';
import Onboarding from '@/pages/Onboarding';
import Splash from '@/pages/Splash';
import Welcome from '@/pages/Welcome';
import SOS from '@/pages/SOS';
import Analytics from '@/pages/Analytics';
import Gamification from '@/pages/Gamification';
import LanguageSelect from '@/pages/LanguageSelect';
import Profile from '@/pages/Profile';
import AdminDashboard from '@/pages/AdminDashboard';
import UserProfile from '@/pages/UserProfile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

import { LanguageProvider } from '@/lib/i18n.jsx';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AppProvider>
          <Router>
            <Routes>
              <Route path="/splash" element={<Splash />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/onboarding" element={<Onboarding />} />
              
              <Route element={<AppLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/report" element={<Report />} />
                <Route path="/navigate" element={<Navigate />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/sos" element={<SOS />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/gamification" element={<Gamification />} />
                <Route path="/language-select" element={<LanguageSelect />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/user-profile" element={<UserProfile />} />
              </Route>
              
              <Route path="*" element={<RouterNavigate to="/splash" replace />} />
            </Routes>
          </Router>
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#111E30',
                color: '#fff',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
              },
            }}
          />
        </AppProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}