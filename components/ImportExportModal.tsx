
import React from 'react';
import Button from './ui/Button';
import { DownloadIcon, UploadIcon, InfoIcon, FeatureShieldIcon } from './ui/Icons';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
  onDownload: () => void;
  onShowHelp: () => void;
  onViewPrivacy?: () => void;
  hasData: boolean;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose, onUpload, onDownload, onShowHelp, onViewPrivacy, hasData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-fade-in border border-gray-100 dark:border-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Data</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 flex gap-3">
            <InfoIcon />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Exporting your data creates a local backup. Use this to transfer your financial history between devices or if cloud sync is unavailable.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Restore Session</h3>
                <p className="text-[10px] text-gray-500">Upload a .json backup file.</p>
              </div>
              <Button onClick={onUpload} size="small"><UploadIcon /> Import</Button>
            </div>

            <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Backup Data</h3>
                <p className="text-[10px] text-gray-500">Save current progress locally.</p>
              </div>
              <Button onClick={onDownload} variant="secondary" size="small" disabled={!hasData}>
                <DownloadIcon /> {hasData ? 'Export' : 'No Data'}
              </Button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="text-center">
              <button onClick={onShowHelp} className="text-xs text-gray-500 hover:text-brand-primary underline transition-colors">
                Help with file formats
              </button>
            </div>
            
            {onViewPrivacy && (
              <div className="flex justify-center border-t border-gray-100 dark:border-gray-800 pt-4">
                <button 
                  onClick={onViewPrivacy}
                  className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-brand-primary transition-colors"
                >
                  <FeatureShieldIcon /> Review Privacy & Security Policy
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 flex justify-end bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <Button onClick={onClose} variant="secondary">Close</Button>
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;
