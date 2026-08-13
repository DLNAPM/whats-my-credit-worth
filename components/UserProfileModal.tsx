import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';
import { CloseIcon, CheckIcon, SparklesIcon, FeatureShieldIcon, DeleteIcon } from './ui/Icons';
import type { AccountType } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMembership?: () => void;
}

const POPULAR_TICKERS = ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'AMD', 'SPY', 'QQQ', 'BTC', 'ETH'];

const BUSINESS_ENTITY_TYPES = ['LLC', 'S-Corporation', 'C-Corporation', 'Sole Proprietorship', 'Partnership', 'Non-Profit'];

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, onOpenMembership }) => {
  const { 
    user, 
    isPremium, 
    isSuperUser, 
    savedTickers, 
    updateSavedTickers, 
    showStockBanner, 
    updateShowStockBanner,
    accountType: currentAccountType,
    businessName: currentBusinessName,
    businessType: currentBusinessType,
    updateAccountType
  } = useAuth();

  const [tickers, setTickers] = useState<string[]>([]);
  const [bannerVisible, setBannerVisible] = useState<boolean>(true);
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>('personal');
  const [bizName, setBizName] = useState<string>('');
  const [bizType, setBizType] = useState<string>('LLC');
  const [inputTicker, setInputTicker] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (savedTickers) {
      setTickers(savedTickers);
    }
    if (typeof showStockBanner === 'boolean') {
      setBannerVisible(showStockBanner);
    }
    if (currentAccountType) {
      setSelectedAccountType(currentAccountType);
    }
    if (currentBusinessName !== undefined) {
      setBizName(currentBusinessName);
    }
    if (currentBusinessType) {
      setBizType(currentBusinessType);
    }
  }, [savedTickers, showStockBanner, currentAccountType, currentBusinessName, currentBusinessType, isOpen]);

  if (!isOpen) return null;

  const handleAddTicker = (symbolToAdd?: string) => {
    setError(null);
    const sym = (symbolToAdd || inputTicker).trim().toUpperCase();

    if (!sym) {
      setError("Please enter a valid stock ticker symbol (e.g. AAPL).");
      return;
    }

    if (tickers.includes(sym)) {
      setError(`Ticker "${sym}" is already in your saved list.`);
      return;
    }

    if (tickers.length >= 5) {
      setError("You can save up to 5 stock ticker symbols maximum.");
      return;
    }

    setTickers(prev => [...prev, sym]);
    setInputTicker('');
  };

  const handleRemoveTicker = (sym: string) => {
    setError(null);
    setTickers(prev => prev.filter(t => t !== sym));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await updateSavedTickers(tickers);
      await updateShowStockBanner(bannerVisible);
      await updateAccountType(selectedAccountType, {
        businessName: bizName.trim(),
        businessType: bizType
      });
      setSuccessMsg("Profile, account type & banner preferences saved successfully!");
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg text-white border border-white/30">
              {user?.displayName?.charAt(0) || (selectedAccountType === 'business' ? 'B' : 'P')}
            </div>
            <div>
              <h3 className="text-lg font-bold">User Profile & Settings</h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-white/80">{user?.email || 'Guest User'}</p>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  {selectedAccountType === 'business' ? '🏢 Business' : '👤 Personal'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-900 dark:text-gray-100">
          {/* Account Status Badge */}
          <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/80 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Account Membership</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-extrabold text-base">
                  {isPremium ? 'Premium Account' : 'Basic Free Tier'}
                </span>
                {isSuperUser && (
                  <span className="px-2 py-0.5 bg-brand-primary text-white text-[9px] font-black rounded uppercase tracking-tighter">
                    <FeatureShieldIcon className="w-2.5 h-2.5 inline mr-1" /> Admin
                  </span>
                )}
              </div>
            </div>
            {!isPremium && onOpenMembership && (
              <Button
                onClick={() => { onClose(); onOpenMembership(); }}
                size="small"
                className="bg-brand-primary hover:bg-brand-secondary text-white font-bold"
              >
                <SparklesIcon className="w-3.5 h-3.5 mr-1 inline" /> Upgrade
              </Button>
            )}
          </div>

          {/* Account Type Classification (Personal vs Business) */}
          <div className="bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/40 dark:from-gray-800/80 dark:to-gray-800/40 p-5 rounded-2xl border border-indigo-100 dark:border-gray-700 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-brand-primary text-white text-xs">
                    {selectedAccountType === 'business' ? '🏢' : '👤'}
                  </span>
                  Account Type Classification
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Distinguish your account type to configure the <strong>AI Advisor</strong> and <strong>AI Deep Dive Insights</strong> with Personal vs. Business Underwriting Standards and Policies.
                </p>
              </div>
            </div>

            {/* Account Type Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Personal Account Option */}
              <button
                type="button"
                onClick={() => setSelectedAccountType('personal')}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedAccountType === 'personal'
                    ? 'bg-white dark:bg-gray-800 border-brand-primary dark:border-blue-500 shadow-md ring-2 ring-brand-primary/20 dark:ring-blue-500/30'
                    : 'bg-white/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👤</span>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">Personal Account</span>
                  </div>
                  {selectedAccountType === 'personal' && (
                    <span className="w-5 h-5 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Tailored for household budgeting, personal FICO credit models (8/4/2), personal DTI ratios &lt;43%, family emergency funds & estate protection.
                </p>
                <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700 text-[10px] font-bold text-brand-primary dark:text-blue-400">
                  Consumer Credit & Wealth Standards
                </div>
              </button>

              {/* Business Account Option */}
              <button
                type="button"
                onClick={() => setSelectedAccountType('business')}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedAccountType === 'business'
                    ? 'bg-white dark:bg-gray-800 border-indigo-600 dark:border-indigo-400 shadow-md ring-2 ring-indigo-500/20 dark:ring-indigo-400/30'
                    : 'bg-white/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏢</span>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">Business Account</span>
                  </div>
                  {selectedAccountType === 'business' && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Tailored for commercial operations, Debt Service Coverage (DSCR &gt;1.25x), business lines of credit, OPEX runway, and corporate credit profiles.
                </p>
                <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  Commercial & Underwriting Policies
                </div>
              </button>
            </div>

            {/* Optional Business Details (shown when Business Account is selected) */}
            {selectedAccountType === 'business' && (
              <div className="pt-2 border-t border-indigo-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Business / Entity Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Enterprises LLC"
                    value={bizName}
                    onChange={e => setBizName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Entity Structure
                  </label>
                  <select
                    value={bizType}
                    onChange={e => setBizType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-medium"
                  >
                    {BUSINESS_ENTITY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Banner Visibility Settings Toggle */}
          <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/80 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary dark:text-blue-400 shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  Stock Banner Display
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                    bannerVisible 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' 
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {bannerVisible ? 'Enabled' : 'Disabled'}
                  </span>
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Show or hide the moving stock ticker banner at the top of your screen.
                </p>
              </div>
            </div>

            {/* Interactive Toggle Switch */}
            <button
              type="button"
              onClick={() => setBannerVisible(!bannerVisible)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${
                bannerVisible ? 'bg-brand-primary' : 'bg-gray-300 dark:bg-gray-700'
              }`}
              role="switch"
              aria-checked={bannerVisible}
            >
              <span className="sr-only">Toggle Stock Banner</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  bannerVisible ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Saved Tickers Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-primary dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Moving Banner Stock Tickers
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Customize up to 5 stock ticker symbols featured on your live top banner alongside DOW, S&P 500, and NASDAQ.
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                tickers.length === 5
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-brand-primary/10 text-brand-primary dark:text-blue-400'
              }`}>
                {tickers.length} / 5 Tickers
              </span>
            </div>

            {/* Current Tickers Chips */}
            <div className="bg-gray-50 dark:bg-gray-800/80 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 min-h-[68px] flex flex-wrap items-center gap-2">
              {tickers.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">No custom tickers added yet. Add tickers below to customize your moving banner.</p>
              ) : (
                tickers.map(sym => (
                  <div
                    key={sym}
                    className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-xl shadow-sm font-bold text-xs text-gray-800 dark:text-gray-200"
                  >
                    <span className="text-brand-primary dark:text-blue-400 font-extrabold">$</span>
                    <span>{sym}</span>
                    <button
                      onClick={() => handleRemoveTicker(sym)}
                      className="ml-1 text-gray-400 hover:text-red-500 p-0.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title={`Remove ${sym}`}
                    >
                      <CloseIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Ticker Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter ticker (e.g. AAPL, NVDA, GOOGL)"
                value={inputTicker}
                onChange={e => setInputTicker(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') handleAddTicker(); }}
                disabled={tickers.length >= 5}
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary uppercase font-bold text-gray-900 dark:text-white disabled:opacity-50"
              />
              <Button
                onClick={() => handleAddTicker()}
                disabled={tickers.length >= 5 || !inputTicker.trim()}
                size="small"
                className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2.5 px-4"
              >
                Add Ticker
              </Button>
            </div>

            {/* Quick Popular Suggestions */}
            {tickers.length < 5 && (
              <div>
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Quick Add Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_TICKERS.filter(s => !tickers.includes(s)).slice(0, 8).map(sym => (
                    <button
                      key={sym}
                      onClick={() => handleAddTicker(sym)}
                      className="text-[11px] font-bold px-2.5 py-1 bg-gray-100 hover:bg-brand-primary/10 hover:text-brand-primary dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                    >
                      +{sym}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-800 font-medium">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            Close
          </button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs py-2 px-5"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
