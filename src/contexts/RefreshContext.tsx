import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface RefreshStatus {
  lastRefresh: Date | null;
  isRefreshing: boolean;
  rowsUpdated: number;
  error: string | null;
}

interface RefreshContextType {
  status: RefreshStatus;
  triggerRefresh: () => Promise<void>;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000/api';

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<RefreshStatus>({
    lastRefresh: null,
    isRefreshing: false,
    rowsUpdated: 0,
    error: null
  });

  // Fetch refresh status on mount
  useEffect(() => {
    fetchRefreshStatus();
  }, []);

  const fetchRefreshStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/refresh/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus({
          lastRefresh: data.run_at ? new Date(data.run_at) : null,
          isRefreshing: false,
          rowsUpdated: data.rows_inserted || 0,
          error: data.error || null
        });
      }
    } catch (error) {
      console.error('Failed to fetch refresh status:', error);
      setStatus(prev => ({ ...prev, error: 'Failed to connect to API' }));
    }
  };

  const triggerRefresh = async () => {
    setStatus(prev => ({ ...prev, isRefreshing: true, error: null }));
    
    try {
      const response = await fetch(`${API_BASE}/refresh/run`, { method: 'GET' });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setStatus({
          lastRefresh: new Date(),
          isRefreshing: false,
          rowsUpdated: data.result?.total_weekly_rows + data.result?.total_metrics_rows || 0,
          error: null
        });
      } else {
        setStatus(prev => ({
          ...prev,
          isRefreshing: false,
          error: data.error || 'Failed to refresh data. Please try again.'
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isRefreshing: false,
        error: 'Failed to refresh data. Please try again.'
      }));
    }
  };

  return (
    <RefreshContext.Provider value={{ status, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
}