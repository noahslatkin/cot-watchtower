import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const heatMapData = [
  { market: "Gold", sector: "Metals", commercial: 92, largeSpec: 8, smallSpec: 35, weekChange: 12 },
  { market: "Silver", sector: "Metals", commercial: 89, largeSpec: 11, smallSpec: 42, weekChange: 8 },
  { market: "S&P 500", sector: "Equities", commercial: 15, largeSpec: 85, smallSpec: 65, weekChange: -18 },
  { market: "Crude Oil", sector: "Energy", commercial: 45, largeSpec: 55, smallSpec: 38, weekChange: 3 },
  { market: "EUR/USD", sector: "Currencies", commercial: 8, largeSpec: 92, smallSpec: 55, weekChange: -22 },
  { market: "10Y Note", sector: "Fixed Income", commercial: 78, largeSpec: 22, smallSpec: 45, weekChange: 15 },
  { market: "Corn", sector: "Grains", commercial: 65, largeSpec: 35, smallSpec: 48, weekChange: 5 },
  { market: "Coffee", sector: "Softs", commercial: 23, largeSpec: 77, smallSpec: 62, weekChange: -8 },
];

const getHeatmapColor = (value: number) => {
  if (value >= 95) return "bg-red-500";
  if (value >= 85) return "bg-red-400";
  if (value >= 75) return "bg-red-300";
  if (value >= 65) return "bg-red-200";
  if (value >= 55) return "bg-gray-200";
  if (value >= 45) return "bg-gray-200";
  if (value >= 35) return "bg-blue-200";
  if (value >= 25) return "bg-blue-300";
  if (value >= 15) return "bg-blue-400";
  if (value >= 5) return "bg-blue-500";
  return "bg-blue-600";
};

const getChangeColor = (change: number) => {
  if (change > 10) return "text-green-600 bg-green-100";
  if (change > 0) return "text-green-500 bg-green-50";
  if (change < -10) return "text-red-600 bg-red-100";
  if (change < 0) return "text-red-500 bg-red-50";
  return "text-gray-500 bg-gray-50";
};

export default function HeatMaps() {
  const sortedByCommercial = [...heatMapData].sort((a, b) => b.commercial - a.commercial);
  const sortedByLargeSpec = [...heatMapData].sort((a, b) => b.largeSpec - a.largeSpec);
  const sortedBySmallSpec = [...heatMapData].sort((a, b) => b.smallSpec - a.smallSpec);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Heat Maps & Rankings</h1>
        <p className="text-muted-foreground mt-2">
          Visual analysis of positioning across all markets and trader groups
        </p>
      </div>

      {/* Week-over-Week Heat Map */}
      <Card>
        <CardHeader>
          <CardTitle>Week-over-Week Index Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {heatMapData.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.market}</span>
                  <Badge variant="outline" className="text-xs">{item.sector}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Commercial:</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${getHeatmapColor(item.commercial)}`}></div>
                      <span className="font-medium">{item.commercial}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Large Spec:</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${getHeatmapColor(item.largeSpec)}`}></div>
                      <span className="font-medium">{item.largeSpec}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Small Spec:</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${getHeatmapColor(item.smallSpec)}`}></div>
                      <span className="font-medium">{item.smallSpec}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Week Change:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getChangeColor(item.weekChange)}`}>
                      {item.weekChange > 0 ? '+' : ''}{item.weekChange}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sorted Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sorted by Commercial */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ranked by Commercial Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedByCommercial.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div>
                    <div className="font-medium text-sm">{item.market}</div>
                    <div className="text-xs text-muted-foreground">{item.sector}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{item.commercial}</div>
                    <div className={`w-2 h-2 rounded ml-auto ${getHeatmapColor(item.commercial)}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sorted by Large Specs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ranked by Large Speculators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedByLargeSpec.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div>
                    <div className="font-medium text-sm">{item.market}</div>
                    <div className="text-xs text-muted-foreground">{item.sector}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{item.largeSpec}</div>
                    <div className={`w-2 h-2 rounded ml-auto ${getHeatmapColor(item.largeSpec)}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sorted by Small Specs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ranked by Small Speculators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedBySmallSpec.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div>
                    <div className="font-medium text-sm">{item.market}</div>
                    <div className="text-xs text-muted-foreground">{item.sector}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{item.smallSpec}</div>
                    <div className={`w-2 h-2 rounded ml-auto ${getHeatmapColor(item.smallSpec)}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Heat Map Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-sm">0-5 (Extreme Short)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-400 rounded"></div>
              <span className="text-sm">15-25</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-sm">45-55 (Neutral)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-400 rounded"></div>
              <span className="text-sm">75-85</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">95-100 (Extreme Long)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}