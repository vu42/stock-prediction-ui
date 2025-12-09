import { useState, useEffect } from "react";
import { TrainingPage } from "./components/pages/TrainingPage";
import { PipelinesPage } from "./components/pages/PipelinesPage";
import { ModelsPage } from "./components/pages/ModelsPage";
import { HomePage } from "./components/pages/HomePage";
import { StockDetailPage } from "./components/pages/StockDetailPage";
import { LoginPage } from "./components/pages/LoginPage";
import { Button } from "./components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

type PageType =
  | "home"
  | "stock-detail"
  | "training"
  | "pipelines"
  | "models";

function AppContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [activePage, setActivePage] = useState<PageType>("home");
  const [selectedTicker, setSelectedTicker] = useState<string>("FPT");

  // Set default page based on role when user logs in
  useEffect(() => {
    if (user) {
      if (user.role === "end_user") {
        setActivePage("home");
      } else if (user.role === "data_scientist") {
        setActivePage("training");
      }
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    setActivePage("home");
  };

  const handleNavigateToStock = (ticker: string) => {
    setSelectedTicker(ticker);
    setActivePage("stock-detail");
  };

  const handleNavigateHome = () => {
    setActivePage("home");
  };

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // Navigation items based on user role
  const navItems = {
    end_user: [{ key: "home" as PageType, label: "Home" }],
    data_scientist: [
      { key: "training" as PageType, label: "Training" },
      { key: "pipelines" as PageType, label: "Pipelines" },
      { key: "models" as PageType, label: "Models" },
      { key: "home" as PageType, label: "Home" },
      { key: "stock-detail" as PageType, label: "Stock Detail" },
    ],
  };

  const currentNavItems = navItems[user.role] || [];

  const handleLogoClick = () => {
    if (user.role === "end_user") {
      setActivePage("home");
    } else if (user.role === "data_scientist") {
      setActivePage("training");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2
              className="text-gray-900 cursor-pointer hover:text-gray-700 transition-colors"
              onClick={handleLogoClick}
            >
              Stock Prediction
            </h2>
            <span className="text-sm text-gray-500">
              {user.displayName} (
              {user.role === "end_user"
                ? "End User"
                : "Data Scientist"}
              )
            </span>
          </div>
          <div className="flex items-center gap-2">
            {currentNavItems.map((item) => (
              <Button
                key={item.key}
                variant={
                  activePage === item.key ? "default" : "ghost"
                }
                onClick={() => setActivePage(item.key)}
              >
                {item.label}
              </Button>
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

      {/* Page Content */}
      <div
        className="w-full"
        style={{ width: "1440px", margin: "0 auto" }}
      >
        {activePage === "home" && (
          <HomePage onNavigateToStock={handleNavigateToStock} />
        )}
        {activePage === "stock-detail" && (
          <StockDetailPage
            ticker={selectedTicker}
            onNavigateHome={handleNavigateHome}
          />
        )}
        {activePage === "training" && <TrainingPage />}
        {activePage === "pipelines" && <PipelinesPage />}
        {activePage === "models" && <ModelsPage />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}