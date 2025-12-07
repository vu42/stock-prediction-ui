import { useState } from "react";
import { TrainingPage } from "./components/pages/TrainingPage";
import { PipelinesPage } from "./components/pages/PipelinesPage";
import { ModelsPage } from "./components/pages/ModelsPage";
import { HomePage } from "./components/pages/HomePage";
import { StockDetailPage } from "./components/pages/StockDetailPage";
import { LoginPage } from "./components/pages/LoginPage";
import { Button } from "./components/ui/button";
import { LogOut } from "lucide-react";
import { Toaster } from "./components/ui/sonner";

type PageType =
  | "home"
  | "stock-detail"
  | "training"
  | "pipelines"
  | "models";
type UserRole = "enduser" | "datascientist" | null;

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [username, setUsername] = useState("");
  const [activePage, setActivePage] =
    useState<PageType>("home");
  const [selectedTicker, setSelectedTicker] =
    useState<string>("FPT");

  const handleLogin = (username: string, password: string) => {
    // Determine user role based on username
    const role: UserRole = username.startsWith("enduser")
      ? "enduser"
      : username.startsWith("ds")
        ? "datascientist"
        : null;

    setUsername(username);
    setUserRole(role);
    setIsAuthenticated(true);

    // Set default landing page based on role
    if (role === "enduser") {
      setActivePage("home");
    } else if (role === "datascientist") {
      setActivePage("training");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUsername("");
    setActivePage("home");
  };

  const handleNavigateToStock = (ticker: string) => {
    setSelectedTicker(ticker);
    setActivePage("stock-detail");
  };

  const handleNavigateHome = () => {
    setActivePage("home");
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Navigation items based on user role
  const navItems = {
    enduser: [{ key: "home" as PageType, label: "Home" }],
    datascientist: [
      { key: "training" as PageType, label: "Training" },
      { key: "pipelines" as PageType, label: "Pipelines" },
      { key: "models" as PageType, label: "Models" },
      { key: "home" as PageType, label: "Home" },
      { key: "stock-detail" as PageType, label: "Stock Detail" },
    ],
  };

  const currentNavItems = userRole ? navItems[userRole] : [];

  const handleLogoClick = () => {
    if (userRole === "enduser") {
      setActivePage("home");
    } else if (userRole === "datascientist") {
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
              {username} (
              {userRole === "enduser"
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