import { Toaster } from "@/components/ui/toaster"
import React, { Suspense, lazy } from 'react';
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
import PageTransition from './components/layout/PageTransition';

// Lazy-loaded route components for code splitting
const Dashboard          = lazy(() => import('./pages/Dashboard'));
const Paths              = lazy(() => import('./pages/Paths'));
const PathDetail         = lazy(() => import('./pages/PathDetail'));
const Rooms              = lazy(() => import('./pages/Rooms'));
const RoomDetail         = lazy(() => import('./pages/RoomDetail'));
const Leaderboard        = lazy(() => import('./pages/Leaderboard'));
const Profile            = lazy(() => import('./pages/Profile'));
const SkillTree          = lazy(() => import('./pages/SkillTree'));
const Sandbox            = lazy(() => import('./pages/Sandbox'));
const AttackSimulator    = lazy(() => import('./pages/AttackSimulator'));
const ScenarioBuilder    = lazy(() => import('./pages/ScenarioBuilder'));
const AttackHistory      = lazy(() => import('./pages/AttackHistory'));
const MitreScenarioBuilder = lazy(() => import('./pages/MitreScenarioBuilder'));
const QuizEngine         = lazy(() => import('./pages/QuizEngine'));
const SavedQuizzes       = lazy(() => import('./pages/SavedQuizzes'));
const Community          = lazy(() => import('./pages/Community'));
const DiscussionDetail   = lazy(() => import('./pages/DiscussionDetail'));
const NewDiscussion      = lazy(() => import('./pages/NewDiscussion'));
const ContentGenerator   = lazy(() => import('./pages/ContentGenerator'));
const Performance        = lazy(() => import('./pages/Performance'));
const AttackLogs             = lazy(() => import('./pages/AttackLogs'));
const CourseProgressTracker  = lazy(() => import('./pages/CourseProgressTracker'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

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
    <Suspense fallback={<PageLoader />}>
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
        <Route path="/AttackLogs" element={<AttackLogs />} />
        <Route path="/CourseProgressTracker" element={<CourseProgressTracker />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {
  React.useEffect(() => {
    const apply = (dark) => {
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.classList.toggle('light', !dark);
    };
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    apply(mq.matches);
    const handler = (e) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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