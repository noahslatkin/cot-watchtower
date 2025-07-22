import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  preset: string;
  setPreset: (preset: string) => void;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState('90d');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(2025, 3, 15), // April 15, 2025 (90 days before July 15, 2025)
    to: new Date(2025, 6, 15)    // July 15, 2025 - latest COT data
  });

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange, preset, setPreset }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (context === undefined) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
}