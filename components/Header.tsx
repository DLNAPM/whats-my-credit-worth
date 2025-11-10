import React from 'react';
import type { View } from '../types';
import { formatMonthYear } from '../utils/helpers';
import Button from './ui/Button';
import { ChevronLeftIcon, ChevronRightIcon, EditIcon, ImportIcon, ShareIcon } from './ui/Icons';
import HelpTooltip from './ui/HelpTooltip';

interface HeaderProps {
  currentMonthYear: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onEdit: () => void;
  onShare: () => void;
  onImportExport: () => void;
  view: View;
  setView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentMonthYear, 
  onPreviousMonth, 
  onNextMonth,
  onEdit,
  onShare,
  onImportExport,
  view,
  setView
}) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 mb-6 rounded-lg">
      <div className="container mx-auto flex flex-wrap justify-between items-center gap-4">
        
        <div className="flex-1 min-w-[200px] flex items-center gap-2">
          <h1 className="text-2xl font-bold text-brand-primary dark:text-brand-light">What's My Credit Worth?</h1>
          <HelpTooltip 
            text="Welcome to your personal finance dashboard! Use this app to track your financial health. Click 'Edit Data' to enter your monthly income, assets, and liabilities. Use the arrows to navigate your history, 'Import/Export' to save or load data, and 'Share' to create a read-only snapshot. The 'Reports' tab compares your progress over time."
          />
        </div>
        
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
                  ? 'bg-brand-primary text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-brand-light hover:text-brand-primary'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={onEdit} variant="primary"><EditIcon /> Edit Data</Button>
            <Button onClick={onImportExport} variant="secondary"><ImportIcon /> Import/Export</Button>
            <Button onClick={onShare} variant="secondary"><ShareIcon /> Share</Button>
        </div>
      </div>
    </header>
  );
};

export default Header;