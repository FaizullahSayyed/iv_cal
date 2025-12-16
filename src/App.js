import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Homepage from './pages/Hompage';
import Dashboard from './pages/Dashboard';
import NurseDashboard from './pages/Dashboard/Nurse';
import BillerDashboard from './pages/Dashboard/Biller';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/nurse" element={<NurseDashboard />} />
          <Route path="/dashboard/biller" element={<BillerDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
