import React from 'react';
import Button from './ui/Button';
import { DownloadIcon, UploadIcon, InfoIcon } from './ui/Icons';

interface UploadHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadClick: () => void;
  exportTemplateData: () => void;
}

const exampleJson = `{
  "2023-10": { ...monthly data... },
  "2023-11": {
    "income": {
      "jobs": [
        { "id": "...", "name": "Job 1", "amount": 2000, "frequency": "bi-weekly" }
      ]
    },
    "creditScores": {
      "experian": { "score2": 750, "score8": 760 },
      ...
    },
    "creditCards": [
      { "id": "...", "name": "AMEX", "balance": 500, "limit": 10000 }
    ],
    "loans": [
      { "id": "...", "name": "Mortgage", "balance": 250000, "limit": 300000 }
    ],
    "assets": [
      { "id": "...", "name": "401k", "value": 50000 }
    ],
    "monthlyBills": [
      { "id": "...", "name": "Electric", "amount": 150 }
    ]
  }
}`;

const UploadHelpModal: React.FC<UploadHelpModalProps> = ({ isOpen, onClose, onUploadClick, exportTemplateData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sticky top-0 bg-white dark:bg-gray-900 border-b z-10 flex items-center gap-2">
            <InfoIcon />
            <h2 className="text-2xl font-bold">Uploading Your Data</h2>
        </div>
        <div className="p-6 space-y-4">
            <p className="text-gray-700 dark:text-gray-300">To upload your financial data, you'll need a JSON file. The file should contain an object where each key is a month in <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-sm">"YYYY-MM"</code> format, and the value is your financial data for that month.</p>
            
            <h3 className="text-lg font-semibold">Required Structure</h3>
            <p className="text-gray-700 dark:text-gray-300">Each month's data object must include these main keys: <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-sm">income</code>, <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-sm">creditScores</code>, <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-sm">creditCards</code>, <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-sm">loans</code>, <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-sm">assets</code>, and <code className="bg-gray-200 dark:bg-gray-700 p-1 rounded text-sm">monthlyBills</code>.</p>
            
            <h3 className="text-lg font-semibold">Example Snippet</h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm overflow-x-auto">
                <code>
                    {exampleJson}
                </code>
            </pre>

            <div className="border-t pt-4">
                 <p className="text-gray-700 dark:text-gray-300">The easiest way to get started or to ensure your format is correct is to download a template file. You can also download your existing data from the main header to use as a base.</p>
            </div>
        </div>
        <div className="p-6 flex justify-between gap-4 sticky bottom-0 bg-white dark:bg-gray-900 border-t">
            <Button onClick={exportTemplateData} variant="secondary">
                <DownloadIcon />
                Download Template
            </Button>
            <div className="flex gap-4">
                <Button onClick={onClose} variant="secondary">Cancel</Button>
                <Button onClick={() => { onUploadClick(); onClose(); }}>
                    <UploadIcon />
                    Choose File to Upload
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UploadHelpModal;
