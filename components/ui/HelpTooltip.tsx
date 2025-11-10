import React from 'react';
import { HelpIcon } from './Icons';

interface HelpTooltipProps {
  text: string;
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ text }) => {
  return (
    <div className="relative flex items-center group">
      <HelpIcon />
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 text-sm font-normal text-white bg-gray-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 dark:bg-gray-800">
        {text}
        <svg className="absolute text-gray-700 dark:text-gray-800 h-2 w-full left-0 bottom-full" x="0px" y="0px" viewBox="0 0 255 255">
          <polygon className="fill-current" points="0,255 127.5,0 255,255"/>
        </svg>
      </div>
    </div>
  );
};

export default HelpTooltip;