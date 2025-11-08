import React from 'react';
import HelpTooltip from './HelpTooltip';

interface MetricProps {
  label: string;
  value: string | number;
  change?: 'positive' | 'negative';
  size?: 'normal' | 'small';
  tooltipText?: string;
}

const Metric: React.FC<MetricProps> = ({ label, value, change, size = 'normal', tooltipText }) => {
  const valueColorClass = change === 'positive' ? 'text-positive' : change === 'negative' ? 'text-negative' : '';
  const valueSizeClass = size === 'small' ? 'text-xl' : 'text-3xl';
  const labelSizeClass = size === 'small' ? 'text-xs' : 'text-sm';

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div className="flex items-center gap-1.5">
        <h4 className={`${labelSizeClass} text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider`}>{label}</h4>
        {tooltipText && <HelpTooltip text={tooltipText} />}
      </div>
      <p className={`${valueSizeClass} font-bold ${valueColorClass}`}>{value}</p>
    </div>
  );
};

export default Metric;
