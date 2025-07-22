import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card } from "@/components/ui/card";

interface IndexDataPoint {
  date: string;
  commercialIndex: number;
  largeSpecIndex: number;
  smallSpecIndex: number;
}

interface IndexChartProps {
  data: IndexDataPoint[];
  title: string;
  height?: number;
}

export function IndexChart({ data, title, height = 300 }: IndexChartProps) {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-card-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="extremeLow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="extremeHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--chart-text))"
            fontSize={12}
          />
          <YAxis 
            domain={[0, 100]}
            stroke="hsl(var(--chart-text))" 
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
          />
          
          {/* Extreme zones */}
          <ReferenceLine y={5} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
          <ReferenceLine y={95} stroke="hsl(var(--success))" strokeDasharray="5 5" />
          
          <Area
            type="monotone"
            dataKey="commercialIndex"
            stroke="hsl(var(--chart-commercial))"
            strokeWidth={2}
            fill="url(#extremeLow)"
            fillOpacity={0.2}
            name="Commercial Index"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="mt-4 text-sm text-muted-foreground space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-destructive rounded"></div>
          <span>Extreme Short (0-5): High probability long setup</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-success rounded"></div>
          <span>Extreme Long (95-100): High probability short setup</span>
        </div>
      </div>
    </Card>
  );
}