import React from 'react';
import Button from './ui/Button';
import { DownloadIcon, UploadIcon } from './ui/Icons';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
  onDownload: () => void;
  onShowHelp: () => void;
  hasData: boolean;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose, onUpload, onDownload, onShowHelp, hasData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">Import or Export Data</h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Choose an option to either upload your data from a file or download your current data for backup.
            </p>
            <div className="flex flex-col space-y-4">
              <Button onClick={onUpload}>
                <UploadIcon />
                Upload Data File
              </Button>
              <Button onClick={onDownload} variant="secondary" disabled={!hasData}>
                <DownloadIcon />
                Download Data File
              </Button>
              {!hasData && <p className="text-sm text-center text-gray-500 dark:text-gray-400">Download is disabled as there is no data to export.</p>}
            </div>
          </div>
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={onShowHelp} className="text-sm text-brand-primary hover:underline">
              Need help with the file format?
            </button>
          </div>
        </div>
        <div className="p-6 flex justify-end gap-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} variant="secondary">Close</Button>
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;