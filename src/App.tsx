import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import LogToday from './pages/LogToday';
import Simulator from './pages/Simulator';
import AICoach from './pages/AICoach';
import Profile from './pages/Profile';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { UserProfile } from './types';

function App() {
  const [profile] = useLocalStorage<UserProfile | null>('ecosense_profile', null);

  return (
    <Routes>
      <Route path="/onboarding" element={!profile ? <Onboarding /> : <Navigate to="/" />} />
      
      <Route path="/" element={profile ? <Layout /> : <Navigate to="/onboarding" />}>
        <Route index element={<Dashboard />} />
        <Route path="log" element={<LogToday />} />
        <Route path="simulator" element={<Simulator />} />
        <Route path="coach" element={<AICoach />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
