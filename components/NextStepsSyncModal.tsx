import React, { useState, useMemo } from 'react';
import type { MonthlyData, AccountType, NextStepsAccount, NextStepsSyncPayload } from '../types';
import { buildNextStepsSyncPayload, copyNextStepsPayloadToClipboard, downloadNextStepsPayloadFile } from '../utils/nextStepsSync';
import Button from './ui/Button';
import { formatMonthYear } from '../utils/helpers';

interface NextStepsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MonthlyData;
  monthYear: string;
  accountType?: AccountType;
  businessName?: string;
  businessType?: string;
}

export const NextStepsSyncModal: React.FC<NextStepsSyncModalProps> = ({
  isOpen,
  onClose,
  data,
  monthYear,
  accountType = 'personal',
  businessName = '',
  businessType = 'LLC'
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [customAccounts, setCustomAccounts] = useState<NextStepsAccount[] | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'raw_json'>('overview');
  const [filterType, setFilterType] = useState<'all' | 'cards' | 'loans' | 'assets'>('all');

  const basePayload = useMemo(() => {
    return buildNextStepsSyncPayload(data, {
      accountType,
      businessName,
      businessType,
      monthYear
    });
  }, [data, accountType, businessName, businessType, monthYear]);

  const activeAccounts = customAccounts || basePayload.accounts;

  const currentPayload: NextStepsSyncPayload = useMemo(() => {
    return {
      ...basePayload,
      accounts: activeAccounts
    };
  }, [basePayload, activeAccounts]);

  const jsonString = useMemo(() => {
    return JSON.stringify(currentPayload, null, 2);
  }, [currentPayload]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await copyNextStepsPayloadToClipboard(currentPayload);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } else {
      alert("Clipboard copy failed. Please use the Download button or select and copy the JSON text directly.");
    }
  };

  const handleDownload = () => {
    downloadNextStepsPayloadFile(currentPayload, `NextSteps-Sync-${accountType}-${monthYear}`);
  };

  const handleAccountFieldChange = (index: number, field: keyof NextStepsAccount, value: any) => {
    const updated = [...activeAccounts];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setCustomAccounts(updated);
  };

  const totalCards = activeAccounts.filter(a => a.category === 'credit-card' || (a.isBusiness && a.category === 'llc')).length;
  const totalLoans = activeAccounts.filter(a => a.category === 'loan' || a.category === 'mortgage').length;
  const totalAssets = activeAccounts.filter(a => a.category === 'asset' || a.accountType === 'asset').length;

  const filteredAccounts = activeAccounts.filter(a => {
    if (filterType === 'cards') return a.category === 'credit-card' || (a.isBusiness && a.category === 'llc');
    if (filterType === 'loans') return a.category === 'loan' || a.category === 'mortgage';
    if (filterType === 'assets') return a.category === 'asset' || a.accountType === 'asset';
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">1-Click Sync to Next Steps</h2>
                <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-extrabold uppercase rounded-md tracking-wider border border-white/20">
                  v2.0 Payload
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                Seamlessly transfer and auto-diff credit, loan, and asset accounts into the Next Steps app
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="relative z-10 text-white/70 hover:text-white transition-colors p-2 text-2xl font-light hover:bg-white/10 rounded-xl"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Quick Instructions & Metrics Banner */}
        <div className="bg-slate-50 dark:bg-gray-800/60 p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs text-gray-600 dark:text-gray-300">
            <span className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Snapshot: {formatMonthYear(monthYear)}
            </span>
            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
            <span>Accounts: <strong>{activeAccounts.length}</strong> total</span>
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-md font-semibold text-[11px]">
              {totalCards} Cards
            </span>
            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 rounded-md font-semibold text-[11px]">
              {totalLoans} Loans
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-md font-semibold text-[11px]">
              {totalAssets} Assets
            </span>
            {accountType === 'business' && (
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 rounded-md font-semibold text-[11px]">
                Entity: {businessName || 'Business'}
              </span>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg text-xs font-semibold self-end sm:self-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 rounded-md transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-gray-800 text-brand-primary shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Account Table
            </button>
            <button
              onClick={() => setActiveTab('raw_json')}
              className={`px-3 py-1 rounded-md transition-all ${activeTab === 'raw_json' ? 'bg-white dark:bg-gray-800 text-brand-primary shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Raw JSON
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[58vh]">
          {/* 3-Step Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-gray-800/80 dark:to-gray-800/40 rounded-xl border border-blue-100 dark:border-gray-700/60 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black flex items-center justify-center shrink-0">1</div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Click "Copy Sync Payload"</p>
                <p className="text-[11px] text-gray-500">Writes formatted v2.0 JSON payload</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center shrink-0">2</div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Switch to Next Steps</p>
                <p className="text-[11px] text-gray-500">Open your target Next Steps workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0">3</div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Paste & Review Diff</p>
                <p className="text-[11px] text-gray-500">Matches last 4 digits & syncs all balances</p>
              </div>
            </div>
          </div>

          {activeTab === 'overview' ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Accounts Ready for Next Steps</span>
                  <span className="text-xs font-normal text-gray-500">(Includes Debts & Assets)</span>
                </h3>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      filterType === 'all'
                        ? 'bg-brand-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    All ({activeAccounts.length})
                  </button>
                  <button
                    onClick={() => setFilterType('cards')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      filterType === 'cards'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Cards ({totalCards})
                  </button>
                  <button
                    onClick={() => setFilterType('loans')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      filterType === 'loans'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Loans ({totalLoans})
                  </button>
                  <button
                    onClick={() => setFilterType('assets')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      filterType === 'assets'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Assets ({totalAssets})
                  </button>
                </div>
              </div>

              {filteredAccounts.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500">No accounts found for the selected filter in this snapshot.</p>
                  <p className="text-xs text-gray-400 mt-1">Add accounts or assets in the Data Editor to populate this view.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 uppercase tracking-wider font-bold border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="p-3">Account Name</th>
                        <th className="p-3">Institution / Lender</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Balance / Value</th>
                        <th className="p-3">Limit / Valuation</th>
                        <th className="p-3">Last 4 #</th>
                        <th className="p-3">APR / APY</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Info / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                      {filteredAccounts.map((account, idx) => {
                        const originalIndex = activeAccounts.indexOf(account);
                        const isAsset = account.category === 'asset' || account.accountType === 'asset';
                        return (
                          <tr key={idx} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                            <td className="p-3 font-semibold text-gray-900 dark:text-white max-w-[160px] truncate">
                              {account.name}
                            </td>
                            <td className="p-3 text-gray-600 dark:text-gray-300">
                              {account.lenderName}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                account.category === 'credit-card'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                  : account.category === 'mortgage'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                  : account.category === 'llc'
                                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                  : isAsset
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/50'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              }`}>
                                {isAsset ? (account.assetType ? `Asset (${account.assetType})` : 'Asset') : account.category}
                              </span>
                            </td>
                            <td className={`p-3 font-mono font-semibold ${isAsset ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'}`}>
                              {account.currentBalance}
                            </td>
                            <td className="p-3 font-mono text-gray-500">
                              {isAsset ? (
                                <span className="text-[11px] text-gray-400">Holding</span>
                              ) : (
                                account.creditLimit
                              )}
                            </td>
                            <td className="p-3 font-mono">
                              <input
                                type="text"
                                maxLength={4}
                                value={account.accountNumber}
                                onChange={(e) => handleAccountFieldChange(originalIndex, 'accountNumber', e.target.value.replace(/\D/g, ''))}
                                className="w-14 px-1.5 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-center text-xs font-mono font-bold focus:ring-1 focus:ring-blue-500"
                                title="Last 4 digits used as primary key in Next Steps"
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={account.apr}
                                  onChange={(e) => handleAccountFieldChange(originalIndex, 'apr', e.target.value)}
                                  className="w-14 px-1.5 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-center text-xs font-mono focus:ring-1 focus:ring-blue-500"
                                />
                                <span className="text-gray-400">{isAsset ? 'APY' : '%'}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                account.isBusiness
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                              }`}>
                                {account.isBusiness ? 'Business' : 'Personal'}
                              </span>
                            </td>
                            <td className="p-3 max-w-[180px]">
                              <input
                                type="text"
                                value={account.notes || account.info || ''}
                                onChange={(e) => handleAccountFieldChange(originalIndex, 'notes', e.target.value)}
                                className="w-full px-1.5 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 focus:ring-1 focus:ring-blue-500 truncate"
                                title={account.notes || account.info || ''}
                                placeholder="Add notes..."
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">Official v2.0 JSON Payload (Includes Debts & Assets)</span>
                <span className="text-[11px] text-gray-400">{jsonString.length} bytes</span>
              </div>
              <div className="relative">
                <pre className="p-4 bg-gray-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-72 border border-gray-800 select-all">
                  {jsonString}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 w-full sm:w-auto justify-center sm:justify-start">
            {copySuccess && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold animate-fade-in">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied to clipboard! Ready to paste in Next Steps.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button onClick={onClose} variant="secondary" size="small">
              Close
            </Button>
            
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors flex items-center gap-1.5"
              title="Download standard .json file for Next Steps"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export File (.json)
            </button>

            <button
              onClick={handleCopy}
              className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 ${
                copySuccess 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400 ring-offset-2'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-indigo-500/25'
              }`}
            >
              {copySuccess ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Payload Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy Sync Payload
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextStepsSyncModal;
