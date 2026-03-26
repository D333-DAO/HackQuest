import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { NotificationProvider } from '@/lib/NotificationContext';
import NotificationCenter from '@/components/NotificationCenter';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Paths from './pages/Paths';
import PathDetail from './pages/PathDetail';
import Rooms from './pages/Rooms';
import RoomDetail from './pages/RoomDetail';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import SkillTree from './pages/SkillTree';
import Sandbox from './pages/Sandbox';
import AttackSimulator from './pages/AttackSimulator';
import ScenarioBuilder from './pages/ScenarioBuilder';
import AttackHistory from './pages/AttackHistory';
import MitreScenarioBuilder from './pages/MitreScenarioBuilder';
import QuizEngine from './pages/QuizEngine';
import SavedQuizzes from './pages/SavedQuizzes';
import Community from './pages/Community';
import DiscussionDetail from './pages/DiscussionDetail';
import NewDiscussion from './pages/NewDiscussion';
import ContentGenerator from './pages/ContentGenerator';
import Performance from './pages/Performance';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Dashboard" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Paths" element={<Paths />} />
        <Route path="/PathDetail" element={<PathDetail />} />
        <Route path="/Rooms" element={<Rooms />} />
        <Route path="/RoomDetail" element={<RoomDetail />} />
        <Route path="/Leaderboard" element={<Leaderboard />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/SkillTree" element={<SkillTree />} />
        <Route path="/Sandbox" element={<Sandbox />} />
        <Route path="/AttackSimulator" element={<AttackSimulator />} />
        <Route path="/ScenarioBuilder" element={<ScenarioBuilder />} />
        <Route path="/AttackHistory" element={<AttackHistory />} />
        <Route path="/MitreScenarioBuilder" element={<MitreScenarioBuilder />} />
        <Route path="/QuizEngine" element={<QuizEngine />} />
        <Route path="/SavedQuizzes" element={<SavedQuizzes />} />
        <Route path="/Community" element={<Community />} />
        <Route path="/Discussion" element={<DiscussionDetail />} />
        <Route path="/NewDiscussion" element={<NewDiscussion />} />
        <Route path="/ContentGenerator" element={<ContentGenerator />} />
        <Route path="/Performance" element={<Performance />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <NotificationProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <NotificationCenter />
        </QueryClientProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App