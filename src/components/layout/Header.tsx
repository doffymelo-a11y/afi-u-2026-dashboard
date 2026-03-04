'use client';

import { useState, useRef, useEffect } from 'react';
import { useDateRange, DateRangeOption, ComparisonType } from '@/contexts/DateRangeContext';

interface HeaderProps {
  title?: string;
  showExport?: boolean;
}

const DATE_OPTIONS: { value: DateRangeOption; label: string }[] = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: 'ytd', label: 'Année en cours' },
  { value: 'ly', label: 'Année précédente' },
  { value: 'custom', label: 'Personnalisé...' },
];

const COMPARISON_OPTIONS: { value: ComparisonType; label: string }[] = [
  { value: 'previous_period', label: 'Période précédente' },
  { value: 'previous_year', label: 'Année précédente' },
  { value: 'custom', label: 'Personnalisé...' },
];

export default function Header({ title = 'Dashboard', showExport = true }: HeaderProps) {
  const {
    dateRange,
    setDateRange,
    customDates,
    setCustomDates,
    dateRangeLabel,
    comparisonEnabled,
    setComparisonEnabled,
    comparisonType,
    setComparisonType,
    comparisonDates,
    setComparisonDates,
    comparisonLabel,
  } = useDateRange();

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showComparisonPicker, setShowComparisonPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [tempCompStartDate, setTempCompStartDate] = useState('');
  const [tempCompEndDate, setTempCompEndDate] = useState('');
  const datePickerRef = useRef<HTMLDivElement>(null);
  const compPickerRef = useRef<HTMLDivElement>(null);

  // Close pickers when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (compPickerRef.current && !compPickerRef.current.contains(event.target as Node)) {
        setShowComparisonPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize temp dates when opening picker
  useEffect(() => {
    if (showDatePicker) {
      if (customDates) {
        setTempStartDate(customDates.startDate);
        setTempEndDate(customDates.endDate);
      } else {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        setTempStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
        setTempEndDate(today.toISOString().split('T')[0]);
      }
    }
  }, [showDatePicker, customDates]);

  // Initialize comparison dates when opening picker
  useEffect(() => {
    if (showComparisonPicker && comparisonDates) {
      setTempCompStartDate(comparisonDates.startDate);
      setTempCompEndDate(comparisonDates.endDate);
    }
  }, [showComparisonPicker, comparisonDates]);

  const handleDateRangeChange = (value: DateRangeOption) => {
    if (value === 'custom') {
      setShowDatePicker(true);
    } else {
      setDateRange(value);
      setShowDatePicker(false);
    }
  };

  const handleApplyCustomDates = () => {
    if (tempStartDate && tempEndDate) {
      if (new Date(tempStartDate) > new Date(tempEndDate)) {
        setCustomDates({ startDate: tempEndDate, endDate: tempStartDate });
      } else {
        setCustomDates({ startDate: tempStartDate, endDate: tempEndDate });
      }
      setDateRange('custom');
      setShowDatePicker(false);
    }
  };

  const handleComparisonTypeChange = (value: ComparisonType) => {
    setComparisonType(value);
    if (value !== 'custom') {
      setShowComparisonPicker(false);
    }
  };

  const handleApplyComparisonDates = () => {
    if (tempCompStartDate && tempCompEndDate) {
      if (new Date(tempCompStartDate) > new Date(tempCompEndDate)) {
        setComparisonDates({ startDate: tempCompEndDate, endDate: tempCompStartDate });
      } else {
        setComparisonDates({ startDate: tempCompStartDate, endDate: tempCompEndDate });
      }
      setComparisonType('custom');
      setShowComparisonPicker(false);
    }
  };

  const handleCopyKPIs = async () => {
    const kpiSummary = `
📊 Résumé KPIs - ${dateRangeLabel}
Date: ${new Date().toLocaleDateString('fr-FR')}
${comparisonEnabled ? `Comparaison: ${comparisonLabel}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PERFORMANCE GLOBALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• MER (Marketing Efficiency Ratio): À consulter dans le dashboard
• Taux de conversion global: À consulter dans le dashboard
• Blended CPL: À consulter dans le dashboard
• Trafic organique: À consulter dans le dashboard

🔗 Dashboard: ${typeof window !== 'undefined' ? window.location.origin : ''}
    `.trim();

    try {
      await navigator.clipboard.writeText(kpiSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
    setExportMenuOpen(false);
  };

  const handleExportPDF = () => {
    window.print();
    setExportMenuOpen(false);
  };

  const applyQuickPreset = (days: number) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    setTempStartDate(startDate.toISOString().split('T')[0]);
    setTempEndDate(today.toISOString().split('T')[0]);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white print:hidden">
      {/* Desktop Header */}
      <div className="hidden md:flex h-16 items-center justify-between px-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')} • {dateRangeLabel}
            {comparisonEnabled && <span className="text-blue-600 ml-1">{comparisonLabel}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{dateRangeLabel}</span>
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 z-50">
                <div className="p-4">
                  {/* Quick Options */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Périodes prédéfinies</p>
                    <div className="grid grid-cols-2 gap-2">
                      {DATE_OPTIONS.filter(o => o.value !== 'custom').map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleDateRangeChange(option.value)}
                          className={`px-3 py-2 text-sm rounded-md transition-colors ${
                            dateRange === option.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 my-4"></div>

                  {/* Custom Date Range */}
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Période personnalisée</p>
                    <div className="flex gap-2 mb-3">
                      {[7, 14, 30, 60].map((days) => (
                        <button
                          key={days}
                          onClick={() => applyQuickPreset(days)}
                          className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                        >
                          {days}j
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date de début</label>
                        <input
                          type="date"
                          value={tempStartDate}
                          onChange={(e) => setTempStartDate(e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date de fin</label>
                        <input
                          type="date"
                          value={tempEndDate}
                          onChange={(e) => setTempEndDate(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={handleApplyCustomDates}
                        disabled={!tempStartDate || !tempEndDate}
                        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Appliquer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comparison Toggle & Selector */}
          <div className="relative" ref={compPickerRef}>
            <button
              onClick={() => {
                if (comparisonEnabled) {
                  setShowComparisonPicker(!showComparisonPicker);
                } else {
                  setComparisonEnabled(true);
                }
              }}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                comparisonEnabled
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden lg:inline">
                {comparisonEnabled ? 'Comparaison' : 'Comparer'}
              </span>
              {comparisonEnabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setComparisonEnabled(false);
                    setShowComparisonPicker(false);
                  }}
                  className="ml-1 p-0.5 rounded-full hover:bg-blue-200"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </button>

            {/* Comparison Picker Dropdown */}
            {showComparisonPicker && comparisonEnabled && (
              <div className="absolute right-0 mt-2 w-72 rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 z-50">
                <div className="p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-3">Comparer avec</p>
                  <div className="space-y-2 mb-4">
                    {COMPARISON_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleComparisonTypeChange(option.value)}
                        className={`w-full px-3 py-2 text-sm rounded-md text-left transition-colors ${
                          comparisonType === option.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {comparisonType === 'custom' && (
                    <>
                      <div className="border-t border-slate-200 my-4"></div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Date de début</label>
                          <input
                            type="date"
                            value={tempCompStartDate}
                            onChange={(e) => setTempCompStartDate(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Date de fin</label>
                          <input
                            type="date"
                            value={tempCompEndDate}
                            onChange={(e) => setTempCompEndDate(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={handleApplyComparisonDates}
                          disabled={!tempCompStartDate || !tempCompEndDate}
                          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                          Appliquer
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition-colors"
            title="Rafraîchir les données"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Export Menu */}
          {showExport && (
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exporter
              </button>

              {exportMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <button
                      onClick={handleCopyKPIs}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      {copied ? 'Copié !' : 'Copier résumé KPIs'}
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Imprimer / PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <div className="flex items-center gap-2">
            {/* Mobile Comparison Toggle */}
            <button
              onClick={() => setComparisonEnabled(!comparisonEnabled)}
              className={`rounded-lg p-2 ${
                comparisonEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
              }`}
              title="Comparer"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            {showExport && (
              <button
                onClick={handleCopyKPIs}
                className="rounded-lg bg-blue-600 p-2 text-white"
                title="Copier KPIs"
              >
                {copied ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDatePicker(true)}
            className="flex-1 flex items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="truncate">{dateRangeLabel}</span>
            </div>
            <svg className="h-4 w-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-slate-100 p-2 text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        {comparisonEnabled && (
          <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
            <span>Comparaison:</span>
            <select
              value={comparisonType}
              onChange={(e) => setComparisonType(e.target.value as ComparisonType)}
              className="flex-1 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs"
            >
              {COMPARISON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Mobile Date Picker Modal */}
      {showDatePicker && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
          <div className="w-full bg-white rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Sélectionner une période</h3>
              <button
                onClick={() => setShowDatePicker(false)}
                className="p-2 text-slate-500 hover:text-slate-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Options */}
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 uppercase mb-2">Périodes prédéfinies</p>
              <div className="grid grid-cols-2 gap-2">
                {DATE_OPTIONS.filter(o => o.value !== 'custom').map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDateRangeChange(option.value)}
                    className={`px-3 py-3 text-sm rounded-lg transition-colors ${
                      dateRange === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 my-4"></div>

            {/* Custom Date Range */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase mb-2">Période personnalisée</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date de début</label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleApplyCustomDates}
                  disabled={!tempStartDate || !tempEndDate}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-medium text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
