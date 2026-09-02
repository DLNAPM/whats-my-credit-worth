
import React, { useState } from 'react';
import Button from './ui/Button';
import { DownloadIcon, UploadIcon, InfoIcon, FeatureShieldIcon, DeleteIcon, AlertTriangleIcon, SparklesIcon } from './ui/Icons';
import { useFinancialData } from '../hooks/useFinancialData';
import { useAuth } from '../contexts/AuthContext';
import { buildNextStepsSyncPayload, copyNextStepsPayloadToClipboard, downloadNextStepsPayloadFile } from '../utils/nextStepsSync';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
  onDownload: () => void;
  onShowHelp: () => void;
  onViewPrivacy?: () => void;
  onOpenNextStepsSync?: () => void;
  hasData: boolean;
  currentMonthData?: any;
  currentMonthYear?: string;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({ 
  isOpen, 
  onClose, 
  onUpload, 
  onDownload, 
  onShowHelp, 
  onViewPrivacy, 
  onOpenNextStepsSync,
  hasData,
  currentMonthData,
  currentMonthYear
}) => {
  const { clearCloudData } = useFinancialData();
  const { deleteUserAccount, logout, user, isPremium, cancelSubscription, isSuperUser, accountType, businessName, businessType } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedSync, setCopiedSync] = useState(false);

  const handleQuickCopyNextSteps = async () => {
    if (!currentMonthData) return;
    const payload = buildNextStepsSyncPayload(currentMonthData, {
      accountType: accountType || 'personal',
      businessName: businessName || '',
      businessType: businessType || 'LLC',
      monthYear: currentMonthYear
    });
    const ok = await copyNextStepsPayloadToClipboard(payload);
    if (ok) {
      setCopiedSync(true);
      setTimeout(() => setCopiedSync(false), 2500);
    } else {
      alert("Failed to copy payload to clipboard.");
    }
  };

  const handleQuickDownloadNextSteps = () => {
    if (!currentMonthData) return;
    const payload = buildNextStepsSyncPayload(currentMonthData, {
      accountType: accountType || 'personal',
      businessName: businessName || '',
      businessType: businessType || 'LLC',
      monthYear: currentMonthYear
    });
    downloadNextStepsPayloadFile(payload, `NextSteps-Sync-${accountType || 'personal'}-${currentMonthYear || 'current'}`);
  };

  /**
   * DATA DELETION ENDPOINT DOCUMENTATION:
   * Financial Data Deletion: Logic calls Firebase Firestore `deleteDoc` on the user's specific document.
   * Firestore Data Path (Console URL): https://console.firebase.google.com/u/0/project/whats-my-credit-worth/firestore/data/~2Fusers~2F${user.uid}
   * 
   * Account Deletion: Logic calls Firebase Auth `deleteUser` method.
   * Firebase Auth Console URL: https://console.firebase.google.com/u/0/project/whats-my-credit-worth/authentication/users
   */

  const handleResetData = async () => {
    if (!window.confirm("ARE YOU ABSOLUTELY SURE?\n\nThis will permanently delete all months of your financial history. This cannot be undone unless you have a .json backup file.")) return;
    if (!window.confirm("FINAL CONFIRMATION: Wipe all data but keep my account open?")) return;

    setIsDeleting(true);
    try {
      await clearCloudData();
      alert("All financial data has been wiped. Your account remains active.");
      onClose();
    } catch (err) {
      alert("Failed to reset data. Please check your connection.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("DANGER: DELETE ACCOUNT & ALL DATA?\n\nThis will remove your account and all associated financial records from our servers forever.")) return;
    if (!window.confirm("ABSOLUTELY CERTAIN?\n\nThis is the point of no return. Your account will be closed immediately.")) return;

    setIsDeleting(true);
    try {
      // 1. Wipe Firestore data first
      await clearCloudData();
      // 2. Delete Auth record
      await deleteUserAccount();
      
      alert("Your account and all data have been permanently deleted.");
      window.location.reload(); // Hard reload to clear app state
    } catch (err: any) {
      console.error(err);
      // Re-auth error is handled in the deleteUserAccount function via alert
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelSubscription = async () => {
    if(!window.confirm("Are you sure you want to cancel your Premium Subscription? You will immediately lose access to AI Insights, Simulations, and PDF Reports.")) return;
    
    setIsDeleting(true);
    try {
        await cancelSubscription();
        alert("Subscription cancelled. Your profile has been reverted to Basic.");
        onClose();
    } catch (err) {
        alert("Failed to cancel subscription.");
    } finally {
        setIsDeleting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-fade-in border border-gray-100 dark:border-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Data</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Subscription Section */}
          {isPremium && !isSuperUser && (
             <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800/50">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4" /> Subscription Status
                    </h3>
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 text-[10px] font-bold rounded uppercase">Premium Active</span>
                </div>
                <p className="text-xs text-purple-600/80 dark:text-purple-300/80 mb-3">
                    You have full access to advanced tools.
                </p>
                <Button onClick={handleCancelSubscription} variant="secondary" size="small" className="w-full text-xs" disabled={isDeleting}>
                    Cancel Premium Subscription
                </Button>
             </div>
          )}

          {/* Information Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 flex gap-3">
            <InfoIcon />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Exporting your data creates a local backup. Use this to transfer your financial history between devices or if cloud sync is unavailable.
            </p>
          </div>

          {/* 1-Click Sync to Next Steps Section */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-blue-50/80 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                    Next Steps 1-Click Sync
                    <span className="px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 text-[9px] font-extrabold uppercase rounded">v2.0</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Instant debt transfer & diff matching for Next Steps
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={handleQuickCopyNextSteps}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                  copiedSync
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                }`}
              >
                {copiedSync ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Payload Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Sync Payload
                  </>
                )}
              </button>

              {onOpenNextStepsSync && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenNextStepsSync();
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                >
                  Review Diff
                </button>
              )}

              <button
                onClick={handleQuickDownloadNextSteps}
                className="px-2.5 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800 transition-colors"
                title="Download JSON File"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Core Actions */}
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Restore Session</h3>
                <p className="text-[10px] text-gray-500">Upload a .json backup file.</p>
              </div>
              <Button onClick={onUpload} size="small" disabled={isDeleting}><UploadIcon /> Import</Button>
            </div>

            <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Backup Data</h3>
                <p className="text-[10px] text-gray-500">Save current progress locally.</p>
              </div>
              <Button onClick={onDownload} variant="secondary" size="small" disabled={!hasData || isDeleting}>
                <DownloadIcon /> {hasData ? 'Export' : 'No Data'}
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-red-100 dark:border-red-900/30">
            <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangleIcon className="w-4 h-4" /> Danger Zone
            </h3>
            
            <div className="space-y-3 bg-red-50/50 dark:bg-red-900/5 p-4 rounded-2xl border border-red-100 dark:border-red-900/20">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Reset Financial Data</p>
                  <p className="text-[10px] text-gray-500">Delete all history but keep your account.</p>
                </div>
                <button 
                  onClick={handleResetData}
                  disabled={isDeleting}
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 text-red-600 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Reset Records
                </button>
              </div>

              <div className="h-px bg-red-100 dark:bg-red-900/20"></div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Delete Account Forever</p>
                  <p className="text-[10px] text-gray-500">Permanently wipe account and all data.</p>
                </div>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <DeleteIcon className="w-3 h-3" /> Delete All
                </button>
              </div>
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
                  <FeatureShieldIcon /> Privacy Policy
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
