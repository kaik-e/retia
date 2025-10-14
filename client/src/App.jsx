import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Domains from './pages/Domains'
import DomainEdit from './pages/DomainEdit'
import Templates from './pages/Templates'
import Analytics from './pages/Analytics'
import Logs from './pages/Logs'
import ProxyManager from './pages/ProxyManager'
import Users from './pages/Users'
import Automations from './pages/Automations'
import Login from './pages/Login'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="domains" element={<Domains />} />
          <Route path="domains/new" element={<DomainEdit />} />
          <Route path="domains/:id" element={<DomainEdit />} />
          <Route path="templates" element={<Templates />} />
          <Route path="analytics/:id" element={<Analytics />} />
          <Route path="logs" element={<Logs />} />
          <Route path="proxy" element={<ProxyManager />} />
          <Route path="users" element={<Users />} />
          <Route path="automations" element={<Automations />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
