import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Generate comprehensive mock data for all contracts
const generateAllContractsData = () => {
  const sectors = [
    { title: "Equities", markets: ["E-mini S&P 500", "E-mini Nasdaq-100", "E-mini Dow"] },
    { title: "Fixed Income", markets: ["2-Year Note", "5-Year Note", "10-Year Note", "30-Year Bond"] },
    { title: "Currencies", markets: ["Euro FX", "Japanese Yen", "British Pound", "Canadian Dollar"] },
    { title: "Energies", markets: ["Crude Oil WTI", "Brent Crude", "Natural Gas", "Heating Oil"] },
    { title: "Metals", markets: ["Gold", "Silver", "Copper", "Platinum"] },
    { title: "Softs", markets: ["Coffee C", "Sugar #11", "Cotton #2", "Cocoa"] },
    { title: "Grains", markets: ["Corn", "Soybeans", "Wheat", "Soybean Oil"] },
    { title: "Livestock", markets: ["Live Cattle", "Feeder Cattle", "Lean Hogs"] }
  ];

  const allContracts: any[] = [];
  
  sectors.forEach(sector => {
    sector.markets.forEach(market => {
      // Generate realistic indices and deltas
      const commIndex = Math.round(Math.random() * 100);
      const lsIndex = Math.round(100 - commIndex + (Math.random() - 0.5) * 20);
      const ssIndex = Math.round(40 + (Math.random() - 0.5) * 40);
      
      const commDelta = Math.round((Math.random() - 0.5) * 30);
      const lsDelta = Math.round((Math.random() - 0.5) * 30);
      const ssDelta = Math.round((Math.random() - 0.5) * 15);
      
      let setupStatus = "neutral";
      if (commIndex >= 95 || commIndex <= 5) setupStatus = "extreme";
      else if (commIndex >= 85 || commIndex <= 15) setupStatus = "setup";
      
      allContracts.push({
        contract: market,
        category: sector.title.toUpperCase(),
        slug: market.toLowerCase().replace(/\s+/g, '-').replace('#', '').replace('&', 'and'),
        commercials: commIndex,
        largeSpecs: Math.max(0, Math.min(100, lsIndex)),
        smallSpecs: Math.max(0, Math.min(100, ssIndex)),
        commWoWDelta: commDelta,
        lgSpecWoWDelta: lsDelta,
        smSpecWoWDelta: ssDelta,
        cotSetUp: setupStatus === "extreme" ? 
          (commIndex >= 95 ? "SHORT SETUP" : "LONG SETUP") :
          setupStatus === "setup" ? 
          `CLOSE SETUP - ${commIndex >= 85 ? "SHORT" : "LONG"}` : "",
        prevCommercials: Math.max(0, Math.min(100, commIndex - commDelta)),
        prevLargeSpecs: Math.max(0, Math.min(100, lsIndex - lsDelta)),
        prevSmallSpecs: Math.max(0, Math.min(100, ssIndex - ssDelta))
      });
    });
  });
  
  return allContracts;
};

type SortKey = 'contract' | 'category' | 'commercials' | 'largeSpecs' | 'smallSpecs' | 'commWoWDelta' | 'lgSpecWoWDelta' | 'smSpecWoWDelta';
type SortDirection = 'asc' | 'desc' | null;

const getCellColor = (value: number) => {
  if (value >= 95) return "bg-red-600 text-white";
  if (value >= 85) return "bg-red-500 text-white";
  if (value >= 75) return "bg-red-400 text-white";
  if (value >= 65) return "bg-red-300 text-black";
  if (value >= 55) return "bg-red-200 text-black";
  if (value >= 45) return "bg-gray-200 text-black";
  if (value >= 35) return "bg-blue-200 text-black";
  if (value >= 25) return "bg-blue-300 text-white";
  if (value >= 15) return "bg-blue-400 text-white";
  if (value >= 5) return "bg-blue-500 text-white";
  return "bg-blue-600 text-white";
};

const getDeltaColor = (delta: number) => {
  if (Math.abs(delta) >= 20) return delta > 0 ? "bg-green-600 text-white" : "bg-red-600 text-white";
  if (Math.abs(delta) >= 10) return delta > 0 ? "bg-green-500 text-white" : "bg-red-500 text-white";
  if (Math.abs(delta) >= 5) return delta > 0 ? "bg-green-400 text-black" : "bg-red-400 text-black";
  return "bg-gray-100 text-black";
};

const getSetupColor = (setup: string) => {
  if (setup.includes("SHORT")) return "bg-red-100 text-red-800 border-red-300";
  if (setup.includes("LONG")) return "bg-green-100 text-green-800 border-green-300";
  return "bg-gray-100 text-gray-800 border-gray-300";
};

export default function HeatMaps() {
  const navigate = useNavigate();
  const [contractsData] = useState(generateAllContractsData());
  const [sectorFilter, setSectorFilter] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>('commercials');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredAndSortedData = useMemo(() => {
    let filtered = contractsData.filter(contract => {
      const matchesSector = sectorFilter === "all" || contract.category === sectorFilter.toUpperCase();
      const matchesSearch = contract.contract.toLowerCase().includes(searchFilter.toLowerCase());
      return matchesSector && matchesSearch;
    });

    if (sortKey && sortDirection) {
      filtered.sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];
        
        if (typeof aValue === 'string') {
          return sortDirection === 'asc' ? 
            aValue.localeCompare(bValue) : 
            bValue.localeCompare(aValue);
        }
        
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }
    
    return filtered;
  }, [contractsData, sectorFilter, searchFilter, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => 
        prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
      );
      if (sortDirection === 'desc') {
        setSortKey('commercials');
        setSortDirection('desc');
      }
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    if (sortDirection === 'asc') return <ArrowUp className="h-4 w-4 text-foreground" />;
    if (sortDirection === 'desc') return <ArrowDown className="h-4 w-4 text-foreground" />;
    return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
  };

  const sectors = ["Equities", "Fixed Income", "Currencies", "Energies", "Metals", "Softs", "Grains", "Livestock"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">COT Heat Maps & Rankings</h1>
        <p className="text-muted-foreground mt-2">
          Week-over-week positioning changes and current index levels across all markets
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[300px]">
          <Input
            placeholder="Search contracts..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
        <Select value={sectorFilter} onValueChange={setSectorFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by sector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sectors</SelectItem>
            {sectors.map(sector => (
              <SelectItem key={sector} value={sector}>{sector}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">
          {filteredAndSortedData.length} contracts
        </Badge>
      </div>

      {/* Sortable Heat Map Table */}
      <Card>
        <CardHeader>
          <CardTitle>Week over Week Heat Map</CardTitle>
          <div className="text-sm text-muted-foreground">
            Sortable table with all contracts - click column headers to sort
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('contract')}
                      className="font-semibold text-xs"
                    >
                      Contract {getSortIcon('contract')}
                    </Button>
                  </th>
                  <th className="text-left p-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('category')}
                      className="font-semibold text-xs"
                    >
                      Category {getSortIcon('category')}
                    </Button>
                  </th>
                  <th className="text-left p-2 font-semibold">CoT Set Up</th>
                  <th className="text-center p-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('commWoWDelta')}
                      className="font-semibold text-xs"
                    >
                      Comm WoW Δ {getSortIcon('commWoWDelta')}
                    </Button>
                  </th>
                  <th className="text-center p-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('lgSpecWoWDelta')}
                      className="font-semibold text-xs"
                    >
                      LG Spec WoW Δ {getSortIcon('lgSpecWoWDelta')}
                    </Button>
                  </th>
                  <th className="text-center p-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('smSpecWoWDelta')}
                      className="font-semibold text-xs"
                    >
                      SM Spec WoW Δ {getSortIcon('smSpecWoWDelta')}
                    </Button>
                  </th>
                  <th className="text-center p-2 font-semibold">Current Week</th>
                  <th className="text-center p-2 font-semibold"></th>
                  <th className="text-center p-2 font-semibold"></th>
                  <th className="text-center p-2 font-semibold">Previous Week</th>
                  <th className="text-center p-2 font-semibold"></th>
                  <th className="text-center p-2 font-semibold"></th>
                  <th className="text-center p-2 font-semibold">Action</th>
                </tr>
                <tr className="border-b text-xs">
                  <th className="p-1"></th>
                  <th className="p-1"></th>
                  <th className="p-1"></th>
                  <th className="p-1"></th>
                  <th className="p-1"></th>
                  <th className="p-1"></th>
                  <th className="text-center p-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('commercials')}
                      className="font-medium text-xs"
                    >
                      Commercials {getSortIcon('commercials')}
                    </Button>
                  </th>
                  <th className="text-center p-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('largeSpecs')}
                      className="font-medium text-xs"
                    >
                      Large Specs {getSortIcon('largeSpecs')}
                    </Button>
                  </th>
                  <th className="text-center p-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('smallSpecs')}
                      className="font-medium text-xs"
                    >
                      Small Specs {getSortIcon('smallSpecs')}
                    </Button>
                  </th>
                  <th className="text-center p-1 font-medium">Commercials</th>
                  <th className="text-center p-1 font-medium">Large Specs</th>
                  <th className="text-center p-1 font-medium">Small Specs</th>
                  <th className="text-center p-1"></th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{row.contract}</td>
                    <td className="p-2 text-muted-foreground">{row.category}</td>
                    <td className="p-2">
                      {row.cotSetUp && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getSetupColor(row.cotSetUp)}`}
                        >
                          {row.cotSetUp}
                        </Badge>
                      )}
                    </td>
                    <td className={`p-2 text-center text-xs ${getDeltaColor(row.commWoWDelta)}`}>
                      {row.commWoWDelta > 0 ? '+' : ''}{row.commWoWDelta}
                    </td>
                    <td className={`p-2 text-center text-xs ${getDeltaColor(row.lgSpecWoWDelta)}`}>
                      {row.lgSpecWoWDelta > 0 ? '+' : ''}{row.lgSpecWoWDelta}
                    </td>
                    <td className={`p-2 text-center text-xs ${getDeltaColor(row.smSpecWoWDelta)}`}>
                      {row.smSpecWoWDelta > 0 ? '+' : ''}{row.smSpecWoWDelta}
                    </td>
                    <td className={`p-2 text-center font-bold ${getCellColor(row.commercials)}`}>
                      {row.commercials}
                    </td>
                    <td className={`p-2 text-center font-bold ${getCellColor(row.largeSpecs)}`}>
                      {row.largeSpecs}
                    </td>
                    <td className={`p-2 text-center font-bold ${getCellColor(row.smallSpecs)}`}>
                      {row.smallSpecs}
                    </td>
                    <td className={`p-2 text-center ${getCellColor(row.prevCommercials)}`}>
                      {row.prevCommercials}
                    </td>
                    <td className={`p-2 text-center ${getCellColor(row.prevLargeSpecs)}`}>
                      {row.prevLargeSpecs}
                    </td>
                    <td className={`p-2 text-center ${getCellColor(row.prevSmallSpecs)}`}>
                      {row.prevSmallSpecs}
                    </td>
                    <td className="p-2 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/market/${row.slug}`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Heat Map Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded"></div>
              <span className="text-sm">0-5 (Extreme Short)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-400 rounded"></div>
              <span className="text-sm">15-25</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
              <span className="text-sm">45-55 (Neutral)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-400 rounded"></div>
              <span className="text-sm">75-85</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-600 rounded"></div>
              <span className="text-sm">95-100 (Extreme Long)</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p><strong>Setup Definitions:</strong></p>
            <p>• <strong>Close Setup:</strong> Within 5 points of extreme threshold</p>
            <p>• <strong>Current Trade:</strong> Active position based on index reading</p>
            <p>• <strong>Short/Long Setup:</strong> Directional bias based on commercial positioning</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}