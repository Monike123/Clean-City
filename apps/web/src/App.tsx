import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Login, Dashboard, ReportsManagementConsole, LiveMap, AuditAnalytics, WorkerVerification, TaskAssignment, TeamPanel, AIAutomation } from './pages';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="reports" element={<ReportsManagementConsole />} />
          <Route path="map" element={<LiveMap />} />
          <Route path="audit" element={<AuditAnalytics />} />
          <Route path="workers" element={<WorkerVerification />} />
          <Route path="tasks" element={<TaskAssignment />} />
          <Route path="team" element={<TeamPanel />} />
          <Route path="ai-automation" element={<AIAutomation />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
