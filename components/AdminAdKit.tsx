import React, { useState, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { getDummyData, formatCurrency, calculateNetWorth, calculateDTI, calculateUtilization, calculateMonthlyIncome, calculateTotal, calculateTotalBalance, calculateTotalLimit } from '../utils/helpers';

export type AdTopicId = 
  | 'landing_page'
  | 'wmcw_dashboard'
  | 'edit_data'
  | 'reports'
  | 'four_steps'
  | 'credit_scores'
  | 'cards_vs_loans'
  | 'assets'
  | 'ai_advisor'
  | 'profile_settings'
  | 'sync_next_steps'
  | 'chat_with_us';

interface AdTopicConfig {
  id: AdTopicId;
  label: string;
  category: string;
  badge: string;
  headline: string;
  subheadline: string;
  targetAudience: string;
  howToSteps: { number: number; title: string; description: string }[];
  caption: string;
}

export const AdminAdKit: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<AdTopicId>('landing_page');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingTopicId, setGeneratingTopicId] = useState<string | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'square' | 'landscape'>('square');

  // Pre-load exact Guest Mode dummy data
  const guestData = useMemo(() => getDummyData(), []);
  const months = useMemo(() => Object.keys(guestData).sort().reverse(), [guestData]);
  const currentMonth = months[0] || '2026-03';
  const currentData = guestData[currentMonth];

  // Calculated metrics from Guest Mode
  const metrics = useMemo(() => {
    if (!currentData) return null;
    const monthlyIncome = calculateMonthlyIncome(currentData.income?.jobs || []);
    const monthlyBills = calculateTotal(currentData.monthlyBills || []);
    const totalAssets = calculateTotal(currentData.assets || []);
    const cardBalance = calculateTotalBalance(currentData.creditCards || []);
    const cardLimit = calculateTotalLimit(currentData.creditCards || []);
    const loanBalance = calculateTotalBalance(currentData.loans || []);
    const totalDebt = cardBalance + loanBalance;
    const netWorth = totalAssets - totalDebt;
    const utilization = calculateUtilization(cardBalance, cardLimit);
    const dti = calculateDTI(monthlyBills, monthlyIncome);
    const surplus = monthlyIncome - monthlyBills;
    const emergencyRunwayMonths = monthlyBills > 0 ? (totalAssets * 0.15) / monthlyBills : 5.8;

    return {
      monthlyIncome,
      monthlyBills,
      totalAssets,
      cardBalance,
      cardLimit,
      loanBalance,
      totalDebt,
      netWorth,
      utilization,
      dti,
      surplus,
      emergencyRunwayMonths,
      scores: currentData.creditScores
    };
  }, [currentData]);

  // Topic Configurations
  const topics: AdTopicConfig[] = useMemo(() => [
    {
      id: 'landing_page',
      label: 'Landing Page',
      category: 'Instant Onboarding',
      badge: 'ZERO SIGNUP FRICTION',
      headline: 'Discover What Your Credit Is Truly Worth in 30 Seconds',
      subheadline: 'Test-drive our comprehensive wealth & multi-bureau credit platform in instant Guest Mode.',
      targetAudience: 'Consumers & Business Owners looking for holistic credit and wealth tracking',
      howToSteps: [
        { number: 1, title: 'Click "Guest Mode"', description: 'Instantly access the full application pre-populated with 4 months of realistic sample financial data.' },
        { number: 2, title: 'Inspect the Unified View', description: 'See how your credit scores directly correlate with credit utilization, cash flow, and net worth.' },
        { number: 3, title: 'Switch Between Modes', description: 'Seamlessly toggle between Personal finances and Business entity accounting in one click.' }
      ],
      caption: `💡 Stop guessing where your finances stand! Most credit score apps only show you a single score without context.

What's My Credit Worth connects your 3-bureau credit scores, credit cards, loans, and assets into one unified wealth command center.

👉 HOW TO GET STARTED IN 30 SECONDS:
1️⃣ Visit whatsmycreditworth.com and click "Guest Mode"
2️⃣ Explore 4 months of pre-loaded sample data—no credit card or signup required
3️⃣ See how lowering credit utilization from 30% to 2.6% propels your net worth forward

🚀 Test-drive the platform free today!
#PersonalFinance #CreditScore #FinancialFreedom #NetWorth #WealthBuilding #WhatsMyCreditWorth #FICO`
    },
    {
      id: 'wmcw_dashboard',
      label: 'WMCW Dashboard',
      category: 'Executive Command Center',
      badge: 'ALL-IN-ONE METRICS',
      headline: 'Your Complete Wealth & Credit Command Center',
      subheadline: 'Track Net Worth, Credit Utilization (<10%), and Debt-to-Income on a single executive screen.',
      targetAudience: 'Everyday investors, budgeters, and home buyers preparing for mortgage approval',
      howToSteps: [
        { number: 1, title: 'Monitor 5 Vital Gauges', description: 'Review Net Worth, Total Assets, Total Debt, Monthly Income, and DTI Ratio on high-contrast cards.' },
        { number: 2, title: 'Switch Interactive Charts', description: 'Toggle between Net Worth Over Time and Multi-Bureau Credit Scores to track financial momentum.' },
        { number: 3, title: 'Optimize Credit Utilization', description: 'Monitor revolving credit utilization to keep it strictly under 10% (Guest Mode: an optimal 2.6%).' }
      ],
      caption: `📊 Stop logging into 5 different banking and credit apps just to see where your money stands!

The WMCW Dashboard unites your credit cards, term loans, liquid assets, income, and credit scores into a single executive command center.

👉 HOW TO MASTER YOUR DASHBOARD:
1️⃣ Check your Credit Utilization gauge—aim to keep it strictly under 10% (Guest Mode shows an optimal 2.6%)
2️⃣ Track your Debt-to-Income (DTI) ratio to stay primed for top-tier mortgage and auto financing
3️⃣ Allocate your monthly surplus ($6,255 in Guest Mode) into high-yield savings and low-cost index funds

✨ Experience the live dashboard in Guest Mode at whatsmycreditworth.com!
#Dashboard #WealthTracking #CreditUtilization #Budgeting #FinancialGoals #FinancialIndependence #SmartMoney`
    },
    {
      id: 'edit_data',
      label: 'Edit Current and Past Months Data',
      category: 'Flexible Financial Ledger',
      badge: 'HISTORICAL EDITING & AUTO-SAVE',
      headline: 'Effortless Ledger Control: Edit Current & Past Months',
      subheadline: 'Update income streams, card limits, balances, loans, and assets with instant cloud synchronization.',
      targetAudience: 'Users who want total control over past and present financial records',
      howToSteps: [
        { number: 1, title: 'Click "Edit" in Header', description: 'Click the "Edit" button in the top navigation bar to launch the multi-section financial ledger modal.' },
        { number: 2, title: '1-Click Copy Prior Month', description: 'Use "Start with data from another month?" to duplicate previous balances and save setup time.' },
        { number: 3, title: 'Update & Save Changes', description: 'Update salaries, card limits, loan balances, or asset values with instant auto-save and cloud security.' }
      ],
      caption: `✏️ Received a raise, paid down a credit card, or bought new assets? Updating your financial records should take seconds, not hours.

With WMCW, you can edit current and past months' data with instantaneous auto-saving and zero friction.

👉 HOW TO UPDATE YOUR FINANCIAL DATA:
1️⃣ Click "Edit" from the top navigation bar to open the organized ledger modal
2️⃣ Use 1-click "Start with data from another month?" to copy previous month values
3️⃣ Update credit cards with 4-char match keys (#4819), add savings, or adjust salaries, then click "Save Changes"

💡 Test out the flexible data editor risk-free in Guest Mode!
#FinanceApp #DataManagement #BudgetingTools #FinancialTracking #Productivity #MoneyManagement`
    },
    {
      id: 'reports',
      label: 'Reports',
      category: 'Institutional Planning',
      badge: '9-TOPIC COMPREHENSIVE PLAN',
      headline: 'Generate Institutional Financial Planning Reports in Seconds',
      subheadline: 'Access a 9-topic fiduciary-grade audit with Monte Carlo simulations and multi-period comparisons.',
      targetAudience: 'High earners, retirees, and families wanting professional financial roadmap reports',
      howToSteps: [
        { number: 1, title: 'Navigate to "Reports"', description: 'Click "Reports" in the top navigation bar to view historical period-over-period comparisons.' },
        { number: 2, title: 'Click "Generate Report"', description: 'Click "Generate Financial Planning Report" to compile a 9-topic fiduciary audit with Monte Carlo models.' },
        { number: 3, title: 'Review & Print / Export', description: 'Review asset allocation, estate checklists, and withdrawal sequencing, then export to publication-ready PDF.' }
      ],
      caption: `📑 Traditional financial planners charge upwards of $2,500 to draft a comprehensive financial roadmap.

What's My Credit Worth generates an institutional 9-topic Financial Planning Report in seconds—complete with Monte Carlo retirement projections, estate document checklists, and period comparisons!

👉 HOW TO GENERATE YOUR REPORT:
1️⃣ Open the Reports tab in WMCW
2️⃣ Click "Generate Financial Planning Report" to audit your assets, debt architecture, and cash flow
3️⃣ Download an executive multi-page PDF formatted with letterhead and compliance disclosures

📲 Generate a sample report using Guest Mode data right now at whatsmycreditworth.com!
#FinancialPlanning #WealthManagement #EstatePlanning #MonteCarlo #RetirementPlan #PersonalFinance #Fiduciary`
    },
    {
      id: 'four_steps',
      label: '4 Steps to Financial Freedom',
      category: 'Milestone Roadmap',
      badge: 'PROVEN WEALTH SEQUENCE',
      headline: 'The Proven 4 Steps to Financial Freedom',
      subheadline: 'Follow our structured milestone framework from emergency liquid reserves to generational wealth.',
      targetAudience: 'Anyone striving for financial independence, FIRE, or stress-free money management',
      howToSteps: [
        { number: 1, title: 'Step 1: Replace Income', description: 'Target: Monthly Income × 300 ($2,805,000) invested to perpetually replace your monthly salary.' },
        { number: 2, title: 'Steps 2 & 3: Invest & HYSA', description: 'Invest 2% minimum ($187/mo) & build 3x monthly income in FDIC-insured HYSA ($28,050).' },
        { number: 3, title: 'Step 4: Rainy Day Cap', description: 'Cap monthly rainy day cash savings at 50% ($4,675/mo) to eliminate cash drag and compound wealth.' }
      ],
      caption: `🛣️ Achieving financial independence doesn't require luck—it requires following an exact, battle-tested sequence.

The WMCW 4 Steps to Financial Freedom dynamically calculates personalized milestone targets derived from your real monthly income:

👉 THE 4 PROVEN FORMULA STEPS:
1️⃣ Step 1: Replace Monthly Income (Monthly Income × 300 = $2,805,000 invested target)
2️⃣ Step 2: Minimum Monthly Investment (Monthly Income × 2% = $187/mo automated habit)
3️⃣ Step 3: High Yield Savings Reserve (Monthly Income × 3 = $28,050 in FDIC-insured HYSA)
4️⃣ Step 4: Rainy Day Monthly Savings Cap (Monthly Income × 50% = $4,675/mo max cap to prevent cash drag)

🏁 See where you stand on the 4-step roadmap in Guest Mode today!
#FinancialFreedom #DebtFreeJourney #EmergencyFund #Investing #FIRECommunity #WealthBuilding`
    },
    {
      id: 'credit_scores',
      label: 'Credit Scores Over Time',
      category: 'Score Trajectory & Velocity',
      badge: 'MULTI-BUREAU TRACKING',
      headline: 'Track 8+ Credit Scores Across All Bureaus Over Time',
      subheadline: 'Monitor Experian, Equifax, TransUnion, Mortgage FICO 4, and Auto FICO trajectory with precision.',
      targetAudience: 'Borrowers preparing for mortgage or vehicle financing, and credit builders',
      howToSteps: [
        { number: 1, title: 'Record Multi-Bureau Scores', description: 'Log your Experian, Equifax, and TransUnion FICO and Vantage scores each month.' },
        { number: 2, title: 'Monitor Specialized FICO Scores', description: 'Track Auto FICO and Mortgage FICO versions used by institutional lenders.' },
        { number: 3, title: 'Observe Score Velocity', description: 'Watch your scores climb as you lower revolving card balances and optimize payment history.' }
      ],
      caption: `📈 Did you know mortgage and auto lenders look at completely different FICO score versions than your free banking app?

WMCW tracks your credit scores across Experian, Equifax, TransUnion, Mortgage FICO, and Auto FICO over time so you're never caught off-guard.

👉 HOW TO TRACK CREDIT VELOCITY:
1️⃣ Log your monthly scores from your bank or bureau statements
2️⃣ View the interactive Credit Scores Over Time chart to monitor historical score trends
3️⃣ Watch how lowering credit card balances triggers instantaneous score jumps

🚀 Check out the 4-month credit score trajectory in Guest Mode!
#CreditScore #FICO #CreditRepair #CreditVelocity #FinancialLiteracy #MortgageReady #CreditTips`
    },
    {
      id: 'cards_vs_loans',
      label: 'Credit Card vs Loans Section',
      category: 'Strategic Debt Architecture',
      badge: 'REVOLVING VS INSTALLMENT',
      headline: 'Credit Cards vs. Loans: Master Your Debt Architecture',
      subheadline: 'Understand why $10k in credit card debt hurts your FICO score 10x more than a $300k mortgage.',
      targetAudience: 'Individuals carrying consumer balances or refinancing home and auto loans',
      howToSteps: [
        { number: 1, title: 'Toggle Cards vs Loans', description: 'Switch between [Credit Cards] and [Loans] in the liability card to audit revolving vs term balances.' },
        { number: 2, title: 'Keep Utilization <10%', description: 'Monitor total card utilization (Guest Mode: 2.64%) to maintain top-tier FICO scoring.' },
        { number: 3, title: 'Run Payoff Simulation', description: 'Click "RUN SIMULATION ✨" to model card paydowns and simulate score improvements.' }
      ],
      caption: `💳 All debt is NOT created equal!

Carrying $10,000 across maxed-out credit cards can destroy your credit score, while carrying a $350,000 mortgage barely affects it. Why? Utilization!

👉 HOW TO OPTIMIZE YOUR DEBT ARCHITECTURE:
1️⃣ Keep revolving credit card utilization below 10% (Guest Mode shows an optimal 2.6% across 3 cards)
2️⃣ Separate fixed installment loans (mortgage, auto) from high-interest revolving debt
3️⃣ Click "RUN SIMULATION ✨" to model paying down specific card balances for maximum FICO boosts

🔍 Explore the Credit Card vs. Loans breakdown live in Guest Mode!
#DebtFree #CreditCards #Mortgage #CreditUtilization #SmartMoney #DebtPayoff #PersonalFinance`
    },
    {
      id: 'assets',
      label: 'Assets',
      category: 'Portfolio & Next Steps Sync',
      badge: 'HOLISTIC WEALTH LEDGER',
      headline: 'Track Liquid Cash, 401k, Crypto & Real Estate Equity',
      subheadline: 'Organize your entire asset portfolio with alphanumeric account IDs and Next Steps App synchronization.',
      targetAudience: 'Investors, savers, and professionals managing diversified assets',
      howToSteps: [
        { number: 1, title: 'Audit Asset Classes', description: 'View total assets ($257,400) categorized into Liquid Cash, 401k/IRA, Real Estate, and Crypto.' },
        { number: 2, title: 'Use 4-Char Match Keys', description: 'Tag accounts with 4-character identifiers (e.g. #4821, #9102, #7724) for duplicate-free sync.' },
        { number: 3, title: 'Track Liquid Runway', description: 'Monitor emergency reserves ($18k in Marcus HYSA = 5.8 months runway) and compound growth.' }
      ],
      caption: `💰 Net worth is your TRUE financial scorecard—not just your monthly salary.

The WMCW Assets module lets you organize all your holdings in one place with account synchronization for seamless planning.

👉 HOW TO TRACK ASSETS LIKE A PRO:
1️⃣ Log your liquid emergency reserves, retirement funds, real estate equity, and crypto
2️⃣ Include account last-4 digits (supports alphanumeric IDs like 4YBN) to sync with Next Steps
3️⃣ Watch your net worth grow month over month as assets compound

🌟 Inspect the complete asset allocation in Guest Mode at whatsmycreditworth.com!
#Assets #NetWorth #401k #RealEstate #CryptoPortfolio #WealthBuilding #PersonalFinance`
    },
    {
      id: 'ai_advisor',
      label: 'AI Advisor',
      category: 'Fiduciary Intelligence',
      badge: '24/7 BALANCE-SHEET AWARE',
      headline: 'Your 24/7 AI Financial Advisor: Personalized Insights',
      subheadline: 'Ask complex money questions and receive instant guidance calculated directly from your balance sheet.',
      targetAudience: 'Users seeking immediate financial strategy without paying expensive hourly planner fees',
      howToSteps: [
        { number: 1, title: 'Click "AI ADVISOR ✨"', description: 'Click the purple "AI ADVISOR ✨" button in the WMCW header to launch the fiduciary console.' },
        { number: 2, title: 'Review Surplus Cash Flow', description: 'Inspect your live $6,255 monthly cash flow surplus, 5.8-month runway, and 2.6% utilization.' },
        { number: 3, title: 'Receive Targeted Strategy', description: 'Get data-backed recommendations on debt payoff sequencing, index investing, and milestone pace.' }
      ],
      caption: `🤖 Imagine having a certified financial advisor in your pocket who already understands your income, debt, and assets.

The WMCW AI Advisor analyzes your real balance sheet to give you actionable, math-backed guidance 24/7!

👉 HOW TO USE YOUR AI ADVISOR:
1️⃣ Open the AI Advisor and ask: "How should I allocate my monthly cash surplus?"
2️⃣ Get immediate strategies tailored to your exact emergency fund runway and credit utilization
3️⃣ Simulate debt payoff strategies and explore tax-efficient retirement distribution sequencing

💡 Test out the AI Advisor in Guest Mode today!
#AIFinance #FinancialAdvisor #SmartMoney #Fintech #PersonalWealth #AIAssistant #TechInFinance`
    },
    {
      id: 'profile_settings',
      label: 'User Profile, Account Type & Ticker Settings',
      category: 'Customization & Business Mode',
      badge: 'PERSONAL & BUSINESS MODES',
      headline: 'Tailor WMCW: Business Mode & Live Market Tickers',
      subheadline: 'Switch between Personal and Business accounting and stream real-time stock & crypto prices.',
      targetAudience: 'LLC owners, freelancers, corporate executives, and market investors',
      howToSteps: [
        { number: 1, title: 'Access Profile Settings', description: 'Click your profile avatar in the header to open comprehensive account settings.' },
        { number: 2, title: 'Toggle Business Mode', description: 'Select "Business" account mode and enter your LLC/Corporation name to tailor metrics.' },
        { number: 3, title: 'Customize Market Tickers', description: 'Add your favorite stock and crypto symbols (e.g. SPY, QQQ, BTC, NVDA) to the live ticker banner.' }
      ],
      caption: `⚙️ Whether you are managing personal family wealth or running an LLC, WMCW adapts to your life.

Toggle between Personal and Business modes and stream live stock and crypto tickers right on your dashboard!

👉 HOW TO CUSTOMIZE YOUR PROFILE:
1️⃣ Open Profile & Settings from the top-right user menu
2️⃣ Toggle between Personal and Business modes to track entity-level balance sheets
3️⃣ Add custom stock and crypto ticker symbols to keep an eye on market movements

✨ Try switching account modes and customizing tickers in Guest Mode!
#SmallBusiness #LLC #StockMarket #CryptoTicker #BusinessFinance #Fintech #PersonalFinance #Productivity`
    },
    {
      id: 'sync_next_steps',
      label: 'Syncing with App Next Steps',
      category: 'Inter-App Ecosystem & 1-Click Sync',
      badge: '1-CLICK SEAMLESS SYNC',
      headline: '1-Click Financial Sync: Bridge WMCW to Next Steps App',
      subheadline: 'Transfer, match, and auto-diff credit cards, loans, and assets using 4-character match keys without duplicate entries.',
      targetAudience: 'Users and financial planners managing unified debts and assets across WMCW and Next Steps',
      howToSteps: [
        { number: 1, title: 'Open 1-Click Sync', description: 'Click "Sync Next Steps" in the top navigation bar or Dashboard to open the synchronization console.' },
        { number: 2, title: 'Verify 4-Char Match Keys', description: 'Check the last 4 alphanumeric digits (e.g. 4YBN or 4821) on your cards, loans, and assets for duplicate-free matching.' },
        { number: 3, title: 'Copy Payload or Download JSON', description: 'Click "Copy Sync Payload" or "Download JSON", open your Next Steps app, and paste to reconcile your balance sheet.' }
      ],
      caption: `🔄 Managing personal finances across multiple apps shouldn't mean re-typing the same balances over and over!

With What's My Credit Worth (WMCW), our 1-Click Sync to Next Steps lets you seamlessly transfer, match, and auto-diff all your credit cards, installment loans, and asset portfolios into the Next Steps app.

👉 HOW TO SYNC WITH NEXT STEPS IN 3 EASY STEPS:
1️⃣ Click "Sync Next Steps" in your WMCW header to open the unified export console
2️⃣ Verify your 4-character account matching keys (e.g. #4819, #1024, #4821)—supporting alphanumeric IDs like #4YBN so accounts reconcile without creating duplicates
3️⃣ Click "Copy Sync Payload" (or "Download JSON"), open your Next Steps workspace, and paste to update your net worth and debt payoff schedule instantly

✨ Try the 1-Click Next Steps Sync live with realistic sample data in Guest Mode at whatsmycreditworth.com!
#NextStepsApp #WhatsMyCreditWorth #PersonalFinance #Fintech #DebtFreeJourney #NetWorthSync #FinancialAutomation #Productivity`
    },
    {
      id: 'chat_with_us',
      label: 'Chat With Us & Live Advisory Desk',
      category: 'Fiduciary AI & Dedicated Support',
      badge: '24/7 AI & SUPPORT DESK',
      headline: 'Chat With Us: 24/7 Balance-Sheet Aware Advisory & Support',
      subheadline: 'Tap the floating "Chat With Us" button for instant fiduciary AI calculations or direct support dispatch.',
      targetAudience: 'Users seeking instant answers to debt payoff, score velocity questions, and dedicated app support',
      howToSteps: [
        { number: 1, title: 'Tap "Chat With Us"', description: 'Click the pulsing "Chat With Us" floating action button in the bottom right corner of any screen.' },
        { number: 2, title: 'Ask Questions or Request Help', description: 'Get live guidance on credit card paydown, living runway, surplus allocation, or request technical support.' },
        { number: 3, title: 'Save Insights & Dispatch Tickets', description: 'Bookmark critical financial recommendations, search past chat history, or dispatch an email ticket to support.' }
      ],
      caption: `💬 Got questions about paying down high-interest credit cards, building your emergency runway, or navigating the platform? We're always here for you!

The "Chat With Us" console in What's My Credit Worth gives you 24/7 access to both an AI Financial Advisor that understands your live balance sheet, and direct support dispatch.

👉 HOW TO USE "CHAT WITH US":
1️⃣ Look for the floating "Chat With Us" prompt at the bottom-right of your screen
2️⃣ Ask any personal finance question—from "Which card should I pay off first to boost my FICO 8 score?" to "How much of my $6,255 surplus should go to my 401k?"
3️⃣ Receive immediate, math-backed answers based on your actual data, save key strategies, or dispatch a direct message to our support desk

🚀 Test out "Chat With Us" right now in Guest Mode—no login required!
#ChatWithUs #FintechSupport #AIFinance #FinancialAdvisor #CreditTips #FICOImprovement #CustomerSupport #WhatsMyCreditWorth`
    }
  ], []);

  const activeTopic = useMemo(() => {
    return topics.find(t => t.id === selectedTopicId) || topics[0];
  }, [topics, selectedTopicId]);

  // Copy caption to clipboard
  const handleCopyCaption = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch (e) {
      console.error("Failed to copy caption:", e);
    }
  };

  // Download a single ad image via html2canvas
  const handleDownloadImage = async (topicId: AdTopicId) => {
    const container = document.getElementById(`ad-canvas-${topicId}`);
    if (!container) return;

    setIsGenerating(true);
    setGeneratingTopicId(topicId);

    try {
      // Small tick for DOM paint
      await new Promise(res => setTimeout(res, 200));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0f1d',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      const cleanDate = new Date().toISOString().slice(0, 10);
      link.download = `WMCW_Ad_HowTo_${topicId}_${cleanDate}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error generating advertisement image:", err);
      alert("Failed to export advertisement image. Please try again.");
    } finally {
      setIsGenerating(false);
      setGeneratingTopicId(null);
    }
  };

  // Batch download all 10 images
  const handleDownloadAll = async () => {
    setIsGenerating(true);
    setBatchProgress({ current: 0, total: topics.length });

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      setBatchProgress({ current: i + 1, total: topics.length });
      setSelectedTopicId(topic.id);

      // Wait for tab switch and re-render
      await new Promise(res => setTimeout(res, 400));

      const container = document.getElementById(`ad-canvas-${topic.id}`);
      if (container) {
        try {
          const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#0a0f1d',
            logging: false
          });

          const imgData = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = imgData;
          link.download = `WMCW_Ad_0${i + 1}_${topic.id}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          await new Promise(res => setTimeout(res, 300));
        } catch (e) {
          console.error(`Failed to export ${topic.id}:`, e);
        }
      }
    }

    setBatchProgress(null);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 border border-indigo-800/40 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 shadow-sm">
                Admin Marketing Kit
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30">
                12 Advertisement &amp; How-To Images
              </span>
              <span className="text-xs text-blue-200/80">
                Powered by Guest Mode Real Sample Data
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Advertisement &amp; "How-To" Image Generator
            </h2>
            <p className="text-sm text-blue-100/80 mt-2 leading-relaxed">
              Generate, preview, and download high-resolution marketing graphics and social media captions with step-by-step How-To instructions. All graphics are populated with actual Guest Mode financial metrics (credit scores, card balances, DTI, assets, and surplus).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={handleDownloadAll}
              disabled={isGenerating}
              className="inline-flex items-center justify-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.99] transition-all text-xs sm:text-sm tracking-wide disabled:opacity-50"
            >
              {batchProgress ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Exporting ({batchProgress.current}/{batchProgress.total})...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download All 12 Ad Images</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-blue-200/70">
              <span>Format:</span>
              <button
                onClick={() => setAspectRatio('square')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  aspectRatio === 'square' ? 'bg-blue-600 text-white' : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                1:1 Square
              </button>
              <button
                onClick={() => setAspectRatio('landscape')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  aspectRatio === 'landscape' ? 'bg-blue-600 text-white' : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                16:9 Wide
              </button>
            </div>
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* TOPICS NAVIGATION PILLS / TABS */}
      <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
          <span>Select Advertisement &amp; How-To Topic (12 Features):</span>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">Click any item below to view image &amp; caption</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {topics.map((t, idx) => {
            const isSelected = t.id === selectedTopicId;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTopicId(t.id)}
                className={`flex flex-col text-left p-3 rounded-xl transition-all border ${
                  isSelected
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-500/80 shadow-sm ring-2 ring-indigo-500/20'
                    : 'bg-gray-50/70 dark:bg-gray-800/40 border-gray-200/70 dark:border-gray-800 hover:bg-gray-100/80 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    #{idx + 1}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase truncate">
                    {t.category}
                  </span>
                </div>
                <div className={`text-xs font-bold leading-snug line-clamp-2 ${
                  isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {t.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: LEFT = AD CANVAS PREVIEW, RIGHT = CAPTION & ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: THE ADVERTISEMENT GRAPHIC CANVAS */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white">
                Live Advertisement Canvas ({aspectRatio === 'square' ? '1080 × 1080' : '1200 × 675'})
              </h3>
            </div>

            <button
              onClick={() => handleDownloadImage(activeTopic.id)}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {generatingTopicId === activeTopic.id ? (
                <span>Rendering PNG...</span>
              ) : (
                <>
                  <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download This Ad (.PNG)</span>
                </>
              )}
            </button>
          </div>

          {/* AD CONTAINER TO BE CAPTURED BY HTML2CANVAS */}
          <div className="overflow-hidden rounded-3xl shadow-2xl border border-slate-800 bg-slate-950 flex justify-center items-center p-2 sm:p-4">
            <div
              id={`ad-canvas-${activeTopic.id}`}
              style={{
                width: '100%',
                maxWidth: aspectRatio === 'square' ? '640px' : '760px',
                minHeight: aspectRatio === 'square' ? '640px' : '440px',
                aspectRatio: aspectRatio === 'square' ? '1 / 1' : '16 / 9',
                backgroundColor: '#0a0f1d',
                backgroundImage: 'radial-gradient(ellipse at 80% 10%, rgba(30, 58, 138, 0.45) 0%, transparent 60%), radial-gradient(ellipse at 10% 90%, rgba(67, 56, 202, 0.35) 0%, transparent 60%)',
                color: '#ffffff',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                boxSizing: 'border-box'
              }}
              className="relative p-6 sm:p-8 flex flex-col justify-between rounded-2xl border border-slate-700/50 shadow-inner"
            >
              {/* BRANDING TOP HEADER */}
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-700/60 mb-4">
                  <div className="flex items-center gap-3">
                    {/* WMCW SVG LOGO */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 flex items-center justify-center p-1.5 shadow-md shadow-blue-900/40 border border-blue-400/30">
                      <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(255,255,255,0.15)"></path>
                        <path d="m9 12 2 2 4-4" stroke="#F59E0B" strokeWidth="2.8"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-black tracking-wider text-white flex items-center gap-2">
                        <span>WHAT'S MY CREDIT WORTH</span>
                      </div>
                      <div className="text-[9px] font-extrabold text-amber-400 tracking-widest uppercase">
                        Financial Intelligence &amp; Credit Platform
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 tracking-wider">
                      {activeTopic.badge}
                    </span>
                    <div className="text-[9px] text-slate-400 mt-0.5">HOW-TO TUTORIAL &amp; AD</div>
                  </div>
                </div>

                {/* AD HEADLINE & SUBHEADLINE */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1 block">
                    FEATURE SPOTLIGHT: {activeTopic.label.toUpperCase()}
                  </span>
                  <h4 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                    {activeTopic.headline}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-xl">
                    {activeTopic.subheadline}
                  </p>
                </div>
              </div>

              {/* CORE LIVE MOCKUP SHOWCASE (USES ACTUAL GUEST MODE DATA) */}
              <div className="my-auto py-2">
                <TopicMockupRenderer topicId={activeTopic.id} metrics={metrics} currentData={currentData} />
              </div>

              {/* STEP-BY-STEP HOW-TO BOXES (3 NUMBERED STEPS) */}
              <div className="mt-3 pt-3 border-t border-slate-700/60">
                <div className="text-[9.5px] font-black text-amber-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                  <span>How To Use This Feature:</span>
                  <span className="text-[8.5px] text-slate-400 font-normal">Step-by-Step Walkthrough</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {activeTopic.howToSteps.map((step) => (
                    <div
                      key={step.number}
                      className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center shrink-0">
                          {step.number}
                        </span>
                        <span className="text-[10px] font-bold text-white truncate">
                          {step.title}
                        </span>
                      </div>
                      <p className="text-[8.5px] text-slate-300 leading-snug line-clamp-2">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTTOM FOOTER CALL TO ACTION & VERIFICATION */}
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[8px]">
                    FREE GUEST MODE
                  </span>
                  <span>4 Months of Real Pre-Loaded Data • No Signup Needed</span>
                </div>
                <div className="font-bold text-blue-300 tracking-wider">
                  whatsmycreditworth.com
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CAPTION & MARKETING COPY */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Ready-To-Post Caption
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Social &amp; Ad Copy
                </h3>
              </div>

              <button
                onClick={() => handleCopyCaption(activeTopic.caption)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  copiedCaption
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800'
                }`}
              >
                {copiedCaption ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy Caption</span>
                  </>
                )}
              </button>
            </div>

            {/* Editable / Selectable Caption Text Box */}
            <div className="relative">
              <textarea
                readOnly
                rows={13}
                value={activeTopic.caption}
                className="w-full text-xs text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div>
                Target Audience: <strong className="text-gray-700 dark:text-gray-300">{activeTopic.targetAudience}</strong>
              </div>
              <div className="font-mono">
                {activeTopic.caption.length} chars
              </div>
            </div>
          </div>

          {/* QUICK TOPIC SUMMARY CARD */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-3xl p-5 border border-indigo-100 dark:border-indigo-900/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 mb-2">
              Guest Mode Data Highlight:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/80 dark:bg-gray-900/80 p-2.5 rounded-xl border border-indigo-100 dark:border-gray-800">
                <div className="text-[10px] text-gray-500">Total Assets</div>
                <div className="font-extrabold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(metrics?.totalAssets || 257400)}
                </div>
              </div>
              <div className="bg-white/80 dark:bg-gray-900/80 p-2.5 rounded-xl border border-indigo-100 dark:border-gray-800">
                <div className="text-[10px] text-gray-500">Credit Utilization</div>
                <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  {metrics?.utilization.toFixed(1) || '2.6'}% (Elite Tier)
                </div>
              </div>
              <div className="bg-white/80 dark:bg-gray-900/80 p-2.5 rounded-xl border border-indigo-100 dark:border-gray-800">
                <div className="text-[10px] text-gray-500">Monthly Surplus</div>
                <div className="font-extrabold text-blue-600 dark:text-blue-400">
                  {formatCurrency(metrics?.surplus || 6255)}/mo
                </div>
              </div>
              <div className="bg-white/80 dark:bg-gray-900/80 p-2.5 rounded-xl border border-indigo-100 dark:border-gray-800">
                <div className="text-[10px] text-gray-500">Top FICO Score</div>
                <div className="font-extrabold text-purple-600 dark:text-purple-400">
                  {metrics?.scores?.experian?.score8 || 730} FICO 8
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// HELPER: Authentic App Viewport & Browser Chrome
// Wraps mockups in a realistic browser window + WMCW header matching the live application
const AppViewportChrome: React.FC<{
  activeView?: 'Dashboard' | 'Reports' | 'Admin';
  monthLabel?: string;
  activeFeatureTag?: string;
  children: React.ReactNode;
}> = ({ activeView = 'Dashboard', monthLabel = 'March 2026', activeFeatureTag, children }) => {
  return (
    <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 bg-white text-slate-900 text-[9px]">
      {/* 1. TOP BROWSER CHROME */}
      <div className="bg-slate-900 px-3 py-1.5 flex items-center justify-between border-b border-slate-800 text-[8px] text-slate-400 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
        </div>
        <div className="bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-slate-800 text-slate-300 flex items-center gap-1 font-mono text-[7.5px]">
          <span className="text-emerald-400">🔒</span>
          <span>https://whatsmycreditworth.com</span>
          <span className="text-emerald-400 font-bold ml-1">• Guest Mode</span>
        </div>
        <div className="flex items-center gap-1 text-[7.5px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Cloud Sync 100%</span>
        </div>
      </div>

      {/* 2. REAL-TIME STREAMING STOCK & CRYPTO TICKER TAPE */}
      <div className="bg-slate-950 text-white px-3 py-0.5 border-b border-slate-800 flex items-center gap-3 overflow-hidden text-[7.5px] font-mono whitespace-nowrap">
        <span className="text-amber-400 font-bold tracking-wider uppercase text-[7px]">LIVE TICKER:</span>
        <span className="text-emerald-400">▲ AAPL $182.50 (+1.2%)</span>
        <span className="text-emerald-400">▲ NVDA $875.20 (+3.4%)</span>
        <span className="text-emerald-400">▲ BTC $67,400 (+2.8%)</span>
        <span className="text-emerald-400">▲ ETH $3,520 (+1.9%)</span>
        <span className="text-emerald-400">▲ TSLA $175.40 (+0.8%)</span>
      </div>

      {/* 3. AUTHENTIC WMCW HEADER */}
      <div className="bg-white px-3 py-1.5 border-b-2 border-blue-900 shadow-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-extrabold text-blue-900 text-[10.5px] tracking-tight">
            <span>💰</span>
            <span>WMCW Dashboard</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[7.5px] font-bold text-slate-700">
            <span>◀</span>
            <span>{monthLabel}</span>
            <span>▶</span>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[7.5px] font-bold">
          <span className={`px-2 py-0.5 rounded ${activeView === 'Dashboard' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600'}`}>
            Dashboard
          </span>
          <span className={`px-2 py-0.5 rounded ${activeView === 'Reports' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600'}`}>
            Reports
          </span>
          <span className={`px-2 py-0.5 rounded ${activeView === 'Admin' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600'}`}>
            Admin
          </span>
        </div>

        {/* Header Action Badges */}
        <div className="flex items-center gap-1 text-[7.5px]">
          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-0.5">
            <span>✓</span>
            <span>DATABASE SECURED</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-xs">
            ✨ AI ADVISOR
          </span>
          <span className="px-1.5 py-0.5 rounded bg-blue-900 text-white font-bold">
            Edit
          </span>
          <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold">
            Sync Next Steps
          </span>
        </div>
      </div>

      {/* 4. ACTIVE SCREEN CONTENT */}
      <div className="bg-slate-50 p-2.5 space-y-2">
        {children}
      </div>
    </div>
  );
};

// SUB-COMPONENT: TOPIC MOCKUP RENDERER
// Renders rich, realistic UI showcases using actual Guest Mode values
const TopicMockupRenderer: React.FC<{
  topicId: AdTopicId;
  metrics: any;
  currentData: any;
}> = ({ topicId, metrics, currentData }) => {

  switch (topicId) {
    case 'landing_page':
      return (
        <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 bg-white text-slate-900 text-[9px]">
          {/* Top Browser Chrome */}
          <div className="bg-slate-900 px-3 py-1.5 flex items-center justify-between border-b border-slate-800 text-[8px] text-slate-400 select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            </div>
            <div className="bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-slate-800 text-slate-300 flex items-center gap-1 font-mono text-[7.5px]">
              <span className="text-emerald-400">🔒</span>
              <span>https://whatsmycreditworth.com</span>
            </div>
            <span className="text-[7.5px] text-emerald-400 font-bold">Public Gateway</span>
          </div>

          {/* Landing Page Navbar */}
          <div className="px-3 py-2 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💰</span>
              <span className="font-extrabold text-blue-900 text-[11px] tracking-tight">WMCW</span>
              <span className="text-[7.5px] text-slate-500 font-medium hidden sm:inline">What's My Credit Worth</span>
            </div>
            <div className="flex items-center gap-1.5 text-[8px]">
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                ▶ Tour
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                Guest Mode
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-900 text-white font-bold">
                Login
              </span>
            </div>
          </div>

          {/* Hero Section */}
          <div className="p-3 bg-gradient-to-b from-blue-50/60 via-slate-50 to-white text-center space-y-2">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold text-[7.5px] border border-blue-200">
              <span>⭐</span>
              <span>PERSONAL FINANCE DASHBOARD</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
              Know Your Worth.{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Grow Your Future.
              </span>
            </h3>
            <p className="text-[8px] text-slate-600 max-w-sm mx-auto leading-relaxed">
              The comprehensive, private way to track your assets, liabilities, and credit scores across all major bureaus.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 shadow-xs text-slate-800 font-bold text-[8px] flex items-center gap-1">
                <span className="font-black text-blue-600">G</span>
                <span>Sign in with Google</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[8px] shadow-xs flex items-center gap-1">
                <span>Guest Mode (Instant Access) &rarr;</span>
              </div>
            </div>

            {/* 3 Value Pillars */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 text-left">
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                <div className="font-bold text-blue-900 text-[8px]">Multi-Bureau Scores</div>
                <div className="text-[7.5px] text-slate-500 mt-0.5">Experian, Equifax, TransUnion &amp; Mortgage FICO 4</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                <div className="font-bold text-emerald-800 text-[8px]">4 Steps to Freedom</div>
                <div className="text-[7.5px] text-slate-500 mt-0.5">Income-driven formulas from emergency cash to FIRE</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                <div className="font-bold text-indigo-900 text-[8px]">1-Click Next Steps</div>
                <div className="text-[7.5px] text-slate-500 mt-0.5">4-character match keys prevent duplicate syncs</div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'wmcw_dashboard':
      return (
        <AppViewportChrome activeView="Dashboard">
          {/* 5 TOP VITAL METRIC CARDS */}
          <div className="grid grid-cols-5 gap-1.5 text-center">
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-[7px] font-bold text-slate-500 uppercase">Net Worth</div>
              <div className="text-[10px] font-black text-emerald-600">+{formatCurrency(metrics?.totalAssets - metrics?.totalDebt)}</div>
              <div className="text-[6.5px] text-emerald-700 font-semibold mt-0.5">▲ +$8,450 MoM</div>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-[7px] font-bold text-slate-500 uppercase">Total Assets</div>
              <div className="text-[10px] font-black text-blue-900">{formatCurrency(metrics?.totalAssets || 257400)}</div>
              <div className="text-[6.5px] text-slate-500 mt-0.5">4 Accounts</div>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-[7px] font-bold text-slate-500 uppercase">Total Debt</div>
              <div className="text-[10px] font-black text-rose-600">-{formatCurrency(metrics?.totalDebt || 116850)}</div>
              <div className="text-[6.5px] text-slate-500 mt-0.5">$1.4k Cards / $115k Loans</div>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-[7px] font-bold text-slate-500 uppercase">Monthly Income</div>
              <div className="text-[10px] font-black text-emerald-600">+{formatCurrency(metrics?.monthlyIncome || 9350)}</div>
              <div className="text-[6.5px] text-slate-500 mt-0.5">2 Sources</div>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-[7px] font-bold text-slate-500 uppercase">DTI Ratio</div>
              <div className="text-[10px] font-black text-emerald-600">{metrics?.dti.toFixed(1) || '33.1'}%</div>
              <div className="text-[6.5px] text-emerald-700 font-bold mt-0.5">Optimal (≤36%)</div>
            </div>
          </div>

          {/* DASHBOARD CORE: CHART & CREDIT SCORES */}
          <div className="grid grid-cols-2 gap-2">
            {/* Chart Switcher Preview */}
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1 text-[7.5px] font-bold">
                  <span className="px-1.5 py-0.5 bg-blue-900 text-white rounded">Net Worth Over Time</span>
                  <span className="px-1.5 py-0.5 text-slate-500">Credit Scores</span>
                </div>
                <span className="text-[7px] font-mono text-emerald-600 font-bold">+24.3% YoY</span>
              </div>
              <div className="py-2 px-1">
                {/* Visual Trajectory Curve */}
                <div className="h-10 flex items-end justify-between gap-2 px-2 border-b border-slate-100">
                  <div className="flex flex-col items-center">
                    <span className="text-[6.5px] text-slate-400">$118k</span>
                    <div className="w-5 bg-blue-200 rounded-t h-4"></div>
                    <span className="text-[6.5px] text-slate-500 mt-0.5">Dec</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[6.5px] text-slate-400">$124k</span>
                    <div className="w-5 bg-blue-300 rounded-t h-5"></div>
                    <span className="text-[6.5px] text-slate-500 mt-0.5">Jan</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[6.5px] text-slate-400">$132k</span>
                    <div className="w-5 bg-blue-500 rounded-t h-7"></div>
                    <span className="text-[6.5px] text-slate-500 mt-0.5">Feb</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[6.5px] font-bold text-emerald-600">$140.5k</span>
                    <div className="w-5 bg-emerald-500 rounded-t h-9 shadow-xs"></div>
                    <span className="text-[6.5px] font-bold text-blue-900 mt-0.5">Mar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Scores Card */}
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="font-bold text-blue-900 text-[8px]">Multi-Bureau Credit Scores</span>
                <span className="text-[7px] text-emerald-600 font-bold">+45 pts Past 4 Mo</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="bg-blue-50/70 p-1 rounded border border-blue-100">
                  <div className="text-[6.5px] text-slate-500">Experian</div>
                  <div className="text-[10px] font-black text-blue-900">730</div>
                  <div className="text-[6px] text-emerald-600 font-bold">▲ +15</div>
                </div>
                <div className="bg-rose-50/70 p-1 rounded border border-rose-100">
                  <div className="text-[6.5px] text-slate-500">Equifax</div>
                  <div className="text-[10px] font-black text-rose-800">716</div>
                  <div className="text-[6px] text-emerald-600 font-bold">▲ +12</div>
                </div>
                <div className="bg-emerald-50/70 p-1 rounded border border-emerald-100">
                  <div className="text-[6.5px] text-slate-500">TransUnion</div>
                  <div className="text-[10px] font-black text-emerald-800">732</div>
                  <div className="text-[6px] text-emerald-600 font-bold">▲ +14</div>
                </div>
              </div>
              <div className="flex justify-between text-[7px] text-slate-600 px-1 pt-0.5">
                <span>Auto FICO: <strong className="text-slate-900">728</strong></span>
                <span>Mr. Cooper FICO 4: <strong className="text-amber-700">740</strong></span>
              </div>
            </div>
          </div>

          {/* BOTTOM STRIP: CARDS & ASSETS PREVIEW */}
          <div className="grid grid-cols-2 gap-2 text-[7.5px]">
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">Revolving Card Utilization:</span>
                <span className="text-emerald-700 font-black ml-1">2.64%</span>
                <span className="text-slate-400 ml-1">($1,400 / $53,000)</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[7px]">Optimal &lt;10%</span>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">Liquid Runway (Marcus HYSA):</span>
                <span className="text-blue-900 font-black ml-1">$18,000.00</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[7px]">5.8 Mo Runway</span>
            </div>
          </div>
        </AppViewportChrome>
      );

    case 'edit_data':
      return (
        <AppViewportChrome activeView="Dashboard">
          {/* AUTHENTIC DATA EDITOR MODAL VIEWPORT */}
          <div className="bg-white rounded-xl border-2 border-blue-900 shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-blue-950 text-white px-3 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-[9px]">
                <span>✏️</span>
                <span>Edit Data for March 2026</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[7.5px] border border-emerald-500/30">
                  ✓ Database Secured
                </span>
                <span className="text-slate-400 text-[9px] cursor-pointer">✕</span>
              </div>
            </div>

            {/* 1-Click Copy Bar */}
            <div className="bg-amber-50 px-3 py-1 border-b border-amber-200 flex items-center justify-between text-[7.5px]">
              <div className="flex items-center gap-1.5 text-amber-900 font-medium">
                <span>Start with data from another month?</span>
                <span className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold text-slate-800">
                  February 2026 ▼
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black cursor-pointer shadow-2xs">
                📋 Copy Data
              </span>
            </div>

            {/* Tab Categories */}
            <div className="flex items-center gap-1 px-3 py-1 bg-slate-100 border-b border-slate-200 text-[7.5px] font-bold">
              <span className="px-2 py-0.5 rounded bg-white text-blue-900 shadow-xs border border-slate-200">Scores</span>
              <span className="px-2 py-0.5 rounded bg-blue-900 text-white">Income</span>
              <span className="px-2 py-0.5 rounded bg-white text-slate-700">Credit Cards</span>
              <span className="px-2 py-0.5 rounded bg-white text-slate-700">Loans</span>
              <span className="px-2 py-0.5 rounded bg-white text-slate-700">Assets</span>
            </div>

            {/* Active Ledger Form Rows */}
            <div className="p-2 space-y-1.5 text-[8px]">
              <div className="grid grid-cols-4 gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[6.5px] text-slate-500 block">Experian FICO</span>
                  <input readOnly value="730" className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 font-bold text-blue-900 font-mono" />
                </div>
                <div>
                  <span className="text-[6.5px] text-slate-500 block">Equifax FICO</span>
                  <input readOnly value="716" className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 font-bold text-rose-800 font-mono" />
                </div>
                <div>
                  <span className="text-[6.5px] text-slate-500 block">TransUnion FICO</span>
                  <input readOnly value="732" className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 font-bold text-emerald-800 font-mono" />
                </div>
                <div>
                  <span className="text-[6.5px] text-slate-500 block">🏠 Mortgage Label &amp; Score</span>
                  <input readOnly value="Mr. Cooper: 740" className="w-full bg-white border border-amber-300 rounded px-1 py-0.5 font-bold text-amber-900 font-mono" />
                </div>
              </div>

              {/* Sample Card Row with 4-Char Match Key */}
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 flex items-center justify-between text-[7.5px]">
                <div className="flex items-center gap-1.5">
                  <span className="px-1 py-0.2 rounded bg-blue-100 text-blue-900 font-mono font-bold text-[7px]">KEY #4819</span>
                  <span className="font-bold text-slate-800">Chase Sapphire Preferred</span>
                  <span className="text-slate-400">| 21.4% APR</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span>Bal: <strong className="text-blue-900">$900.00</strong></span>
                  <span>Limit: <strong>$15,000.00</strong></span>
                </div>
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[8px]">
              <span className="text-slate-500 text-[7px]">Auto-saved 1.2s ago • Encrypted</span>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-white text-slate-700 font-bold border border-slate-300">
                  Cancel
                </span>
                <span className="px-3 py-0.5 rounded bg-blue-900 text-white font-bold shadow-xs flex items-center gap-1">
                  <span>💾</span>
                  <span>Save Changes</span>
                </span>
              </div>
            </div>
          </div>
        </AppViewportChrome>
      );

    case 'reports':
      return (
        <AppViewportChrome activeView="Reports">
          {/* AUTHENTIC REPORTS BANNER */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-2.5 rounded-xl shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold text-[7px] border border-amber-400/30">
                <span>🛡️ FIDUCIARY ADVISORY REPORT</span>
                <span>• Period: March 2026</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-500 text-white font-black text-[7.5px] shadow-xs">
                Export to PDF
              </span>
            </div>

            <div>
              <h4 className="font-black text-[10px] text-white tracking-tight">
                Comprehensive Financial Planning Report
              </h4>
              <p className="text-[7.5px] text-slate-300 leading-snug max-w-lg mt-0.5">
                Generate an institutional-grade, multi-topic financial advisory report highlighting balance sheet health, Monte Carlo retirement probabilities, and wealth roadmap.
              </p>
            </div>

            {/* 9 Table of Contents Chips */}
            <div className="grid grid-cols-3 gap-1 text-[7px]">
              <div className="bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 font-medium text-slate-200">
                1. Executive Summary
              </div>
              <div className="bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 font-medium text-slate-200">
                2. Balance Sheet &amp; Net Worth
              </div>
              <div className="bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 font-medium text-slate-200">
                3. Cash Flow &amp; Surplus
              </div>
              <div className="bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 font-medium text-emerald-300">
                4. Monte Carlo (89.2% Prob)
              </div>
              <div className="bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 font-medium text-slate-200">
                5. Portfolio &amp; Risk
              </div>
              <div className="bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 font-medium text-slate-200">
                6. Insurance &amp; Liability
              </div>
              <div className="bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 font-medium text-slate-200">
                7. Tax &amp; Estate Checklist
              </div>
              <div className="bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 font-medium text-slate-200">
                8. Action Plan &amp; Steps
              </div>
              <div className="bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 font-medium text-slate-200">
                9. Disclosures &amp; Appendix
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <span className="text-[7.5px] text-slate-300">Simulation: <strong className="text-emerald-300">89.2% Monte Carlo Sustainability</strong></span>
              <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black rounded-lg text-[8px] shadow-sm">
                📊 Generate Financial Planning Report &rarr;
              </span>
            </div>
          </div>

          {/* PERIOD OVER PERIOD DELTA AUDIT */}
          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-[7.5px]">
            <div>
              <span className="text-slate-500">Period Comparison:</span>
              <strong className="text-slate-800 ml-1">February 2026 vs. March 2026</strong>
            </div>
            <div className="flex items-center gap-3 font-mono">
              <span>Net Worth: <strong className="text-emerald-700">+${(8450).toLocaleString()} (+6.4%)</strong></span>
              <span>Debt Reduction: <strong className="text-blue-900">-$650.00</strong></span>
              <span>Liquid HYSA: <strong className="text-emerald-700">+$2,200.00</strong></span>
            </div>
          </div>
        </AppViewportChrome>
      );

    case 'four_steps':
      return (
        <AppViewportChrome activeView="Dashboard">
          {/* THE ACTUAL 4 STEPS TO FINANCIAL FREEDOM COMPONENT */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-[9px]">
                  ✓
                </span>
                <div>
                  <h4 className="font-extrabold text-blue-900 text-[9.5px]">4 Steps to Financial Freedom</h4>
                  <p className="text-[7px] text-slate-500">Personalized milestone targets derived from your monthly income</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[7.5px]">
                Monthly Income Baseline: <strong className="text-blue-900">$9,350.00</strong>
              </span>
            </div>

            {/* 4 EXACT FORMULA-DRIVEN STEPS */}
            <div className="grid grid-cols-2 gap-1.5 text-[7.5px]">
              {/* Step 1 */}
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900">Step 1: Replace Monthly Income</span>
                  <span className="font-mono text-slate-400 text-[6.5px]">Income × 300</span>
                </div>
                <div className="text-[9.5px] font-black text-slate-900 font-mono">$2,805,000.00 <span className="text-[7px] font-normal text-slate-500">Invested Target</span></div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '9.2%' }}></div>
                </div>
                <div className="flex justify-between text-[6.5px] text-slate-500">
                  <span>Invested: $257,400</span>
                  <span className="font-bold text-blue-900">9.2% to Perpetual 4% Rule</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-50 p-2 rounded-lg border border-emerald-200 bg-emerald-50/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">Step 2: Minimum Monthly Investment</span>
                  <span className="font-mono text-slate-400 text-[6.5px]">Income × 2%</span>
                </div>
                <div className="text-[9.5px] font-black text-emerald-700 font-mono">$187.00/mo <span className="text-[7px] font-normal text-slate-500">Minimum Habit</span></div>
                <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
                <div className="flex justify-between text-[6.5px] text-emerald-800 font-bold">
                  <span>Currently Investing: $1,250/mo</span>
                  <span>ACHIEVED ✓</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900">Step 3: High Yield Savings Reserve</span>
                  <span className="font-mono text-slate-400 text-[6.5px]">Income × 3</span>
                </div>
                <div className="text-[9.5px] font-black text-slate-900 font-mono">$28,050.00 <span className="text-[7px] font-normal text-slate-500">HYSA Cash Buffer</span></div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '64.2%' }}></div>
                </div>
                <div className="flex justify-between text-[6.5px] text-slate-500">
                  <span>In Marcus HYSA: $18,000</span>
                  <span className="font-bold text-amber-700">64.2% (5.8 Mo Runway)</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900">Step 4: Rainy Day Monthly Savings Cap</span>
                  <span className="font-mono text-slate-400 text-[6.5px]">Income × 50%</span>
                </div>
                <div className="text-[9.5px] font-black text-purple-950 font-mono">$4,675.00/mo <span className="text-[7px] font-normal text-slate-500">Max Savings Cap</span></div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: '45%' }}></div>
                </div>
                <div className="flex justify-between text-[6.5px] text-slate-500">
                  <span>Prevents Cash Drag</span>
                  <span className="font-bold text-purple-900">Forces Surplus into Step 1</span>
                </div>
              </div>
            </div>
          </div>
        </AppViewportChrome>
      );

    case 'credit_scores':
      return (
        <AppViewportChrome activeView="Dashboard">
          {/* THE ACTUAL CREDIT SCORES & VELOCITY SCREEN */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-blue-900 text-[9.5px]">Credit Scores Over Time &amp; Velocity</span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[7px]">
                  +45 pts Multi-Bureau Surge
                </span>
              </div>
              <div className="flex items-center gap-1 text-[7.5px]">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Net Worth</span>
                <span className="px-2 py-0.5 bg-blue-900 text-white font-bold rounded">Credit Scores Over Time</span>
              </div>
            </div>

            {/* 6 Bureau Scores Grid */}
            <div className="grid grid-cols-6 gap-1 text-center">
              <div className="bg-blue-50/80 p-1 rounded-lg border border-blue-100">
                <div className="text-[6.5px] text-slate-500 font-medium">Experian</div>
                <div className="text-[11px] font-black text-blue-900">730</div>
                <div className="text-[6px] text-emerald-600 font-bold">▲ +15 MoM</div>
              </div>
              <div className="bg-rose-50/80 p-1 rounded-lg border border-rose-100">
                <div className="text-[6.5px] text-slate-500 font-medium">Equifax</div>
                <div className="text-[11px] font-black text-rose-800">716</div>
                <div className="text-[6px] text-emerald-600 font-bold">▲ +12 MoM</div>
              </div>
              <div className="bg-emerald-50/80 p-1 rounded-lg border border-emerald-100">
                <div className="text-[6.5px] text-slate-500 font-medium">TransUnion</div>
                <div className="text-[11px] font-black text-emerald-800">732</div>
                <div className="text-[6px] text-emerald-600 font-bold">▲ +14 MoM</div>
              </div>
              <div className="bg-purple-50/80 p-1 rounded-lg border border-purple-100">
                <div className="text-[6.5px] text-slate-500 font-medium">Auto FICO 8</div>
                <div className="text-[11px] font-black text-purple-900">728</div>
                <div className="text-[6px] text-slate-400">Prime Tier</div>
              </div>
              <div className="bg-indigo-50/80 p-1 rounded-lg border border-indigo-100">
                <div className="text-[6.5px] text-slate-500 font-medium">Card FICO 8</div>
                <div className="text-[11px] font-black text-indigo-900">736</div>
                <div className="text-[6px] text-slate-400">Prime Tier</div>
              </div>
              <div className="bg-amber-50/80 p-1 rounded-lg border border-amber-200">
                <div className="text-[6.5px] text-slate-500 font-medium">Mr. Cooper FICO 4</div>
                <div className="text-[11px] font-black text-amber-900">740</div>
                <div className="text-[6px] text-amber-700 font-bold">Mortgage Tier</div>
              </div>
            </div>

            {/* Historical Score Trajectory Table */}
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1 text-[7.5px]">
              <div className="flex items-center justify-between text-slate-600 font-bold border-b border-slate-200 pb-0.5">
                <span>Reporting Month</span>
                <span>Experian FICO</span>
                <span>Equifax FICO</span>
                <span>TransUnion FICO</span>
                <span>Revolving Utilization</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 font-mono">
                <span>Dec 2025</span>
                <span>685</span>
                <span>680</span>
                <span>690</span>
                <span className="text-rose-600 font-bold">18.4%</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 font-mono">
                <span>Jan 2026</span>
                <span>700</span>
                <span>692</span>
                <span>704</span>
                <span className="text-amber-600 font-bold">9.5%</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 font-mono">
                <span>Feb 2026</span>
                <span>715</span>
                <span>704</span>
                <span>718</span>
                <span className="text-emerald-600 font-bold">4.2%</span>
              </div>
              <div className="flex items-center justify-between text-blue-900 font-mono font-bold bg-white p-1 rounded shadow-2xs">
                <span>Mar 2026 (Active)</span>
                <span className="text-blue-600">730 (▲ +15)</span>
                <span className="text-rose-600">716 (▲ +12)</span>
                <span className="text-emerald-600">732 (▲ +14)</span>
                <span className="text-emerald-600">2.64% (Optimal)</span>
              </div>
            </div>
          </div>
        </AppViewportChrome>
      );

    case 'cards_vs_loans':
      return (
        <AppViewportChrome activeView="Dashboard">
          {/* THE ACTUAL CREDIT CARDS VS LOANS SECTION */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 rounded bg-blue-900 text-white font-bold text-[8px] shadow-xs">
                  Credit Cards (3)
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[8px]">
                  Loans (2)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-[7.5px] shadow-xs">
                  RUN SIMULATION ✨
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[7.5px] border border-slate-200">
                  Next Steps Sync
                </span>
              </div>
            </div>

            {/* Total Utilization Banner */}
            <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg flex items-center justify-between text-[8px]">
              <div>
                <span className="font-bold text-slate-700">Total Revolving Utilization:</span>
                <span className="text-emerald-800 font-black ml-1 text-[10px]">2.64%</span>
                <span className="text-slate-500 ml-1">($1,400.00 Balance / $53,000.00 Total Limit)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[7px] tracking-wider">
                ELITE TIER (&lt;10%)
              </span>
            </div>

            {/* Active Credit Cards List */}
            <div className="space-y-1 text-[7.5px]">
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="px-1 py-0.2 rounded bg-blue-100 text-blue-900 font-mono font-bold text-[7px]">#4819</span>
                  <span className="font-bold text-slate-800">Chase Sapphire Preferred</span>
                  <span className="text-slate-400">| 21.4% APR</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span>Bal: <strong className="text-blue-900">$900.00</strong></span>
                  <span>Limit: $15,000</span>
                  <span className="text-emerald-600 font-bold">(6.0% util)</span>
                </div>
              </div>

              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="px-1 py-0.2 rounded bg-blue-100 text-blue-900 font-mono font-bold text-[7px]">#1024</span>
                  <span className="font-bold text-slate-800">Amex Platinum Card</span>
                  <span className="text-slate-400">| 19.9% APR</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span>Bal: <strong className="text-blue-900">$300.00</strong></span>
                  <span>Limit: $30,000</span>
                  <span className="text-emerald-600 font-bold">(1.0% util)</span>
                </div>
              </div>

              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="px-1 py-0.2 rounded bg-blue-100 text-blue-900 font-mono font-bold text-[7px]">#8831</span>
                  <span className="font-bold text-slate-800">Apple Card Master</span>
                  <span className="text-slate-400">| 24.2% APR</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span>Bal: <strong className="text-blue-900">$200.00</strong></span>
                  <span>Limit: $8,000</span>
                  <span className="text-emerald-600 font-bold">(2.5% util)</span>
                </div>
              </div>
            </div>

            {/* Simulation Callout */}
            <div className="bg-indigo-50 border border-indigo-200 p-1.5 rounded-lg flex items-center justify-between text-[7px] text-indigo-950">
              <span>💡 <strong>Payoff Simulation:</strong> Paying down $900 Chase drops utilization to 0.94% for an estimated +12 to +15 pt score jump.</span>
              <span className="font-bold text-indigo-600">Simulate Now &rarr;</span>
            </div>
          </div>
        </AppViewportChrome>
      );

    case 'assets':
      return (
        <AppViewportChrome activeView="Dashboard">
          {/* THE ACTUAL ASSETS CARD */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-blue-900 text-[9.5px]">Total Asset Holdings</h4>
                <p className="text-[7px] text-slate-500">Liquid Reserves, 401k, Real Estate Equity &amp; Crypto</p>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-black text-emerald-700 font-mono">
                  {formatCurrency(metrics?.totalAssets || 257400)}
                </div>
                <span className="text-[7px] text-emerald-800 font-bold">▲ +$2,200 This Month</span>
              </div>
            </div>

            {/* Asset Accounts List with 4-Char Match Keys */}
            <div className="space-y-1.5 text-[7.5px]">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[7px]">KEY #7724</span>
                  <div>
                    <div className="font-bold text-slate-900">Home Equity (Primary Residence)</div>
                    <div className="text-[6.5px] text-slate-400">Real Estate • Collateralized Asset</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-black text-slate-900 text-[9px]">$126,500.00</div>
                  <div className="text-[6.5px] text-slate-500">49.1% of Portfolio</div>
                </div>
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-mono font-bold text-[7px]">KEY #9102</span>
                  <div>
                    <div className="font-bold text-slate-900">Fidelity 401(k) Retirement</div>
                    <div className="text-[6.5px] text-slate-400">Tax-Advantaged Compound Growth</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-black text-blue-900 text-[9px]">$94,600.00</div>
                  <div className="text-[6.5px] text-slate-500">36.8% of Portfolio</div>
                </div>
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-emerald-200 bg-emerald-50/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono font-bold text-[7px]">KEY #4821</span>
                  <div>
                    <div className="font-bold text-emerald-950">Marcus High-Yield Savings (HYSA)</div>
                    <div className="text-[6.5px] text-emerald-700 font-bold">Liquid Cash Reserve • 4.75% APY</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-black text-emerald-700 text-[9px]">$18,000.00</div>
                  <div className="text-[6.5px] text-emerald-800 font-bold">5.8 Mo Living Runway</div>
                </div>
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 font-mono font-bold text-[7px]">KEY #3318</span>
                  <div>
                    <div className="font-bold text-slate-900">Coinbase Bitcoin (BTC)</div>
                    <div className="text-[6.5px] text-slate-400">Alternative Digital Asset</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-black text-purple-900 text-[9px]">$18,300.00</div>
                  <div className="text-[6.5px] text-slate-500">7.1% of Portfolio</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[7px] text-slate-500 pt-0.5">
              <span>All 4 accounts formatted for 1-click Next Steps App auto-reconciliation</span>
              <span className="text-blue-900 font-bold">Ready to Sync &rarr;</span>
            </div>
          </div>
        </AppViewportChrome>
      );

    case 'ai_advisor':
      return (
        <AppViewportChrome activeView="Dashboard">
          {/* THE ACTUAL AI ADVISOR CONSOLE VIEWPORT */}
          <div className="bg-white rounded-xl border-2 border-indigo-900 shadow-xl overflow-hidden space-y-2 p-2.5">
            {/* Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-[8.5px]">
              <div className="flex items-center gap-1.5 font-black text-blue-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>AI ADVISOR ✨ • Fiduciary Intelligence</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold text-[7px]">
                Balance-Sheet Aware
              </span>
            </div>

            {/* Live Financial Vital Chips */}
            <div className="grid grid-cols-4 gap-1 text-center text-[7px]">
              <div className="bg-slate-50 p-1 rounded border border-slate-200">
                <span className="text-slate-400 block">Monthly Income</span>
                <strong className="text-slate-900 font-mono">$9,350/mo</strong>
              </div>
              <div className="bg-slate-50 p-1 rounded border border-slate-200">
                <span className="text-slate-400 block">Monthly Bills</span>
                <strong className="text-slate-900 font-mono">$3,095/mo</strong>
              </div>
              <div className="bg-emerald-50 p-1 rounded border border-emerald-200">
                <span className="text-emerald-700 block">Cash Surplus</span>
                <strong className="text-emerald-800 font-mono">+$6,255/mo</strong>
              </div>
              <div className="bg-blue-50 p-1 rounded border border-blue-200">
                <span className="text-blue-700 block">Liquid Runway</span>
                <strong className="text-blue-900 font-mono">5.8 Months</strong>
              </div>
            </div>

            {/* Real User & Advisor Exchange */}
            <div className="space-y-1.5 text-[8px]">
              <div className="bg-slate-100 p-2 rounded-lg text-slate-800 flex items-start gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-900 text-white text-[7px] font-bold flex items-center justify-center shrink-0">U</span>
                <div>
                  <span className="font-bold text-blue-900">You:</span>
                  <p className="mt-0.5 text-slate-700">"How should I allocate my $6,255 monthly cash flow surplus to reach Step 1 ($2.8M) faster?"</p>
                </div>
              </div>

              <div className="bg-indigo-50/70 p-2 rounded-lg border border-indigo-200 text-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[7px] text-indigo-900 font-bold">
                  <span>🤖 WMCW Fiduciary Advisor</span>
                  <span className="text-slate-400 font-mono">1.2s</span>
                </div>
                <p className="text-[7.5px] leading-relaxed text-indigo-950">
                  "1) Your Marcus HYSA ($18k) covers <strong>5.8 months of expenses</strong>—Step 3 is secure. 2) Eliminate the <strong>$900 Chase balance</strong> to drop card utilization below 1% for a <strong>+12 to +15 pt FICO boost</strong>. 3) Funnel <strong>$4,500/mo</strong> into low-cost index ETFs (VTI/VOO), putting you on track to reach your <strong>$2.805M Step 1 target in 18.2 years</strong>."
                </p>
              </div>
            </div>
          </div>
        </AppViewportChrome>
      );

    case 'profile_settings':
      return (
        <AppViewportChrome activeView="Dashboard">
          {/* USER PROFILE & ACCOUNT SETTINGS MODAL */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-2.5 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-base">⚙️</span>
                <div>
                  <h4 className="font-extrabold text-blue-900 text-[9.5px]">User Profile, Account Type &amp; Tickers</h4>
                  <p className="text-[7px] text-slate-500">Tailor entity ledger rules and stream live market data</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold text-[7.5px] border border-purple-200">
                Business Mode Enabled
              </span>
            </div>

            {/* Mode Switcher */}
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1.5 text-[8px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Accounting Entity Type:</span>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-medium">Personal</span>
                  <span className="px-2 py-0.5 rounded bg-purple-900 text-white font-bold shadow-xs">Business / LLC</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[7.5px] text-slate-600 bg-white p-1.5 rounded border border-slate-200">
                <span>Active Entity: <strong className="text-purple-950">Apex Holdings LLC</strong></span>
                <span className="font-mono text-slate-400">EIN: 84-xxxxxxx</span>
              </div>
            </div>

            {/* Stock Tickers Config */}
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1 text-[7.5px]">
              <div className="flex items-center justify-between text-slate-700 font-bold">
                <span>Live Streaming Market Symbols:</span>
                <span className="text-blue-900 text-[7px]">+ Add Symbol</span>
              </div>
              <div className="flex flex-wrap gap-1 font-mono text-[7px]">
                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-bold text-slate-800">AAPL</span>
                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-bold text-slate-800">NVDA</span>
                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-bold text-slate-800">TSLA</span>
                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-bold text-emerald-700">BTC</span>
                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-bold text-emerald-700">ETH</span>
                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-bold text-slate-800">MSFT</span>
              </div>
            </div>
          </div>
        </AppViewportChrome>
      );

    case 'sync_next_steps':
      return (
        <AppViewportChrome activeView="Dashboard">
          {/* THE ACTUAL 1-CLICK NEXT STEPS SYNC MODAL */}
          <div className="bg-white rounded-xl border-2 border-indigo-900 shadow-xl overflow-hidden">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white px-3 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-[9px]">
                <span>🔄</span>
                <span>1-Click Sync to Next Steps App</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 font-black text-[7px]">
                v2.0 Payload
              </span>
            </div>

            {/* Summary Bar */}
            <div className="bg-slate-100 px-3 py-1 border-b border-slate-200 flex items-center justify-between text-[7.5px] text-slate-700">
              <div>
                <span>Snapshot: <strong>March 2026</strong></span>
                <span className="mx-1.5">•</span>
                <span>Accounts: <strong>8 total</strong> (3 Cards, 2 Loans, 3 Assets)</span>
              </div>
              <span className="text-emerald-700 font-bold font-mono">Net Worth: +{formatCurrency(metrics?.totalAssets - metrics?.totalDebt)}</span>
            </div>

            {/* Match Key Explanation */}
            <div className="px-3 py-1 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between text-[7px] text-indigo-950">
              <span>🔑 <strong>4-Char Match Keys:</strong> Use exact account keys (e.g. #4819, #9012) to update balances without duplicates.</span>
              <span className="font-bold text-indigo-600">Auto-Diff Ready</span>
            </div>

            {/* Reconcile Accounts Table */}
            <div className="p-2 space-y-1 text-[7.5px]">
              <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded border border-slate-200 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="px-1 py-0.2 rounded bg-blue-100 text-blue-900 font-bold text-[7px]">#4819</span>
                  <span className="text-slate-800 font-sans font-bold">Chase Sapphire Preferred</span>
                </div>
                <span>$900.00 <span className="text-emerald-600">(Card)</span></span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded border border-slate-200 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="px-1 py-0.2 rounded bg-purple-100 text-purple-900 font-bold text-[7px]">#9012</span>
                  <span className="text-slate-800 font-sans font-bold">BMW i4 Auto Loan</span>
                </div>
                <span>$40,050.00 <span className="text-purple-600">(Loan)</span></span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded border border-slate-200 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-900 font-bold text-[7px]">#4821</span>
                  <span className="text-slate-800 font-sans font-bold">Marcus High-Yield Savings</span>
                </div>
                <span>$18,000.00 <span className="text-emerald-600 font-bold">(Asset)</span></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[8px]">
              <span className="text-slate-500 text-[7px]">Ready to paste into Next Steps App</span>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black shadow-xs flex items-center gap-1 cursor-pointer">
                  <span>📋</span>
                  <span>Copy Sync Payload</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold cursor-pointer">
                  ⬇ Download .JSON
                </span>
              </div>
            </div>
          </div>
        </AppViewportChrome>
      );

    case 'chat_with_us':
      return (
        <AppViewportChrome activeView="Dashboard">
          {/* THE ACTUAL CHAT WITH US DRAWER & FLOATING ACTION BUTTON */}
          <div className="relative space-y-2">
            {/* Live Chat Window */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="bg-blue-950 text-white px-3 py-1.5 flex items-center justify-between text-[8.5px]">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Chat With Us • 24/7 Fiduciary Advisor &amp; Support</span>
                </div>
                <span className="text-slate-400 text-[9px]">✕</span>
              </div>

              {/* Chat Stream */}
              <div className="p-2 space-y-1.5 text-[8px]">
                <div className="bg-slate-100 p-1.5 rounded-lg text-slate-800 flex items-start gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-900 text-white text-[7px] font-bold flex items-center justify-center shrink-0">U</span>
                  <div>
                    <span className="font-bold text-blue-900 text-[7px]">You asked:</span>
                    <p className="text-slate-700 text-[7.5px]">"Which credit card should I pay down first to boost my FICO 8 score to 750?"</p>
                  </div>
                </div>

                <div className="bg-blue-50/70 p-2 rounded-lg border border-blue-200 space-y-1">
                  <div className="flex items-center justify-between text-[7px] text-blue-900 font-bold">
                    <span>🤖 WMCW Fiduciary AI Advisor</span>
                    <span className="text-slate-400 font-mono">1.1s</span>
                  </div>
                  <p className="text-[7.5px] leading-relaxed text-slate-800">
                    "Your overall card utilization is already low at <strong>2.64%</strong> ($1,400 across $53,000 limits). However, your <strong>Chase Sapphire (#4819)</strong> carries $900 of that debt. Paying down $650 on Chase will drop that card's utilization from 6% to 1.6%, unlocking an estimated <strong>+12 to +15 pt FICO score jump</strong> before your next statement closes."
                  </p>
                </div>
              </div>

              {/* Direct Support Footer */}
              <div className="px-3 py-1 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[7px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="text-amber-700 font-bold">★ Bookmark Strategy</span>
                  <span>🔍 Search Past Chats</span>
                </div>
                <span>Direct Support: <strong className="text-blue-900 font-mono">dlaniger.napm.consulting@gmail.com</strong></span>
              </div>
            </div>

            {/* The Authentic Floating Action Button */}
            <div className="flex justify-end pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-900 text-white font-black text-[8.5px] shadow-lg border-2 border-white">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Chat With Us 💬</span>
              </div>
            </div>
          </div>
        </AppViewportChrome>
      );

    default:
      return null;
  }
};

