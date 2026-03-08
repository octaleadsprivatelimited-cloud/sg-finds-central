import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SearchProvider } from "@/contexts/SearchContext";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import AddListing from "./pages/AddListing";
import Admin from "./pages/Admin";
import SuperAdmin from "./pages/SuperAdmin";
import BusinessDashboard from "./pages/BusinessDashboard";
import BusinessDetail from "./pages/BusinessDetail";
import CityCategory from "./pages/CityCategory";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import SeedFirestore from "./pages/SeedFirestore";
import SignUp from "./pages/SignUp";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const hideFooter = ["/signup", "/reset-password"].includes(location.pathname);

  return (
    <>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/:areaSlug/:categorySlug/:businessSlug" element={<BusinessDetail />} />
        <Route path="/add-listing" element={<AddListing />} />
        <Route path="/dashboard" element={<BusinessDashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/seed" element={<SeedFirestore />} />
        <Route path="/:citySlug" element={<CityCategory />} />
        <Route path="/:citySlug/:categorySlug" element={<CityCategory />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideFooter && <Footer />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SearchProvider>
            <AppContent />
          </SearchProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
