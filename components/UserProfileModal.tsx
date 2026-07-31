import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';
import { CloseIcon, CheckIcon, SparklesIcon, FeatureShieldIcon, DeleteIcon } from './ui/Icons';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMembership?: () => void;
}

const POPULAR_TICKERS = ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'AMD', 'SPY', 'QQQ', 'BTC', 'ETH'];

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, onOpenMembership }) => {
  const { user, isPremium, isSuperUser, savedTickers, updateSavedTickers } = useAuth();
  const [tickers, setTickers] = useState<string[]>([]);
  const [inputTicker, setInputTicker] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (savedTickers) {
      setTickers(savedTickers);
    }
  }, [savedTickers, isOpen]);

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
      setSuccessMsg("Stock ticker preferences saved successfully!");
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to save tickers. Please try again.");
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
              {user?.displayName?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold">User Profile & Settings</h3>
              <p className="text-xs text-white/80">{user?.email || 'Guest User'}</p>
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
