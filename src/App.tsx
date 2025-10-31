import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import RegisterDelivery from "./pages/RegisterDelivery";
import PickupDelivery from "./pages/PickupDelivery";
import ManageUnits from "./pages/ManageUnits";
import InviteResident from "./pages/InviteResident";
import ManagePorteiro from "./pages/ManagePorteiro";
import RemovePorteiro from "./pages/RemovePorteiro";
import RemoveMorador from "./pages/RemoveMorador";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register-delivery" element={<RegisterDelivery />} />
            <Route path="/pickup-delivery" element={<PickupDelivery />} />
            <Route path="/manage-units" element={<ManageUnits />} />
            <Route path="/invite-resident" element={<InviteResident />} />
            <Route path="/manage-porteiro" element={<ManagePorteiro />} />
            <Route path="/remove-porteiro" element={<RemovePorteiro />} />
            <Route path="/remove-morador" element={<RemoveMorador />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
