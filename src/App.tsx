import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MainLayout } from "@/components/layout/MainLayout";
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
