import type { MonthlyData, CreditCard, Loan, Asset, NextStepsAccount, NextStepsSyncPayload, AccountType } from '../types';

interface LenderRule {
  keywords: string[];
  name: string;
  url: string;
  defaultApr?: string;
  categoryHint?: 'credit-card' | 'mortgage' | 'loan' | 'llc' | 'asset';
}

const LENDER_DIRECTORY: LenderRule[] = [
  {
    keywords: ['chase', 'sapphire', 'freedom', 'ink', 'slate'],
    name: 'Chase',
    url: 'https://www.chase.com',
    defaultApr: '21.49'
  },
  {
    keywords: ['american express', 'amex', 'platinum', 'centurion', 'blue cash', 'gold card', 'delta skymiles'],
    name: 'American Express',
    url: 'https://www.americanexpress.com',
    defaultApr: '20.99'
  },
  {
    keywords: ['capital one', 'capone', 'venture', 'quicksilver', 'savor'],
    name: 'Capital One',
    url: 'https://www.capitalone.com',
    defaultApr: '22.24'
  },
  {
    keywords: ['citi', 'citibank', 'custom cash', 'double cash', 'diamond'],
    name: 'Citibank',
    url: 'https://www.citi.com',
    defaultApr: '19.99'
  },
  {
    keywords: ['discover', 'discover it'],
    name: 'Discover',
    url: 'https://www.discover.com',
    defaultApr: '18.24'
  },
  {
    keywords: ['bank of america', 'bofa', 'cash rewards', 'travel rewards'],
    name: 'Bank of America',
    url: 'https://www.bankofamerica.com',
    defaultApr: '19.49'
  },
  {
    keywords: ['wells fargo', 'active cash', 'autograph', 'reflect'],
    name: 'Wells Fargo',
    url: 'https://www.wellsfargo.com',
    defaultApr: '20.24'
  },
  {
    keywords: ['barclays', 'barclaycard', 'view card'],
    name: 'Barclays',
    url: 'https://www.barclaysus.com',
    defaultApr: '21.99'
  },
  {
    keywords: ['us bank', 'u.s. bank', 'altitude'],
    name: 'US Bank',
    url: 'https://www.usbank.com',
    defaultApr: '19.74'
  },
  {
    keywords: ['apple card', 'apple'],
    name: 'Apple Card / Goldman Sachs',
    url: 'https://card.apple.com',
    defaultApr: '19.24'
  },
  {
    keywords: ['navy federal', 'nfcu', 'cashrewards', 'more rewards'],
    name: 'Navy Federal Credit Union',
    url: 'https://www.navyfederal.org',
    defaultApr: '14.99'
  },
  {
    keywords: ['usaa'],
    name: 'USAA',
    url: 'https://www.usaa.com',
    defaultApr: '15.40'
  },
  {
    keywords: ['synchrony', 'carecredit', 'amazon store card'],
    name: 'Synchrony Bank',
    url: 'https://www.synchrony.com',
    defaultApr: '28.99'
  },
  {
    keywords: ['sofi'],
    name: 'SoFi',
    url: 'https://www.sofi.com',
    defaultApr: '17.99'
  },
  {
    keywords: ['fidelity'],
    name: 'Fidelity Investments',
    url: 'https://www.fidelity.com',
    defaultApr: '19.24',
    categoryHint: 'asset'
  },
  {
    keywords: ['vanguard'],
    name: 'Vanguard Group',
    url: 'https://investor.vanguard.com',
    categoryHint: 'asset'
  },
  {
    keywords: ['schwab', 'charles schwab'],
    name: 'Charles Schwab',
    url: 'https://www.schwab.com',
    categoryHint: 'asset'
  },
  {
    keywords: ['marcus', 'goldman sachs', 'goldman'],
    name: 'Marcus by Goldman Sachs',
    url: 'https://www.marcus.com',
    categoryHint: 'asset'
  },
  {
    keywords: ['coinbase'],
    name: 'Coinbase',
    url: 'https://www.coinbase.com',
    categoryHint: 'asset'
  },
  {
    keywords: ['kraken'],
    name: 'Kraken',
    url: 'https://www.kraken.com',
    categoryHint: 'asset'
  },
  {
    keywords: ['robinhood'],
    name: 'Robinhood',
    url: 'https://robinhood.com',
    categoryHint: 'asset'
  },
  {
    keywords: ['etrade', 'e*trade', 'morgan stanley'],
    name: 'E*TRADE / Morgan Stanley',
    url: 'https://us.etrade.com',
    categoryHint: 'asset'
  },
  {
    keywords: ['merrill', 'merrill lynch', 'merrill edge'],
    name: 'Merrill Edge / Bank of America',
    url: 'https://www.merrilledge.com',
    categoryHint: 'asset'
  },
  {
    keywords: ['ally', 'ally bank', 'ally invest'],
    name: 'Ally Financial',
    url: 'https://www.ally.com',
    categoryHint: 'asset'
  },
  {
    keywords: ['betterment'],
    name: 'Betterment',
    url: 'https://www.betterment.com',
    categoryHint: 'asset'
  },
  {
    keywords: ['wealthfront'],
    name: 'Wealthfront',
    url: 'https://www.wealthfront.com',
    categoryHint: 'asset'
  },
  {
    keywords: ['interactive brokers', 'ibkr'],
    name: 'Interactive Brokers',
    url: 'https://www.interactivebrokers.com',
    categoryHint: 'asset'
  },
  {
    keywords: ['treasurydirect', 'treasury direct', 'i-bond', 'savings bond'],
    name: 'TreasuryDirect (US Treasury)',
    url: 'https://www.treasurydirect.gov',
    categoryHint: 'asset'
  },
  {
    keywords: ['empower', 'personal capital'],
    name: 'Empower Retirement',
    url: 'https://www.empower.com',
    categoryHint: 'asset'
  },
  {
    keywords: ['principal'],
    name: 'Principal Financial Group',
    url: 'https://www.principal.com',
    categoryHint: 'asset'
  },
  {
    keywords: ['t. rowe', 't rowe', 'troweprice'],
    name: 'T. Rowe Price',
    url: 'https://www.troweprice.com',
    categoryHint: 'asset'
  },
  {
    keywords: ['rocket mortgage', 'rocket', 'quicken loans'],
    name: 'Rocket Mortgage',
    url: 'https://www.rocketmortgage.com',
    defaultApr: '6.75',
    categoryHint: 'mortgage'
  },
  {
    keywords: ['mr. cooper', 'mr cooper', 'nationstar'],
    name: 'Mr. Cooper',
    url: 'https://www.mrcooper.com',
    defaultApr: '6.50',
    categoryHint: 'mortgage'
  },
  {
    keywords: ['loandepot'],
    name: 'loanDepot',
    url: 'https://www.loandepot.com',
    defaultApr: '6.85',
    categoryHint: 'mortgage'
  },
  {
    keywords: ['pennymac'],
    name: 'PennyMac',
    url: 'https://www.pennymac.com',
    defaultApr: '6.65',
    categoryHint: 'mortgage'
  },
  {
    keywords: ['freedom mortgage'],
    name: 'Freedom Mortgage',
    url: 'https://www.freedommortgage.com',
    defaultApr: '6.70',
    categoryHint: 'mortgage'
  },
  {
    keywords: ['nelnet'],
    name: 'Nelnet',
    url: 'https://www.nelnet.com',
    defaultApr: '5.50',
    categoryHint: 'loan'
  },
  {
    keywords: ['mohela'],
    name: 'MOHELA',
    url: 'https://www.mohela.com',
    defaultApr: '5.80',
    categoryHint: 'loan'
  },
  {
    keywords: ['sallie mae'],
    name: 'Sallie Mae',
    url: 'https://www.salliemae.com',
    defaultApr: '8.50',
    categoryHint: 'loan'
  },
  {
    keywords: ['bmw financial', 'bmw'],
    name: 'BMW Financial Services',
    url: 'https://www.bmwusa.com/financial-services.html',
    defaultApr: '4.99',
    categoryHint: 'loan'
  },
  {
    keywords: ['mercedes', 'daimler'],
    name: 'Mercedes-Benz Financial',
    url: 'https://www.mbfs.com',
    defaultApr: '5.25',
    categoryHint: 'loan'
  },
  {
    keywords: ['tesla'],
    name: 'Tesla Finance',
    url: 'https://www.tesla.com/finance',
    defaultApr: '5.99',
    categoryHint: 'loan'
  },
  {
    keywords: ['toyota financial', 'toyota'],
    name: 'Toyota Financial Services',
    url: 'https://www.toyotafinancial.com',
    defaultApr: '4.99',
    categoryHint: 'loan'
  },
  {
    keywords: ['honda financial', 'honda'],
    name: 'Honda Financial Services',
    url: 'https://www.hondafinancialservices.com',
    defaultApr: '4.99',
    categoryHint: 'loan'
  },
  {
    keywords: ['ford credit', 'ford'],
    name: 'Ford Motor Credit',
    url: 'https://www.ford.com/finance',
    defaultApr: '5.49',
    categoryHint: 'loan'
  }
];

/**
 * Extracts or infers a 4-digit account number (last4) from account name or properties.
 * If not present, produces a stable, deterministic 4-digit code based on the card id.
 */
export function extractOrGenerateLast4(name: string, explicitNumber?: string, id?: string): string {
  if (explicitNumber && explicitNumber.trim().length > 0) {
    const cleaned = explicitNumber.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      return cleaned.slice(-4);
    }
    if (cleaned.length > 0) {
      return cleaned.padStart(4, '0');
    }
  }

  // Look for 4 digits in the name like "Sapphire (4819)", "CapOne - 8921", "*3312", "#4490", "x1234"
  const patterns = [
    /(?:[#\-*x(\[]\s*|\b)(\d{4})(?:\b|[)\]])/i,
    /\b(\d{4})\b/
  ];

  for (const regex of patterns) {
    const match = name.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Generate deterministic 4-digit number based on item id / name hash
  const seedStr = id || name;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) % 9000;
  }
  const last4 = (1000 + Math.abs(hash)).toString().slice(-4);
  return last4;
}

/**
 * Detects lender name and login portal URL based on account title.
 */
export function inferLenderDetails(name: string, explicitLender?: string, explicitUrl?: string) {
  if (explicitLender && explicitUrl) {
    return { lenderName: explicitLender, url: explicitUrl, defaultApr: '19.99' };
  }

  const lower = name.toLowerCase();
  for (const rule of LENDER_DIRECTORY) {
    if (rule.keywords.some(k => lower.includes(k))) {
      return {
        lenderName: explicitLender || rule.name,
        url: explicitUrl || rule.url,
        defaultApr: rule.defaultApr || '19.99',
        categoryHint: rule.categoryHint
      };
    }
  }

  // Fallbacks
  const firstWord = name.trim().split(' ')[0] || 'Institution';
  return {
    lenderName: explicitLender || firstWord,
    url: explicitUrl || 'https://www.google.com/search?q=' + encodeURIComponent(`${name} login portal`),
    defaultApr: '19.99',
    categoryHint: undefined
  };
}

export function inferAssetDetails(
  name: string, 
  explicitInstitution?: string, 
  explicitUrl?: string, 
  explicitCategory?: string
) {
  const lender = inferLenderDetails(name, explicitInstitution, explicitUrl);
  const nameLower = name.toLowerCase();
  
  let assetType = 'Asset Account';
  if (explicitCategory && explicitCategory.trim().length > 0) {
    assetType = explicitCategory;
  } else if (nameLower.includes('401k') || nameLower.includes('401(k)') || nameLower.includes('ira') || nameLower.includes('roth') || nameLower.includes('pension') || nameLower.includes('retirement')) {
    assetType = 'Retirement (401k/IRA)';
  } else if (nameLower.includes('saving') || nameLower.includes('hysa') || nameLower.includes('money market') || nameLower.includes('cd') || nameLower.includes('deposit')) {
    assetType = 'Savings / HYSA';
  } else if (nameLower.includes('checking') || nameLower.includes('cash') || nameLower.includes('debit')) {
    assetType = 'Checking / Cash';
  } else if (nameLower.includes('crypto') || nameLower.includes('bitcoin') || nameLower.includes('btc') || nameLower.includes('eth') || nameLower.includes('coinbase') || nameLower.includes('kraken')) {
    assetType = 'Cryptocurrency';
  } else if (nameLower.includes('invest') || nameLower.includes('stock') || nameLower.includes('brokerage') || nameLower.includes('etf') || nameLower.includes('fidelity') || nameLower.includes('vanguard') || nameLower.includes('schwab')) {
    assetType = 'Investment / Brokerage';
  } else if (nameLower.includes('equity') || nameLower.includes('real estate') || nameLower.includes('property') || nameLower.includes('home') || nameLower.includes('house')) {
    assetType = 'Real Estate Equity';
  } else if (nameLower.includes('vehicle') || nameLower.includes('car') || nameLower.includes('auto') || nameLower.includes('boat')) {
    assetType = 'Vehicle';
  }

  return {
    institutionName: explicitInstitution || lender.lenderName,
    url: explicitUrl || lender.url,
    assetType
  };
}

/**
 * Normalizes category to Next Steps recognized categories:
 * 'credit-card' | 'mortgage' | 'loan' | 'llc' | 'asset' | 'other'
 */
export function normalizeCategory(
  item: { name: string; isBusiness?: boolean; category?: string },
  sourceType: 'card' | 'loan' | 'asset',
  accountType?: AccountType
): 'credit-card' | 'mortgage' | 'loan' | 'llc' | 'asset' | 'other' {
  const isBusiness = item.isBusiness || accountType === 'business';
  const nameLower = item.name.toLowerCase();

  if (item.category) {
    const cat = item.category.toLowerCase();
    if (['credit-card', 'mortgage', 'loan', 'llc', 'asset', 'other'].includes(cat)) {
      return cat as any;
    }
  }

  if (sourceType === 'asset') {
    if (isBusiness && (nameLower.includes('llc') || nameLower.includes('business') || nameLower.includes('corporate'))) {
      return 'llc';
    }
    return 'asset';
  }

  if (sourceType === 'card') {
    if (isBusiness && (nameLower.includes('llc') || nameLower.includes('business') || nameLower.includes('corporate'))) {
      return 'llc';
    }
    return 'credit-card';
  }

  // Loans / Mortgages
  if (nameLower.includes('mortgage') || nameLower.includes('home') || nameLower.includes('cooper') || nameLower.includes('rocket') || nameLower.includes('realty') || nameLower.includes('house')) {
    return 'mortgage';
  }

  if (isBusiness && (nameLower.includes('llc') || nameLower.includes('eidl') || nameLower.includes('sba') || nameLower.includes('commercial'))) {
    return 'llc';
  }

  return 'loan';
}

/**
 * Formats dollar values as standard "$X,XXX.XX" strings
 */
export function formatSyncCurrency(val: number | string): string {
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]+/g, '')) || 0;
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface SyncOptions {
  accountType?: AccountType;
  businessName?: string;
  businessType?: string;
  monthYear?: string;
  exportedAt?: string;
}

/**
 * Builds the official 1-Click Sync Next Steps Payload
 */
export function buildNextStepsSyncPayload(data: MonthlyData, options?: SyncOptions): NextStepsSyncPayload {
  const accounts: NextStepsAccount[] = [];
  const isGlobalBusiness = options?.accountType === 'business';
  const timestamp = options?.exportedAt || new Date().toISOString();

  // 1. Process Credit Cards
  (data.creditCards || []).forEach((card: CreditCard) => {
    const isBiz = card.isBusiness !== undefined ? card.isBusiness : isGlobalBusiness;
    const lender = inferLenderDetails(card.name, card.lenderName, card.url);
    const last4 = extractOrGenerateLast4(card.name, card.accountNumber || card.last4, card.id);
    const category = normalizeCategory(card, 'card', options?.accountType);
    const apr = card.apr ? String(card.apr).replace('%', '').trim() : lender.defaultApr;
    const notes = card.notes || (isBiz && options?.businessName ? `Corporate line for ${options.businessName}` : `Revolving credit line synced from What's My Credit Worth`);

    accounts.push({
      name: card.name,
      lenderName: lender.lenderName,
      category: category,
      currentBalance: formatSyncCurrency(card.balance),
      creditLimit: formatSyncCurrency(card.limit),
      accountNumber: last4,
      apr: apr,
      isBusiness: isBiz,
      url: lender.url,
      notes: notes,
      accountType: 'debt',
      info: `Revolving Card | Lender: ${lender.lenderName} | Limit: ${formatSyncCurrency(card.limit)} | APR: ${apr}%`,
      balanceNumeric: Number(card.balance) || 0
    });
  });

  // 2. Process Mortgages and Loans
  (data.loans || []).forEach((loan: Loan) => {
    const isBiz = loan.isBusiness !== undefined ? loan.isBusiness : isGlobalBusiness;
    const lender = inferLenderDetails(loan.name, loan.lenderName, loan.url);
    const last4 = extractOrGenerateLast4(loan.name, loan.accountNumber || loan.last4, loan.id);
    const category = normalizeCategory(loan, 'loan', options?.accountType);
    const apr = loan.apr ? String(loan.apr).replace('%', '').trim() : (category === 'mortgage' ? '6.75' : '5.99');
    const notes = loan.notes || (category === 'mortgage' ? `Mortgage / Real Estate installment account` : `Installment loan synced from What's My Credit Worth`);

    accounts.push({
      name: loan.name,
      lenderName: lender.lenderName,
      category: category,
      currentBalance: formatSyncCurrency(loan.balance),
      creditLimit: formatSyncCurrency(loan.limit),
      accountNumber: last4,
      apr: apr,
      isBusiness: isBiz,
      url: lender.url,
      notes: notes,
      accountType: 'debt',
      info: `Installment Account (${category}) | Lender: ${lender.lenderName} | Original Limit: ${formatSyncCurrency(loan.limit)} | Rate: ${apr}%`,
      balanceNumeric: Number(loan.balance) || 0
    });
  });

  // 3. Process Asset Accounts (Savings, Investments, Retirement, Real Estate, Crypto, etc.)
  (data.assets || []).forEach((asset: Asset) => {
    const isBiz = asset.isBusiness !== undefined ? asset.isBusiness : isGlobalBusiness;
    const details = inferAssetDetails(asset.name, asset.institution, asset.url, asset.category);
    const last4 = extractOrGenerateLast4(asset.name, asset.accountNumber || asset.last4, asset.id);
    const category = normalizeCategory(asset, 'asset', options?.accountType);
    const formattedBalance = formatSyncCurrency(asset.value || 0);
    const aprOrApy = asset.apy ? String(asset.apy).replace('%', '').trim() : '0.00';
    const notes = asset.notes || (isBiz && options?.businessName 
      ? `Commercial asset account (${details.assetType}) for ${options.businessName}` 
      : `${details.assetType} account synced from What's My Credit Worth`);
    const info = asset.info || `Asset Account (${details.assetType}) | Institution: ${details.institutionName} | Account: ...${last4} | Balance: ${formattedBalance}`;

    accounts.push({
      name: asset.name,
      lenderName: details.institutionName,
      category: category,
      currentBalance: formattedBalance,
      creditLimit: formattedBalance, // Asset holding valuation
      accountNumber: last4,
      apr: aprOrApy,
      isBusiness: isBiz,
      url: details.url,
      notes: notes,
      accountType: 'asset',
      assetType: details.assetType,
      info: info,
      balanceNumeric: Number(asset.value) || 0
    });
  });

  const totalDebtNum = (data.creditCards || []).reduce((s, c) => s + (Number(c.balance) || 0), 0) +
                       (data.loans || []).reduce((s, l) => s + (Number(l.balance) || 0), 0);
  const totalAssetNum = (data.assets || []).reduce((s, a) => s + (Number(a.value) || 0), 0);
  const assetAccounts = accounts.filter(a => a.accountType === 'asset' || a.category === 'asset');

  return {
    app: 'WhatsMyCreditWorth',
    version: '2.0',
    exportedAt: timestamp,
    accounts: accounts,
    assetAccounts: assetAccounts,
    assets: assetAccounts,
    summary: {
      totalDebts: formatSyncCurrency(totalDebtNum),
      totalAssets: formatSyncCurrency(totalAssetNum),
      netWorth: formatSyncCurrency(totalAssetNum - totalDebtNum),
      totalAccounts: accounts.length,
      totalCards: (data.creditCards || []).length,
      totalLoans: (data.loans || []).length,
      totalAssetsCount: (data.assets || []).length
    }
  };
}

/**
 * Copies JSON payload to clipboard using modern Clipboard API
 */
export async function copyNextStepsPayloadToClipboard(payload: NextStepsSyncPayload): Promise<boolean> {
  const jsonString = JSON.stringify(payload, null, 2);
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(jsonString);
      return true;
    } else {
      // Fallback for non-secure contexts or legacy browsers
      const textArea = document.createElement('textarea');
      textArea.value = jsonString;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy Next Steps payload to clipboard:', err);
    return false;
  }
}

/**
 * Downloads JSON payload file for Next Steps
 */
export function downloadNextStepsPayloadFile(payload: NextStepsSyncPayload, filenamePrefix = 'WhatsMyCreditWorth-NextSteps-Sync'): void {
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `${filenamePrefix}-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
