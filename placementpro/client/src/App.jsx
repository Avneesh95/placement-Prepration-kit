import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './lib/theme';
import { AuthProvider, Protected } from './lib/auth';
import Layout from './components/Layout';
import { Login, Register, Forgot } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import { Companies, CompanyDetail } from './pages/Companies';
import Practice from './pages/Practice';
import Drill from './pages/Drill';
import Materials from './pages/Materials';
import AdventureMap from './pages/AdventureMap';
import Topic from './pages/Topic';
import { CodingList, CodingProblem } from './pages/Coding';
import { SqlList, SqlExercise } from './pages/Sql';
import { MockList, MockIntro } from './pages/Mocks';
import TestRunner from './pages/TestRunner';
import Result from './pages/Result';
import StudyPlan from './pages/StudyPlan';
import Faqs from './pages/Faqs';
import Profile from './pages/Profile';
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/forgot-password" element={<Forgot />} />
          <Route path="/attempt/:id" element={<Protected><TestRunner /></Protected>} />
          <Route element={<Protected><Layout /></Protected>}>
            <Route index element={<Dashboard />} />
            <Route path="map" element={<AdventureMap />} />
            <Route path="companies" element={<Companies />} /><Route path="companies/:slug" element={<CompanyDetail />} />
            <Route path="drill" element={<Drill />} />
            <Route path="materials" element={<Materials />} />
            <Route path="practice" element={<Practice />} /><Route path="topics/:slug" element={<Topic />} />
            <Route path="coding" element={<CodingList />} /><Route path="coding/:id" element={<CodingProblem />} />
            <Route path="sql" element={<SqlList />} /><Route path="sql/:id" element={<SqlExercise />} />
            <Route path="mocks" element={<MockList />} /><Route path="mocks/:slug" element={<MockIntro />} /><Route path="results/:id" element={<Result />} />
            <Route path="plan" element={<StudyPlan />} /><Route path="faqs" element={<Faqs />} /><Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
