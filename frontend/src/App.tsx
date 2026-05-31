import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import './styles/global.css';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage, RegisterPage, GoogleCallbackPage } from './pages/AuthPages';
import { CatalogPage } from './pages/CatalogPage';
import { CoursePage } from './pages/CoursePage';
import { MyCertificatesPage, VerifyCertPage } from './pages/CertificatesPage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { AdminPanel } from './pages/AdminPanel';
import { PaymentResultPage } from './pages/PaymentResultPage';
import { CourseCreatePage } from './pages/CourseCreatePage';
import { CourseEditPage } from './pages/CourseEditPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { WishlistPage } from './pages/WishlistPage';
import { WishlistProvider } from './context/WishlistContext';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { InstructorPage } from './pages/InstructorPage';
import { CourseAnalyticsPage } from './pages/CourseAnalyticsPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/PasswordResetPages';

function GuestRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <div style={{ display:'flex', justifyContent:'center', marginTop:80 }}>Завантаження...</div>;
  if (isAuthenticated) {
    if (user?.role === 'admin' || user?.role === 'super_admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'teacher') return <Navigate to="/teacher" replace />;
    return <Navigate to="/courses" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
      <Routes>
        <Route path="/login"                element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register"             element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password"      element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password"       element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

        <Route path="/admin/*" element={
          <ProtectedRoute roles={['admin', 'super_admin']}>
            <AdminPanel />
          </ProtectedRoute>
        }/>

        <Route path="/*" element={
          <>
            <Navbar />
            <Routes>
              <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
              <Route path="/courses" element={<CatalogPage />} />
              <Route path="/courses/:id" element={<CoursePage />} />
              <Route path="/instructors/:id" element={<InstructorPage />} />
              <Route path="/courses/create" element={
                <ProtectedRoute roles={['teacher', 'admin', 'super_admin']}>
                  <CourseCreatePage />
                </ProtectedRoute>
              }/>
              <Route path="/courses/:id/edit" element={
                <ProtectedRoute roles={['teacher', 'admin', 'super_admin']}>
                  <CourseEditPage />
                </ProtectedRoute>
              }/>

              <Route path="/certificates/verify/:code" element={<VerifyCertPage />} />
              <Route path="/certificates/verify" element={<VerifyCertPage />} />

              <Route path="/certificates" element={
                <ProtectedRoute><MyCertificatesPage /></ProtectedRoute>
              }/>

              <Route path="/teacher" element={
                <ProtectedRoute roles={['teacher', 'admin', 'super_admin']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }/>

              <Route path="/analytics/courses/:id" element={
                <ProtectedRoute roles={['teacher', 'admin', 'super_admin']}>
                  <CourseAnalyticsPage />
                </ProtectedRoute>
              }/>

              <Route path="/student" element={
                <ProtectedRoute roles={['student', 'admin', 'super_admin']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }/>

              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }/>

              <Route path="/wishlist" element={
                <ProtectedRoute>
                  <WishlistPage />
                </ProtectedRoute>
              }/>

              <Route path="/subscription" element={
                <ProtectedRoute>
                  <SubscriptionPage />
                </ProtectedRoute>
              }/>

              <Route path="/payment/result" element={<PaymentResultPage />}/>

              <Route path="/terms"   element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />

              <Route path="/forbidden" element={
                <div style={{ textAlign: 'center', padding: '80px 32px' }}>
                  <h2>403 — Доступ заборонено</h2>
                  <p style={{ color: '#6b7280' }}>У тебе немає прав для цієї сторінки</p>
                  <Link to="/courses" style={{ color: '#4f46e5' }}>На головну</Link>
                </div>
              }/>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Footer />
          </>
        }/>
      </Routes>
  );
}

export default function App() {
  return (
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <WishlistProvider>
                <NotificationProvider>
                  <AppRoutes />
                </NotificationProvider>
              </WishlistProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
  );
}