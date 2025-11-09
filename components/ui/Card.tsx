import React from 'react';

interface CardProps {
  title: React.ReactNode;
  children: React.ReactNode;
  footerText?: string;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, footerText, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {typeof title === 'string' ? (
          <h3 className="text-lg font-semibold text-brand-primary dark:text-brand-light">{title}</h3>
        ) : (
          title
        )}
      </div>
      <div className="p-4">
        {children}
      </div>
      {footerText && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 font-medium">
          {footerText}
        </div>
      )}
    </div>
  );
};

export default Card;
