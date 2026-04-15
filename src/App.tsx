import { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SearchProvider } from "@/contexts/SearchContext";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import Index from "./pages/Index";
import AddListing from "./pages/AddListing";
import Admin from "./pages/Admin";

import BusinessDashboard from "./pages/BusinessDashboard";
import BusinessDetail from "./pages/BusinessDetail";
import CityCategory from "./pages/CityCategory";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import SeedFirestore from "./pages/SeedFirestore";
import GenerateSitemap from "./pages/GenerateSitemap";
import SignUp from "./pages/SignUp";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isAdminPage = location.pathname === "/admin";
  const isDashboardPage = location.pathname === "/dashboard";
  const isSignupPage = location.pathname === "/signup";
  const hideHeader = isAdminPage || isDashboardPage || isSignupPage;
  const hideFooter = isAdminPage || isDashboardPage || ["/signup", "/reset-password"].includes(location.pathname);
  const [showMap, setShowMap] = useState(false);
  const [detectLocationFn, setDetectLocationFn] = useState<(() => void) | null>(null);

  const registerDetectLocation = useCallback((fn: () => void) => {
    setDetectLocationFn(() => fn);
  }, []);

  return (
    <>
      <ScrollToTop />
      {!hideHeader && (
        <Header
          showMap={showMap}
          onToggleMap={() => setShowMap(prev => !prev)}
          onDetectLocation={detectLocationFn ?? undefined}
        />
      )}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            <PageTransition>
              <Index
                showMap={showMap}
                setShowMap={setShowMap}
                registerDetectLocation={registerDetectLocation}
              />
            </PageTransition>
          } />
          <Route path="/:areaSlug/:categorySlug/:businessSlug" element={<PageTransition><BusinessDetail /></PageTransition>} />
          <Route path="/add-listing" element={<PageTransition><AddListing /></PageTransition>} />
          <Route path="/dashboard" element={<PageTransition><BusinessDashboard /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
          
          <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
          <Route path="/signup" element={<PageTransition><SignUp /></PageTransition>} />
          <Route path="/about" element={<PageTransition><About /></PageTransition>} />
          <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
          <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
          <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
          <Route path="/seed" element={<PageTransition><SeedFirestore /></PageTransition>} />
          <Route path="/:citySlug" element={<PageTransition><CityCategory /></PageTransition>} />
          <Route path="/:citySlug/:categorySlug" element={<PageTransition><CityCategory /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
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