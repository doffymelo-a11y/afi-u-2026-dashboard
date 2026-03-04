import Header from '@/components/layout/Header';
import BrandedTrafficChart from '@/components/dashboard/BrandedTrafficChart';
import CoreWebVitalsLive from '@/components/dashboard/CoreWebVitalsLive';
import SEOHealthIndex from '@/components/dashboard/SEOHealthIndex';
import SEORecovery from '@/components/dashboard/SEORecovery';

export default function SEOPage() {
  return (
    <>
      <Header title="SEO & Migration" />
      <div className="p-6">
        {/* Branded Traffic & CWV */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BrandedTrafficChart dateRange="30d" />
          <CoreWebVitalsLive strategy="mobile" />
        </div>

        {/* SEO Health & Recovery */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SEOHealthIndex />
          <SEORecovery />
        </div>
      </div>
    </>
  );
}
