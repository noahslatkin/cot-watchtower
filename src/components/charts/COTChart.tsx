import {
  ComposedChart,
  Bar,
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
  openInterest?: number;
}

interface COTChartProps {
  data: COTDataPoint[];
  title: string;
  height?: number;
}

export function COTChart({ data, title, height = 300 }: COTChartProps) {
  // Add open interest data if not present
  const enrichedData = data.map((point, index) => ({
    ...point,
    openInterest: point.openInterest || 50000 + Math.sin(index * 0.5) * 10000,
  }));

  return (
    <Card className="p-4 bg-card">
      <h3 className="text-lg font-semibold mb-4 text-card-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={enrichedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            yAxisId="positions"
            stroke="hsl(var(--muted-foreground))" 
            fontSize={11}
            tickFormatter={(value) => `${value/1000}k`}
          />
          <YAxis 
            yAxisId="openInterest"
            orientation="right"
            stroke="hsl(var(--success))" 
            fontSize={11}
            tickFormatter={(value) => `${value/1000}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              color: "hsl(var(--popover-foreground))",
            }}
            formatter={(value: any, name: string) => {
              if (name === "openInterest") return [`${Number(value).toLocaleString()}`, "Open Interest"];
              return [`${Number(value).toLocaleString()}`, name];
            }}
          />
          <Legend />
          
          {/* Commercial Bars - Red */}
          <Bar
            yAxisId="positions"
            dataKey="commercial"
            fill="hsl(var(--destructive))"
            name="Commercials"
            radius={[0, 0, 0, 0]}
          />
          
          {/* Large Spec Bars - Blue */}
          <Bar
            yAxisId="positions"
            dataKey="largeSpec"
            fill="hsl(var(--primary))"
            name="Large Specs"
            radius={[0, 0, 0, 0]}
          />
          
          {/* Small Spec Bars - Yellow/Green */}
          <Bar
            yAxisId="positions"
            dataKey="smallSpec"
            fill="hsl(var(--warning))"
            name="Small Specs"
            radius={[0, 0, 0, 0]}
          />
          
          {/* Open Interest Line - Green */}
          <Line
            yAxisId="openInterest"
            type="monotone"
            dataKey="openInterest"
            stroke="hsl(var(--success))"
            strokeWidth={2}
            dot={false}
            name="Open Interest"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}