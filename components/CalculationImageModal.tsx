import React, { useMemo, useState } from 'react';
import type { MonthlyData, IncomeSource, Asset, CreditCard, Loan, NamedAmount } from '../types';
import { 
  calculateNetWorth, 
  calculateTotal, 
  calculateTotalBalance, 
  calculateMonthlyIncome, 
  calculateDTI, 
  formatCurrency, 
  formatMonthYear 
} from '../utils/helpers';

export type CalculationMetricType = 'NET WORTH' | 'TOTAL ASSETS' | 'TOTAL DEBT' | 'MONTHLY INCOME' | 'DTI RATIO';

interface CalculationImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMetric: CalculationMetricType;
  data: MonthlyData;
  monthYear: string;
  onOpenEditor?: () => void;
}

function escapeXml(unsafe: string = ''): string {
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export function generateCalculationSvg(metricType: CalculationMetricType, data: MonthlyData, monthYear: string): string {
  const formattedMonth = formatMonthYear(monthYear, 'long') || monthYear;
  
  const netWorth = calculateNetWorth(data);
  const totalAssets = calculateTotal(data.assets);
  const totalCardDebt = calculateTotalBalance(data.creditCards);
  const totalLoanDebt = calculateTotalBalance(data.loans);
  const totalDebt = totalCardDebt + totalLoanDebt;
  const totalIncome = calculateMonthlyIncome(data.income?.jobs || []);
  const totalBills = calculateTotal(data.monthlyBills || []);
  const dti = calculateDTI(totalBills, totalIncome);

  const width = 880;

  if (metricType === 'NET WORTH') {
    const assetItems = data.assets || [];
    const cardItems = data.creditCards || [];
    const loanItems = data.loans || [];

    const height = 620;

    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0B1120"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="redGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#EF4444"/>
      <stop offset="100%" stop-color="#DC2626"/>
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="${width}" height="${height}" rx="16" fill="url(#bg)" stroke="#1E293B" stroke-width="2"/>
  
  <!-- Subtle Grid Lines -->
  <line x1="30" y1="75" x2="850" y2="75" stroke="#1E293B" stroke-width="1.5"/>
  <line x1="30" y1="565" x2="850" y2="565" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Top Ribbon -->
  <g transform="translate(30, 24)">
    <rect x="0" y="0" width="220" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="12" y="17" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="1">WMCW FORMULA ENGINE</text>
    <text x="240" y="18" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">Month: <tspan fill="#F8FAFC">${escapeXml(formattedMonth)}</tspan></text>
    
    <rect x="690" y="0" width="130" height="26" rx="6" fill="#064E3B" stroke="#059669" stroke-width="1"/>
    <text x="702" y="17" fill="#34D399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">AUDIT VERIFIED ✓</text>
  </g>

  <!-- Title & Result Banner -->
  <g transform="translate(30, 95)">
    <text x="0" y="24" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" letter-spacing="-0.5">NET WORTH CALCULATION</text>
    <text x="0" y="46" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Formula: Total Assets minus Total Liabilities (Debts)</text>
    
    <!-- Big Computed Result Box -->
    <g transform="translate(560, -5)" filter="url(#cardShadow)">
      <rect width="260" height="66" rx="12" fill="#0F172A" stroke="${netWorth >= 0 ? '#10B981' : '#EF4444'}" stroke-width="2"/>
      <text x="130" y="22" text-anchor="middle" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="1">RESULTING NET WORTH</text>
      <text x="130" y="50" text-anchor="middle" fill="${netWorth >= 0 ? '#34D399' : '#F87171'}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800">${escapeXml(formatCurrency(netWorth))}</text>
    </g>
  </g>

  <!-- Equation Flow Bar -->
  <g transform="translate(30, 180)">
    <!-- Box A: Total Assets -->
    <rect x="0" y="0" width="240" height="74" rx="10" fill="#1E293B" stroke="#0284C7" stroke-width="1.5" filter="url(#cardShadow)"/>
    <text x="16" y="24" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="0.5">TOTAL ASSETS (A)</text>
    <text x="16" y="52" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800">${escapeXml(formatCurrency(totalAssets))}</text>
    <text x="224" y="52" text-anchor="end" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">${assetItems.length} items</text>

    <!-- Minus Operator -->
    <circle cx="280" cy="37" r="18" fill="#334155"/>
    <text x="280" y="44" text-anchor="middle" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800">−</text>

    <!-- Box B: Total Debt -->
    <rect x="320" y="0" width="240" height="74" rx="10" fill="#1E293B" stroke="#E11D48" stroke-width="1.5" filter="url(#cardShadow)"/>
    <text x="336" y="24" fill="#FB7185" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="0.5">TOTAL DEBT (B)</text>
    <text x="336" y="52" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800">${escapeXml(formatCurrency(totalDebt))}</text>
    <text x="544" y="52" text-anchor="end" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">${cardItems.length + loanItems.length} items</text>

    <!-- Equals Operator -->
    <circle cx="600" cy="37" r="18" fill="#334155"/>
    <text x="600" y="43" text-anchor="middle" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800">=</text>

    <!-- Box C: Resulting Net Worth -->
    <rect x="640" y="0" width="180" height="74" rx="10" fill="${netWorth >= 0 ? '#064E3B' : '#7F1D1D'}" stroke="${netWorth >= 0 ? '#10B981' : '#EF4444'}" stroke-width="1.5"/>
    <text x="656" y="24" fill="${netWorth >= 0 ? '#6EE7B7' : '#FCA5A5'}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">NET WORTH (A − B)</text>
    <text x="656" y="52" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800">${escapeXml(formatCurrency(netWorth))}</text>
  </g>

  <!-- User Entered Elements Section -->
  <g transform="translate(30, 280)">
    <!-- Header with Highlight Pill -->
    <rect x="0" y="0" width="820" height="32" rx="6" fill="#1E293B"/>
    <rect x="8" y="5" width="200" height="22" rx="4" fill="#D97706"/>
    <text x="18" y="20" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" letter-spacing="0.5">★ USER-ENTERED INPUTS</text>
    <text x="220" y="21" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">Numbers entered directly by you that formulate this calculation</text>

    <!-- Column 1: Assets Entered -->
    <g transform="translate(0, 44)">
      <rect width="395" height="215" rx="8" fill="#0F172A" stroke="#334155" stroke-width="1"/>
      <text x="14" y="22" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">ENTERED ASSETS (DATA EDITOR &gt; ASSETS)</text>
      
      ${assetItems.slice(0, 4).map((item, idx) => `
        <g transform="translate(14, ${40 + idx * 38})">
          <rect x="0" y="0" width="367" height="32" rx="6" fill="#1E293B" stroke="#38BDF8" stroke-width="0.8" stroke-dasharray="3 2"/>
          <text x="10" y="20" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">${escapeXml(item.name.slice(0, 22))}</text>
          <rect x="250" y="4" width="107" height="24" rx="4" fill="#0284C7" fill-opacity="0.2" stroke="#38BDF8" stroke-width="1"/>
          <text x="303" y="19" text-anchor="middle" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">+ ${escapeXml(formatCurrency(item.value))}</text>
        </g>
      `).join('')}

      <text x="14" y="202" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Subtotal Assets Entered: <tspan fill="#38BDF8" font-weight="700">${escapeXml(formatCurrency(totalAssets))}</tspan></text>
    </g>

    <!-- Column 2: Liabilities Entered -->
    <g transform="translate(425, 44)">
      <rect width="395" height="215" rx="8" fill="#0F172A" stroke="#334155" stroke-width="1"/>
      <text x="14" y="22" fill="#FB7185" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">ENTERED DEBTS (CARDS &amp; LOANS)</text>
      
      ${[...cardItems.slice(0, 2), ...loanItems.slice(0, 2)].slice(0, 4).map((item, idx) => `
        <g transform="translate(14, ${40 + idx * 38})">
          <rect x="0" y="0" width="367" height="32" rx="6" fill="#1E293B" stroke="#FB7185" stroke-width="0.8" stroke-dasharray="3 2"/>
          <text x="10" y="20" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">${escapeXml(item.name.slice(0, 22))}</text>
          <rect x="250" y="4" width="107" height="24" rx="4" fill="#BE123C" fill-opacity="0.2" stroke="#FB7185" stroke-width="1"/>
          <text x="303" y="19" text-anchor="middle" fill="#FB7185" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">− ${escapeXml(formatCurrency(item.balance))}</text>
        </g>
      `).join('')}

      <text x="14" y="202" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Subtotal Debts Entered: <tspan fill="#FB7185" font-weight="700">${escapeXml(formatCurrency(totalDebt))}</tspan></text>
    </g>
  </g>

  <!-- Footer Watermark -->
  <g transform="translate(30, 585)">
    <text x="0" y="14" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">🔒 WhatsMyCreditWorth.com Mathematical Audit Engine • Highlighted pills signify direct user inputs.</text>
    <text x="820" y="14" text-anchor="end" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Generated Live</text>
  </g>
</svg>
    `;
  }

  if (metricType === 'TOTAL ASSETS') {
    const assetItems = data.assets || [];
    const height = Math.max(560, 360 + assetItems.length * 48);

    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgAssets" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0B1120"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" rx="16" fill="url(#bgAssets)" stroke="#1E293B" stroke-width="2"/>
  <line x1="30" y1="75" x2="850" y2="75" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Top Ribbon -->
  <g transform="translate(30, 24)">
    <rect x="0" y="0" width="220" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="12" y="17" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="1">WMCW ASSETS AUDIT</text>
    <text x="240" y="18" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">Month: <tspan fill="#F8FAFC">${escapeXml(formattedMonth)}</tspan></text>
    
    <rect x="690" y="0" width="130" height="26" rx="6" fill="#075985" stroke="#0284C7" stroke-width="1"/>
    <text x="702" y="17" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">SUMMATION ✓</text>
  </g>

  <!-- Title & Result -->
  <g transform="translate(30, 95)">
    <text x="0" y="24" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800">TOTAL ASSETS CALCULATION</text>
    <text x="0" y="46" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Formula: Sum of all cash, investments, crypto, and equity entered by user</text>
    
    <g transform="translate(560, -5)" filter="url(#cardShadow)">
      <rect width="260" height="66" rx="12" fill="#0F172A" stroke="#0284C7" stroke-width="2"/>
      <text x="130" y="22" text-anchor="middle" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="1">RESULTING TOTAL ASSETS</text>
      <text x="130" y="50" text-anchor="middle" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800">${escapeXml(formatCurrency(totalAssets))}</text>
    </g>
  </g>

  <!-- Highlight Banner -->
  <g transform="translate(30, 180)">
    <rect x="0" y="0" width="820" height="34" rx="6" fill="#1E293B"/>
    <rect x="8" y="6" width="190" height="22" rx="4" fill="#0284C7"/>
    <text x="18" y="21" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800">★ USER-ENTERED ASSETS</text>
    <text x="210" y="22" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">Each value below is highlighted from your input in the Data Editor Assets tab</text>
  </g>

  <!-- Table of Assets -->
  <g transform="translate(30, 230)">
    ${assetItems.map((item, idx) => {
      const share = totalAssets > 0 ? ((item.value / totalAssets) * 100).toFixed(1) : '0.0';
      return `
      <g transform="translate(0, ${idx * 52})">
        <rect width="820" height="44" rx="8" fill="#0F172A" stroke="#334155" stroke-width="1"/>
        <circle cx="24" cy="22" r="10" fill="#0284C7" fill-opacity="0.2"/>
        <text x="24" y="26" text-anchor="middle" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">${idx + 1}</text>
        
        <text x="46" y="22" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">${escapeXml(item.name)}</text>
        <text x="46" y="36" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10">${escapeXml(item.category || item.institution || 'Asset Account')} • ${share}% of total</text>
        
        <!-- Highlighted User Input Pill -->
        <rect x="620" y="7" width="185" height="30" rx="6" fill="#0369A1" fill-opacity="0.25" stroke="#38BDF8" stroke-width="1.5"/>
        <text x="632" y="23" fill="#BAE6FD" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700">USER INPUT:</text>
        <text x="793" y="24" text-anchor="end" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800">+ ${escapeXml(formatCurrency(item.value))}</text>
      </g>
      `;
    }).join('')}
  </g>

  <!-- Bottom Total Row -->
  <g transform="translate(30, ${240 + assetItems.length * 52})">
    <rect width="820" height="46" rx="8" fill="#1E293B" stroke="#0284C7" stroke-width="1.5"/>
    <text x="20" y="28" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800">SUM OF ALL USER ASSETS (${assetItems.length} accounts):</text>
    <text x="800" y="30" text-anchor="end" fill="#38BDF8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800">${escapeXml(formatCurrency(totalAssets))}</text>
  </g>

  <g transform="translate(30, ${height - 25})">
    <text x="0" y="12" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">🔒 WhatsMyCreditWorth.com • Formula: Total = Σ(Asset Values)</text>
    <text x="820" y="12" text-anchor="end" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Highlight Color: Cyan / User Input</text>
  </g>
</svg>
    `;
  }

  if (metricType === 'TOTAL DEBT') {
    const cardItems = data.creditCards || [];
    const loanItems = data.loans || [];
    const height = Math.max(580, 420 + (cardItems.length + loanItems.length) * 36);

    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgDebt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0B1120"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" rx="16" fill="url(#bgDebt)" stroke="#1E293B" stroke-width="2"/>
  <line x1="30" y1="75" x2="850" y2="75" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Top Ribbon -->
  <g transform="translate(30, 24)">
    <rect x="0" y="0" width="220" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="12" y="17" fill="#FB7185" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="1">WMCW LIABILITIES AUDIT</text>
    <text x="240" y="18" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">Month: <tspan fill="#F8FAFC">${escapeXml(formattedMonth)}</tspan></text>
    
    <rect x="690" y="0" width="130" height="26" rx="6" fill="#881337" stroke="#E11D48" stroke-width="1"/>
    <text x="702" y="17" fill="#FDA4AF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">DEBT AUDITED ✓</text>
  </g>

  <!-- Title & Result Banner -->
  <g transform="translate(30, 95)">
    <text x="0" y="24" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800">TOTAL DEBT CALCULATION</text>
    <text x="0" y="46" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Formula: Revolving Credit Card Balances + Installment Loan Balances</text>
    
    <g transform="translate(560, -5)" filter="url(#cardShadow)">
      <rect width="260" height="66" rx="12" fill="#0F172A" stroke="#E11D48" stroke-width="2"/>
      <text x="130" y="22" text-anchor="middle" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="1">RESULTING TOTAL DEBT</text>
      <text x="130" y="50" text-anchor="middle" fill="#FB7185" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800">${escapeXml(formatCurrency(totalDebt))}</text>
    </g>
  </g>

  <!-- Two Component Split -->
  <g transform="translate(30, 180)">
    <!-- Cards Component -->
    <rect x="0" y="0" width="395" height="74" rx="10" fill="#1E293B" stroke="#E11D48" stroke-width="1.5" filter="url(#cardShadow)"/>
    <text x="16" y="24" fill="#FDA4AF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="0.5">REVOLVING CREDIT CARDS (${cardItems.length})</text>
    <text x="16" y="52" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800">${escapeXml(formatCurrency(totalCardDebt))}</text>

    <!-- Plus -->
    <circle cx="410" cy="37" r="14" fill="#334155"/>
    <text x="410" y="42" text-anchor="middle" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800">+</text>

    <!-- Loans Component -->
    <rect x="425" y="0" width="395" height="74" rx="10" fill="#1E293B" stroke="#9333EA" stroke-width="1.5" filter="url(#cardShadow)"/>
    <text x="441" y="24" fill="#D8B4FE" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="0.5">INSTALLMENT LOANS (${loanItems.length})</text>
    <text x="441" y="52" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800">${escapeXml(formatCurrency(totalLoanDebt))}</text>
  </g>

  <!-- Highlight Banner -->
  <g transform="translate(30, 275)">
    <rect x="0" y="0" width="820" height="34" rx="6" fill="#1E293B"/>
    <rect x="8" y="6" width="220" height="22" rx="4" fill="#BE123C"/>
    <text x="18" y="21" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800">★ USER-ENTERED BALANCES</text>
    <text x="240" y="22" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">Direct balances entered in Data Editor &gt; Credit Cards &amp; Loans</text>
  </g>

  <!-- List of Balances -->
  <g transform="translate(30, 325)">
    <!-- Credit Cards Sub-group -->
    <g transform="translate(0, 0)">
      <rect width="395" height="${Math.max(140, 40 + cardItems.length * 36)}" rx="8" fill="#0F172A" stroke="#334155" stroke-width="1"/>
      <text x="14" y="22" fill="#FDA4AF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">CREDIT CARD BALANCES ENTERED</text>
      ${cardItems.map((c, i) => `
        <g transform="translate(14, ${34 + i * 36})">
          <rect x="0" y="0" width="367" height="30" rx="6" fill="#1E293B" stroke="#E11D48" stroke-width="0.8" stroke-dasharray="3 2"/>
          <text x="10" y="19" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">${escapeXml(c.name.slice(0, 18))}</text>
          <rect x="235" y="4" width="122" height="22" rx="4" fill="#881337" fill-opacity="0.3" stroke="#FDA4AF" stroke-width="1"/>
          <text x="296" y="18" text-anchor="middle" fill="#FDA4AF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">USER: ${escapeXml(formatCurrency(c.balance))}</text>
        </g>
      `).join('')}
    </g>

    <!-- Loans Sub-group -->
    <g transform="translate(425, 0)">
      <rect width="395" height="${Math.max(140, 40 + loanItems.length * 36)}" rx="8" fill="#0F172A" stroke="#334155" stroke-width="1"/>
      <text x="14" y="22" fill="#D8B4FE" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">LOAN BALANCES ENTERED</text>
      ${loanItems.map((l, i) => `
        <g transform="translate(14, ${34 + i * 36})">
          <rect x="0" y="0" width="367" height="30" rx="6" fill="#1E293B" stroke="#9333EA" stroke-width="0.8" stroke-dasharray="3 2"/>
          <text x="10" y="19" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">${escapeXml(l.name.slice(0, 18))}</text>
          <rect x="235" y="4" width="122" height="22" rx="4" fill="#581C87" fill-opacity="0.3" stroke="#D8B4FE" stroke-width="1"/>
          <text x="296" y="18" text-anchor="middle" fill="#D8B4FE" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">USER: ${escapeXml(formatCurrency(l.balance))}</text>
        </g>
      `).join('')}
    </g>
  </g>

  <g transform="translate(30, ${height - 25})">
    <text x="0" y="12" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">🔒 WhatsMyCreditWorth.com • Formula: Total Debt = Σ(Card Balances) + Σ(Loan Balances)</text>
    <text x="820" y="12" text-anchor="end" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Highlight Color: Rose / Purple</text>
  </g>
</svg>
    `;
  }

  if (metricType === 'MONTHLY INCOME') {
    const jobs = data.income?.jobs || [];
    const height = Math.max(540, 360 + jobs.length * 56);

    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgInc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0B1120"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" rx="16" fill="url(#bgInc)" stroke="#1E293B" stroke-width="2"/>
  <line x1="30" y1="75" x2="850" y2="75" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Ribbon -->
  <g transform="translate(30, 24)">
    <rect x="0" y="0" width="220" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="12" y="17" fill="#34D399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="1">WMCW INCOME ENGINE</text>
    <text x="240" y="18" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">Month: <tspan fill="#F8FAFC">${escapeXml(formattedMonth)}</tspan></text>
    
    <rect x="690" y="0" width="130" height="26" rx="6" fill="#064E3B" stroke="#059669" stroke-width="1"/>
    <text x="702" y="17" fill="#34D399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">INCOME NORMALIZED ✓</text>
  </g>

  <!-- Title & Result -->
  <g transform="translate(30, 95)">
    <text x="0" y="24" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800">GROSS MONTHLY INCOME CALCULATION</text>
    <text x="0" y="46" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Formula: Sum of user-entered income streams annualized and normalized to monthly</text>
    
    <g transform="translate(560, -5)" filter="url(#cardShadow)">
      <rect width="260" height="66" rx="12" fill="#0F172A" stroke="#10B981" stroke-width="2"/>
      <text x="130" y="22" text-anchor="middle" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="1">RESULTING MONTHLY INCOME</text>
      <text x="130" y="50" text-anchor="middle" fill="#34D399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800">${escapeXml(formatCurrency(totalIncome))}</text>
    </g>
  </g>

  <!-- Banner -->
  <g transform="translate(30, 180)">
    <rect x="0" y="0" width="820" height="34" rx="6" fill="#1E293B"/>
    <rect x="8" y="6" width="220" height="22" rx="4" fill="#059669"/>
    <text x="18" y="21" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800">★ USER-ENTERED JOBS &amp; PAY</text>
    <text x="240" y="22" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">Each amount &amp; pay frequency is entered by you in Data Editor &gt; Income</text>
  </g>

  <!-- Jobs List -->
  <g transform="translate(30, 230)">
    ${jobs.map((job, idx) => {
      let monthlyContrib = 0;
      const weeksInMonth = 52 / 12;
      const amount = Number(job.amount) || 0;
      let freqLabel = job.frequency || 'monthly';
      let formulaText = `Entered $${amount.toLocaleString()} ${freqLabel}`;

      switch (job.frequency) {
        case 'weekly':
          monthlyContrib = amount * weeksInMonth;
          formulaText = `$${amount} × (52 ÷ 12) = ${formatCurrency(monthlyContrib)}`;
          break;
        case 'bi-weekly':
          monthlyContrib = amount * (weeksInMonth / 2);
          formulaText = `$${amount} × (26 ÷ 12) = ${formatCurrency(monthlyContrib)}`;
          break;
        case 'twice-a-month':
          monthlyContrib = amount * 2;
          formulaText = `$${amount} × 2 = ${formatCurrency(monthlyContrib)}`;
          break;
        case 'monthly':
          monthlyContrib = amount;
          formulaText = `$${amount} × 1.0 = ${formatCurrency(monthlyContrib)}`;
          break;
        case 'yearly':
          monthlyContrib = amount / 12;
          formulaText = `$${amount} ÷ 12 = ${formatCurrency(monthlyContrib)}`;
          break;
        default:
          monthlyContrib = amount;
      }

      return `
      <g transform="translate(0, ${idx * 60})">
        <rect width="820" height="50" rx="8" fill="#0F172A" stroke="#334155" stroke-width="1"/>
        
        <circle cx="24" cy="25" r="10" fill="#059669" fill-opacity="0.2"/>
        <text x="24" y="29" text-anchor="middle" fill="#34D399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">${idx + 1}</text>
        
        <text x="46" y="22" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">${escapeXml(job.name)}</text>
        <text x="46" y="38" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">${escapeXml(formulaText)}</text>
        
        <!-- User Input Tag -->
        <rect x="430" y="10" width="165" height="30" rx="6" fill="#065F46" fill-opacity="0.25" stroke="#10B981" stroke-width="1.2"/>
        <text x="442" y="26" fill="#A7F3D0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700">USER INPUT:</text>
        <text x="585" y="28" text-anchor="end" fill="#34D399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800">${escapeXml(formatCurrency(job.amount))}</text>
        
        <!-- Monthly Result Pill -->
        <rect x="610" y="10" width="195" height="30" rx="6" fill="#1E293B" stroke="#059669" stroke-width="1.5"/>
        <text x="622" y="26" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600">MONTHLY CONTRIB:</text>
        <text x="793" y="28" text-anchor="end" fill="#10B981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800">+ ${escapeXml(formatCurrency(monthlyContrib))}</text>
      </g>
      `;
    }).join('')}
  </g>

  <!-- Total Row -->
  <g transform="translate(30, ${240 + jobs.length * 60})">
    <rect width="820" height="46" rx="8" fill="#1E293B" stroke="#10B981" stroke-width="1.5"/>
    <text x="20" y="28" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800">SUM OF ALL NORMALIZED INCOME STREAMS:</text>
    <text x="800" y="30" text-anchor="end" fill="#34D399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800">${escapeXml(formatCurrency(totalIncome))}/mo</text>
  </g>

  <g transform="translate(30, ${height - 25})">
    <text x="0" y="12" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">🔒 WhatsMyCreditWorth.com • Formula: Monthly = Σ(Pay Amount × Frequency Factor)</text>
    <text x="820" y="12" text-anchor="end" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Highlight Color: Emerald / User Input</text>
  </g>
</svg>
    `;
  }

  // DTI RATIO
  const bills = data.monthlyBills || [];
  const height = Math.max(580, 420 + Math.min(bills.length, 6) * 36);
  const dtiColor = dti <= 36 ? '#10B981' : dti > 43 ? '#EF4444' : '#F59E0B';
  const dtiStatusText = dti <= 36 ? 'IDEAL / LOW RISK (≤36%)' : dti > 43 ? 'HIGH RISK (&gt;43%)' : 'ACCEPTABLE (37-43%)';

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgDti" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0B1120"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" rx="16" fill="url(#bgDti)" stroke="#1E293B" stroke-width="2"/>
  <line x1="30" y1="75" x2="850" y2="75" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Top Ribbon -->
  <g transform="translate(30, 24)">
    <rect x="0" y="0" width="220" height="26" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="12" y="17" fill="#F59E0B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="1">WMCW UNDERWRITING</text>
    <text x="240" y="18" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">Month: <tspan fill="#F8FAFC">${escapeXml(formattedMonth)}</tspan></text>
    
    <rect x="670" y="0" width="150" height="26" rx="6" fill="#1E293B" stroke="${dtiColor}" stroke-width="1"/>
    <text x="745" y="17" text-anchor="middle" fill="${dtiColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">${escapeXml(dtiStatusText)}</text>
  </g>

  <!-- Title & Result -->
  <g transform="translate(30, 95)">
    <text x="0" y="24" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800">DEBT-TO-INCOME (DTI) RATIO</text>
    <text x="0" y="46" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Formula: (Total Monthly Bills ÷ Gross Monthly Income) × 100</text>
    
    <g transform="translate(560, -5)" filter="url(#cardShadow)">
      <rect width="260" height="66" rx="12" fill="#0F172A" stroke="${dtiColor}" stroke-width="2"/>
      <text x="130" y="22" text-anchor="middle" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="1">RESULTING DTI RATIO</text>
      <text x="130" y="50" text-anchor="middle" fill="${dtiColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800">${dti.toFixed(2)}%</text>
    </g>
  </g>

  <!-- Mathematical Fraction Representation -->
  <g transform="translate(30, 180)">
    <!-- Numerator Box -->
    <rect x="0" y="0" width="340" height="60" rx="8" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
    <text x="14" y="22" fill="#FBBF24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" letter-spacing="0.5">NUMERATOR: TOTAL MONTHLY BILLS</text>
    <text x="14" y="45" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800">${escapeXml(formatCurrency(totalBills))}</text>
    <text x="326" y="45" text-anchor="end" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">${bills.length} bills</text>

    <!-- Division Sign -->
    <text x="365" y="38" text-anchor="middle" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800">÷</text>

    <!-- Denominator Box -->
    <rect x="390" y="0" width="300" height="60" rx="8" fill="#1E293B" stroke="#10B981" stroke-width="1.5"/>
    <text x="404" y="22" fill="#34D399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" letter-spacing="0.5">DENOMINATOR: GROSS INCOME</text>
    <text x="404" y="45" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800">${escapeXml(formatCurrency(totalIncome))}</text>

    <!-- Multiplier Box -->
    <text x="710" y="38" text-anchor="middle" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800">× 100 =</text>
    
    <!-- Result -->
    <rect x="745" y="0" width="75" height="60" rx="8" fill="#0F172A" stroke="${dtiColor}" stroke-width="2"/>
    <text x="782" y="38" text-anchor="middle" fill="${dtiColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800">${dti.toFixed(1)}%</text>
  </g>

  <!-- User Input Highlights -->
  <g transform="translate(30, 265)">
    <rect x="0" y="0" width="820" height="34" rx="6" fill="#1E293B"/>
    <rect x="8" y="6" width="220" height="22" rx="4" fill="#D97706"/>
    <text x="18" y="21" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800">★ USER-ENTERED BILLS (NUMERATOR)</text>
    <text x="240" y="22" fill="#CBD5E1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">Each monthly bill is entered in Data Editor &gt; Monthly Bills</text>
  </g>

  <g transform="translate(30, 310)">
    ${bills.slice(0, 5).map((bill, i) => `
      <g transform="translate(0, ${i * 36})">
        <rect width="820" height="30" rx="6" fill="#0F172A" stroke="#334155" stroke-width="1"/>
        <text x="16" y="20" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">${escapeXml(bill.name)}</text>
        
        <rect x="620" y="3" width="185" height="24" rx="4" fill="#B45309" fill-opacity="0.25" stroke="#F59E0B" stroke-width="1"/>
        <text x="632" y="19" fill="#FDE68A" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700">USER INPUT:</text>
        <text x="793" y="20" text-anchor="end" fill="#FBBF24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800">+ ${escapeXml(formatCurrency(bill.amount))}</text>
      </g>
    `).join('')}
  </g>

  <g transform="translate(30, ${height - 25})">
    <text x="0" y="12" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">🔒 WhatsMyCreditWorth.com • Formula: DTI = (Total Bills / Gross Income) × 100</text>
    <text x="820" y="12" text-anchor="end" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Underwriting Cap: 36.0% (Preferred) / 43.0% (QM Limit)</text>
  </g>
</svg>
  `;
}

const CalculationImageModal: React.FC<CalculationImageModalProps> = ({
  isOpen,
  onClose,
  initialMetric,
  data,
  monthYear,
  onOpenEditor
}) => {
  const [activeMetric, setActiveMetric] = useState<CalculationMetricType>(initialMetric || 'NET WORTH');
  const [copySuccess, setCopySuccess] = useState(false);

  // Sync initialMetric when opened
  React.useEffect(() => {
    if (initialMetric) {
      setActiveMetric(initialMetric);
    }
  }, [initialMetric, isOpen]);

  if (!isOpen || !data) return null;

  const svgString = useMemo(() => {
    return generateCalculationSvg(activeMetric, data, monthYear);
  }, [activeMetric, data, monthYear]);

  const svgDataUrl = useMemo(() => {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  }, [svgString]);

  const metrics: CalculationMetricType[] = ['NET WORTH', 'TOTAL ASSETS', 'TOTAL DEBT', 'MONTHLY INCOME', 'DTI RATIO'];

  const handleDownloadSvg = () => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WMCW_${activeMetric.replace(/\s+/g, '_')}_${monthYear}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = svgDataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Render at 2x for sharp retina resolution
      canvas.width = 880 * 2;
      canvas.height = (img.height || 620) * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `WMCW_${activeMetric.replace(/\s+/g, '_')}_${monthYear}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  const handleCopyMath = () => {
    let summaryText = '';
    if (activeMetric === 'NET WORTH') {
      const assets = calculateTotal(data.assets);
      const debt = calculateTotalBalance(data.creditCards) + calculateTotalBalance(data.loans);
      const netWorth = assets - debt;
      summaryText = `WMCW Net Worth Calculation for ${monthYear}:\nTotal Assets: ${formatCurrency(assets)}\n- Total Debt: ${formatCurrency(debt)}\n= Resulting Net Worth: ${formatCurrency(netWorth)}`;
    } else if (activeMetric === 'TOTAL ASSETS') {
      const total = calculateTotal(data.assets);
      summaryText = `WMCW Total Assets Calculation for ${monthYear}:\n` +
        (data.assets || []).map(a => `• ${a.name}: ${formatCurrency(a.value)}`).join('\n') +
        `\n= Total Assets: ${formatCurrency(total)}`;
    } else if (activeMetric === 'TOTAL DEBT') {
      const cards = calculateTotalBalance(data.creditCards);
      const loans = calculateTotalBalance(data.loans);
      summaryText = `WMCW Total Debt Calculation for ${monthYear}:\nRevolving Cards: ${formatCurrency(cards)}\nInstallment Loans: ${formatCurrency(loans)}\n= Total Debt: ${formatCurrency(cards + loans)}`;
    } else if (activeMetric === 'MONTHLY INCOME') {
      const total = calculateMonthlyIncome(data.income?.jobs || []);
      summaryText = `WMCW Monthly Income Calculation for ${monthYear}:\n` +
        (data.income?.jobs || []).map(j => `• ${j.name}: ${formatCurrency(j.amount)} (${j.frequency})`).join('\n') +
        `\n= Gross Monthly Income: ${formatCurrency(total)}/mo`;
    } else {
      const bills = calculateTotal(data.monthlyBills || []);
      const income = calculateMonthlyIncome(data.income?.jobs || []);
      const dti = calculateDTI(bills, income);
      summaryText = `WMCW DTI Calculation for ${monthYear}:\nMonthly Bills: ${formatCurrency(bills)}\n÷ Monthly Income: ${formatCurrency(income)}\n× 100 = DTI: ${dti.toFixed(2)}%`;
    }

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fade-in">
      <div 
        className="bg-gray-900 border border-gray-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto text-gray-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 md:p-5 bg-gray-850 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-brand-primary font-bold text-lg">
              ∑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-bold text-white tracking-tight">Calculation Formula &amp; Input Breakdown</h3>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700 px-2 py-0.5 rounded-full">
                  LIVE AUDIT
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Visualizing exact user inputs and arithmetic for {formatMonthYear(monthYear, 'long') || monthYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenEditor && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEditor();
                }}
                className="text-xs font-semibold text-brand-secondary hover:text-white bg-brand-secondary/10 hover:bg-brand-secondary/30 border border-brand-secondary/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                title="Edit these numbers in the Data Editor"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Inputs</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Metric Switcher Tab Bar */}
        <div className="px-4 py-2.5 bg-gray-950 border-b border-gray-800 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          {metrics.map((m) => {
            const isActive = activeMetric === m;
            return (
              <button
                key={m}
                onClick={() => setActiveMetric(m)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                <span>{m}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Calculation Image Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Generated Calculation Image (Highlights User-Entered Numbers)
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPng}
                  className="text-xs font-semibold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-2.5 py-1 rounded-md transition-all flex items-center gap-1"
                  title="Download calculation image as high-res PNG"
                >
                  <svg className="w-3 h-3 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download .PNG</span>
                </button>
                <button
                  onClick={handleDownloadSvg}
                  className="text-xs font-semibold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-2.5 py-1 rounded-md transition-all flex items-center gap-1"
                  title="Download vector graphic SVG"
                >
                  <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <span>.SVG</span>
                </button>
                <button
                  onClick={handleCopyMath}
                  className="text-xs font-semibold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-2.5 py-1 rounded-md transition-all flex items-center gap-1"
                  title="Copy calculation summary text to clipboard"
                >
                  <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>{copySuccess ? 'Copied!' : 'Copy Math'}</span>
                </button>
              </div>
            </div>

            {/* Rendered Image Element */}
            <div className="bg-gray-950 p-2 md:p-3 rounded-xl border border-gray-800 shadow-inner flex items-center justify-center">
              <img
                src={svgDataUrl}
                alt={`Calculation details for ${activeMetric}`}
                className="w-full h-auto max-h-[480px] object-contain rounded-lg shadow-md"
              />
            </div>
          </div>

          {/* Detailed Itemized Ledger Section */}
          <div className="bg-gray-850 p-4 rounded-xl border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                User-Entered Numbers Ledger &amp; Calculation Provenance
              </h4>
              <span className="text-[11px] text-gray-400">
                Gold &amp; cyan tags highlight numbers you entered
              </span>
            </div>

            {activeMetric === 'NET WORTH' && (
              <div className="space-y-3 text-xs">
                <p className="text-gray-300">
                  Your Net Worth is calculated as <strong>Total Assets minus Total Debt</strong>. Both sides of the equation are composed strictly of the records you entered:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-900 rounded-lg border border-sky-900/60">
                    <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-800">
                      <span className="font-bold text-sky-400">Total Assets (A)</span>
                      <span className="font-bold text-white">{formatCurrency(calculateTotal(data.assets))}</span>
                    </div>
                    <ul className="space-y-1 text-gray-400">
                      {(data.assets || []).map(a => (
                        <li key={a.id} className="flex justify-between items-center">
                          <span>{a.name}</span>
                          <span className="font-mono text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/50">
                            {formatCurrency(a.value)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-gray-900 rounded-lg border border-rose-900/60">
                    <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-800">
                      <span className="font-bold text-rose-400">Total Debt (B)</span>
                      <span className="font-bold text-white">{formatCurrency(calculateTotalBalance(data.creditCards) + calculateTotalBalance(data.loans))}</span>
                    </div>
                    <ul className="space-y-1 text-gray-400">
                      {(data.creditCards || []).map(c => (
                        <li key={c.id} className="flex justify-between items-center">
                          <span>{c.name} (Card)</span>
                          <span className="font-mono text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50">
                            {formatCurrency(c.balance)}
                          </span>
                        </li>
                      ))}
                      {(data.loans || []).map(l => (
                        <li key={l.id} className="flex justify-between items-center">
                          <span>{l.name} (Loan)</span>
                          <span className="font-mono text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50">
                            {formatCurrency(l.balance)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeMetric === 'TOTAL ASSETS' && (
              <div className="space-y-2 text-xs">
                <p className="text-gray-300">
                  Every asset below was inputted in the <strong>Data Editor &gt; Assets</strong> tab. The sum is exactly equal to the highlighted total:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400 text-[11px]">
                        <th className="py-2">Asset Name</th>
                        <th className="py-2">Category</th>
                        <th className="py-2 text-right">User-Entered Value</th>
                        <th className="py-2 text-right">% Portfolio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {(data.assets || []).map(a => {
                        const total = calculateTotal(data.assets);
                        const pct = total > 0 ? ((a.value / total) * 100).toFixed(1) : '0';
                        return (
                          <tr key={a.id} className="hover:bg-gray-800/50">
                            <td className="py-2 font-medium text-white">{a.name}</td>
                            <td className="py-2 text-gray-400">{a.category || a.institution || 'Asset'}</td>
                            <td className="py-2 text-right">
                              <span className="font-mono text-sky-400 font-bold bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/50">
                                {formatCurrency(a.value)}
                              </span>
                            </td>
                            <td className="py-2 text-right text-gray-400">{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeMetric === 'TOTAL DEBT' && (
              <div className="space-y-2 text-xs">
                <p className="text-gray-300">
                  Total Debt sums the current balances of all credit cards and loans entered in <strong>Data Editor &gt; Credit Cards &amp; Loans</strong>:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400 text-[11px]">
                        <th className="py-2">Liability</th>
                        <th className="py-2">Type</th>
                        <th className="py-2 text-right">User-Entered Balance</th>
                        <th className="py-2 text-right">Credit Limit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {(data.creditCards || []).map(c => (
                        <tr key={c.id} className="hover:bg-gray-800/50">
                          <td className="py-2 font-medium text-white">{c.name}</td>
                          <td className="py-2 text-gray-400">Credit Card (Revolving)</td>
                          <td className="py-2 text-right">
                            <span className="font-mono text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
                              {formatCurrency(c.balance)}
                            </span>
                          </td>
                          <td className="py-2 text-right text-gray-400">{formatCurrency(c.limit)}</td>
                        </tr>
                      ))}
                      {(data.loans || []).map(l => (
                        <tr key={l.id} className="hover:bg-gray-800/50">
                          <td className="py-2 font-medium text-white">{l.name}</td>
                          <td className="py-2 text-gray-400">Installment Loan</td>
                          <td className="py-2 text-right">
                            <span className="font-mono text-purple-400 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
                              {formatCurrency(l.balance)}
                            </span>
                          </td>
                          <td className="py-2 text-right text-gray-400">{formatCurrency(l.limit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeMetric === 'MONTHLY INCOME' && (
              <div className="space-y-2 text-xs">
                <p className="text-gray-300">
                  Each job source entered in <strong>Data Editor &gt; Income</strong> is converted into a monthly equivalent using standard annual frequency multipliers (e.g., Weekly × 4.333, Bi-Weekly × 2.167, Yearly ÷ 12):
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400 text-[11px]">
                        <th className="py-2">Job / Source</th>
                        <th className="py-2">User Frequency</th>
                        <th className="py-2 text-right">User-Entered Amount</th>
                        <th className="py-2 text-right">Monthly Equivalent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {(data.income?.jobs || []).map(j => {
                        let monthly = 0;
                        const weeks = 52 / 12;
                        const amt = Number(j.amount) || 0;
                        if (j.frequency === 'weekly') monthly = amt * weeks;
                        else if (j.frequency === 'bi-weekly') monthly = amt * (weeks / 2);
                        else if (j.frequency === 'twice-a-month') monthly = amt * 2;
                        else if (j.frequency === 'monthly') monthly = amt;
                        else if (j.frequency === 'yearly') monthly = amt / 12;
                        return (
                          <tr key={j.id} className="hover:bg-gray-800/50">
                            <td className="py-2 font-medium text-white">{j.name}</td>
                            <td className="py-2 text-gray-400 capitalize">{j.frequency || 'Monthly'}</td>
                            <td className="py-2 text-right">
                              <span className="font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                                {formatCurrency(j.amount)}
                              </span>
                            </td>
                            <td className="py-2 text-right font-bold text-white">{formatCurrency(monthly)}/mo</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeMetric === 'DTI RATIO' && (
              <div className="space-y-2 text-xs">
                <p className="text-gray-300">
                  Debt-to-Income (DTI) evaluates your monthly obligations against gross income: <strong>(Total Monthly Bills ÷ Gross Monthly Income) × 100</strong>:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-gray-900 rounded-lg border border-amber-900/60">
                    <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-gray-800">
                      <span className="font-bold text-amber-400">Monthly Bills (Numerator)</span>
                      <span className="font-bold text-white">{formatCurrency(calculateTotal(data.monthlyBills))}</span>
                    </div>
                    <ul className="space-y-1 text-gray-400">
                      {(data.monthlyBills || []).map(b => (
                        <li key={b.id} className="flex justify-between items-center">
                          <span>{b.name}</span>
                          <span className="font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                            {formatCurrency(b.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-gray-900 rounded-lg border border-emerald-900/60">
                    <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-gray-800">
                      <span className="font-bold text-emerald-400">Monthly Income (Denominator)</span>
                      <span className="font-bold text-white">{formatCurrency(calculateMonthlyIncome(data.income?.jobs || []))}</span>
                    </div>
                    <div className="space-y-2 text-gray-300">
                      <p>
                        Current DTI: <strong className="text-white">{calculateDTI(calculateTotal(data.monthlyBills), calculateMonthlyIncome(data.income?.jobs || [])).toFixed(2)}%</strong>
                      </p>
                      <div className="p-2 bg-gray-950 rounded border border-gray-800 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-emerald-400">≤ 36%: Ideal / Preferred</span>
                          <span className="text-amber-400">37% - 43%: Acceptable</span>
                          <span className="text-rose-400">&gt; 43%: Elevated</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-950 border-t border-gray-800 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Tip: Click any metric tab above or close to return to your dashboard.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-xl transition-all shadow-md"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculationImageModal;
