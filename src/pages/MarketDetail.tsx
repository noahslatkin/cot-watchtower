import { useParams } from "react-router-dom";
import { COTChart } from "@/components/charts/COTChart";
import { IndexChart } from "@/components/charts/IndexChart";
import { MetricCard } from "@/components/widgets/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from "lucide-react";

// Mock data - in real app would fetch based on market param
const mockData = {
  "gold": {
    name: "Gold",
    sector: "Metals",
    currentIndex: 92,
    weekChange: "+12",
    cotData: [
      { date: "2024-06-01", commercial: 298123, largeSpec: -245678, smallSpec: -52445, openInterest: 345000 },
      { date: "2024-06-08", commercial: 301234, largeSpec: -248901, smallSpec: -52333, openInterest: 348000 },
      { date: "2024-06-15", commercial: 305678, largeSpec: -252345, smallSpec: -53333, openInterest: 351000 },
      { date: "2024-06-22", commercial: 309123, largeSpec: -255678, smallSpec: -53445, openInterest: 354000 },
      { date: "2024-06-29", commercial: 312456, largeSpec: -259012, smallSpec: -53444, openInterest: 357000 },
      { date: "2024-07-06", commercial: 315789, largeSpec: -262345, smallSpec: -53444, openInterest: 360000 },
      { date: "2024-07-13", commercial: 319123, largeSpec: -265678, smallSpec: -53445, openInterest: 363000 },
      { date: "2024-07-20", commercial: 322456, largeSpec: -269012, smallSpec: -53444, openInterest: 366000 },
    ],
    indexData: [
      { date: "2024-06-01", commercialIndex: 65, largeSpecIndex: 35, smallSpecIndex: 45 },
      { date: "2024-06-08", commercialIndex: 68, largeSpecIndex: 32, smallSpecIndex: 48 },
      { date: "2024-06-15", commercialIndex: 72, largeSpecIndex: 28, smallSpecIndex: 52 },
      { date: "2024-06-22", commercialIndex: 76, largeSpecIndex: 24, smallSpecIndex: 48 },
      { date: "2024-06-29", commercialIndex: 80, largeSpecIndex: 20, smallSpecIndex: 45 },
      { date: "2024-07-06", commercialIndex: 85, largeSpecIndex: 15, smallSpecIndex: 42 },
      { date: "2024-07-13", commercialIndex: 89, largeSpecIndex: 11, smallSpecIndex: 38 },
      { date: "2024-07-20", commercialIndex: 92, largeSpecIndex: 8, smallSpecIndex: 35 },
    ]
  }
};

export default function MarketDetail() {
  const { marketId } = useParams();
  const market = mockData[marketId as keyof typeof mockData] || mockData.gold;

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