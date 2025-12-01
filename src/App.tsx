import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import JobsPage from "./pages/JobsPage";
import MyContractsPage from "./pages/MyContractsPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ErrorBoundary>
          <Router>
            <div className="min-h-screen bg-background text-foreground">
              <ErrorBoundary>
                <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            {/* Jobs page - accessible to workers and admins */}
            <Route
              path="/"
              element={
                <RoleProtectedRoute allowedRoles={['worker', 'admin']}>
                  <JobsPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/jobs"
              element={
                <RoleProtectedRoute allowedRoles={['worker', 'admin']}>
                  <JobsPage />
                </RoleProtectedRoute>
              }
            />
            {/* Contracts page - accessible to workers and admins */}
            <Route
              path="/my-contracts"
              element={
                <RoleProtectedRoute allowedRoles={['worker', 'admin']}>
                  <MyContractsPage />
                </RoleProtectedRoute>
              }
            />
            {/* Dashboard (Post Job) - accessible to growers and admins */}
            <Route
              path="/dashboard"
              element={
                <RoleProtectedRoute allowedRoles={['grower', 'admin']}>
                  <DashboardPage />
                </RoleProtectedRoute>
              }
            />
            {/* Admin page - only accessible to admins */}
            <Route
              path="/admin"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <AdminPage />
                </RoleProtectedRoute>
              }
                />
                </Routes>
              </ErrorBoundary>
              <ErrorBoundary>
                <Navbar />
              </ErrorBoundary>
            </div>
          </Router>
        </ErrorBoundary>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
