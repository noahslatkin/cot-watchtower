import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndexChart } from "@/components/charts/IndexChart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Market sectors data
const marketSectors = [
  { title: "Equities", markets: ["E-mini S&P 500", "E-mini Nasdaq-100", "E-mini Dow"] },
  { title: "Fixed Income", markets: ["2-Year Note", "5-Year Note", "10-Year Note", "30-Year Bond"] },
  { title: "Currencies", markets: ["Euro FX", "Japanese Yen", "British Pound", "Canadian Dollar"] },
  { title: "Energies", markets: ["Crude Oil WTI", "Brent Crude", "Natural Gas", "Heating Oil"] },
  { title: "Metals", markets: ["Gold", "Silver", "Copper", "Platinum"] },
  { title: "Softs", markets: ["Coffee C", "Sugar #11", "Cotton #2", "Cocoa"] },
  { title: "Grains", markets: ["Corn", "Soybeans", "Wheat", "Soybean Oil"] },
  { title: "Livestock", markets: ["Live Cattle", "Feeder Cattle", "Lean Hogs"] }
];

// Generate extreme readings data
const generateExtremeReadings = () => {
  const extremeContracts = [];
  
  marketSectors.forEach(sector => {
    sector.markets.forEach(market => {
      const slug = market.toLowerCase().replace(/\s+/g, '-').replace('#', '').replace('&', 'and');
      
      // Generate random extreme readings (some contracts will be extreme, others won't)
      const commercialIndex = Math.random() > 0.7 ? 
        (Math.random() > 0.5 ? Math.random() * 5 + 2 : Math.random() * 5 + 93) : 
        Math.random() * 80 + 10;
      
      const largeSpecIndex = 100 - commercialIndex + (Math.random() - 0.5) * 10;
      const smallSpecIndex = 50 + (Math.random() - 0.5) * 30;
      
      // Only include if it's actually extreme
      if (commercialIndex <= 5 || commercialIndex >= 95) {
        // Generate price data (mock daily prices)
        const priceData = [];
        let price = Math.random() * 1000 + 100;
        for (let i = 0; i < 30; i++) {
          price += (Math.random() - 0.5) * price * 0.02;
          priceData.push({
            date: new Date(2024, 6, i + 1).toISOString().split('T')[0],
            price: Math.round(price * 100) / 100
          });
        }
        
        // Generate index history
        const indexHistory = [];
        let index = commercialIndex;
        for (let i = 0; i < 8; i++) {
          index += (Math.random() - 0.5) * 8;
          index = Math.max(0, Math.min(100, index));
          indexHistory.push({
            date: new Date(2024, 5, 1 + i * 7).toISOString().split('T')[0],
            commercialIndex: Math.round(index),
            largeSpecIndex: Math.round(100 - index + (Math.random() - 0.5) * 10),
            smallSpecIndex: Math.round(50 + (Math.random() - 0.5) * 20)
          });
        }
        
        extremeContracts.push({
          name: market,
          sector: sector.title,
          slug,
          commercialIndex: Math.round(commercialIndex),
          largeSpecIndex: Math.round(largeSpecIndex),
          smallSpecIndex: Math.round(smallSpecIndex),
          weekChange: (Math.random() - 0.5) * 20,
          signalType: commercialIndex >= 95 ? 'Short Setup' : 'Long Setup',
          riskLevel: commercialIndex >= 95 || commercialIndex <= 5 ? 'High' : 'Medium',
          priceData,
          indexHistory
        });
      }
    });
  });
  
  return extremeContracts.sort((a, b) => {
    const aExtreme = Math.min(a.commercialIndex, 100 - a.commercialIndex);
    const bExtreme = Math.min(b.commercialIndex, 100 - b.commercialIndex);
    return aExtreme - bExtreme;
  });
};

export default function ExtremeReadings() {
  const navigate = useNavigate();
  const [extremeContracts] = useState(generateExtremeReadings());
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [thresholdLow, setThresholdLow] = useState(5);
  const [thresholdHigh, setThresholdHigh] = useState(95);

  const filteredContracts = extremeContracts.filter(contract => {
    const matchesSector = sectorFilter === "all" || contract.sector === sectorFilter;
    const matchesSearch = contract.name.toLowerCase().includes(searchFilter.toLowerCase());
    const isExtreme = contract.commercialIndex <= thresholdLow || contract.commercialIndex >= thresholdHigh;
    return matchesSector && matchesSearch && isExtreme;
  });

  const getStatusBadge = (index: number) => {
    if (index >= thresholdHigh) return { variant: "destructive" as const, text: "Extreme Long", icon: TrendingUp };
    if (index <= thresholdLow) return { variant: "destructive" as const, text: "Extreme Short", icon: TrendingDown };
    return { variant: "secondary" as const, text: "Neutral", icon: AlertTriangle };
  };

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
            {marketSectors.map(sector => (
              <SelectItem key={sector.title} value={sector.title}>{sector.title}</SelectItem>
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
                const status = getStatusBadge(contract.commercialIndex);
                const StatusIcon = status.icon;
                
                return (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer border"
                    onClick={() => setSelectedContract(contract)}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium text-foreground">{contract.name}</div>
                        <div className="text-sm text-muted-foreground">{contract.sector}</div>
                      </div>
                      
                      {/* Mini sparkline */}
                      <div className="w-20 h-8">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={contract.indexHistory.slice(-5)}>
                            <Line 
                              type="monotone" 
                              dataKey="commercialIndex" 
                              stroke="hsl(var(--chart-commercial))" 
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-lg">{contract.commercialIndex}</div>
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
                          navigate(`/market/${contract.slug}`);
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
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedContract.name} - Detailed Analysis</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedContract(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Price Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Daily Price Chart (30 days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={selectedContract.priceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={11}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                            color: "hsl(var(--popover-foreground))",
                          }}
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Price"]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* COT Index Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Commercial Index History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <IndexChart 
                      data={selectedContract.indexHistory} 
                      title="" 
                      height={250}
                    />
                  </CardContent>
                </Card>
              </div>
              
              {/* Summary */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Analysis Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Signal Type:</span>
                    <div className="font-medium">{selectedContract.signalType}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Risk Level:</span>
                    <div className="font-medium">{selectedContract.riskLevel}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Week Change:</span>
                    <div className={`font-medium ${selectedContract.weekChange > 0 ? 'text-success' : 'text-destructive'}`}>
                      {selectedContract.weekChange > 0 ? '+' : ''}{selectedContract.weekChange.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Index:</span>
                    <div className="font-medium">{selectedContract.commercialIndex}/100</div>
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