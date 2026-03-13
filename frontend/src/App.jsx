import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import MainDashboard from './pages/dashboard/MainDashboard'
import AdminPanel from './pages/admin/AdminPanel'
import ChargerHealthDetail from './pages/chargers/ChargerHealthDetail'
import ChargerMaintenance from './pages/chargers/ChargerMaintenance'
import SchedulesGantt from './pages/schedules/SchedulesGantt'
import SessionDetail from './pages/sessions/SessionDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<MainDashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/chargers/:id" element={<ChargerHealthDetail />} />
          <Route path="/chargers/:id/maintenance" element={<ChargerMaintenance />} />
          <Route path="/schedules" element={<SchedulesGantt />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
