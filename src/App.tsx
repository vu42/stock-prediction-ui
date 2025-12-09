import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from "react-router-dom";
import { TrainingPage } from "./components/pages/TrainingPage";
import { PipelinesPage } from "./components/pages/PipelinesPage";
import { ModelsPage } from "./components/pages/ModelsPage";
import { HomePage } from "./components/pages/HomePage";
import { StockDetailPage } from "./components/pages/StockDetailPage";
import { LoginPage } from "./components/pages/LoginPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Button } from "./components/ui/button";
import { LogOut } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = {
    end_user: [
      { path: "/home", label: "Home" },
      { path: "/stock-detail", label: "Stock Detail" },
    ],
    data_scientist: [
      { path: "/training", label: "Training" },
      { path: "/pipelines", label: "Pipelines" },
      { path: "/models", label: "Models" },
      { path: "/home", label: "Home" },
      { path: "/stock-detail", label: "Stock Detail" },
    ],
  };

  const currentNavItems = navItems[user?.role || "end_user"] || [];

  const handleLogout = () => {
    logout();
    navigate("/sign-in");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={user?.role === "end_user" ? "/home" : "/training"}
            className="text-gray-900 cursor-pointer hover:text-gray-700 transition-colors"
          >
            Stock Prediction
          </Link>
          <span className="text-sm text-gray-500">
            {user?.displayName} (
            {user?.role === "end_user"
              ? "End User"
              : "Data Scientist"}
            )
          </span>
        </div>
        <div className="flex items-center gap-2">
          {currentNavItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={
                  location.pathname === item.path ? "default" : "ghost"
                }
              >
                {item.label}
              </Button>
            </Link>
          ))}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="gap-2 ml-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}

function AppLayout() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <Navigation />
      <div
        className="w-full"
        style={{ width: "1440px", margin: "0 auto" }}
      >
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/stock-detail/:ticker" element={<StockDetailPage />} />
          <Route path="/stock-detail" element={<StockDetailPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/pipelines" element={<PipelinesPage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route 
            path="/" 
            element={
              <Navigate 
                to={user?.role === "end_user" ? "/home" : "/training"} 
                replace 
              />
            } 
          />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 animate-spin text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/sign-in" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider children={<AppContent />}>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}