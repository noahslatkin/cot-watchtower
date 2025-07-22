import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDateRange } from '@/contexts/DateRangeContext';
import { EDGE_BASE, fetchJSON } from '@/lib/api';

interface HeatMapData {
  contract_id: string;
  report_date: string;
  comm_net: number;
  ls_net: number;
  ss_net: number;
  comm_index: number;
  ls_index: number;
  ss_index: number;
  wow_comm_delta: number;
  wow_ls_delta: number;
  wow_ss_delta: number;
  contracts: {
    name: string;
    sector: string;
  };
}

export default function HeatMaps() {
  const { dateRange } = useDateRange();
  const [data, setData] = useState<HeatMapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchJSON(`${EDGE_BASE}/cot/latest`);
      setData(data);
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const getBgColor = (value: number) => {
    if (value >= 90) return "bg-red-600";
    if (value >= 80) return "bg-red-500";
    if (value >= 70) return "bg-red-400";
    if (value >= 60) return "bg-red-300";
    if (value >= 50) return "bg-yellow-300";
    if (value >= 40) return "bg-blue-300";
    if (value >= 30) return "bg-blue-400";
    if (value >= 20) return "bg-blue-500";
    if (value >= 10) return "bg-blue-600";
    return "bg-blue-700";
  };

  const getTextColor = (value: number) => {
    return value >= 50 ? "text-white" : "text-white";
  };

  if (loading) {
    return <div className="p-6">Loading heat map data...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  if (!data.length) {
    return <div className="p-6">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">COT Heat Maps</h1>
        <p className="text-muted-foreground mt-2">
          Visual representation of Commitment of Traders positioning data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commercial Index Heat Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.map((item) => (
              <div
                key={item.contract_id}
                className={`p-4 rounded-lg ${getBgColor(item.comm_index)} ${getTextColor(item.comm_index)}`}
              >
                <div className="font-semibold text-sm">{item.contracts.name}</div>
                <div className="text-xs opacity-80">{item.contracts.sector}</div>
                <div className="mt-2">
                  <div className="text-lg font-bold">{item.comm_index.toFixed(1)}</div>
                  <div className="text-xs">
                    WoW: {item.wow_comm_delta > 0 ? '+' : ''}{item.wow_comm_delta}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Heat Map Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-700 text-white">0-10: Extreme Short</Badge>
            <Badge className="bg-blue-500 text-white">20-30: Short</Badge>
            <Badge className="bg-yellow-300 text-black">40-60: Neutral</Badge>
            <Badge className="bg-red-400 text-white">70-80: Long</Badge>
            <Badge className="bg-red-600 text-white">90-100: Extreme Long</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}