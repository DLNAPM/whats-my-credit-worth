
import React from 'react';
import type { View } from '../types';
import { formatMonthYear } from '../utils/helpers';
import Button from './ui/Button';
import { ChevronLeftIcon, ChevronRightIcon, EditIcon, ImportIcon, ShareIcon, CheckIcon, AlertTriangleIcon, SparklesIcon } from './ui/Icons';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  saveStatus?: 'saved' | 'saving' | 'error';
  currentMonthYear: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onEdit: () => void;
  onShare: () => void;
  onImportExport: () => void;
  onRecommendations: () => void;
  view: View;
  setView: (view: View) => void;
  onLogout: () => Promise<void>;
  onSave?: () => Promise<void>;
}

const Header: React.FC<HeaderProps> = ({ 
  saveStatus,
  currentMonthYear, 
  onPreviousMonth, 
  onNextMonth,
  onEdit,
  onShare,
  onImportExport,
  onRecommendations,
  view,
  setView,
  onLogout,
  onSave
}) => {
  const { user } = useAuth();

  const SaveStatusIndicator = () => {
      if (!saveStatus) return null;

      if (saveStatus === 'saving') {
          return <div className="text-[10px] flex items-center gap-1.5 text-blue-500 font-bold bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full animate-pulse border border-blue-100">CLOUD SYNCING...</div>;
      }
      if (saveStatus === 'saved') {
          return <div className="text-[10px] flex items-center gap-1.5 text-positive font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-100"><CheckIcon /> DATABASE SECURED</div>;
      }
      return (
        <button onClick={onSave} className="text-[10px] flex items-center gap-1.5 text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full border border-red-100">
          <AlertTriangleIcon /> SYNC ERROR - RETRY
        </button>
      );
  };

  const LogoutIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 mb-6 rounded-lg border-b-4 border-brand-primary">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        
        <div className="flex flex-col items-center lg:items-start">
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <h1 className="text-2xl font-bold text-brand-primary dark:text-brand-light whitespace-nowrap">WMCW Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button 
              onClick={onRecommendations} 
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-[10px] font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <SparklesIcon />
              <span className="tracking-wider">AI ADVISOR</span>
            </button>
            <SaveStatusIndicator />
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-4">
                <button onClick={onPreviousMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ChevronLeftIcon /></button>
                <span className="font-semibold text-lg w-32 text-center">{formatMonthYear(currentMonthYear)}</span>
                <button onClick={onNextMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ChevronRightIcon /></button>
            </div>

            <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            {(['dashboard', 'reports'] as View[]).map(v => (
                <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
                    view === v
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-brand-light hover:text-brand-primary'
                }`}
                >
                {v}
                </button>
            ))}
            </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-end">
            {user && (
                <div className="flex items-center gap-3 border-r pr-4 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-primary font-bold text-xs">
                            {user.displayName?.charAt(0) || (user.isAnonymous ? 'G' : 'U')}
                        </div>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100 max-w-[80px] truncate">
                            {user.isAnonymous ? 'Guest' : (user.displayName?.split(' ')[0] || 'User')}
                        </span>
                    </div>
                    <button onClick={onLogout} className="text-gray-500 hover:text-negative p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Logout"><LogoutIcon /></button>
                </div>
            )}
            <Button onClick={onEdit} variant="primary"><EditIcon /> Edit</Button>
            <Button onClick={onShare} variant="secondary" size="small"><ShareIcon /></Button>
            <Button onClick={onImportExport} variant="secondary" size="small"><ImportIcon /></Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
