import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loading or direct import. Let's do direct for simplicity in MVP.
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import QueueManagementPage from './pages/QueueManagementPage';
import QueueDashboardPage from './pages/QueueDashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      
      {/* Protected Routes wrapped in Layout */}
      <Route element={<Layout />}>
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/patients" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Registrator']}>
              <PatientsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/appointments" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Registrator']}>
              <AppointmentsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/queue" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Registrator']}>
              <QueueManagementPage />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Queue Dashboard — no sidebar, standalone full-screen page */}
      <Route 
        path="/queue-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Registrator', 'Doctor']}>
            <QueueDashboardPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
