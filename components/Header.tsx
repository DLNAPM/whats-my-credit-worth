
import React from 'react';
import type { View } from '../types';
import { formatMonthYear } from '../utils/helpers';
import Button from './ui/Button';
import { ChevronLeftIcon, ChevronRightIcon, EditIcon, ImportIcon, ShareIcon, SaveIcon, CheckIcon, AlertTriangleIcon, SparklesIcon } from './ui/Icons';
import HelpTooltip from './ui/HelpTooltip';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  saveStatus?: 'saved' | 'unsaved' | 'saving' | 'error';
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
          return <div className="text-xs flex items-center gap-1.5 text-gray-400 font-medium bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-full"><div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> Saving...</div>;
      }
      if (saveStatus === 'saved') {
          return <div className="text-xs flex items-center gap-1.5 text-positive font-medium bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full"><CheckIcon /> Saved</div>;
      }
      if (saveStatus === 'error') {
          return <Button onClick={onSave} variant="danger" size="small"><AlertTriangleIcon /> Save Error</Button>;
      }
      // unsaved
      return <Button onClick={onSave} variant="primary" size="small"><SaveIcon /> Save Changes</Button>;
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 mb-6 rounded-lg">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        
        <div className="flex flex-col items-center lg:items-start">
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <h1 className="text-2xl font-bold text-brand-primary dark:text-brand-light whitespace-nowrap">What's My Credit Worth?</h1>
            <HelpTooltip 
              text="Track your financial health. Click 'Edit Data' to enter info. Nav arrows move through time. AI Recommendations offer insights."
            />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button 
              onClick={onRecommendations} 
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors border border-purple-200"
            >
              <SparklesIcon />
              <span>AI ADVICE</span>
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
                <div className="flex items-center gap-2 border-r pr-4 border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate" title={user.displayName || 'User'}>
                        {user.displayName}
                    </span>
                    <Button onClick={onLogout} variant="secondary" size="small">Logout</Button>
                </div>
            )}
            <Button onClick={onEdit} variant="primary"><EditIcon /> Edit Data</Button>
            <Button onClick={onShare} variant="secondary" size="small"><ShareIcon /></Button>
            <Button onClick={onImportExport} variant="secondary" size="small"><ImportIcon /></Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
