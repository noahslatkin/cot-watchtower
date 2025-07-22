import { MetricCard } from "@/components/widgets/MetricCard";
import { COTChart } from "@/components/charts/COTChart";
import { IndexChart } from "@/components/charts/IndexChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, BarChart3, Users, AlertTriangle } from "lucide-react";

// Mock data for demonstration - matching CMR chart style
const mockCOTData = [
  { date: "2024-06-01", commercial: 45000, largeSpec: -32000, smallSpec: -13000, openInterest: 48000 },
  { date: "2024-06-08", commercial: 48000, largeSpec: -35000, smallSpec: -13000, openInterest: 49000 },
  { date: "2024-06-15", commercial: 52000, largeSpec: -38000, smallSpec: -14000, openInterest: 51000 },
  { date: "2024-06-22", commercial: 49000, largeSpec: -34000, smallSpec: -15000, openInterest: 52000 },
  { date: "2024-06-29", commercial: 55000, largeSpec: -40000, smallSpec: -15000, openInterest: 53000 },
  { date: "2024-07-06", commercial: 58000, largeSpec: -42000, smallSpec: -16000, openInterest: 54000 },
  { date: "2024-07-13", commercial: 61000, largeSpec: -45000, smallSpec: -16000, openInterest: 55000 },
  { date: "2024-07-20", commercial: 59000, largeSpec: -43000, smallSpec: -16000, openInterest: 56000 },
];

const mockIndexData = [
  { date: "2024-07-01", commercialIndex: 65, largeSpecIndex: 30, smallSpecIndex: 45 },
  { date: "2024-07-08", commercialIndex: 75, largeSpecIndex: 25, smallSpecIndex: 40 },
  { date: "2024-07-15", commercialIndex: 85, largeSpecIndex: 20, smallSpecIndex: 35 },
  { date: "2024-07-22", commercialIndex: 78, largeSpecIndex: 28, smallSpecIndex: 42 },
];

const recentMarkets = [
  { name: "Gold", change: "+2.3%", index: 92, status: "extreme" },
  { name: "S&P 500", change: "-1.2%", index: 15, status: "setup" },
  { name: "Crude Oil", change: "+0.8%", index: 45, status: "neutral" },
  { name: "EUR/USD", change: "-0.5%", index: 8, status: "extreme" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">COT Analysis Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Weekly Commitment of Traders analysis and market positioning insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Markets"
          value="142"
          change="+3 this week"
          changeType="positive"
          icon={BarChart3}
          description="Active COT contracts"
        />
        <MetricCard
          title="Extreme Readings"
          value="23"
          change="+8 from last week"
          changeType="positive"
          icon={AlertTriangle}
          description="Markets at 95+ or 5- index"
        />
        <MetricCard
          title="Setup Signals"
          value="15"
          change="-2 from last week"
          changeType="negative"
          icon={TrendingUp}
          description="Close to extreme thresholds"
        />
        <MetricCard
          title="Data Freshness"
          value="2 days"
          change="Updated Friday 4PM ET"
          changeType="neutral"
          icon={Activity}
          description="Last CFTC release"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <COTChart 
          data={mockCOTData} 
          title="Gold Net Positions (Contracts)" 
          height={350}
        />
        <IndexChart 
          data={mockIndexData} 
          title="Gold Commercial Index (0-100)" 
          height={350}
        />
      </div>

      {/* Recent Markets & Weekly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Markets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Market Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMarkets.map((market, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium text-foreground">{market.name}</div>
                    <div className="text-sm text-muted-foreground">Index: {market.index}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      market.change.startsWith('+') ? 'text-success' : 'text-destructive'
                    }`}>
                      {market.change}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      market.status === 'extreme' ? 'bg-destructive/20 text-destructive' :
                      market.status === 'setup' ? 'bg-warning/20 text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {market.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card>
          <CardHeader>
            <CardTitle>This Week's Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-success pl-4">
                <div className="font-medium text-foreground">New Extreme Readings</div>
                <div className="text-sm text-muted-foreground">
                  Gold, Silver hit 95+ Commercial index - potential short setups
                </div>
              </div>
              <div className="border-l-4 border-warning pl-4">
                <div className="font-medium text-foreground">Setup Alerts</div>
                <div className="text-sm text-muted-foreground">
                  S&P 500, EUR/USD approaching 5- threshold - watch for reversals
                </div>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <div className="font-medium text-foreground">Data Quality</div>
                <div className="text-sm text-muted-foreground">
                  All markets updated successfully. Next release: Friday 4PM ET
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}