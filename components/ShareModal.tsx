
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { MonthlyData } from '../types';
import { calculateNetWorth, formatCurrency, calculateMonthlyIncome, formatMonthYear } from '../utils/helpers';
import Button from './ui/Button';
import { CopyIcon, LinkIcon, EmailIcon, DownloadIcon } from './ui/Icons';
import Card from './ui/Card';
import Snapshot from './Snapshot';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: MonthlyData;
  monthYear: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, data, monthYear }) => {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);


  if (!isOpen || !data) return null;

  const netWorth = calculateNetWorth(data);
  const monthlyIncome = calculateMonthlyIncome(data.income.jobs);

  const summaryText = `
My Financial Snapshot for ${formatMonthYear(monthYear)}:
- Net Worth: ${formatCurrency(netWorth)}
- Monthly Income: ${formatCurrency(monthlyIncome)}
- Total Assets: ${formatCurrency(data.assets.reduce((sum, a) => sum + a.value, 0))}
- Total Debt: ${formatCurrency(data.creditCards.reduce((s, c) => s + c.balance, 0) + data.loans.reduce((s, l) => s + l.balance, 0))}
  `.trim();

  const handleCopyText = () => {
    navigator.clipboard.writeText(summaryText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };
  
  const generateLink = () => {
    if (!data) return;
    const payload = {
      monthYear,
      data,
    };
    try {
      const jsonString = JSON.stringify(payload);
      
      const strToUrlSafeBase64 = (str: string): string => {
        const uint8Array = new TextEncoder().encode(str);
        let binaryString = '';
        uint8Array.forEach((byte) => {
            binaryString += String.fromCharCode(byte);
        });
        const base64String = btoa(binaryString);
        return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      };
      
      const encodedData = strToUrlSafeBase64(jsonString);
      const link = `${window.location.origin}/snapshot/${encodedData}`;
      setShareableLink(link);
    } catch (error) {
        console.error("Error generating share link:", error);
        alert("Could not generate share link. The data might be too large.");
    }
  };
  
  const handleCopyLink = () => {
      if (!shareableLink) return;
      navigator.clipboard.writeText(shareableLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
  }

  const handleDownloadPdf = async () => {
    if (!data) return;
    setIsGeneratingPdf(true);

    const snapshotContainer = document.createElement('div');
    snapshotContainer.style.width = '1280px';
    snapshotContainer.style.position = 'absolute';
    snapshotContainer.style.left = '-9999px';
    document.body.appendChild(snapshotContainer);

    const root = ReactDOM.createRoot(snapshotContainer);
    const snapshotData = { monthYear, data };
    root.render(<Snapshot snapshotData={snapshotData} />);

    // Wait for rendering and styles
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        const canvas = await html2canvas(snapshotContainer, { 
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`financial-snapshot-${monthYear}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Sorry, there was an error creating the PDF.");
    } finally {
        root.unmount();
        document.body.removeChild(snapshotContainer);
        setIsGeneratingPdf(false);
    }
  };

  const mailtoLink = shareableLink
    ? `mailto:?subject=${encodeURIComponent(`Financial Snapshot for ${formatMonthYear(monthYear)}`)}&body=${encodeURIComponent(`${summaryText}\n\nView the full snapshot here:\n${shareableLink}`)}`
    : '#';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Share Your Financial Snapshot</h2>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
              <h3 className="text-lg font-semibold mb-2">Share as Text</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Copy a text summary of your financial data for {formatMonthYear(monthYear)} to your clipboard.</p>
              <Card title="Summary">
                <pre className="whitespace-pre-wrap p-4 bg-gray-100 dark:bg-gray-800 rounded text-sm">{summaryText}</pre>
              </Card>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleCopyText}>
                    <CopyIcon />
                    {copiedText ? 'Copied!' : 'Copy Text'}
                </Button>
              </div>
          </div>

           <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-2">Share via Link</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Generate a private link to a read-only version of this snapshot. Anyone with the link will be able to view it.
              </p>
              {shareableLink ? (
                <div className="space-y-3">
                  <input 
                    type="text" 
                    readOnly 
                    value={shareableLink} 
                    className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    onFocus={(e) => e.target.select()}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleCopyLink}><CopyIcon /> {copiedLink ? 'Copied!' : 'Copy Link'}</Button>
                    <a 
                      href={mailtoLink}
                      className="font-bold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-2 justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100 focus:ring-gray-400 py-2 px-4 text-base"
                    >
                        <EmailIcon /> Share via Email
                    </a>
                  </div>
                </div>
              ) : (
                <Button onClick={generateLink}><LinkIcon /> Create Shareable Link</Button>
              )}
            </div>
            
            <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-2">Download as PDF</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Download a high-quality PDF of the snapshot for printing or offline sharing.
                </p>
                <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                    <DownloadIcon />
                    {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
                </Button>
            </div>

        </div>
        <div className="p-6 flex justify-end gap-4 bg-gray-50 dark:bg-gray-800/50 border-t">
          <Button onClick={onClose} variant="secondary">Close</Button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;