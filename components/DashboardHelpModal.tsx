
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
          {/* APP OVERVIEW SECTION */}
          <section className="space-y-6">
            <div className="bg-gradient-to-br from-brand-primary/10 via-blue-50/50 to-indigo-50/30 dark:from-gray-800 dark:via-gray-800/80 dark:to-gray-800/40 p-6 rounded-2xl border border-brand-primary/20 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 bg-brand-primary text-white text-[11px] font-black uppercase rounded-lg tracking-wide">
                  About WMCW
                </span>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                  What's My Credit Worth
                </h3>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                <strong>What's My Credit Worth (WMCW)</strong> is an all-in-one personal financial intelligence platform designed to give you total clarity over your credit health, net worth, cash flow, and debt payoff strategies.
              </p>
            </div>

            {/* 3 Core Overview Cards: What is, How to use, Who is it for */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: What is it */}
              <div className="bg-gray-50 dark:bg-gray-800/60 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-brand-primary dark:text-blue-400 flex items-center justify-center font-bold text-lg mb-3">
                    💡
                  </div>
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mb-2">
                    What is WMCW?
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    A financial freedom manager combining debt tracking, credit simulation, cash flow auditing, and live market stock tickers into one intuitive dashboard.
                  </p>
                </div>
              </div>

              {/* Card 2: How to use it */}
              <div className="bg-gray-50 dark:bg-gray-800/60 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg mb-3">
                    🚀
                  </div>
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mb-2">
                    How to Use It?
                  </h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 list-disc list-inside">
                    <li>Log monthly income & liabilities</li>
                    <li>Follow Financial Freedom steps</li>
                    <li>Simulate credit score payoff scenarios</li>
                    <li>Customize top stock market tickers</li>
                  </ul>
                </div>
              </div>

              {/* Card 3: Who is it for */}
              <div className="bg-gray-50 dark:bg-gray-800/60 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg mb-3">
                    🎯
                  </div>
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mb-2">
                    Who is it For?
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Anyone aiming to improve their credit rating, eliminate high-interest debt, build generational wealth, or monitor stock investments in real-time.
                  </p>
                </div>
              </div>
            </div>
          </section>

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
            <AlertTriangleIcon className="w-8 h-8 text-red-500 shrink-0" />
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
