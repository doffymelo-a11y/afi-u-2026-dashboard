'use client';

import Sidebar from '@/components/layout/Sidebar';
import { DateRangeProvider } from '@/contexts/DateRangeContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DateRangeProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="lg:pl-64 min-h-screen">
          {children}
        </main>
      </div>
    </DateRangeProvider>
  );
}
