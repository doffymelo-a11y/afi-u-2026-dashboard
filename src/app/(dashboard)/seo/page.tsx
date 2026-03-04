'use client';

import Header from '@/components/layout/Header';
import BrandedTrafficChart from '@/components/dashboard/BrandedTrafficChart';
import CoreWebVitalsLive from '@/components/dashboard/CoreWebVitalsLive';
import SEOHealthIndex from '@/components/dashboard/SEOHealthIndex';
import SEORecovery from '@/components/dashboard/SEORecovery';

export default function SEOPage() {
  return (
    <>
      <Header title="SEO & Migration" />
      <div className="p-4 sm:p-6">
        {/* Branded Traffic & CWV */}
        <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <BrandedTrafficChart />
          <CoreWebVitalsLive strategy="mobile" />
        </div>

        {/* SEO Health & Recovery */}
        <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <SEOHealthIndex />
          <SEORecovery />
        </div>
      </div>
    </>
  );
}
