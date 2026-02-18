
import React from 'react';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { SparklesIcon, CheckIcon, FeatureShieldIcon, SimulationIcon, DownloadIcon } from './ui/Icons';

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Optional prop to pass the Stripe link dynamically, though typically hardcoded in file
  stripeLink?: string;
}

const MembershipModal: React.FC<MembershipModalProps> = ({ isOpen, onClose }) => {
  const { upgradeToPremium } = useAuth();

  if (!isOpen) return null;

  // IMPORTANT: Replace this URL with your actual Stripe Payment Link (from Stripe Dashboard > Payment Links)
  // Ensure the Payment Link is configured to redirect to: https://[your-app-url]/?payment_success=true
  const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_dRm14pcx782vgIT42T3ZK00";

  const handleSubscribe = () => {
    // Check if the link is still the placeholder
    if (STRIPE_PAYMENT_LINK.includes("REPLACE_WITH_YOUR_STRIPE_LINK")) {
        // Fallback for development/demo: Simulate the payment flow
        if(window.confirm("Developer Mode: The Stripe Link is not configured.\n\nClick OK to simulate a successful payment upgrade.")) {
            upgradeToPremium();
            onClose();
        }
    } else {
        // Production: Redirect to Stripe
        window.location.href = STRIPE_PAYMENT_LINK;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-brand-primary/20">
        <div className="p-8 text-center bg-gradient-to-br from-brand-primary to-brand-secondary text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Upgrade to Premium</h2>
          <p className="text-blue-100">Unlock advanced financial simulations and AI insights</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            {[
              { icon: <SimulationIcon />, text: 'Run Simulations & Predict Scores*' },
              { icon: <SparklesIcon />, text: 'AI Deep Dive & Advisor Insights*' },
              { icon: <DownloadIcon />, text: 'Export PDF Reports & High-Res Printing*' },
              { icon: <FeatureShieldIcon />, text: 'Publish Private Live Snapshots*' }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <div className="text-brand-primary">{feature.icon}</div>
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-1">Limited Time Offer</p>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-4xl font-extrabold text-gray-900 dark:text-white">$11.11</span>
              <span className="text-gray-500 font-medium">/quarterly</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Includes an <strong>11-Day Free Trial</strong>. Cancel anytime.</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handleSubscribe} className="py-4 text-lg bg-brand-primary hover:bg-brand-secondary shadow-lg">
              Subscribe Now
            </Button>
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Maybe later
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 text-center border-t border-gray-100 dark:border-gray-700">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Secure Payment Processed by Stripe</p>
        </div>
      </div>
    </div>
  );
};

export default MembershipModal;
