import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface MarketData {
  name: string;
  sector: string;
  commercial: number;
  largeSpec: number;
  smallSpec: number;
}

interface SortedBarChartProps {
  title: string;
  data: MarketData[];
  height?: number;
}

export function SortedBarChart({ title, data, height = 400 }: SortedBarChartProps) {
  const [sortBy, setSortBy] = useState<"commercial" | "largeSpec" | "smallSpec">("commercial");

  const sortedData = [...data].sort((a, b) => {
    const aValue = Math.abs(a[sortBy]);
    const bValue = Math.abs(b[sortBy]);
    return bValue - aValue; // Sort by largest absolute value first
  }).slice(0, 15); // Show top 15

  const getBarColor = (sortBy: string) => {
    switch (sortBy) {
      case "commercial": return "hsl(var(--chart-commercial))";
      case "largeSpec": return "hsl(var(--chart-large-spec))";
      case "smallSpec": return "hsl(var(--chart-small-spec))";
      default: return "hsl(var(--primary))";
    }
  };

  const formatValue = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (absValue >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  return (
    <Card className="p-4 bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-card-foreground">{title}</CardTitle>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="commercial">Commercials</SelectItem>
              <SelectItem value="largeSpec">Large Specs</SelectItem>
              <SelectItem value="smallSpec">Small Specs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={sortedData}
            layout="horizontal"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
            <XAxis 
              type="number"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickFormatter={formatValue}
            />
            <YAxis 
              type="category"
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              width={75}
              tick={{ textAnchor: 'end' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                color: "hsl(var(--popover-foreground))",
              }}
              formatter={(value: any, name: string) => [
                `${Number(value).toLocaleString()}`,
                name === "commercial" ? "Commercials" : 
                name === "largeSpec" ? "Large Specs" : "Small Specs"
              ]}
            />
            <Bar
              dataKey={sortBy}
              fill={getBarColor(sortBy)}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}