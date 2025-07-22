import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Heat map data matching the CMR appendix format
const heatMapData = [
  { 
    contract: "30-YEAR BONDS", 
    category: "FIXED INCOME", 
    cotSetUp: "", 
    commWoWDelta: 21, 
    lgSpecWoWDelta: -15, 
    smSpecWoWDelta: -20,
    commercials: 21, 
    largeSpecs: 68, 
    smallSpecs: 67,
    prevCommercials: 55, 
    prevLargeSpecs: 83, 
    prevSmallSpecs: 87 
  },
  { 
    contract: "10-YEAR NOTES", 
    category: "FIXED INCOME", 
    cotSetUp: "", 
    commWoWDelta: 1, 
    lgSpecWoWDelta: 0, 
    smSpecWoWDelta: -3,
    commercials: 56, 
    largeSpecs: 40, 
    smallSpecs: 70,
    prevCommercials: 55, 
    prevLargeSpecs: 40, 
    prevSmallSpecs: 73 
  },
  { 
    contract: "S&P 500", 
    category: "EQUITIES", 
    cotSetUp: "CLOSE SETUP - LONG", 
    commWoWDelta: -1, 
    lgSpecWoWDelta: 1, 
    smSpecWoWDelta: -1,
    commercials: 93, 
    largeSpecs: 7, 
    smallSpecs: 92,
    prevCommercials: 94, 
    prevLargeSpecs: 6, 
    prevSmallSpecs: 93 
  },
  { 
    contract: "DOW", 
    category: "EQUITIES", 
    cotSetUp: "CLOSE SETUP - SHORT", 
    commWoWDelta: 6, 
    lgSpecWoWDelta: -6, 
    smSpecWoWDelta: -10,
    commercials: 9, 
    largeSpecs: 87, 
    smallSpecs: 90,
    prevCommercials: 3, 
    prevLargeSpecs: 93, 
    prevSmallSpecs: 100 
  },
  { 
    contract: "GOLD", 
    category: "METALS", 
    cotSetUp: "CLOSE SETUP - SHORT", 
    commWoWDelta: -4, 
    lgSpecWoWDelta: 2, 
    smSpecWoWDelta: -2,
    commercials: 0, 
    largeSpecs: 100, 
    smallSpecs: 27,
    prevCommercials: 4, 
    prevLargeSpecs: 98, 
    prevSmallSpecs: 29 
  },
  { 
    contract: "SILVER", 
    category: "METALS", 
    cotSetUp: "CLOSE SETUP - SHORT", 
    commWoWDelta: 0, 
    lgSpecWoWDelta: 4, 
    smSpecWoWDelta: 2,
    commercials: 5, 
    largeSpecs: 100, 
    smallSpecs: 49,
    prevCommercials: 5, 
    prevLargeSpecs: 96, 
    prevSmallSpecs: 47 
  },
  { 
    contract: "CRUDE OIL", 
    category: "ENERGIES", 
    cotSetUp: "CLOSE SETUP - SHORT", 
    commWoWDelta: -8, 
    lgSpecWoWDelta: 10, 
    smSpecWoWDelta: -16,
    commercials: 20, 
    largeSpecs: 79, 
    smallSpecs: 63,
    prevCommercials: 28, 
    prevLargeSpecs: 69, 
    prevSmallSpecs: 79 
  },
  { 
    contract: "COFFEE", 
    category: "SOFTS", 
    cotSetUp: "SHORT SETUP", 
    commWoWDelta: -35, 
    lgSpecWoWDelta: 39, 
    smSpecWoWDelta: 28,
    commercials: 0, 
    largeSpecs: 100, 
    smallSpecs: 100,
    prevCommercials: 35, 
    prevLargeSpecs: 61, 
    prevSmallSpecs: 72 
  },
];

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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">COT Heat Map & Rankings</h1>
        <p className="text-muted-foreground mt-2">
          Week-over-week positioning analysis across all markets
        </p>
      </div>

      {/* CMR-Style Heat Map Table */}
      <Card>
        <CardHeader>
          <CardTitle>Week over Week Heat Map</CardTitle>
          <div className="text-sm text-muted-foreground">
            Data as of 4/7/2024 vs 3/31/2024
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold">Contract</th>
                  <th className="text-left p-2 font-semibold">Category</th>
                  <th className="text-left p-2 font-semibold">CoT Set Up</th>
                  <th className="text-center p-2 font-semibold">Comm<br/>WoW<br/>Delta</th>
                  <th className="text-center p-2 font-semibold">LG Spec<br/>WoW<br/>Delta</th>
                  <th className="text-center p-2 font-semibold">SM Spec<br/>WoW<br/>Delta</th>
                  <th className="text-center p-2 font-semibold">4/7/2024</th>
                  <th className="text-center p-2 font-semibold"></th>
                  <th className="text-center p-2 font-semibold"></th>
                  <th className="text-center p-2 font-semibold">3/31/2024</th>
                  <th className="text-center p-2 font-semibold"></th>
                  <th className="text-center p-2 font-semibold"></th>
                </tr>
                <tr className="border-b text-xs">
                  <th className="p-1"></th>
                  <th className="p-1"></th>
                  <th className="p-1"></th>
                  <th className="p-1"></th>
                  <th className="p-1"></th>
                  <th className="p-1"></th>
                  <th className="text-center p-1 font-medium">Commercials</th>
                  <th className="text-center p-1 font-medium">Large Specs</th>
                  <th className="text-center p-1 font-medium">Small Specs</th>
                  <th className="text-center p-1 font-medium">Commercials</th>
                  <th className="text-center p-1 font-medium">Large Specs</th>
                  <th className="text-center p-1 font-medium">Small Specs</th>
                </tr>
              </thead>
              <tbody>
                {heatMapData.map((row, index) => (
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