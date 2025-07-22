import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/widgets/MetricCard";
import { COTChart } from "@/components/charts/COTChart";
import { IndexChart } from "@/components/charts/IndexChart";
import { useDateRange } from '@/contexts/DateRangeContext';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from "lucide-react";
import { EDGE_BASE, fetchJSON } from '@/lib/api';

interface COTData {
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
}

interface Contract {
  id: string;
  name: string;
  sector: string;
}

export default function MarketDetail() {
  const { marketId } = useParams<{ marketId: string }>();
  const { dateRange } = useDateRange();
  const [contract, setContract] = useState<Contract | null>(null);
  const [cotData, setCotData] = useState<COTData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!marketId) return;
    
    const fetchContractAndData = async () => {
      setLoading(true);
      try {
        // Convert slug to contract name
        const contractName = marketId.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ').replace('And', '&');
        
        // For now, create a mock contract since we don't have contract lookup yet
        const mockContract = {
          id: 'mock-id',
          name: contractName,
          sector: 'Unknown'
        };
        setContract(mockContract);

        // Fetch latest COT data and filter for this contract
        const data = await fetchJSON(`${EDGE_BASE}/cot/latest`);
        
        // Filter for this contract (approximate match)
        const contractData = data.find((item: any) => 
          item.contracts?.name?.toLowerCase().includes(contractName.toLowerCase())
        );
        
        if (contractData) {
          setCotData([contractData]);
        } else {
          throw new Error('Contract data not found');
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContractAndData();
  }, [marketId, dateRange]);
  
  if (!marketId) {
    return <div>Market not found</div>;
  }
  
  if (loading) {
    return <div className="p-6">Loading market data...</div>;
  }
  
  if (error || !contract) {
    return <div className="p-6">Error: {error || 'Contract not found'}</div>;
  }

  // Transform COT data for charts
  const chartData = cotData.map(item => ({
    date: item.report_date,
    commercial: item.comm_net,
    largeSpec: item.ls_net,
    smallSpec: item.ss_net
  }));
  
  // Transform index data for IndexChart
  const indexData = cotData.map(item => ({
    date: item.report_date,
    commercialIndex: item.comm_index,
    largeSpecIndex: item.ls_index,
    smallSpecIndex: item.ss_index
  }));
  
  // Get latest data for metrics
  const latestCOT = cotData[cotData.length - 1];
  const previousCOT = cotData[cotData.length - 2];
  
  const commercialIndex = latestCOT ? latestCOT.comm_index : 0;
  const weekChange = latestCOT ? latestCOT.wow_comm_delta : 0;
  const weekChangePercent = previousCOT && previousCOT.comm_net !== 0 ? 
    ((weekChange / Math.abs(previousCOT.comm_net)) * 100) : 0;

  const getStatusBadge = (index: number) => {
    if (index >= 95) return { variant: "destructive" as const, text: "Extreme Long" };
    if (index <= 5) return { variant: "destructive" as const, text: "Extreme Short" };
    if (index >= 85 || index <= 15) return { variant: "default" as const, text: "Setup Zone" };
    return { variant: "secondary" as const, text: "Neutral" };
  };

  const status = getStatusBadge(commercialIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{contract.name}</h1>
            <Badge variant="outline">{contract.sector}</Badge>
            <Badge variant={status.variant}>{status.text}</Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            Commitment of Traders analysis and positioning data
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Commercial Index"
          value={commercialIndex.toFixed(1)}
          change={`${weekChange > 0 ? '+' : ''}${weekChange} this week`}
          changeType={weekChange >= 0 ? "positive" : "negative"}
          icon={Activity}
          description="0-100 percentile rank"
        />
        <MetricCard
          title="Large Spec Index"
          value={latestCOT ? latestCOT.ls_index.toFixed(1) : "0"}
          change={`${latestCOT && latestCOT.wow_ls_delta > 0 ? '+' : ''}${latestCOT ? latestCOT.wow_ls_delta : 0} this week`}
          changeType={latestCOT && latestCOT.wow_ls_delta >= 0 ? "positive" : "negative"}
          icon={TrendingDown}
          description="Inverse to Commercial"
        />
        <MetricCard
          title="Position Risk"
          value={commercialIndex >= 95 || commercialIndex <= 5 ? "High" : "Medium"}
          change={commercialIndex >= 95 || commercialIndex <= 5 ? "Extreme territory" : "Normal range"}
          changeType={commercialIndex >= 95 || commercialIndex <= 5 ? "negative" : "positive"}
          icon={AlertTriangle}
          description="Commercial crowdedness"
        />
        <MetricCard
          title="Setup Signal"
          value={commercialIndex >= 95 ? "Short" : commercialIndex <= 5 ? "Long" : "Neutral"}
          change={commercialIndex >= 95 || commercialIndex <= 5 ? "Strong signal" : "No signal"}
          changeType={commercialIndex >= 95 || commercialIndex <= 5 ? "positive" : "neutral"}
          icon={TrendingUp}
          description="Based on index reading"
        />
      </div>

      {/* Chart Tabs */}
      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="positions">Net Positions</TabsTrigger>
          <TabsTrigger value="index">Index Chart</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          <COTChart 
            data={chartData}
            title="Net Positions"
            height={400}
          />
        </TabsContent>

        <TabsContent value="index" className="space-y-4">
          <IndexChart 
            data={indexData}
            title="Commercial Index History"
            height={400}
          />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Position Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Commercial Index:</span>
                    <span className="font-bold text-lg">{commercialIndex.toFixed(1)}/100</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-chart-commercial h-2 rounded-full transition-all" 
                      style={{ width: `${commercialIndex}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Commercials are at the {commercialIndex.toFixed(1)}th percentile of their historical range. 
                    {commercialIndex >= 95 || commercialIndex <= 5 ? 
                      ' This is considered an extreme reading, suggesting high probability of price reversal.' :
                      ' This is within normal trading range.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trading Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {commercialIndex >= 95 ? (
                    <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <div className="font-medium text-destructive mb-1">Short Setup Signal</div>
                      <div className="text-sm text-muted-foreground">
                        Commercial index above 95 historically marks major tops. 
                        Consider short positions with appropriate risk management.
                      </div>
                    </div>
                  ) : commercialIndex <= 5 ? (
                    <div className="p-3 bg-green-100 rounded-lg border border-green-200">
                      <div className="font-medium text-green-700 mb-1">Long Setup Signal</div>
                      <div className="text-sm text-muted-foreground">
                        Commercial index below 5 historically marks major bottoms. 
                        Consider long positions with appropriate risk management.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <div className="font-medium mb-1">No Clear Signal</div>
                      <div className="text-sm text-muted-foreground">
                        Commercial index is in neutral territory. Wait for extreme readings.
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Signal Strength:</span>
                      <span className="font-medium">
                        {commercialIndex >= 95 || commercialIndex <= 5 ? 'Very Strong' : 
                         commercialIndex >= 85 || commercialIndex <= 15 ? 'Moderate' : 'Weak'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Week Change:</span>
                      <span className={`font-medium ${weekChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {weekChange > 0 ? '+' : ''}{weekChange}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}