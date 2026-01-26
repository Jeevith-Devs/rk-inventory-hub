import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Introduction from "@/pages/Introduction";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Suppliers from "@/pages/Suppliers";
import Buyers from "@/pages/Buyers";
import Products from "@/pages/Products";
import Purchases from "@/pages/Purchases";
import Sales from "@/pages/Sales";
import Quotations from "@/pages/Quotations";
import { QuotationFormPage } from "@/pages/NewQuotation";
import { QuotationView } from "@/pages/QuotationView";
import PurchaseOrders from "@/pages/PurchaseOrders";
import PurchaseOrderFormPage from "@/pages/NewPurchaseOrder";
import PurchaseOrderView from "@/pages/PurchaseOrderView";
import { Invoice } from "@/pages/Invoice";
import Reports from "@/pages/Reports";
import MISReport from "@/pages/MISReport";
import Settings from "@/pages/Settings";
import StockInFormPage from "@/pages/StockInFormPage";
import StockOutFormPage from "@/pages/StockOutFormPage";
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
              <Route path="/" element={<Introduction />} />
              <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />

              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/customers" element={<Buyers />} />
                <Route path="/products" element={<Products />} />
                <Route path="/purchases" element={<Purchases />} />
                <Route path="/purchases/new" element={<StockInFormPage />} />
                <Route path="/purchases/edit/:id" element={<StockInFormPage />} />

                <Route path="/sales" element={<Sales />} />
                <Route path="/sales/new" element={<StockOutFormPage />} />
                <Route path="/sales/edit/:id" element={<StockOutFormPage />} />
                <Route path="/quotations" element={<Quotations />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/mis-report" element={<MISReport />} />
                <Route path="/settings" element={<Settings />} />

                {/* Purchase Orders Routes */}
                <Route path="/purchase-orders" element={<PurchaseOrders />} />
                <Route path="/purchase-orders/new" element={<PurchaseOrderFormPage />} />
                <Route path="/purchase-orders/edit/:id" element={<PurchaseOrderFormPage />} />

                <Route path="/quotations/new" element={<QuotationFormPage />} />
                <Route path="/quotations/edit/:id" element={<QuotationFormPage />} />
              </Route>

              <Route path="/invoice/:id" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
              <Route path="/quotations/:id" element={<ProtectedRoute><QuotationView /></ProtectedRoute>} />

              <Route path="/purchase-orders/:id" element={<ProtectedRoute><PurchaseOrderView /></ProtectedRoute>} />


              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
