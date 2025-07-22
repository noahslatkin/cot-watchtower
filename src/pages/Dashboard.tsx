import { MetricCard } from "@/components/widgets/MetricCard";
import { SortedBarChart } from "@/components/charts/SortedBarChart";
import { SectorPanel } from "@/components/charts/SectorPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, BarChart3, Users, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Generate mock market data for CMR-style charts
const generateMarketData = () => {
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

  const allMarkets: any[] = [];
  
  sectors.forEach(sector => {
    sector.markets.forEach(market => {
      // Generate realistic but varied data for each market
      const baseCommercial = Math.random() * 400000 + 50000;
      const commercial = Math.round(baseCommercial * (Math.random() > 0.5 ? 1 : -1));
      const largeSpec = Math.round(-commercial * (0.6 + Math.random() * 0.4));
      const smallSpec = Math.round(-(commercial + largeSpec) * (0.8 + Math.random() * 0.4));
      
      allMarkets.push({
        name: market,
        sector: sector.title,
        commercial,
        largeSpec,
        smallSpec
      });
    });
  });
  
  return { allMarkets, sectors };
};

const { allMarkets, sectors } = generateMarketData();

const recentMarkets = [
  { name: "Gold", change: "+2.3%", index: 92, status: "extreme" },
  { name: "S&P 500", change: "-1.2%", index: 15, status: "setup" },
  { name: "Crude Oil", change: "+0.8%", index: 45, status: "neutral" },
  { name: "EUR/USD", change: "-0.5%", index: 8, status: "extreme" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  
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
        <div onClick={() => navigate('/extreme-readings')} className="cursor-pointer">
          <MetricCard
            title="Extreme Readings"
            value="23"
            change="+8 from last week"
            changeType="positive"
            icon={AlertTriangle}
            description="Markets at 95+ or 5- index"
          />
        </div>
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

      {/* Overall Market - Sorted Charts */}
      <div className="space-y-6">
        <SortedBarChart 
          title="Overall Market - Sorted by Net Positions" 
          data={allMarkets}
          height={400}
        />
      </div>

      {/* Sector Panels */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Market Sectors</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sectors.slice(0, 4).map(sector => (
            <SectorPanel 
              key={sector.title}
              title={sector.title}
              data={allMarkets.filter(m => m.sector === sector.title)}
              height={250}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sectors.slice(4, 8).map(sector => (
            <SectorPanel 
              key={sector.title}
              title={sector.title}
              data={allMarkets.filter(m => m.sector === sector.title)}
              height={250}
            />
          ))}
        </div>
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