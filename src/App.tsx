import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Index from "./pages/Index";
import AddListing from "./pages/AddListing";
import Admin from "./pages/Admin";
import SuperAdmin from "./pages/SuperAdmin";
import BusinessDashboard from "./pages/BusinessDashboard";
import BusinessDetail from "./pages/BusinessDetail";
import CityCategory from "./pages/CityCategory";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/business/:slug" element={<BusinessDetail />} />
            <Route path="/add-listing" element={<AddListing />} />
            <Route path="/dashboard" element={<BusinessDashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/super-admin" element={<SuperAdmin />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/:citySlug" element={<CityCategory />} />
            <Route path="/:citySlug/:categorySlug" element={<CityCategory />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
