
import React from 'react';
import { ChevronLeftIcon, InfoIcon, CheckIcon, FeatureShieldIcon, ImportIcon } from './ui/Icons';
import Button from './ui/Button';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-brand-primary hover:text-brand-secondary font-bold mb-8 transition-colors"
        >
          <ChevronLeftIcon /> Back to Application
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="bg-brand-primary p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Privacy & Security Policy</h1>
            <p className="text-brand-light text-sm">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div className="p-8 md:p-12 space-y-10 text-gray-700 dark:text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <InfoIcon /> Introduction
              </h2>
              <p>
                At <strong>What's My Credit Worth (WMCW)</strong>, we take your financial privacy seriously. This policy outlines how we handle your sensitive user data, device information, and financial records to provide transparency and security.
              </p>
            </section>

            <section className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Core Principles</h2>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="mt-1 text-brand-primary"><CheckIcon /></div>
                  <p><strong>Transparency:</strong> We tell you exactly what data we collect and why.</p>
                </li>
                <li className="flex gap-3">
                  <div className="mt-1 text-brand-primary"><CheckIcon /></div>
                  <p><strong>Control:</strong> You own your data. You can export or delete it at any time.</p>
                </li>
                <li className="flex gap-3">
                  <div className="mt-1 text-brand-primary"><CheckIcon /></div>
                  <p><strong>Security:</strong> We use industry-standard encryption to protect your records.</p>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Data Collection & Authentication</h2>
              <p className="mb-4">
                WMCW uses <strong>Firebase Authentication</strong> to manage user identities securely.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Google Sign-In:</strong> When you use Google to sign in, we receive your name and email address to create your private account.</li>
                <li><strong>Guest Mode:</strong> Temporary session data is stored locally on your device and is not uploaded to our servers unless you convert to a permanent account.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. Financial Data Storage</h2>
              <p className="mb-4">
                The financial metrics you enter (income, credit scores, assets, liabilities) are stored in <strong>Google Firebase Firestore</strong>.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm border border-blue-100 dark:border-blue-800 flex gap-3">
                <div className="text-blue-600"><InfoIcon /></div>
                <p>
                  <strong>Access Control:</strong> Your data is protected by strict server-side rules. Only you, as the authenticated owner of the account, can read or write your specific financial records.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. Data Usage</h2>
              <p>
                We use your data solely for the following purposes:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Calculating your Net Worth and Debt-to-Income ratios.</li>
                <li>Generating visual growth charts for your personal review.</li>
                <li>Providing AI-driven financial recommendations via the Gemini API (only aggregate numbers are sent to the AI; personal identifiers are never shared).</li>
              </ul>
              <p className="mt-4 font-bold text-brand-primary">
                We NEVER sell your data to third-party advertisers or credit bureaus.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Your Rights & Data Deletion</h2>
              <p className="mb-4">
                You maintain complete authority over your information. You can request a full account wipe or a data reset at any time through our self-service tools:
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li><strong>Export:</strong> Use the "Manage Data" feature to download your entire history in JSON format.</li>
                <li><strong>Self-Service Deletion:</strong> 
                   <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                     <p className="text-xs font-bold text-brand-primary mb-1 uppercase tracking-tight">Location of controls:</p>
                     <p className="text-sm">Logged-in Dashboard -> Header -> <ImportIcon className="w-4 h-4 inline mx-1" /> Manage Data -> Danger Zone</p>
                   </div>
                </li>
                <li><strong>Hard Deletion:</strong> Using "Delete All" in the Danger Zone permanently destructs your Auth record and Firestore document. This is immediate and irreversible.</li>
              </ul>
            </section>

            <div className="pt-8 border-t border-gray-100 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 mb-6">
                By using "What's My Credit Worth", you agree to the terms outlined in this Privacy Policy.
              </p>
              <Button onClick={onBack} variant="primary" className="mx-auto">
                Accept & Return
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
