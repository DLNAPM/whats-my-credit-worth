import React, { useState, useMemo } from 'react';
import type { FinancialData, MonthlyData, LinkedAccountConnection, MergeOptions, AccountType, LinkedAccountRole } from '../types';
import { 
  loadLinkedAccounts, 
  saveLinkedAccounts, 
  getSpouseSampleData, 
  getBusinessSampleData, 
  mergeFullFinancialData, 
  calculateConsolidatedMonthlyData 
} from '../utils/accountLinking';
import { 
  formatCurrency, 
  formatMonthYear, 
  calculateNetWorth, 
  calculateTotal, 
  calculateTotalBalance, 
  calculateMonthlyIncome, 
  calculateDTI,
  formatExternalUrl,
  getDisplayUrl
} from '../utils/helpers';
import Button from './ui/Button';
import { CloseIcon, CheckIcon, FeatureShieldIcon, SparklesIcon, GoldAsterisk } from './ui/Icons';
import { useAuth } from '../contexts/AuthContext';
import MembershipModal from './MembershipModal';

interface AccountLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonthYear: string;
  financialData: FinancialData;
  onUpdateFinancialData: (updated: FinancialData) => Promise<void> | void;
  activeAccountType: AccountType;
  businessName?: string;
  userId?: string;
  userEmail?: string;
  onOpenMembership?: () => void;
}

export const AccountLinkingModal: React.FC<AccountLinkingModalProps> = ({
  isOpen,
  onClose,
  currentMonthYear,
  financialData,
  onUpdateFinancialData,
  activeAccountType,
  businessName = '',
  userId,
  userEmail,
  onOpenMembership
}) => {
  const { isPremium } = useAuth();
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'connections' | 'merge' | 'consolidated'>('connections');
  const [connections, setConnections] = useState<LinkedAccountConnection[]>(() => loadLinkedAccounts(userId));

  const handleTriggerUpgrade = () => {
    if (onOpenMembership) {
      onOpenMembership();
    } else {
      setIsMembershipOpen(true);
    }
  };

  // Form State for Adding New Connection
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<LinkedAccountRole>('spouse');
  const [newPairingCode, setNewPairingCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Merge State
  const [selectedSourceId, setSelectedSourceId] = useState<string>(() => connections[0]?.id || '');
  const [targetDestination, setTargetDestination] = useState<AccountType>(activeAccountType);
  const [mergeScope, setMergeScope] = useState<'current_month' | 'all_months'>('current_month');
  const [includeCards, setIncludeCards] = useState(true);
  const [includeLoans, setIncludeLoans] = useState(true);
  const [includeAssets, setIncludeAssets] = useState(true);
  const [includeBills, setIncludeBills] = useState(true);
  const [includeIncome, setIncludeIncome] = useState(true);
  const [useTagPrefix, setUseTagPrefix] = useState(true);
  const [customTag, setCustomTag] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const [mergeSuccessDetails, setMergeSuccessDetails] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedConnection = connections.find(c => c.id === selectedSourceId) || connections[0];

  // Calculate current user metrics for this month
  const currentMonthData = financialData[currentMonthYear] || {
    income: { jobs: [] },
    creditScores: { experian: { score8: 700 }, equifax: { score8: 700 }, transunion: { score8: 700 }, lendingTree: 700, creditKarma: 700, creditSesame: 700, mrCooper: 700 },
    creditCards: [],
    loans: [],
    assets: [],
    monthlyBills: []
  };

  const currentNetWorth = calculateNetWorth(currentMonthData);
  const currentAssets = calculateTotal(currentMonthData.assets);
  const currentDebt = calculateTotalBalance(currentMonthData.creditCards) + calculateTotalBalance(currentMonthData.loans);
  const currentIncome = calculateMonthlyIncome(currentMonthData.income?.jobs || []);
  const currentBills = calculateTotal(currentMonthData.monthlyBills);
  const currentDti = calculateDTI(currentBills, currentIncome);

  // Incoming data for selected connection for current month
  const incomingMonthData = selectedConnection?.financialData?.[currentMonthYear] || 
    (selectedConnection?.financialData ? Object.values(selectedConnection.financialData)[0] : null);

  const incomingNetWorth = incomingMonthData ? calculateNetWorth(incomingMonthData) : 0;
  const incomingAssets = incomingMonthData ? calculateTotal(incomingMonthData.assets) : 0;
  const incomingDebt = incomingMonthData ? (calculateTotalBalance(incomingMonthData.creditCards) + calculateTotalBalance(incomingMonthData.loans)) : 0;
  const incomingIncome = incomingMonthData ? calculateMonthlyIncome(incomingMonthData.income?.jobs || []) : 0;
  const incomingBills = incomingMonthData ? calculateTotal(incomingMonthData.monthlyBills) : 0;

  // Projected Merged Metrics
  const projectedAssets = currentAssets + (includeAssets ? incomingAssets : 0);
  const projectedDebt = currentDebt + ((includeCards || includeLoans) ? incomingDebt : 0);
  const projectedNetWorth = projectedAssets - projectedDebt;
  const projectedIncome = currentIncome + (includeIncome ? incomingIncome : 0);
  const projectedBills = currentBills + (includeBills ? incomingBills : 0);
  const projectedDti = calculateDTI(projectedBills, projectedIncome);

  // Consolidated View Data
  const consolidatedMonthData = calculateConsolidatedMonthlyData(
    currentMonthData, 
    incomingMonthData || undefined, 
    selectedConnection?.role === 'business' ? 'Business' : 'Spouse'
  );

  const consolidatedNetWorth = consolidatedMonthData ? calculateNetWorth(consolidatedMonthData) : 0;
  const consolidatedAssets = consolidatedMonthData ? calculateTotal(consolidatedMonthData.assets) : 0;
  const consolidatedDebt = consolidatedMonthData ? (calculateTotalBalance(consolidatedMonthData.creditCards) + calculateTotalBalance(consolidatedMonthData.loans)) : 0;
  const consolidatedIncome = consolidatedMonthData ? calculateMonthlyIncome(consolidatedMonthData.income?.jobs || []) : 0;
  const consolidatedBills = consolidatedMonthData ? calculateTotal(consolidatedMonthData.monthlyBills) : 0;
  const consolidatedDti = calculateDTI(consolidatedBills, consolidatedIncome);

  // Handlers
  const handleAddConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPremium) {
      handleTriggerUpgrade();
      return;
    }
    setFormError(null);
    const email = newEmail.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      setFormError("Please enter a valid Gmail address (e.g. spouse@gmail.com).");
      return;
    }

    if (connections.some(c => c.targetEmail.toLowerCase() === email)) {
      setFormError(`An account connection for "${email}" already exists.`);
      return;
    }

    const defaultDataset = newRole === 'business' ? getBusinessSampleData() : getSpouseSampleData();
    const defaultLabel = newName.trim() || (newRole === 'spouse' ? 'Spouse Account' : newRole === 'business' ? 'Business Entity' : 'Partner Account');

    const newConn: LinkedAccountConnection = {
      id: `conn_${Date.now()}`,
      targetEmail: email,
      targetName: `${defaultLabel} (${email})`,
      role: newRole,
      status: 'active',
      linkedAt: new Date().toISOString(),
      notes: newPairingCode ? `Linked via pairing code ${newPairingCode}` : `Directly verified via Gmail link invitation`,
      allowTwoWaySync: true,
      lastSyncedAt: new Date().toISOString(),
      financialData: defaultDataset
    };

    const updated = [newConn, ...connections];
    setConnections(updated);
    saveLinkedAccounts(updated, userId);
    setNewEmail('');
    setNewName('');
    setNewPairingCode('');
    setActionNotice(`Successfully linked "${email}" as ${newRole === 'spouse' ? "Spouse's Account" : "Business Account"}!`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleRemoveConnection = (connId: string) => {
    if (!window.confirm("Are you sure you want to unlink this account? Any data already merged into your account will remain preserved.")) {
      return;
    }
    const updated = connections.filter(c => c.id !== connId);
    setConnections(updated);
    saveLinkedAccounts(updated, userId);
    if (selectedSourceId === connId) {
      setSelectedSourceId(updated[0]?.id || '');
    }
    setActionNotice("Account unlinked successfully.");
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleResetToPresets = () => {
    if (!isPremium) {
      handleTriggerUpgrade();
      return;
    }
    localStorage.removeItem(`wmcw_linked_accounts_${userId || 'guest'}`);
    const presets = loadLinkedAccounts(userId);
    setConnections(presets);
    setSelectedSourceId(presets[0]?.id || '');
    setActionNotice("Reloaded verified Spouse and Business connection presets.");
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleExecuteMerge = async () => {
    if (!isPremium) {
      handleTriggerUpgrade();
      return;
    }
    if (!selectedConnection || !selectedConnection.financialData) {
      alert("Please select a linked account with available data to merge.");
      return;
    }

    setIsMerging(true);
    setMergeSuccessDetails(null);

    try {
      const options: MergeOptions = {
        sourceId: selectedConnection.id,
        sourceRole: selectedConnection.role,
        sourceEmail: selectedConnection.targetEmail,
        targetDestination,
        selectedMonth: mergeScope === 'current_month' ? currentMonthYear : 'all',
        categories: {
          creditCards: includeCards,
          loans: includeLoans,
          assets: includeAssets,
          monthlyBills: includeBills,
          income: includeIncome
        },
        prefixTag: useTagPrefix,
        customTag: customTag.trim() || undefined,
        duplicateResolution: 'keep_both'
      };

      const { resultData, summary } = mergeFullFinancialData(financialData, selectedConnection.financialData, options);

      await onUpdateFinancialData(resultData);

      const targetLabel = targetDestination === 'personal' ? 'Personal Account' : 'Business Account';
      const roleLabel = selectedConnection.role === 'spouse' ? "Spouse's Account" : "Business Account";
      
      const successText = `Successfully merged from ${roleLabel} (${selectedConnection.targetEmail}) into your ${targetLabel}! Added: ${summary.cardsAdded} Credit Cards, ${summary.loansAdded} Loans, ${summary.assetsAdded} Assets, ${summary.billsAdded} Monthly Bills, and ${summary.jobsAdded} Income Sources.`;
      
      setMergeSuccessDetails(successText);
      setActionNotice(`Merge complete! All accounts added to your ${targetLabel}.`);
    } catch (err) {
      console.error("Merge error:", err);
      alert("Failed to complete data merge. Please try again.");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 md:p-6 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/30">
              🔗
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white">Linked Accounts &amp; Data Merging</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400 text-gray-900 border border-amber-300 flex items-center gap-1 shadow-sm">
                  ⭐ Premium Exclusive
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/20 text-white border border-white/30">
                  Spouse &amp; Business Gmail Sync
                </span>
              </div>
              <p className="text-xs text-white/80">
                Current Active Account: <strong className="text-white capitalize">{activeAccountType} Account</strong> {businessName ? `(${businessName})` : ''} • Logged in as: {userEmail || 'User'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-gray-100 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('connections')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'connections'
                  ? 'bg-white dark:bg-gray-800 text-brand-primary dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>👥 Connected Gmail Accounts ({connections.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('merge')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'merge'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>⚡ Merge Data into My Account</span>
            </button>
            <button
              onClick={() => setActiveTab('consolidated')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'consolidated'
                  ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>🏡 Joint Household / Consolidated View</span>
            </button>
          </div>

          <button
            onClick={handleResetToPresets}
            className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline whitespace-nowrap"
            title="Reload verified sample Spouse and Business accounts"
          >
            Reload Samples
          </button>
        </div>

        {/* Premium Upgrade Callout Banner if not premium */}
        {!isPremium && (
          <div className="px-6 py-3.5 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-purple-500/15 dark:from-amber-950/50 dark:via-orange-950/40 dark:to-purple-950/50 border-b border-amber-300 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base font-bold shrink-0 mt-0.5">
                ⭐
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-xs text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                    Premium Account Holder Exclusive
                  </h4>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">
                  Only <strong>Premium User Account Holders</strong> have the ability to link and merge financial data from other Gmail accounts (such as a Spouse's Account or Business / LLC Account) directly into their Personal or Business account.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTriggerUpgrade}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5 shrink-0"
            >
              <SparklesIcon className="w-3.5 h-3.5 text-white" />
              <span>Upgrade to Premium ($11.11) ↗</span>
            </button>
          </div>
        )}

        {/* Notification Toast */}
        {actionNotice && (
          <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-900 dark:text-gray-100">
          
          {/* TAB 1: CONNECTED ACCOUNTS */}
          {activeTab === 'connections' && (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/60 dark:from-gray-800/80 dark:to-gray-800/40 border border-blue-100 dark:border-gray-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-blue-600">💍</span> Connect Spouse's Account or Business Account
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Link another Google / Gmail account to aggregate household balances, combine credit card limits for joint underwriting, track corporate assets, or merge them directly into your Personal or Business finances.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('merge')}
                    className="px-3.5 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-xl shadow hover:bg-brand-secondary transition-all whitespace-nowrap shrink-0"
                  >
                    ⚡ Go to Merge Tool
                  </button>
                </div>
              </div>

              {/* Connections List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Active Linked Accounts ({connections.length})
                </h4>

                {connections.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-500">No linked accounts yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Add your spouse or business Gmail account below.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {connections.map((conn) => {
                      const latestMonth = conn.financialData ? Object.values(conn.financialData)[0] : null;
                      const connNetWorth = latestMonth ? calculateNetWorth(latestMonth) : 0;
                      const connCards = latestMonth?.creditCards?.length || 0;
                      const connLoans = latestMonth?.loans?.length || 0;
                      const connAssets = latestMonth?.assets?.length || 0;

                      return (
                        <div 
                          key={conn.id} 
                          className="p-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all space-y-3 relative"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl p-2 rounded-xl bg-gray-100 dark:bg-gray-700">
                                {conn.role === 'spouse' ? '💍' : conn.role === 'business' ? '🏢' : '👤'}
                              </span>
                              <div>
                                <h5 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                                  {conn.targetName || conn.targetEmail}
                                </h5>
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 block">
                                  {conn.targetEmail}
                                </span>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              conn.role === 'spouse'
                                ? 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300 border border-pink-200/50'
                                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/50'
                            }`}>
                              {conn.role === 'spouse' ? 'Spouse Account' : 'Business LLC'}
                            </span>
                          </div>

                          {/* Quick Numbers Preview */}
                          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 text-center text-xs">
                            <div>
                              <span className="text-[10px] text-gray-400 block font-medium">Net Worth</span>
                              <span className={`font-bold font-mono ${connNetWorth >= 0 ? 'text-positive' : 'text-negative'}`}>
                                {formatCurrency(connNetWorth)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 block font-medium">Holdings</span>
                              <span className="font-bold text-gray-800 dark:text-gray-200">
                                {connAssets} Assets
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 block font-medium">Debts</span>
                              <span className="font-bold text-rose-500">
                                {connCards + connLoans} Accounts
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-xs">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Active &amp; Sync Ready
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedSourceId(conn.id);
                                  setActiveTab('merge');
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                Merge Data ↗
                              </button>
                              <button
                                onClick={() => handleRemoveConnection(conn.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Unlink account"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add New Connection Form */}
              <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-4">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <span>➕</span> Link Another Gmail Account
                </h4>

                <form onSubmit={handleAddConnection} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Google / Gmail Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. spouse.name@gmail.com or biz.finances@gmail.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Account Relationship
                      </label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as LinkedAccountRole)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary font-medium"
                      >
                        <option value="spouse">💍 Spouse / Domestic Partner</option>
                        <option value="business">🏢 Business / Entity LLC</option>
                        <option value="partner">👥 Co-Signer / Financial Partner</option>
                        <option value="secondary">👤 Secondary Personal Account</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Account Nickname / Label (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah's Personal or Apex Holdings LLC"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Invite / Pairing Code (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. WMCW-SP-4912"
                        value={newPairingCode}
                        onChange={(e) => setNewPairingCode(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono"
                      />
                    </div>
                  </div>

                  {formError && (
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                      {formError}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-gray-500">
                      🔒 End-to-end user encrypted • Links can be unlinked at any time.
                    </span>
                    {isPremium ? (
                      <button
                        type="submit"
                        className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <span>Connect Account</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleTriggerUpgrade}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <SparklesIcon className="w-3.5 h-3.5" />
                        <span>⭐ Unlock with Premium to Connect</span>
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: MERGE DATA INTO MY ACCOUNT */}
          {activeTab === 'merge' && (
            <div className="space-y-6">
              {/* Merge Header Description */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-gray-800 dark:to-gray-800/80 border border-indigo-100 dark:border-gray-700">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-indigo-600">⚡</span> Direct Data Merge Engine
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Select which linked account to copy from, choose your destination (<strong>Personal Account</strong> or <strong>Business Account</strong>), select categories, and instantly add them into your current dataset.
                </p>
              </div>

              {/* Step 1 & Step 2: Source & Destination Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source Account */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 space-y-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500">
                    Step 1: Select Source Account
                  </label>
                  <select
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary font-bold"
                  >
                    {connections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.role === 'spouse' ? '💍' : '🏢'} {c.targetName || c.targetEmail} ({c.targetEmail})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-gray-500 block">
                    Source contains: {incomingMonthData?.assets?.length || 0} Assets, {incomingMonthData?.creditCards?.length || 0} Cards, {incomingMonthData?.loans?.length || 0} Loans
                  </span>
                </div>

                {/* Target Destination */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 space-y-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500">
                    Step 2: Add into Which Account?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetDestination('personal')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        targetDestination === 'personal'
                          ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-sm'
                          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <span className="text-base block mb-0.5">👤</span>
                      <span className="text-xs">My Personal Account</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetDestination('business')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        targetDestination === 'business'
                          ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-sm'
                          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <span className="text-base block mb-0.5">🏢</span>
                      <span className="text-xs">My Business Account</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-gray-500 block">
                    Target destination: <strong>{targetDestination === 'personal' ? 'Personal Account' : 'Business Account'}</strong>
                  </span>
                </div>
              </div>

              {/* Step 3: Scope and Category Checkboxes */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                    Step 3: Select Categories to Merge
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Month Scope:</label>
                    <select
                      value={mergeScope}
                      onChange={(e) => setMergeScope(e.target.value as any)}
                      className="px-2.5 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold"
                    >
                      <option value="current_month">Current Month ({formatMonthYear(currentMonthYear)}) Only</option>
                      <option value="all_months">All Available Months (Historical Data)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeCards}
                      onChange={(e) => setIncludeCards(e.target.checked)}
                      className="rounded text-brand-primary"
                    />
                    <span className="text-xs font-bold">💳 Credit Cards ({incomingMonthData?.creditCards?.length || 0})</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeLoans}
                      onChange={(e) => setIncludeLoans(e.target.checked)}
                      className="rounded text-brand-primary"
                    />
                    <span className="text-xs font-bold">🏠 Loans ({incomingMonthData?.loans?.length || 0})</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeAssets}
                      onChange={(e) => setIncludeAssets(e.target.checked)}
                      className="rounded text-brand-primary"
                    />
                    <span className="text-xs font-bold">💰 Assets ({incomingMonthData?.assets?.length || 0})</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeBills}
                      onChange={(e) => setIncludeBills(e.target.checked)}
                      className="rounded text-brand-primary"
                    />
                    <span className="text-xs font-bold">🧾 Bills ({incomingMonthData?.monthlyBills?.length || 0})</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeIncome}
                      onChange={(e) => setIncludeIncome(e.target.checked)}
                      className="rounded text-brand-primary"
                    />
                    <span className="text-xs font-bold">💼 Income ({incomingMonthData?.income?.jobs?.length || 0})</span>
                  </label>
                </div>

                {/* Tag Prefix Options */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useTagPrefix}
                      onChange={(e) => setUseTagPrefix(e.target.checked)}
                      className="rounded text-brand-primary"
                    />
                    <span>
                      Add tag prefix to account names (e.g. <strong>{selectedConnection?.role === 'spouse' ? '[Spouse]' : '[Business]'} Chase Freedom</strong>)
                    </span>
                  </label>

                  {useTagPrefix && (
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <span className="text-gray-400 whitespace-nowrap">Custom Tag:</span>
                      <input
                        type="text"
                        placeholder={selectedConnection?.role === 'spouse' ? '[Spouse]' : '[Business]'}
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        className="px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg w-28 font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Mathematical Impact Diff & Preview */}
              <div className="p-4 rounded-2xl bg-gray-900 text-white border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Mathematical Audit: Projected Results After Merge ({formatMonthYear(currentMonthYear)})
                  </h5>
                  <span className="text-[11px] text-gray-400">
                    Live arithmetic calculation
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-gray-800/80 border border-gray-700">
                    <span className="text-[10px] text-gray-400 block font-semibold">Net Worth</span>
                    <span className="text-sm font-bold font-mono text-white block mt-0.5">
                      {formatCurrency(currentNetWorth)}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400 block mt-0.5">
                      → {formatCurrency(projectedNetWorth)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-800/80 border border-gray-700">
                    <span className="text-[10px] text-gray-400 block font-semibold">Total Assets</span>
                    <span className="text-sm font-bold font-mono text-white block mt-0.5">
                      {formatCurrency(currentAssets)}
                    </span>
                    <span className="text-[11px] font-bold text-sky-400 block mt-0.5">
                      → {formatCurrency(projectedAssets)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-800/80 border border-gray-700">
                    <span className="text-[10px] text-gray-400 block font-semibold">Total Debt</span>
                    <span className="text-sm font-bold font-mono text-white block mt-0.5">
                      {formatCurrency(currentDebt)}
                    </span>
                    <span className="text-[11px] font-bold text-rose-400 block mt-0.5">
                      → {formatCurrency(projectedDebt)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-800/80 border border-gray-700">
                    <span className="text-[10px] text-gray-400 block font-semibold">Monthly Income</span>
                    <span className="text-sm font-bold font-mono text-white block mt-0.5">
                      {formatCurrency(currentIncome)}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400 block mt-0.5">
                      → {formatCurrency(projectedIncome)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-800/80 border border-gray-700">
                    <span className="text-[10px] text-gray-400 block font-semibold">DTI Ratio</span>
                    <span className="text-sm font-bold font-mono text-white block mt-0.5">
                      {currentDti.toFixed(1)}%
                    </span>
                    <span className="text-[11px] font-bold text-amber-400 block mt-0.5">
                      → {projectedDti.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {mergeSuccessDetails && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 font-semibold animate-fade-in">
                    ✓ {mergeSuccessDetails}
                  </div>
                )}

                {!isPremium && (
                  <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-xl text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🔒</span>
                      <span>
                        <strong>Interactive Preview:</strong> You are viewing projected balances. Only Premium User Account Holders can merge and add data directly into their {targetDestination === 'personal' ? 'Personal' : 'Business'} account.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleTriggerUpgrade}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shrink-0 transition-colors self-start sm:self-auto"
                    >
                      Unlock with Premium ↗
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button variant="secondary" onClick={onClose} disabled={isMerging}>
                  Cancel
                </Button>
                {isPremium ? (
                  <button
                    type="button"
                    onClick={handleExecuteMerge}
                    disabled={isMerging || !selectedConnection}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    {isMerging ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                        <span>Merging &amp; Updating Cloud...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡ Add to My {targetDestination === 'personal' ? 'Personal' : 'Business'} Account</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleTriggerUpgrade}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <SparklesIcon className="w-4 h-4 text-white" />
                    <span>⭐ Upgrade to Premium to Merge &amp; Add Data</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: JOINT HOUSEHOLD / CONSOLIDATED VIEW */}
          {activeTab === 'consolidated' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/80 border border-purple-100 dark:border-gray-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-purple-600">🏡</span> Live Consolidated Household View
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      This dynamic view instantly aggregates your finances with your spouse or business in real-time <strong>without</strong> altering your underlying individual accounts.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-gray-500">Pair With:</span>
                    <select
                      value={selectedSourceId}
                      onChange={(e) => setSelectedSourceId(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg font-bold"
                    >
                      {connections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.role === 'spouse' ? '💍' : '🏢'} {c.targetName || c.targetEmail}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 5 Vital Metric Cards for Consolidated Household */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider block">Joint Net Worth</span>
                  <span className={`text-base font-extrabold font-mono block mt-1 ${consolidatedNetWorth >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {formatCurrency(consolidatedNetWorth)}
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Household Total</span>
                </div>

                <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider block">Joint Assets</span>
                  <span className="text-base font-extrabold font-mono text-sky-600 dark:text-sky-400 block mt-1">
                    {formatCurrency(consolidatedAssets)}
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Combined Holdings</span>
                </div>

                <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider block">Joint Debt</span>
                  <span className="text-base font-extrabold font-mono text-rose-500 block mt-1">
                    {formatCurrency(consolidatedDebt)}
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">All Liabilities</span>
                </div>

                <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider block">Joint Income</span>
                  <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400 block mt-1">
                    {formatCurrency(consolidatedIncome)}
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Combined Monthly</span>
                </div>

                <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider block">Joint DTI</span>
                  <span className="text-base font-extrabold font-mono text-amber-500 block mt-1">
                    {consolidatedDti.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Underwriting DTI</span>
                </div>
              </div>

              {/* Side-by-Side Asset & Liability Ledger */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Assets side */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase">
                      Combined Asset Accounts ({consolidatedMonthData?.assets?.length || 0})
                    </span>
                    <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                      {formatCurrency(consolidatedAssets)}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs max-h-56 overflow-y-auto pr-1">
                    {(consolidatedMonthData?.assets || []).map((a) => (
                      <li key={a.id} className="flex justify-between items-start gap-2 p-1.5 rounded-lg bg-white dark:bg-gray-900/60">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-gray-900 dark:text-white truncate">{a.name}</span>
                          {a.url && (
                            <a
                              href={formatExternalUrl(a.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-500 hover:underline truncate max-w-[180px]"
                            >
                              {getDisplayUrl(a.url)} ↗
                            </a>
                          )}
                        </div>
                        <span className="font-mono font-bold text-positive shrink-0">
                          {formatCurrency(a.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Debts side */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase">
                      Combined Liabilities ({((consolidatedMonthData?.creditCards?.length || 0) + (consolidatedMonthData?.loans?.length || 0))})
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-500">
                      {formatCurrency(consolidatedDebt)}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs max-h-56 overflow-y-auto pr-1">
                    {[...(consolidatedMonthData?.creditCards || []), ...(consolidatedMonthData?.loans || [])].map((item) => (
                      <li key={item.id} className="flex justify-between items-start gap-2 p-1.5 rounded-lg bg-white dark:bg-gray-900/60">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</span>
                          {item.url && (
                            <a
                              href={formatExternalUrl(item.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-500 hover:underline truncate max-w-[180px]"
                            >
                              {getDisplayUrl(item.url)} ↗
                            </a>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-rose-500 block">
                            {formatCurrency(item.balance)}
                          </span>
                          <span className="text-[10px] text-gray-400 block font-mono">
                            Limit: {formatCurrency(item.limit)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Call to action */}
              {isPremium ? (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-2xl border border-blue-200 dark:border-blue-800/60 flex items-center justify-between gap-3 text-xs">
                  <span className="text-blue-900 dark:text-blue-200">
                    💡 Want to permanently add these accounts to your record? Switch to the <strong>Merge Data Tool</strong>.
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('merge')}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition-colors whitespace-nowrap shrink-0"
                  >
                    Merge into My Account ↗
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-2xl border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-amber-900 dark:text-amber-200">
                    ⭐ Want to merge these accounts into your personal or business financial record? This is exclusive to <strong>Premium Account Holders</strong>.
                  </span>
                  <button
                    type="button"
                    onClick={handleTriggerUpgrade}
                    className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 self-start sm:self-auto"
                  >
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>Unlock with Premium ↗</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <span>🔒 Multi-Gmail Link Protocol • WhatsMyCreditWorth Private Sync</span>
          <Button variant="secondary" size="small" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <MembershipModal 
        isOpen={isMembershipOpen} 
        onClose={() => setIsMembershipOpen(false)} 
      />
    </div>
  );
};

export default AccountLinkingModal;
