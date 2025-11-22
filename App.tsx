import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Farms from "./pages/Farms";
import FarmDetails from "./pages/FarmDetails";
import Cows from "./pages/Cows";
import CowDetails from "./pages/CowDetails";
import ClusterPerformance from "./pages/ClusterPerformance";

import { PageLoader } from "./components/ui";

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Farm Routes */}
        <Route path="farms" element={<Farms />} />
        <Route path="farms/:id" element={<FarmDetails />} />

        {/* Cow Routes */}
        <Route path="cows" element={<Cows />} />
        <Route path="cows/:id" element={<CowDetails />} />

        {/* Cluster Routes */}
        <Route path="clusters" element={<ClusterPerformance />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}
