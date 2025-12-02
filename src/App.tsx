import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Button } from "./components/ui/button";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import SafeRoute from "./components/SafeRoute";
import Navbar from "./components/Navbar";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import JobsPage from "./pages/JobsPage";
import MyContractsPage from "./pages/MyContractsPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import ApplicationsPage from "./pages/ApplicationsPage";
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
            <Route 
              path="/login" 
              element={
                <SafeRoute>
                  <LoginPage />
                </SafeRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <SafeRoute>
                  <SignUpPage />
                </SafeRoute>
              } 
            />
            {/* Jobs page - accessible to workers and admins */}
            <Route
              path="/"
              element={
                <SafeRoute>
                  <RoleProtectedRoute allowedRoles={['worker', 'admin']}>
                    <JobsPage />
                  </RoleProtectedRoute>
                </SafeRoute>
              }
            />
            <Route
              path="/jobs"
              element={
                <SafeRoute>
                  <RoleProtectedRoute allowedRoles={['worker', 'admin']}>
                    <JobsPage />
                  </RoleProtectedRoute>
                </SafeRoute>
              }
            />
            {/* Contracts page - accessible to workers and admins */}
            <Route
              path="/my-contracts"
              element={
                <SafeRoute>
                  <RoleProtectedRoute allowedRoles={['worker', 'admin']}>
                    <MyContractsPage />
                  </RoleProtectedRoute>
                </SafeRoute>
              }
            />
            {/* Dashboard (Post Job) - accessible to growers and admins */}
            <Route
              path="/dashboard"
              element={
                <SafeRoute>
                  <RoleProtectedRoute allowedRoles={['grower', 'admin']}>
                    <DashboardPage />
                  </RoleProtectedRoute>
                </SafeRoute>
              }
            />
            {/* Admin page - only accessible to admins */}
            <Route
              path="/admin"
              element={
                <SafeRoute>
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <AdminPage />
                  </RoleProtectedRoute>
                </SafeRoute>
              }
            />
            {/* Applications page - accessible to growers and admins */}
            <Route
              path="/applications"
              element={
                <SafeRoute>
                  <RoleProtectedRoute allowedRoles={['grower', 'admin']}>
                    <ApplicationsPage />
                  </RoleProtectedRoute>
                </SafeRoute>
              }
            />
            {/* Fallback route - catch all errors */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center p-4">
                  <div className="max-w-md text-center space-y-4">
                    <h1 className="text-2xl font-bold">Page Not Found</h1>
                    <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
                    <Button asChild>
                      <Link to="/jobs">Go to Jobs</Link>
                    </Button>
                  </div>
                </div>
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
