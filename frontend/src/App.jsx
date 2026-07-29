import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CareerProvider } from './context/CareerContext'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ResumeUploadPage = lazy(() => import('./pages/ResumeUploadPage'))
const ResumeAnalysisPage = lazy(() => import('./pages/ResumeAnalysisPage'))
const AtsScorePage = lazy(() => import('./pages/AtsScorePage'))
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'))
const MockInterviewPage = lazy(() => import('./pages/MockInterviewPage'))
const InterviewResultPage = lazy(() => import('./pages/InterviewResultPage'))
const CodingPage = lazy(() => import('./pages/CodingPage'))
const JobOpportunitiesPage = lazy(() => import('./pages/JobOpportunitiesPage'))
const CareerCoachPage = lazy(() => import('./pages/CareerCoachPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ResumeManagementPage = lazy(() => import('./pages/ResumeManagementPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const SkillGapPage = lazy(() => import('./pages/SkillGapPage'))
const ApplicationTrackerPage = lazy(() => import('./pages/ApplicationTrackerPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8 text-white">Loading...</div>
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading...</div>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/resume" element={<Navigate to="/resume/upload" replace />} />
        <Route path="/resume/upload" element={<ProtectedRoute><ResumeUploadPage /></ProtectedRoute>} />
        <Route path="/resume/analysis" element={<ProtectedRoute><ResumeAnalysisPage /></ProtectedRoute>} />
        <Route path="/ats" element={<ProtectedRoute><AtsScorePage /></ProtectedRoute>} />
        <Route path="/skill-gap" element={<ProtectedRoute><SkillGapPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/roadmap" element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><MockInterviewPage /></ProtectedRoute>} />
        <Route path="/interview/result" element={<ProtectedRoute><InterviewResultPage /></ProtectedRoute>} />
        <Route path="/coding" element={<ProtectedRoute><CodingPage /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><JobOpportunitiesPage /></ProtectedRoute>} />
        <Route path="/coach" element={<ProtectedRoute><CareerCoachPage /></ProtectedRoute>} />
        <Route path="/tracker" element={<ProtectedRoute><ApplicationTrackerPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/resume/management" element={<ProtectedRoute><ResumeManagementPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CareerProvider>
        <AppRoutes />
      </CareerProvider>
    </AuthProvider>
  )
}
