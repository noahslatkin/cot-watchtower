import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MarketData {
  name: string;
  sector: string;
  commercial: number;
  largeSpec: number;
  smallSpec: number;
}

interface SectorPanelProps {
  title: string;
  data: MarketData[];
  height?: number;
}

export function SectorPanel({ title, data, height = 300 }: SectorPanelProps) {
  const formatValue = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (absValue >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  // Shorten contract names for display
  const processedData = data.map(item => ({
    ...item,
    shortName: item.name.length > 12 ? 
      item.name.substring(0, 10) + '...' : 
      item.name
  }));

  return (
    <Card className="p-3 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-card-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={processedData}
            margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
            <XAxis 
              dataKey="shortName"
              stroke="hsl(var(--muted-foreground))"
              fontSize={9}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={9}
              tickFormatter={formatValue}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                color: "hsl(var(--popover-foreground))",
                fontSize: "12px"
              }}
              labelFormatter={(label) => {
                const item = data.find(d => d.name.substring(0, 10) + (d.name.length > 12 ? '...' : '') === label);
                return item?.name || label;
              }}
              formatter={(value: any, name: string) => [
                `${Number(value).toLocaleString()}`,
                name === "commercial" ? "Commercials" : 
                name === "largeSpec" ? "Large Specs" : "Small Specs"
              ]}
            />
            <Legend 
              wrapperStyle={{ fontSize: '10px' }}
              iconType="rect"
            />
            
            {/* Commercial Bars - Red */}
            <Bar
              dataKey="commercial"
              fill="hsl(var(--chart-commercial))"
              name="Commercials"
              radius={[0, 0, 0, 0]}
            />
            
            {/* Large Spec Bars - Blue */}
            <Bar
              dataKey="largeSpec"
              fill="hsl(var(--chart-large-spec))"
              name="Large Specs"
              radius={[0, 0, 0, 0]}
            />
            
            {/* Small Spec Bars - Yellow */}
            <Bar
              dataKey="smallSpec"
              fill="hsl(var(--chart-small-spec))"
              name="Small Specs"
              radius={[0, 0, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}