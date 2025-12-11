import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import HelpTooltip from './ui/HelpTooltip';

const GoogleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.641-3.219-11.334-7.618l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,34.019,44,28.891,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const ChartIcon = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
);

const ScoreIcon = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const ReportIcon = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const AuthScreen: React.FC = () => {
  const { loginWithGoogle, loginAsGuest } = useAuth();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
        {/* Navigation */}
        <nav className="w-full py-6 px-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto">
            <div className="text-2xl font-bold text-brand-primary flex items-center gap-2">
                 <span>💰</span> 
                 <span>What's My Credit Worth?</span>
                 <div className="ml-1">
                    <HelpTooltip text="Welcome! This app helps you track your Net Worth, Credit Scores, Assets, and Debts. Log in with Google to sync your data across devices, or try Guest Mode to store data privately on this device." />
                 </div>
            </div>
            <div className="hidden md:block">
                <button onClick={loginWithGoogle} className="text-sm font-semibold text-gray-600 hover:text-brand-primary transition-colors">
                    Member Login
                </button>
            </div>
        </nav>

        {/* Hero Section */}
        <header className="flex-grow flex flex-col justify-center items-center text-center px-6 py-16 md:py-24 max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                Understand Your <span className="text-brand-primary">Financial True North</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Stop guessing. Start tracking. A comprehensive, private dashboard for your income, credit scores, assets, and liabilities. Calculate your net worth instantly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                 <button 
                    onClick={loginWithGoogle} 
                    className="flex-1 flex items-center justify-center gap-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                 >
                    <GoogleIcon className="w-6 h-6 bg-white rounded-full p-0.5" />
                    <span>Sign in with Google</span>
                </button>
                <button 
                    onClick={loginAsGuest} 
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 px-8 rounded-xl transition-all"
                >
                    Try as Guest
                </button>
            </div>
            <p className="mt-6 text-sm text-gray-400">
                Secure & Private. Guest mode stores data locally on your device.
            </p>
        </header>

        {/* Feature Section */}
        <section className="bg-gray-50 py-20 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-3 gap-12">
                    {/* Feature 1 */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-brand-primary">
                           <ChartIcon />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Net Worth Tracking</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Automatically calculate your net worth by aggregating your assets (investments, cash) and liabilities (loans, credit cards) in one unified view.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                        <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6 text-green-600">
                            <ScoreIcon />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Credit Score History</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Keep a historical log of your FICO® scores from Experian, Equifax, and TransUnion. Visualize trends and improvement over time.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                        <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                             <ReportIcon />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Comparison Reports</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Generate monthly, quarterly, and annual reports to see exactly how your financial health is evolving and where you stand today.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* Footer */}
        <footer className="bg-white py-12 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} What's My Credit Worth. All data is encrypted and secure.
            </p>
        </footer>
    </div>
  );
};

export default AuthScreen;