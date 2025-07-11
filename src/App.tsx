
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import DefaultEmailTemplates from "@/components/DefaultEmailTemplates";

// Import pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import ContactsModule from "./pages/ContactsModule";
import Leads from "./pages/Leads";
import Deals from "./pages/Deals";
import Meetings from "./pages/Meetings";
import Feeds from "./pages/Feeds";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {user && <DefaultEmailTemplates />}
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Index />} />
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/dashboard" />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="contacts-module" element={<ContactsModule />} />
              <Route path="leads" element={<Leads />} />
              <Route path="deals" element={<Deals />} />
              <Route path="meetings" element={<Meetings />} />
              <Route path="feeds" element={<Feeds />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
