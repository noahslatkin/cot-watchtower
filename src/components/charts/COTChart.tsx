import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";

interface COTDataPoint {
  date: string;
  commercial: number;
  largeSpec: number;
  smallSpec: number;
}

interface COTChartProps {
  data: COTDataPoint[];
  title: string;
  height?: number;
}

export function COTChart({ data, title, height = 300 }: COTChartProps) {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-card-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--chart-text))"
            fontSize={12}
          />
          <YAxis stroke="hsl(var(--chart-text))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="commercial"
            stroke="hsl(var(--chart-commercial))"
            strokeWidth={2}
            name="Commercial"
            dot={{ fill: "hsl(var(--chart-commercial))", strokeWidth: 2, r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="largeSpec"
            stroke="hsl(var(--chart-large-spec))"
            strokeWidth={2}
            name="Large Speculators"
            dot={{ fill: "hsl(var(--chart-large-spec))", strokeWidth: 2, r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="smallSpec"
            stroke="hsl(var(--chart-small-spec))"
            strokeWidth={2}
            name="Small Speculators"
            dot={{ fill: "hsl(var(--chart-small-spec))", strokeWidth: 2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}