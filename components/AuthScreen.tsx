
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HelpCircleIcon, PlayCircleIcon, SparklesIcon, FeatureShieldIcon, DeleteIcon, AlertTriangleIcon, InfoIcon } from './ui/Icons';
import PromotionalVideo from './ui/PromotionalVideo';

const GoogleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.641-3.219-11.334-7.618l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,34.019,44,28.891,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const ChartIcon = () => (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const TrendIcon = () => (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

interface AuthScreenProps {
  onViewPrivacy: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onViewPrivacy }) => {
  const { loginWithGoogle, loginAsGuest, isStandalone } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAndroidFixVisible, setIsAndroidFixVisible] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleGoogleLogin = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setAuthError(null);
    setIsAndroidFixVisible(false);

    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Login Error Handler:", err.message);
      
      if (err.message === "ANDROID_AUTH_STATE_ERROR") {
        setAuthError("Android Security Warning: Your browser's privacy settings are blocking the login session.");
        setIsAndroidFixVisible(true);
      } else {
        setAuthError(err.message || "Failed to sign in with Google.");
      }
      setIsAuthenticating(false);
    }
  };

  const handleGuestLogin = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      await loginAsGuest();
    } catch (err: any) {
      setAuthError(err.message || "Failed to start guest session.");
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-100 selection:text-brand-primary flex flex-col relative">
        
        {/* Navigation */}
        <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                <div className="flex items-center gap-2">
                     <span className="text-3xl">💰</span> 
                     <span className="text-xl font-bold tracking-tight text-brand-primary">WMCW</span>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsVideoModalOpen(true)}
                        className="text-sm font-bold text-brand-primary hover:text-brand-secondary flex items-center gap-1 bg-brand-light/30 px-4 py-2 rounded-full transition-colors"
                    >
                        <PlayCircleIcon />
                        Tour
                    </button>
                    <button 
                        onClick={handleGuestLogin}
                        disabled={isAuthenticating}
                        className="text-sm font-medium text-gray-500 hover:text-brand-primary transition-colors disabled:opacity-50"
                    >
                        {isAuthenticating ? 'Connecting...' : 'Guest Mode'}
                    </button>
                    <button 
                        onClick={handleGoogleLogin} 
                        disabled={isAuthenticating}
                        className="bg-brand-primary hover:bg-brand-secondary text-white text-sm font-semibold py-2.5 px-6 rounded-full transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAuthenticating ? 'Signing in...' : 'Login'}
                    </button>
                </div>
            </div>
        </nav>

        {/* Hero Section */}
        <header className="flex-grow pt-40 pb-20 px-6">
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
                <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-50 text-brand-primary text-sm font-semibold tracking-wide uppercase">
                    Personal Finance Dashboard
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-8">
                    Know Your Worth.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">
                        Grow Your Future.
                    </span>
                </h1>
                
                {/* Android Specific Error Fix */}
                {isAndroidFixVisible ? (
                   <div className="mb-10 p-8 bg-amber-50 border-2 border-amber-200 text-amber-900 rounded-3xl text-left max-w-xl mx-auto shadow-xl animate-fade-in">
                      <div className="flex gap-4 items-start">
                         <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                           <AlertTriangleIcon className="w-8 h-8" />
                         </div>
                         <div className="space-y-4">
                            <h3 className="font-black text-lg">Android PWA Login Issue</h3>
                            <p className="text-sm leading-relaxed">
                               This "Missing Initial State" error happens because your browser is blocking cookies while the app is in <strong>Installed/Standalone mode</strong>.
                            </p>
                            <div className="bg-white/50 p-4 rounded-xl space-y-3">
                               <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Choose one to fix:</p>
                               <ul className="text-sm space-y-2 list-disc pl-4">
                                  <li><strong>Open in Browser:</strong> Tap the three dots (⋮) and select "Open in Chrome".</li>
                                  <li><strong>Clear Cache:</strong> Close all Chrome tabs and retry.</li>
                                  <li><strong>Use Guest Mode:</strong> Access the app instantly without an account.</li>
                               </ul>
                            </div>
                            <div className="flex gap-3 pt-2">
                               <button 
                                 onClick={() => window.location.reload()} 
                                 className="flex-1 bg-amber-600 text-white font-bold py-3 rounded-xl hover:bg-amber-700 transition-all text-sm"
                               >
                                 Refresh App
                               </button>
                               <button 
                                 onClick={handleGuestLogin}
                                 className="flex-1 bg-white text-amber-800 font-bold py-3 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all text-sm"
                               >
                                 Continue as Guest
                               </button>
                            </div>
                         </div>
                      </div>
                   </div>
                ) : authError ? (
                    <div className="mb-8 p-6 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-left max-w-md mx-auto animate-fade-in flex gap-4 items-center">
                        <AlertTriangleIcon className="shrink-0" />
                        <p className="text-sm font-medium">{authError}</p>
                    </div>
                ) : (
                    <p className="text-xl md:text-2xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
                        The comprehensive, private way to track your assets, liabilities, and credit scores across all major bureaus.
                    </p>
                )}

                {!isAndroidFixVisible && (
                    <>
                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
                            <button 
                                onClick={handleGoogleLogin} 
                                disabled={isAuthenticating}
                                className="flex-1 flex items-center justify-center gap-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 px-8 rounded-xl transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-75"
                            >
                                {isAuthenticating ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <GoogleIcon className="w-6 h-6 bg-white rounded-full p-0.5" />
                                )}
                                <span>Sign in with Google</span>
                            </button>
                            <button 
                                onClick={() => setIsVideoModalOpen(true)}
                                className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-bold py-4 px-8 rounded-xl border border-gray-200 transition-all shadow-md hover:shadow-lg"
                            >
                                <PlayCircleIcon /> Watch Tour
                            </button>
                        </div>

                        <div className="mt-8 flex flex-col items-center gap-4">
                           <button 
                              onClick={handleGuestLogin}
                              className="text-sm font-bold text-gray-400 hover:text-brand-primary underline transition-colors"
                           >
                             Try Guest Mode (No Account Required)
                           </button>
                           {isStandalone && (
                             <span className="px-3 py-1 bg-blue-50 text-brand-primary text-[10px] font-bold rounded-full uppercase tracking-widest border border-blue-100">
                               PWA Mode Active
                             </span>
                           )}
                        </div>
                    </>
                )}

                <div className="mt-12 text-sm text-gray-400 flex items-center justify-center gap-2">
                    <FeatureShieldIcon /> Secure & Private. Data is never sold or shared.
                </div>
            </div>
        </header>

        {/* Info Section */}
        <section id="help-section" className="py-24 px-6 bg-white border-t border-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 items-center gap-16">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-light/20 text-brand-primary rounded-lg text-sm font-bold uppercase tracking-widest">
                            <HelpCircleIcon /> Getting Started
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900 leading-tight">Master Your Financial Health in 4 Steps</h2>
                        <div className="space-y-6">
                            {[
                                { step: 1, title: 'Connect Securely', desc: 'Authenticate with Google. Your session is protected by multi-layer encryption.' },
                                { step: 2, title: 'Input Metrics', desc: 'Enter your scores, debts, and income. Our editor syncs everything to the cloud.' },
                                { step: 3, title: 'Analyze Growth', desc: 'Watch your net worth and credit history evolve through interactive visual charts.' },
                                { step: 4, title: 'Optimize Daily', desc: 'Use AI simulations to see how paying off debt affects your FICO score.' }
                            ].map((item) => (
                                <div key={item.step} className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm">
                                        {item.step}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{item.title}</h4>
                                        <p className="text-gray-600 text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-3xl p-10 border border-gray-100 shadow-inner space-y-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                            <div className="p-3 bg-blue-50 text-brand-primary rounded-xl">
                                <InfoIcon />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Android Tips</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Running this app via "Add to Home Screen"? Ensure Google Chrome is your default browser to avoid authentication state loss.
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                <SparklesIcon />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">AI-Powered Advisor</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Use our built-in simulator to predict credit score changes before you make big financial moves.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Unified Financial Control</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Track everything in one place. Your privacy is our priority.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all">
                        <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 text-brand-primary group-hover:scale-110 transition-transform">
                           <ChartIcon />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Net Worth Tracking</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Aggregate your cash, investments, and home equity against your debts for a real-time net worth calculation.
                        </p>
                    </div>

                    <div className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all">
                        <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 transition-transform">
                            <FeatureShieldIcon />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Multi-Score History</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Monitor Experian, Equifax, and TransUnion FICO® scores. Track trends over months and years.
                        </p>
                    </div>

                    <div className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all">
                        <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
                             <TrendIcon />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Cloud Portability</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Export your entire database to JSON at any time. Move your data freely or keep a physical backup.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* Footer */}
        <footer className="bg-white py-12 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-2 text-gray-900 font-bold">
                    <span>💰</span> WMCW
                </div>
                <div className="flex items-center gap-8">
                   <button 
                      onClick={onViewPrivacy}
                      className="text-gray-500 text-sm hover:text-brand-primary transition-colors flex items-center gap-2"
                   >
                     <FeatureShieldIcon className="w-4 h-4" /> Privacy & Security
                   </button>
                   <p className="text-gray-400 text-sm">
                      &copy; {new Date().getFullYear()} What's My Credit Worth. All rights reserved.
                   </p>
                </div>
            </div>
        </footer>

        {/* Video Modal */}
        <PromotionalVideo 
            isOpen={isVideoModalOpen} 
            onClose={() => setIsVideoModalOpen(false)} 
        />
    </div>
  );
};

export default AuthScreen;
