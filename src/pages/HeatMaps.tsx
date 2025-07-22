import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000/api';

interface COTData {
  contract_id: string;
  report_date: string;
  comm_net: number;
  ls_net: number;
  ss_net: number;
  comm_index: number;
  ls_index: number;
  ss_index: number;
  wow_comm_delta: number;
  wow_ls_delta: number;
  wow_ss_delta: number;
  contracts: {
    name: string;
    sector: string;
  };
}

interface ProcessedContract {
  contract: string;
  category: string;
  slug: string;
  commercials: number;
  largeSpecs: number;
  smallSpecs: number;
  commWoWDelta: number;
  lgSpecWoWDelta: number;
  smSpecWoWDelta: number;
  cotSetUp: string;
}

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

const getContractSlug = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, '-').replace('#', '').replace('&', 'and');
};

export default function HeatMaps() {
  const navigate = useNavigate();
  const [contractsData, setContractsData] = useState<ProcessedContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectorFilter, setSectorFilter] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>('commercials');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch latest COT data
  useEffect(() => {
    const fetchCOTData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/cot/latest`);
        if (!response.ok) {
          throw new Error('Failed to fetch COT data');
        }
        
        const data: COTData[] = await response.json();
        
        // Process the data to match the expected format
        const processedData: ProcessedContract[] = data.map(item => {
          let setupStatus = "";
          if (item.comm_index >= 95) setupStatus = "SHORT SETUP";
          else if (item.comm_index <= 5) setupStatus = "LONG SETUP";
          else if (item.comm_index >= 85) setupStatus = "CLOSE SETUP - SHORT";
          else if (item.comm_index <= 15) setupStatus = "CLOSE SETUP - LONG";
          
          return {
            contract: item.contracts.name,
            category: item.contracts.sector.toUpperCase(),
            slug: getContractSlug(item.contracts.name),
            commercials: Math.round(item.comm_index),
            largeSpecs: Math.round(item.ls_index),
            smallSpecs: Math.round(item.ss_index),
            commWoWDelta: item.wow_comm_delta,
            lgSpecWoWDelta: item.wow_ls_delta,
            smSpecWoWDelta: item.wow_ss_delta,
            cotSetUp: setupStatus
          };
        });
        
        setContractsData(processedData);
        setError(null);
      } catch (err) {
        // Fallback: show empty state with helpful message
        setContractsData([]);
        setError('Backend not connected - please start FastAPI server at localhost:8000');
        console.error('Error fetching COT data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCOTData();
  }, []);

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
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' ? 
            aValue.localeCompare(bValue) : 
            bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
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

  // Get unique sectors for filter
  const sectors = [...new Set(contractsData.map(c => c.category))].sort();

  if (loading) {
    return <div className="p-6">Loading heat map data...</div>;
  }

  if (error) {
    return <div className="p-6">Error: {error}</div>;
  }

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
            Latest available data from CFTC reports
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
                  <th className="text-center p-2 font-semibold">Current Indices</th>
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
                  <th className="text-center p-1"></th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((row, index) => (
                  <tr key={`${row.contract}-${index}`} className="border-b hover:bg-muted/50">
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
            <p>• <strong>Close Setup:</strong> Within 15 points of extreme threshold</p>
            <p>• <strong>Short/Long Setup:</strong> Directional bias based on commercial positioning</p>
            <p>• <strong>Extreme readings:</strong> Above 95 or below 5 indicate high probability reversal zones</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}