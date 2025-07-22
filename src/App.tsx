import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import MarketDetail from "./pages/MarketDetail";
import HeatMaps from "./pages/HeatMaps";
import ExtremeReadings from "./pages/ExtremeReadings";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/heatmaps" element={<MainLayout><HeatMaps /></MainLayout>} />
          <Route path="/extreme-readings" element={<MainLayout><ExtremeReadings /></MainLayout>} />
          <Route path="/market/:marketId" element={<MainLayout><MarketDetail /></MainLayout>} />
          <Route path="/journal" element={<MainLayout><div className="p-6"><h1 className="text-2xl font-bold">Journal & Notes</h1><p className="text-muted-foreground">Coming soon...</p></div></MainLayout>} />
          <Route path="/settings" element={<MainLayout><div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground">Coming soon...</p></div></MainLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
