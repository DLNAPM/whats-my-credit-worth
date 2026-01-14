
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HelpCircleIcon, PlayCircleIcon, CheckIcon, SparklesIcon, InfoIcon } from './ui/Icons';
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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const TrendIcon = () => (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const FeatureShieldIcon = () => (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const AuthScreen: React.FC = () => {
  const { loginWithGoogle, loginAsGuest } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleGoogleLogin = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Login failed", err);
      setAuthError(err.message || "Failed to sign in with Google.");
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
      console.error("Guest login failed", err);
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
                        className="hidden md:block text-sm font-medium text-gray-500 hover:text-brand-primary transition-colors disabled:opacity-50"
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
                <p className="text-xl md:text-2xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
                    The comprehensive, private way to track your assets, liabilities, and credit scores across all major bureaus.
                </p>
                
                {authError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium animate-fade-in">
                        {authError}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
                     <button 
                        onClick={handleGoogleLogin} 
                        disabled={isAuthenticating}
                        className="flex-1 flex items-center justify-center gap-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 px-8 rounded-xl transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-75 disabled:transform-none"
                     >
                        {isAuthenticating ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <GoogleIcon className="w-6 h-6 bg-white rounded-full p-0.5" />
                        )}
                        <span>{isAuthenticating ? 'Signing in...' : 'Sign in with Google'}</span>
                    </button>
                    <button 
                        onClick={() => setIsVideoModalOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-bold py-4 px-8 rounded-xl border border-gray-200 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                        <PlayCircleIcon /> Watch Video
                    </button>
                </div>
                <div className="mt-8 text-sm text-gray-400 flex items-center justify-center gap-2">
                    <FeatureShieldIcon /> Secure & Private. Try Guest Mode with 4 months of sample data.
                </div>
            </div>
        </header>

        {/* How It Works Section (The "?" Helpers) */}
        <section id="help-section" className="py-24 px-6 bg-white border-t border-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-light/20 text-brand-primary rounded-lg text-sm font-bold uppercase tracking-widest">
                            <HelpCircleIcon /> Question & Help Center
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900">Four Simple Steps to Financial Freedom</h2>
                        <div className="space-y-6">
                            {[
                                { step: 1, title: 'Secure Login', desc: 'Connect with Google or try Guest Mode. Your data is encrypted and private.' },
                                { step: 2, title: 'Input Data', desc: 'Enter your income, scores, and debts. Our intuitive editor makes it easy.' },
                                { step: 3, title: 'Analyze Trends', desc: 'Visualize your growth over time with interactive net worth and credit charts.' },
                                { step: 4, title: 'AI Advisory', desc: 'Unlock personalized strategies from our Gemini-powered advisor to accelerate growth.' }
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
                        
                        {/* Link to Promotional Video Tour */}
                        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-center gap-6 group">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-brand-primary shadow-sm group-hover:scale-110 transition-transform">
                                <PlayCircleIcon />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h4 className="font-bold text-gray-900">New to WMCW?</h4>
                                <p className="text-sm text-gray-500 mb-3">Watch our 90-second animated tour explaining how to use sample data and master your metrics.</p>
                                <button 
                                    onClick={() => setIsVideoModalOpen(true)}
                                    className="text-brand-primary font-bold text-sm flex items-center justify-center sm:justify-start gap-1 hover:underline"
                                >
                                    Play Tour Now <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 bg-gray-50 rounded-3xl p-8 border border-gray-100 shadow-inner">
                        <div className="space-y-6">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4 transform -rotate-1 hover:rotate-0 transition-transform">
                                <div className="p-2 bg-blue-50 text-brand-primary rounded-lg">
                                    <HelpCircleIcon />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-900">Is my data shared with creditors?</p>
                                    <p className="text-xs text-gray-500 mt-1">Absolutely not. WMCW is a private tracker. We never sell data or connect to your bank accounts without permission.</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4 transform rotate-1 hover:rotate-0 transition-transform translate-x-4">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <SparklesIcon />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-900">How does the AI Advisor work?</p>
                                    <p className="text-xs text-gray-500 mt-1">It uses Google Gemini to analyze your debt-to-income and utilization ratios to suggest sophisticated wealth moves.</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4 transform -rotate-1 hover:rotate-0 transition-transform">
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <CheckIcon />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-900">Can I export my reports?</p>
                                    <p className="text-xs text-gray-500 mt-1">Yes! You can download snapshots as JPEGs or PDF reports to share with your personal financial advisor.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Feature Section */}
        <section className="bg-gray-50 py-24 px-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything you need to succeed</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Stop using spreadsheets. Get a clear, unified view of your financial health in seconds.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-brand-primary group-hover:scale-110 transition-transform duration-300">
                           <ChartIcon />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Net Worth Tracking</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Automatically calculate your net worth by aggregating your investments, cash, loans, and credit cards in one beautiful dashboard.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 transition-transform duration-300">
                            <FeatureShieldIcon />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Multi-Bureau Monitoring</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Log and visualize your FICO® scores from Experian, Equifax, and TransUnion. Spot trends and improvements instantly.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform duration-300">
                             <TrendIcon />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Growth Analytics</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Generate detailed monthly, quarterly, and annual reports. Analyze your debt-to-income ratio and track your financial velocity.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* Footer */}
        <footer className="bg-white py-12 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-gray-900 font-bold">
                    <span>💰</span> WMCW
                </div>
                <p className="text-gray-500 text-sm">
                    &copy; {new Date().getFullYear()} What's My Credit Worth. All rights reserved.
                </p>
            </div>
        </footer>

        {/* Floating Help Button */}
        <button 
            onClick={() => document.getElementById('help-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="fixed bottom-8 right-8 w-14 h-14 bg-brand-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-brand-secondary transform hover:scale-110 transition-all z-40 group"
            aria-label="Help and FAQ"
        >
            <HelpCircleIcon />
            <span className="absolute right-full mr-4 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Need Help?
            </span>
        </button>

        {/* Video Modal */}
        <PromotionalVideo 
            isOpen={isVideoModalOpen} 
            onClose={() => setIsVideoModalOpen(false)} 
        />
    </div>
  );
};

export default AuthScreen;
