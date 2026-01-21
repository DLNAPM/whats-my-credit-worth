
import React, { useState } from 'react';
import Button from './ui/Button';
import { DownloadIcon, UploadIcon, InfoIcon, FeatureShieldIcon, DeleteIcon, AlertTriangleIcon } from './ui/Icons';
import { useFinancialData } from '../hooks/useFinancialData';
import { useAuth } from '../contexts/AuthContext';

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
  const { clearCloudData } = useFinancialData();
  const { deleteUserAccount, logout, user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-fade-in border border-gray-100 dark:border-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Data</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Information Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 flex gap-3">
            <InfoIcon />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Exporting your data creates a local backup. Use this to transfer your financial history between devices or if cloud sync is unavailable.
            </p>
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
