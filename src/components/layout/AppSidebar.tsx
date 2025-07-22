import { useState } from "react";
import { useRefresh } from "@/contexts/RefreshContext";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  TrendingUp,
  Wheat,
  Fuel,
  Coins,
  DollarSign,
  Coffee,
  Globe,
  Home,
  Map,
  Settings,
  BookOpen,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Heat Maps", url: "/heatmaps", icon: Map },
  { title: "Extreme Readings", url: "/extreme-readings", icon: AlertTriangle },
  { title: "Journal", url: "/journal", icon: BookOpen },
  { title: "Settings", url: "/settings", icon: Settings },
];

const marketSectors = [
  {
    title: "Equities",
    icon: TrendingUp,
    markets: ["E-mini S&P 500", "E-mini Nasdaq-100", "E-mini Dow"],
  },
  {
    title: "Fixed Income",
    icon: BarChart3,
    markets: ["2-Year Note", "5-Year Note", "10-Year Note", "30-Year Bond"],
  },
  {
    title: "Currencies",
    icon: DollarSign,
    markets: ["Euro FX", "Japanese Yen", "British Pound", "Canadian Dollar"],
  },
  {
    title: "Energies",
    icon: Fuel,
    markets: ["Crude Oil WTI", "Brent Crude", "Natural Gas", "Heating Oil"],
  },
  {
    title: "Metals",
    icon: Coins,
    markets: ["Gold", "Silver", "Copper", "Platinum"],
  },
  {
    title: "Softs",
    icon: Coffee,
    markets: ["Coffee C", "Sugar #11", "Cotton #2", "Cocoa"],
  },
  {
    title: "Grains",
    icon: Wheat,
    markets: ["Corn", "Soybeans", "Wheat", "Soybean Oil"],
  },
  {
    title: "Livestock",
    icon: Globe,
    markets: ["Live Cattle", "Feeder Cattle", "Lean Hogs"],
  },
];

function RefreshButton() {
  const { status, triggerRefresh } = useRefresh();
  const { toast } = useToast();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleRefresh = async () => {
    try {
      await triggerRefresh();
      toast({
        title: "Data Refreshed",
        description: `Successfully updated ${status.rowsUpdated} records`,
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: status.error || "Failed to refresh data",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        className="hover:bg-sidebar-accent/50" 
        onClick={handleRefresh}
        disabled={status.isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 ${status.isRefreshing ? 'animate-spin' : ''}`} />
        {!isCollapsed && (
          <span className="text-sm">
            {status.isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </span>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [openSectors, setOpenSectors] = useState<string[]>(["Equities"]);
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-primary font-medium" : "hover:bg-sidebar-accent/50";

  const toggleSector = (sectorTitle: string) => {
    setOpenSectors((prev) =>
      prev.includes(sectorTitle)
        ? prev.filter((s) => s !== sectorTitle)
        : [...prev, sectorTitle]
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Header */}
        <SidebarGroup>
          <div className="px-4 py-2">
            <h2 className={`font-bold text-lg text-sidebar-primary ${isCollapsed ? "hidden" : ""}`}>
              COT Analyzer
            </h2>
            {isCollapsed && (
              <div className="text-sidebar-primary font-bold text-xl text-center">C</div>
            )}
          </div>
        </SidebarGroup>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Markets by Sector */}
        <SidebarGroup>
          <SidebarGroupLabel>Markets</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {marketSectors.map((sector) => (
                <Collapsible
                  key={sector.title}
                  open={!isCollapsed && openSectors.includes(sector.title)}
                  onOpenChange={() => !isCollapsed && toggleSector(sector.title)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="hover:bg-sidebar-accent/50">
                        <sector.icon className="h-4 w-4" />
                        {!isCollapsed && (
                          <>
                            <span>{sector.title}</span>
                            {openSectors.includes(sector.title) ? (
                              <ChevronDown className="ml-auto h-4 w-4" />
                            ) : (
                              <ChevronRight className="ml-auto h-4 w-4" />
                            )}
                          </>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {!isCollapsed && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {sector.markets.map((market) => (
                            <SidebarMenuSubItem key={market}>
                              <SidebarMenuSubButton asChild>
                                <NavLink 
                                  to={`/market/${market.toLowerCase().replace(/\s+/g, '-').replace('#', '').replace('&', 'and')}`}
                                  className={getNavCls}
                                >
                                  <span className="text-sm">{market}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Actions */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <RefreshButton />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}