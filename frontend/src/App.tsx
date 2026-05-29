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

function AppRoutes() {
  return (
      <Routes>
        <Route path="/login"                element={<LoginPage />} />
        <Route path="/register"             element={<RegisterPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

        <Route path="/admin/*" element={
          <ProtectedRoute roles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        }/>

        <Route path="/*" element={
          <>
            <Navbar />
            <Routes>
              <Route path="/"        element={<Navigate to="/courses" replace />} />
              <Route path="/courses" element={<CatalogPage />} />
              <Route path="/courses/:id" element={<CoursePage />} />
              <Route path="/instructors/:id" element={<InstructorPage />} />
              <Route path="/courses/create" element={
                <ProtectedRoute roles={['teacher', 'admin']}>
                  <CourseCreatePage />
                </ProtectedRoute>
              }/>
              <Route path="/courses/:id/edit" element={
                <ProtectedRoute roles={['teacher', 'admin']}>
                  <CourseEditPage />
                </ProtectedRoute>
              }/>

              <Route path="/certificates/verify/:code" element={<VerifyCertPage />} />

              <Route path="/certificates" element={
                <ProtectedRoute><MyCertificatesPage /></ProtectedRoute>
              }/>

              <Route path="/teacher" element={
                <ProtectedRoute roles={['teacher', 'admin']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }/>

              <Route path="/analytics/courses/:id" element={
                <ProtectedRoute roles={['teacher', 'admin']}>
                  <CourseAnalyticsPage />
                </ProtectedRoute>
              }/>

              <Route path="/student" element={
                <ProtectedRoute roles={['student', 'admin']}>
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

              <Route path="*" element={<Navigate to="/courses" replace />} />
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