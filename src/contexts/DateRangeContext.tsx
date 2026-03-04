'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type DateRangeOption = '7d' | '30d' | '90d' | 'ytd' | 'ly' | 'custom';
export type ComparisonType = 'previous_period' | 'previous_year' | 'custom';

interface CustomDateRange {
  startDate: string;
  endDate: string;
}

interface DateRangeContextType {
  dateRange: DateRangeOption;
  setDateRange: (range: DateRangeOption) => void;
  customDates: CustomDateRange | null;
  setCustomDates: (dates: CustomDateRange) => void;
  dateRangeLabel: string;
  getDateStrings: () => {
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
  };
  // Comparison
  comparisonEnabled: boolean;
  setComparisonEnabled: (enabled: boolean) => void;
  comparisonType: ComparisonType;
  setComparisonType: (type: ComparisonType) => void;
  comparisonDates: CustomDateRange | null;
  setComparisonDates: (dates: CustomDateRange) => void;
  getComparisonDateStrings: () => {
    startDate: string;
    endDate: string;
  } | null;
  comparisonLabel: string;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

const DATE_RANGE_LABELS: Record<Exclude<DateRangeOption, 'custom'>, string> = {
  '7d': '7 derniers jours',
  '30d': '30 derniers jours',
  '90d': '90 derniers jours',
  'ytd': 'Année en cours',
  'ly': 'Année précédente',
};

function formatDateLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
  return `${start.toLocaleDateString('fr-FR', options)} - ${end.toLocaleDateString('fr-FR', options)}`;
}

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d');
  const [customDates, setCustomDates] = useState<CustomDateRange | null>(null);

  // Comparison state
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [comparisonType, setComparisonType] = useState<ComparisonType>('previous_period');
  const [comparisonDates, setComparisonDates] = useState<CustomDateRange | null>(null);

  const getDateStrings = () => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = new Date(today);
    let previousStartDate: Date;
    let previousEndDate: Date;

    // Handle custom date range
    if (dateRange === 'custom' && customDates) {
      startDate = new Date(customDates.startDate);
      endDate = new Date(customDates.endDate);

      // Calculate the period length in days
      const periodLength = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Previous period is the same length, ending the day before start
      previousEndDate = new Date(startDate);
      previousEndDate.setDate(previousEndDate.getDate() - 1);
      previousStartDate = new Date(previousEndDate);
      previousStartDate.setDate(previousStartDate.getDate() - periodLength);

      return {
        startDate: customDates.startDate,
        endDate: customDates.endDate,
        previousStartDate: previousStartDate.toISOString().split('T')[0],
        previousEndDate: previousEndDate.toISOString().split('T')[0],
      };
    }

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

  const getComparisonDateStrings = (): { startDate: string; endDate: string } | null => {
    if (!comparisonEnabled) return null;

    const currentDates = getDateStrings();
    const currentStart = new Date(currentDates.startDate);
    const currentEnd = new Date(currentDates.endDate);
    const periodLength = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));

    if (comparisonType === 'custom' && comparisonDates) {
      return {
        startDate: comparisonDates.startDate,
        endDate: comparisonDates.endDate,
      };
    }

    if (comparisonType === 'previous_year') {
      const prevYearStart = new Date(currentStart);
      prevYearStart.setFullYear(prevYearStart.getFullYear() - 1);
      const prevYearEnd = new Date(currentEnd);
      prevYearEnd.setFullYear(prevYearEnd.getFullYear() - 1);
      return {
        startDate: prevYearStart.toISOString().split('T')[0],
        endDate: prevYearEnd.toISOString().split('T')[0],
      };
    }

    // Default: previous_period
    const prevEnd = new Date(currentStart);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - periodLength);
    return {
      startDate: prevStart.toISOString().split('T')[0],
      endDate: prevEnd.toISOString().split('T')[0],
    };
  };

  const dateRangeLabel = dateRange === 'custom' && customDates
    ? formatDateLabel(customDates.startDate, customDates.endDate)
    : DATE_RANGE_LABELS[dateRange as Exclude<DateRangeOption, 'custom'>] || '30 derniers jours';

  const comparisonDateStrings = getComparisonDateStrings();
  const comparisonLabel = comparisonEnabled && comparisonDateStrings
    ? `vs ${formatDateLabel(comparisonDateStrings.startDate, comparisonDateStrings.endDate)}`
    : '';

  return (
    <DateRangeContext.Provider
      value={{
        dateRange,
        setDateRange,
        customDates,
        setCustomDates,
        dateRangeLabel,
        getDateStrings,
        comparisonEnabled,
        setComparisonEnabled,
        comparisonType,
        setComparisonType,
        comparisonDates,
        setComparisonDates,
        getComparisonDateStrings,
        comparisonLabel,
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
