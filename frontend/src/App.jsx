// App.jsx (Corrected)
import { Routes, Route, Navigate } from 'react-router-dom'

// Layout and Auth
import BaseLayout from './layout/BaseLayout'
import Login from './auth/Login'
import AuthGuard from './auth/AuthGuard'
import LandingPage from './pages/LandingPage'

// Dashboards
import DashboardHR from './pages/dashboard/DashboardHR'
import DashboardManager from './pages/dashboard/DashboardManager'
import DashboardEmployee from './pages/dashboard/DashboardEmployee'

// HR Tools
import UploadCSV from './pages/evaluation/UploadCSV'
import SearchEmployee from './pages/evaluation/SearchEmployee'
import EmployeeResult from './pages/evaluation/EmployeeResult'
import ManualEntryHR from './pages/evaluation/ManualEntryHR'
import ManualEntryTL from './pages/evaluation/ManualEntryTL'
import InsightsPanel from './pages/insights/InsightsPanel'
import InsightsPanelTL from './pages/insights/InsightsPanelTL'
import AssignTask from './pages/AssignTask'
import EmployeeList from './pages/evaluation/EmployeeList'
import MyResult from './pages/evaluation/MyResult'

function App() {
  return (
    <Routes>
      {/* MODIFIED: Landing page is now the default route */}
      <Route path="/" element={<LandingPage />} />
      {/* MODIFIED: Login page is on its own dedicated route */}
      <Route path="/login" element={<Login />} />

      {/* --- ALL OTHER ROUTES REMAIN THE SAME --- */}
      
      {/* HR routes (exclusive) */}
      <Route element={<AuthGuard allowedRoles={['HR']} />}>
        <Route element={<BaseLayout />}> 
          <Route path="/dashboard" element={<DashboardHR />} />
          <Route path="/upload" element={<UploadCSV />} />
          <Route path="/search" element={<SearchEmployee />} />
          <Route path="/manual-entry" element={<ManualEntryHR />} />
          <Route path="/insights" element={<InsightsPanel />} />
          <Route path="/employees" element={<EmployeeList />} />
        </Route>
      </Route>

      {/* Manager routes (exclusive) */}
      <Route element={<AuthGuard allowedRoles={['Manager']} />}>
        <Route element={<BaseLayout />}>
          <Route path="/manager-dashboard" element={<DashboardManager />} />
          <Route path="/manual-complete" element={<ManualEntryTL />} />
          <Route path="/insightstl" element={<InsightsPanelTL />} />
          <Route path="/assigntask" element={<AssignTask />} />
        </Route>
      </Route>
      
      {/* ✅ START: Shared routes for HR and Manager */}
      <Route element={<AuthGuard allowedRoles={['HR', 'Manager']} />}>
        <Route element={<BaseLayout />}>
          <Route path="/generate-report" element={<EmployeeResult />} />
        </Route>
      </Route>
      {/* ✅ END: Shared routes for HR and Manager */}

      {/* Employee routes */}
      <Route element={<AuthGuard allowedRoles={['Employee']} />}>
        <Route element={<BaseLayout />}>
          <Route path="/employee-dashboard" element={<DashboardEmployee />} />
          <Route path="/my-result" element={<MyResult />} />
        </Route>
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App