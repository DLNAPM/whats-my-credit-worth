import React from 'react';
import HelpTooltip from './HelpTooltip';

interface MetricProps {
  label: string;
  value: string | number;
  change?: 'positive' | 'negative';
  size?: 'normal' | 'small';
  tooltipText?: string;
  onClick?: () => void;
  clickable?: boolean;
  clickHint?: string;
}

const Metric: React.FC<MetricProps> = ({ 
  label, 
  value, 
  change, 
  size = 'normal', 
  tooltipText,
  onClick,
  clickable,
  clickHint
}) => {
  const isInteractive = Boolean(onClick || clickable);
  const valueColorClass = change === 'positive' ? 'text-positive' : change === 'negative' ? 'text-negative' : '';
  const valueSizeClass = size === 'small' ? 'text-xl' : 'text-3xl';
  const labelSizeClass = size === 'small' ? 'text-xs' : 'text-sm';

  return (
    <div 
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
      className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow transition-all duration-200 relative ${
        isInteractive 
          ? 'cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-brand-primary/40 dark:hover:ring-brand-primary/50 transform hover:-translate-y-0.5 group focus:outline-none focus:ring-2 focus:ring-brand-primary' 
          : ''
      }`}
      title={clickHint || (isInteractive ? `Click to view ${label} calculation image & inputs` : undefined)}
    >
      <div className="flex items-center justify-between gap-1.5 mb-0.5">
        <div className="flex items-center gap-1.5 truncate">
          <h4 className={`${labelSizeClass} text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider truncate`}>{label}</h4>
          {tooltipText && <HelpTooltip text={tooltipText} />}
        </div>
        {isInteractive && (
          <span 
            className="text-[9px] font-bold text-brand-primary/80 group-hover:text-brand-primary bg-brand-primary/10 group-hover:bg-brand-primary/20 dark:bg-brand-primary/20 dark:group-hover:bg-brand-primary/30 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors shrink-0"
            title="View calculation image & formula details"
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Calc</span>
          </span>
        )}
      </div>
      <p className={`${valueSizeClass} font-bold ${valueColorClass}`}>{value}</p>
    </div>
  );
};

export default Metric;
