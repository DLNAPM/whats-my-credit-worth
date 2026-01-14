
import React from 'react';
import Button from './Button';
import { PlayCircleIcon, MaximizeIcon } from './Icons';

interface PromotionalVideoProps {
  isOpen: boolean;
  onClose: () => void;
}

const PromotionalVideo: React.FC<PromotionalVideoProps> = ({ isOpen, onClose }) => {
  const youtubeId = 'pSEd4CpsvAU';
  const embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${youtubeId}`;

  const handleEnlarge = () => {
    window.open(watchUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border border-brand-primary/20">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-brand-primary text-white">
          <div className="flex items-center gap-3">
            <PlayCircleIcon />
            <h2 className="text-xl font-bold">WMCW Promotional Tour</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/70 hover:text-white transition-colors p-2 text-2xl font-light"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Video Content Area */}
        <div className="aspect-video bg-black relative">
          <iframe
            className="w-full h-full"
            src={embedUrl}
            title="WMCW Promotional Tour"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
             Learn how to master your finances in 90 seconds.
          </div>
          <div className="flex gap-3">
            <Button onClick={handleEnlarge} variant="secondary">
              <MaximizeIcon /> View on YouTube
            </Button>
            <Button onClick={onClose} variant="secondary">
              Close Tour
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionalVideo;
