import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndexChart } from "@/components/charts/IndexChart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000/api';

interface ExtremeContract {
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

export default function ExtremeReadings() {
  const navigate = useNavigate();
  const [extremeContracts, setExtremeContracts] = useState<ExtremeContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<ExtremeContract | null>(null);
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [thresholdLow, setThresholdLow] = useState(5);
  const [thresholdHigh, setThresholdHigh] = useState(95);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch extreme readings
  useEffect(() => {
    const fetchExtremeReadings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/extremes?min_threshold=${thresholdLow}&max_threshold=${thresholdHigh}`);
        if (!response.ok) {
          throw new Error('Failed to fetch extreme readings');
        }
        const data = await response.json();
        setExtremeContracts(data);
        setError(null);
      } catch (err) {
        // Fallback: show empty state with helpful message
        setExtremeContracts([]);
        setError('Backend not connected - please start FastAPI server at localhost:8000');
        console.error('Error fetching extreme readings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExtremeReadings();
  }, [thresholdLow, thresholdHigh]);

  const filteredContracts = extremeContracts.filter(contract => {
    const matchesSector = sectorFilter === "all" || contract.contracts.sector === sectorFilter;
    const matchesSearch = contract.contracts.name.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesSector && matchesSearch;
  });

  const getStatusBadge = (index: number) => {
    if (index >= thresholdHigh) return { variant: "destructive" as const, text: "Extreme Long", icon: TrendingUp };
    if (index <= thresholdLow) return { variant: "destructive" as const, text: "Extreme Short", icon: TrendingDown };
    return { variant: "secondary" as const, text: "Neutral", icon: AlertTriangle };
  };

  const getContractSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace('#', '').replace('&', 'and');
  };

  // Get unique sectors for filter
  const sectors = [...new Set(extremeContracts.map(c => c.contracts.sector))].sort();

  if (loading) {
    return <div className="p-6">Loading extreme readings...</div>;
  }

  if (error) {
    return <div className="p-6">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Extreme Readings</h1>
        <p className="text-muted-foreground mt-2">
          Markets at extreme commercial positioning levels (≤{thresholdLow} or ≥{thresholdHigh} index)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
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
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">Thresholds:</span>
          <Input
            type="number"
            className="w-16"
            value={thresholdLow}
            onChange={(e) => setThresholdLow(Number(e.target.value))}
            min={0}
            max={50}
          />
          <span className="text-sm text-muted-foreground">-</span>
          <Input
            type="number"
            className="w-16"
            value={thresholdHigh}
            onChange={(e) => setThresholdHigh(Number(e.target.value))}
            min={50}
            max={100}
          />
        </div>
      </div>

      {/* Extreme Readings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Extreme Positions ({filteredContracts.length} contracts)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredContracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No contracts match the current filters.
              </div>
            ) : (
              filteredContracts.map((contract, index) => {
                const status = getStatusBadge(contract.comm_index);
                const StatusIcon = status.icon;
                
                return (
                  <div 
                    key={`${contract.contract_id}-${index}`}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer border"
                    onClick={() => setSelectedContract(contract)}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium text-foreground">{contract.contracts.name}</div>
                        <div className="text-sm text-muted-foreground">{contract.contracts.sector}</div>
                      </div>
                      
                      {/* Simple indicator instead of sparkline for now */}
                      <div className="w-20 h-8 flex items-center justify-center">
                        <div className={`w-4 h-4 rounded-full ${
                          contract.wow_comm_delta > 0 ? 'bg-green-500' : 
                          contract.wow_comm_delta < 0 ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-lg">{contract.comm_index.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">Commercial Index</div>
                      </div>
                      
                      <Badge variant={status.variant} className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.text}
                      </Badge>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/market/${getContractSlug(contract.contracts.name)}`);
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed View Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedContract.contracts.name} - Current Analysis</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedContract(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Current Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Commercial Index</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedContract.comm_index.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">
                        WoW Change: {selectedContract.wow_comm_delta > 0 ? '+' : ''}{selectedContract.wow_comm_delta}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Large Spec Index</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedContract.ls_index.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">
                        WoW Change: {selectedContract.wow_ls_delta > 0 ? '+' : ''}{selectedContract.wow_ls_delta}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Small Spec Index</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedContract.ss_index.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">
                        WoW Change: {selectedContract.wow_ss_delta > 0 ? '+' : ''}{selectedContract.wow_ss_delta}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Summary */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Analysis Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Signal Type:</span>
                      <div className="font-medium">
                        {selectedContract.comm_index >= thresholdHigh ? 'Short Setup' : 
                         selectedContract.comm_index <= thresholdLow ? 'Long Setup' : 'Neutral'}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Risk Level:</span>
                      <div className="font-medium">
                        {selectedContract.comm_index >= thresholdHigh || selectedContract.comm_index <= thresholdLow ? 'High' : 'Medium'}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Week Change:</span>
                      <div className={`font-medium ${selectedContract.wow_comm_delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedContract.wow_comm_delta > 0 ? '+' : ''}{selectedContract.wow_comm_delta}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Report Date:</span>
                      <div className="font-medium">{selectedContract.report_date}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}