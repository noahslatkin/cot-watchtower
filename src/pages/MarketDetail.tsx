import { useParams } from "react-router-dom";
import { COTChart } from "@/components/charts/COTChart";
import { IndexChart } from "@/components/charts/IndexChart";
import { MetricCard } from "@/components/widgets/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from "lucide-react";

// Generate mock data for each contract - in real app would fetch from API
const generateMockData = (contractName: string, sector: string) => {
  // Different base values for different contracts to make them unique
  const contractSeeds = {
    'gold': { base: 300000, index: 92, change: '+12' },
    'silver': { base: 150000, index: 85, change: '+8' },
    'copper': { base: 80000, index: 78, change: '+5' },
    'platinum': { base: 45000, index: 15, change: '-18' },
    'e-mini-s-and-p-500': { base: 2800000, index: 25, change: '-12' },
    'e-mini-nasdaq-100': { base: 180000, index: 35, change: '-8' },
    'e-mini-dow': { base: 85000, index: 45, change: '-5' },
    'crude-oil-wti': { base: 350000, index: 88, change: '+15' },
    'natural-gas': { base: 200000, index: 12, change: '-22' },
    'euro-fx': { base: 180000, index: 75, change: '+6' },
    'japanese-yen': { base: 150000, index: 20, change: '-15' },
    'british-pound': { base: 120000, index: 68, change: '+3' },
  };

  const slug = contractName.toLowerCase().replace(/\s+/g, '-').replace('#', '').replace('&', 'and');
  const seed = contractSeeds[slug as keyof typeof contractSeeds] || contractSeeds.gold;
  
  // Generate COT data with some variation
  const cotData = [];
  const indexData = [];
  let commercialBase = seed.base;
  let currentIndex = Math.max(5, Math.min(95, seed.index + (Math.random() - 0.5) * 10));
  
  for (let i = 0; i < 8; i++) {
    const date = new Date(2024, 5, 1 + i * 7).toISOString().split('T')[0];
    const variation = (Math.random() - 0.5) * 0.1;
    
    commercialBase *= (1 + variation);
    const commercial = Math.round(commercialBase);
    const largeSpec = Math.round(-commercial * 0.8 + (Math.random() - 0.5) * commercial * 0.2);
    const smallSpec = Math.round(-(commercial + largeSpec) + (Math.random() - 0.5) * commercial * 0.1);
    const openInterest = Math.round(commercial * 1.15 + Math.sin(i * 0.5) * commercial * 0.1);
    
    cotData.push({
      date,
      commercial,
      largeSpec,
      smallSpec,
      openInterest
    });
    
    // Generate index data
    currentIndex += (Math.random() - 0.5) * 5;
    currentIndex = Math.max(5, Math.min(95, currentIndex));
    
    indexData.push({
      date,
      commercialIndex: Math.round(currentIndex),
      largeSpecIndex: Math.round(100 - currentIndex + (Math.random() - 0.5) * 10),
      smallSpecIndex: Math.round(50 + (Math.random() - 0.5) * 20)
    });
  }

  return {
    name: contractName,
    sector,
    currentIndex: Math.round(currentIndex),
    weekChange: seed.change,
    cotData,
    indexData
  };
};

export default function MarketDetail() {
  const { marketId } = useParams();
  
  // Convert URL slug back to contract name and find sector
  const contractName = marketId?.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ').replace('And', '&') || 'Gold';
  
  // Find the sector for this contract
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
  
  const sector = marketSectors.find(s => 
    s.markets.some(m => m.toLowerCase().replace(/\s+/g, '-').replace('#', '').replace('&', 'and') === marketId)
  )?.title || 'Metals';
  
  const market = generateMockData(contractName, sector);

  const getStatusBadge = (index: number) => {
    if (index >= 95) return { variant: "destructive" as const, text: "Extreme Long" };
    if (index <= 5) return { variant: "destructive" as const, text: "Extreme Short" };
    if (index >= 85 || index <= 15) return { variant: "default" as const, text: "Setup Zone" };
    return { variant: "secondary" as const, text: "Neutral" };
  };

  const status = getStatusBadge(market.currentIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{market.name}</h1>
            <Badge variant="outline">{market.sector}</Badge>
            <Badge variant={status.variant}>{status.text}</Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            Commitment of Traders analysis and positioning data
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Commercial Index"
          value={market.currentIndex}
          change={`${market.weekChange} this week`}
          changeType={market.weekChange.startsWith('+') ? "positive" : "negative"}
          icon={Activity}
          description="0-100 percentile rank"
        />
        <MetricCard
          title="Large Spec Index"
          value="8"
          change="-15 this week"
          changeType="negative"
          icon={TrendingDown}
          description="Inverse to Commercial"
        />
        <MetricCard
          title="Position Risk"
          value="High"
          change="Extreme territory"
          changeType="negative"
          icon={AlertTriangle}
          description="Commercial crowdedness"
        />
        <MetricCard
          title="Setup Signal"
          value="Short"
          change="Strong signal"
          changeType="positive"
          icon={TrendingUp}
          description="Based on index reading"
        />
      </div>

      {/* Chart Tabs */}
      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="positions">Net Positions</TabsTrigger>
          <TabsTrigger value="index">Index Chart</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          <COTChart 
            data={market.cotData} 
            title={`${market.name} - Net Positions by Group`} 
            height={400}
          />
        </TabsContent>

        <TabsContent value="index" className="space-y-4">
          <IndexChart 
            data={market.indexData} 
            title={`${market.name} - Commercial Index (0-100)`} 
            height={400}
          />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Position Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Commercial Index:</span>
                    <span className="font-bold text-lg">{market.currentIndex}/100</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-chart-commercial h-2 rounded-full transition-all" 
                      style={{ width: `${market.currentIndex}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Commercials are at the {market.currentIndex}th percentile of their 6-month range. 
                    This is considered an extreme reading, suggesting high probability of price reversal.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trading Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <div className="font-medium text-destructive mb-1">Short Setup Signal</div>
                    <div className="text-sm text-muted-foreground">
                      Commercial index above 90 historically marks major tops. 
                      Consider short positions with appropriate risk management.
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Signal Strength:</span>
                      <span className="font-medium">Very Strong</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Historical Win Rate:</span>
                      <span className="font-medium">78%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Holding Period:</span>
                      <span className="font-medium">4-8 weeks</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}