import React, { createContext, useContext, useState, ReactNode } from 'react';

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

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<RefreshStatus>({
    lastRefresh: new Date(2024, 6, 19, 16, 0), // Mock last Friday 4PM
    isRefreshing: false,
    rowsUpdated: 2847,
    error: null
  });

  const triggerRefresh = async () => {
    setStatus(prev => ({ ...prev, isRefreshing: true, error: null }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock successful refresh
      const newRowsUpdated = Math.floor(Math.random() * 1000) + 2000;
      setStatus({
        lastRefresh: new Date(),
        isRefreshing: false,
        rowsUpdated: newRowsUpdated,
        error: null
      });
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