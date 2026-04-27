import React from 'react';
import './styles/global.css';
import { Navbar } from './components/Navbar';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { CatalogPage } from './pages/CatalogPage';
import { CoursePage } from './pages/CoursePage';
import { MyCertificatesPage, VerifyCertPage } from './pages/CertificatesPage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { AdminPanel } from './pages/AdminPanel';
import { PaymentResultPage } from './pages/PaymentResultPage';
import { CourseCreatePage } from './pages/CourseCreatePage';

function AppRoutes() {
  return (
    <Routes>
      {/* Без navbar */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Адмін — окремий layout без navbar */}
      <Route path="/admin/*" element={
        <ProtectedRoute roles={['admin']}>
          <AdminPanel />
        </ProtectedRoute>
      }/>

      {/* З navbar */}
      <Route path="/*" element={
        <>
          <Navbar />
          <Routes>
            <Route path="/"        element={<Navigate to="/courses" replace />} />
            <Route path="/courses" element={<CatalogPage />} />
            <Route path="/courses/:id" element={<CoursePage />} />
            <Route path="/courses/create" element={
              <ProtectedRoute roles={['teacher', 'admin']}>
                <CourseCreatePage />
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

            <Route path="/payment/result" element={<PaymentResultPage />}/>

            <Route path="/forbidden" element={
              <div style={{ textAlign: 'center', padding: '80px 32px' }}>
                <h2>403 — Доступ заборонено</h2>
                <p style={{ color: '#6b7280' }}>У тебе немає прав для цієї сторінки</p>
                <Link to="/courses" style={{ color: '#4f46e5' }}>На головну</Link>
              </div>
            }/>

            <Route path="*" element={<Navigate to="/courses" replace />} />
          </Routes>
        </>
      }/>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
