
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import html2canvas from 'html2canvas';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { MonthlyData } from '../types';
import { calculateNetWorth, formatCurrency, calculateMonthlyIncome, formatMonthYear } from '../utils/helpers';
import Button from './ui/Button';
import { CopyIcon, LinkIcon, EmailIcon, DownloadIcon, InfoIcon, CheckIcon, SmsIcon, NativeShareIcon } from './ui/Icons';
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  if (!isOpen || !data) return null;

  const netWorth = calculateNetWorth(data);
  const monthlyIncome = calculateMonthlyIncome(data.income.jobs);

  const summaryText = `
My WMCW Financial Snapshot (${formatMonthYear(monthYear)}):
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
  
  const generateLink = async () => {
    if (!data || isGenerating) return;
    setIsGenerating(true);

    try {
      /**
       * SHORT URL LOGIC:
       * We store the snapshot in Firestore and use the Document ID as the link token.
       */
      const docRef = await addDoc(collection(db, 'shared_snapshots'), {
        monthYear,
        data,
        createdAt: serverTimestamp(),
        summary: {
            netWorth,
            monthlyIncome
        }
      });

      // UPDATED: Added /#/ to make it a hash-based route. 
      // This is crucial for static hosting (Render.com) to prevent 404s on direct navigation.
      const link = `${window.location.origin}/#/snapshot/${docRef.id}`;
      setShareableLink(link);
    } catch (error: any) {
        console.error("CRITICAL: Error generating share link:", error);
        if (error.code === 'permission-denied') {
          alert("Snapshot failed to publish. Action Required: Please update your Firestore Security Rules in the Firebase Console to allow 'create' on the 'shared_snapshots' collection.");
        } else {
          alert(`Failed to publish snapshot. Error: ${error.message || "Unknown connectivity issue"}`);
        }
    } finally {
        setIsGenerating(false);
    }
  };
  
  const handleCopyLink = () => {
      if (!shareableLink) return;
      navigator.clipboard.writeText(shareableLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
  }

  const handleNativeShare = async () => {
    if (!shareableLink) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `WMCW Snapshot - ${formatMonthYear(monthYear)}`,
          text: `Check out my financial snapshot for ${formatMonthYear(monthYear)}. Net Worth: ${formatCurrency(netWorth)}`,
          url: shareableLink,
        });
      } catch (err) {
        console.log('Share cancelled or failed', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleEmailShare = () => {
    if (!shareableLink) return;
    
    const subject = encodeURIComponent(`Financial Snapshot for ${formatMonthYear(monthYear)}`);
    const body = encodeURIComponent(
      `Check out my WMCW Financial Snapshot for ${formatMonthYear(monthYear)}:\n\n` +
      `${summaryText}\n\n` +
      `View the full interactive report here:\n${shareableLink}`
    );
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleSmsShare = () => {
    if (!shareableLink) return;
    const smsBody = `Check out my WMCW Financial Snapshot for ${formatMonthYear(monthYear)}: ${shareableLink}`;
    window.location.href = `sms:?body=${encodeURIComponent(smsBody)}`;
  };

  const handleDownloadImage = async () => {
    if (!data) return;
    setIsGeneratingImage(true);

    const snapshotContainer = document.createElement('div');
    snapshotContainer.style.width = '1280px';
    snapshotContainer.style.position = 'absolute';
    snapshotContainer.style.left = '-9999px';
    document.body.appendChild(snapshotContainer);

    const root = ReactDOM.createRoot(snapshotContainer);
    const snapshotData = { monthYear, data };
    root.render(<Snapshot snapshotData={snapshotData} />);

    // Wait for rendering and styles
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        const canvas = await html2canvas(snapshotContainer, { 
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `financial-snapshot-${monthYear}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Error generating JPEG:", error);
        alert("Sorry, there was an error creating the image.");
    } finally {
        root.unmount();
        document.body.removeChild(snapshotContainer);
        setIsGeneratingImage(false);
    }
  };

  const canShareNative = !!navigator.share;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-fade-in border border-gray-100 dark:border-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Share & Publish Report</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Export your data for {formatMonthYear(monthYear)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-8 max-h-[75vh] overflow-y-auto">
          {/* Publishing Section */}
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <LinkIcon /> Publish Live Snapshot
                </h3>
                {shareableLink && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                    ● Live
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Publishing creates a unique, <span className="font-bold text-purple-600">Short URL</span> for your report. Send this link to anyone via text or email.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 flex gap-3">
                <div className="text-blue-500 mt-0.5"><InfoIcon /></div>
                <div>
                   <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-tighter">Privacy Guarantee</p>
                   <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-1 leading-relaxed">
                     Sharing <span className="font-bold">does NOT</span> expose passwords or account numbers. It only displays the summary data you see in the snapshot.
                   </p>
                </div>
              </div>

              {shareableLink ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="relative">
                    <input 
                      type="text" 
                      readOnly 
                      value={shareableLink} 
                      className="w-full p-3 pr-12 border rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm font-mono text-brand-primary"
                      onFocus={(e) => e.target.select()}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-positive">
                       <CheckIcon />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button onClick={handleCopyLink} className="bg-brand-primary hover:bg-brand-secondary text-white border-none flex-1">
                      <CopyIcon /> {copiedLink ? 'Link Copied!' : 'Copy Short URL'}
                    </Button>
                    
                    {canShareNative ? (
                      <Button onClick={handleNativeShare} className="bg-brand-accent hover:bg-brand-secondary text-white border-none flex-1">
                        <NativeShareIcon /> Send to App
                      </Button>
                    ) : (
                      <Button onClick={handleSmsShare} className="bg-green-600 hover:bg-green-700 text-white border-none flex-1">
                        <SmsIcon /> Send via Text
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={handleEmailShare}
                      className="flex-1 font-bold rounded-md transition-colors bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-700 py-2.5 px-6 text-sm"
                    >
                        <EmailIcon /> Email Snapshot
                    </Button>
                    {canShareNative && (
                      <Button onClick={handleSmsShare} className="bg-green-500 hover:bg-green-600 text-white border-none px-4" title="Send via SMS">
                        <SmsIcon />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Button 
                    onClick={generateLink} 
                    disabled={isGenerating}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-brand-primary hover:from-purple-700 hover:to-brand-secondary text-white border-none shadow-lg"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Publishing Snapshot...
                    </div>
                  ) : (
                    <><LinkIcon /> Generate & Publish Snapshot</>
                  )}
                </Button>
              )}
            </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CopyIcon /> Quick Summary
              </h3>
              <Card title="Dashboard Text" className="bg-gray-50 dark:bg-gray-800/50">
                <pre className="whitespace-pre-wrap p-4 text-xs font-mono text-gray-700 dark:text-gray-300 leading-relaxed">{summaryText}</pre>
              </Card>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleCopyText} variant="secondary">
                    <CopyIcon />
                    {copiedText ? 'Summary Copied!' : 'Copy Text Summary'}
                </Button>
              </div>
          </div>
            
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <DownloadIcon /> Export for Print
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Download a high-resolution JPEG of the dashboard. Perfect for attachments or printing.
                </p>
                <Button onClick={handleDownloadImage} disabled={isGeneratingImage} variant="secondary" className="w-full py-3">
                    {isGeneratingImage ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        Generating Image...
                      </span>
                    ) : (
                      <><DownloadIcon /> Download JPEG Image</>
                    )}
                </Button>
            </div>

        </div>
        <div className="p-6 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <Button onClick={onClose} variant="secondary">Dismiss</Button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
