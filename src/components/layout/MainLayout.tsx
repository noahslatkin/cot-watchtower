import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useRefresh } from "@/contexts/RefreshContext";
import { Download } from "lucide-react";
import { format } from "date-fns";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { status } = useRefresh();
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 border-b bg-card flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="text-lg font-semibold text-foreground">
                CFTC COT Analysis Platform
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DateRangePicker />
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>

          {/* Footer with refresh status */}
          <footer className="h-10 border-t bg-card flex items-center justify-between px-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                Last refresh: {status.lastRefresh ? 
                  format(status.lastRefresh, "MMM dd, yyyy 'at' h:mm a") : 
                  'Never'
                }
              </span>
              {status.rowsUpdated > 0 && (
                <span>({status.rowsUpdated.toLocaleString()} records)</span>
              )}
              {status.error && (
                <span className="text-destructive">Error: {status.error}</span>
              )}
            </div>
            <div className="text-xs">
              CFTC COT Analysis Platform
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}