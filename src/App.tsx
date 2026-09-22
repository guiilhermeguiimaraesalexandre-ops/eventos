import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EventEditor from './pages/EventEditor';
import Registrations from './pages/Registrations';
import PublicForm from './pages/PublicForm';
import PresencePublic from './pages/PresencePublic';
import Checkin from './pages/Checkin';
import Raffle from './pages/Raffle';

export default function App() {
  return (
    <Routes>
      {/* Admin (protegido por login Supabase Auth) */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/novo" element={<ProtectedRoute><EventEditor /></ProtectedRoute>} />
      <Route path="/admin/editar/:id" element={<ProtectedRoute><EventEditor /></ProtectedRoute>} />
      <Route path="/admin/inscritos/:id" element={<ProtectedRoute><Registrations /></ProtectedRoute>} />

      {/* Público — os links que você compartilha */}
      <Route path="/f/:eventId" element={<PublicForm />} />
      <Route path="/presenca/:eventId" element={<PresencePublic />} />
      <Route path="/checkin/:eventId" element={<Checkin />} />
      <Route path="/sorteio/:eventId" element={<Raffle />} />

      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
