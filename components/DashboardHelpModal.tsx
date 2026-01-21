
import React from 'react';
import Button from './ui/Button';
import { HelpCircleIcon, InfoIcon, AlertTriangleIcon, ImportIcon, SupportIcon } from './ui/Icons';

interface DashboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenManageData: () => void;
  onOpenSupport: () => void;
}

const DashboardHelpModal: React.FC<DashboardHelpModalProps> = ({ isOpen, onClose, onOpenManageData, onOpenSupport }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-fade-in border border-gray-100 dark:border-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-brand-primary text-white">
          <div className="flex items-center gap-3">
            <HelpCircleIcon />
            <h2 className="text-xl font-bold">WMCW Help Center</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-2 text-2xl font-light">✕</button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
          {/* Section: Data Management */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-brand-primary">
              <InfoIcon /> Data Management & Privacy
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              You have full control over your financial records. Whether you want to start fresh or leave the platform entirely, we provide self-service tools to handle your request instantly.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">How to Reset or Delete:</h4>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-brand-light text-brand-primary flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <p className="text-sm">Click the <strong><ImportIcon className="w-4 h-4 inline mx-1" /> Manage Data</strong> icon in the top right header.</p>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-brand-light text-brand-primary flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <p className="text-sm">Scroll to the bottom of the modal to find the <strong>"Danger Zone"</strong>.</p>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-brand-light text-brand-primary flex items-center justify-center font-bold text-xs shrink-0">3</div>
                  <div>
                    <p className="text-sm font-bold">Choose your action:</p>
                    <ul className="mt-2 space-y-2 text-xs text-gray-500">
                      <li>• <strong>Reset Records:</strong> Wipes all financial history but keeps your account and settings.</li>
                      <li>• <strong>Delete All:</strong> Permanently destroys your account and all data across our servers.</li>
                    </ul>
                  </div>
                </li>
              </ol>
            </div>
          </section>

          {/* Section: Contact Support */}
          <section className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
             <h3 className="text-lg font-bold flex items-center gap-2 text-brand-primary">
              <SupportIcon /> Need Human Help?
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/20 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Having trouble with your account or found an issue? Our support team is ready to assist you directly.
                  </p>
                </div>
                <Button onClick={() => { onClose(); onOpenSupport(); }} className="whitespace-nowrap">
                   <SupportIcon /> Contact Support
                </Button>
            </div>
          </section>

          {/* Section: Security */}
          <section className="p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 flex gap-4">
            <AlertTriangleIcon className="text-red-500 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-red-800 dark:text-red-400">Account Deletion Security</h4>
              <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-1">
                For your protection, deleting an account requires a recent login. If you haven't logged in recently, the system will ask you to re-authenticate before performing the final wipe.
              </p>
            </div>
          </section>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <button 
            onClick={() => { onClose(); onOpenManageData(); }} 
            className="text-brand-primary font-bold text-sm hover:underline flex items-center gap-2"
          >
            Go to Manage Data <ImportIcon className="w-4 h-4" />
          </button>
          <Button onClick={onClose} variant="secondary">Close Help</Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHelpModal;
