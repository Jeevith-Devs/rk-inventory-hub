import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LoaderProvider, useLoader } from "@/contexts/LoaderContext";
import { Loader } from "@/components/ui/loader";
import { MainLayout } from "@/components/layout/MainLayout";
import { useEffect } from "react";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Suppliers from "@/pages/Suppliers";
import Buyers from "@/pages/Buyers";
import Products from "@/pages/Products";
import Purchases from "@/pages/Purchases";
import Sales from "@/pages/Sales";
import { Invoice } from "@/pages/Invoice";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Component to handle route transitions and show loader
function RouteTransitionHandler() {
  const location = useLocation();
  const { startLoading, stopLoading } = useLoader();

  useEffect(() => {
    startLoading();
    // Stop loading after a short delay to allow route to render
    const timer = setTimeout(() => {
      stopLoading();
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname, startLoading, stopLoading]);

  return null;
}

// Component to render global loader
function GlobalLoader() {
  const { isLoading, message } = useLoader();

  if (!isLoading) return null;

  return (
    <Loader 
      fullScreen 
      variant="spinner" 
      size="lg"
      message={message}
    />
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { startLoading, stopLoading } = useLoader();

  useEffect(() => {
    if (loading) {
      startLoading("Authenticating...");
    } else {
      stopLoading();
    }
  }, [loading, startLoading, stopLoading]);

  if (loading) {
    return null; // Global loader will show
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { startLoading, stopLoading } = useLoader();

  useEffect(() => {
    if (loading) {
      startLoading("Loading...");
    } else {
      stopLoading();
    }
  }, [loading, startLoading, stopLoading]);

  if (loading) {
    return null; // Global loader will show
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LoaderProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <GlobalLoader />
            <BrowserRouter>
              <RouteTransitionHandler />
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
                
                <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/customers" element={<Buyers />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/purchases" element={<Purchases />} />
                  <Route path="/sales" element={<Sales />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                <Route path="/invoice/:id" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LoaderProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
