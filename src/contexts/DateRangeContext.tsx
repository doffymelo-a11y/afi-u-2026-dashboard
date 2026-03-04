'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type DateRangeOption = '7d' | '30d' | '90d' | 'ytd' | 'ly';

interface DateRangeContextType {
  dateRange: DateRangeOption;
  setDateRange: (range: DateRangeOption) => void;
  dateRangeLabel: string;
  getDateStrings: () => {
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
  };
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

const DATE_RANGE_LABELS: Record<DateRangeOption, string> = {
  '7d': '7 derniers jours',
  '30d': '30 derniers jours',
  '90d': '90 derniers jours',
  'ytd': 'Année en cours',
  'ly': 'Année précédente',
};

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d');

  const getDateStrings = () => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = new Date(today);
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (dateRange) {
      case '7d':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        previousEndDate = new Date(startDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        previousStartDate = new Date(previousEndDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;

      case '30d':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
        previousEndDate = new Date(startDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        previousStartDate = new Date(previousEndDate);
        previousStartDate.setDate(previousStartDate.getDate() - 30);
        break;

      case '90d':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 90);
        previousEndDate = new Date(startDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        previousStartDate = new Date(previousEndDate);
        previousStartDate.setDate(previousStartDate.getDate() - 90);
        break;

      case 'ytd':
        startDate = new Date(today.getFullYear(), 0, 1); // 1er janvier
        previousStartDate = new Date(today.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        break;

      case 'ly':
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        previousStartDate = new Date(today.getFullYear() - 2, 0, 1);
        previousEndDate = new Date(today.getFullYear() - 2, 11, 31);
        break;

      default:
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
        previousEndDate = new Date(startDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        previousStartDate = new Date(previousEndDate);
        previousStartDate.setDate(previousStartDate.getDate() - 30);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      previousStartDate: previousStartDate!.toISOString().split('T')[0],
      previousEndDate: previousEndDate!.toISOString().split('T')[0],
    };
  };

  return (
    <DateRangeContext.Provider
      value={{
        dateRange,
        setDateRange,
        dateRangeLabel: DATE_RANGE_LABELS[dateRange],
        getDateStrings,
      }}
    >
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
