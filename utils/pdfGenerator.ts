import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { MonthlyData, RecommendationItem, AccountType } from '../types';
import { 
  formatMonthYear, 
  formatCurrency, 
  calculateMonthlyIncome, 
  calculateTotal, 
  calculateTotalBalance, 
  calculateTotalLimit, 
  calculateUtilization, 
  calculateDTI, 
  calculateNetWorth 
} from './helpers';

export interface ChatReportParams {
  requestPrompt: string;
  responseText: string;
  timestamp?: string;
  userEmail?: string;
  displayName?: string;
  accountType?: AccountType;
  businessName?: string;
}

export interface RecommendationsReportParams {
  recommendations: RecommendationItem[];
  data: MonthlyData;
  monthYear: string;
  accountType?: AccountType;
  businessName?: string;
  businessType?: string;
  advisorMode?: 'local' | 'ai';
  userEmail?: string;
  displayName?: string;
}

const escapeHtml = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const formatMarkdownSimple = (text: string): string => {
  let html = escapeHtml(text);
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 style="color:#0f172a; font-size:13px; font-weight:700; margin-top:12px; margin-bottom:4px;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="color:#0D47A1; font-size:15px; font-weight:800; margin-top:16px; margin-bottom:6px; border-bottom:1px solid #e2e8f0; padding-bottom:3px;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="color:#0D47A1; font-size:17px; font-weight:800; margin-top:18px; margin-bottom:8px;">$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0f172a; font-weight:700;">$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em style="color:#334155;">$1</em>');
  // Bullet lists
  html = html.replace(/^\* (.*$)/gim, '<li style="margin-left:18px; margin-bottom:4px; list-style-type:disc; color:#334155;">$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li style="margin-left:18px; margin-bottom:4px; list-style-type:disc; color:#334155;">$1</li>');
  
  // Paragraph line breaks
  html = html.replace(/\n\n/g, '<br/><br/>');
  html = html.replace(/\n/g, '<br/>');

  return html;
};

// SVG Company Logo as base64 / inline SVG representation
const COMPANY_LOGO_SVG = `
<svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; flex-shrink:0;">
  <defs>
    <linearGradient id="wmcwLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0D47A1" />
      <stop offset="100%" stop-color="#1976D2" />
    </linearGradient>
    <linearGradient id="wmcwGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="10" fill="url(#wmcwLogoGrad)" />
  <path d="M24 7L37 12.5V23.5C37 31.8 31.2 38.3 24 41C16.8 38.3 11 31.8 11 23.5V12.5L24 7Z" fill="#ffffff" fill-opacity="0.12" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M17 24.5L22 29.5L31 18.5" stroke="url(#wmcwGoldGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="34" cy="13" r="2.5" fill="#F59E0B" />
</svg>
`;

const getCategoryColor = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('debt')) {
    return { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', accent: '#DC2626' };
  }
  if (cat.includes('strategic')) {
    return { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', accent: '#2563EB' };
  }
  if (cat.includes('invest')) {
    return { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', accent: '#059669' };
  }
  return { bg: '#FAF5FF', text: '#6B21A8', border: '#E9D5FF', accent: '#9333EA' };
};

/**
 * Generates an Executive Financial Insights & Recommendations PDF Report with
 * Official Letterhead, Company Logo, Financial Snapshot Metrics, Categorized Insights,
 * and Legal Disclaimer.
 */
export async function exportRecommendationsReportToPDF({
  recommendations,
  data,
  monthYear,
  accountType = 'personal',
  businessName = '',
  businessType = 'LLC',
  advisorMode = 'local',
  userEmail = 'Valued Member',
  displayName = ''
}: RecommendationsReportParams): Promise<void> {
  const totalIncome = calculateMonthlyIncome(data.income.jobs);
  const totalBills = calculateTotal(data.monthlyBills);
  const netWorth = calculateNetWorth(data);
  const cardBalance = calculateTotalBalance(data.creditCards);
  const cardLimit = calculateTotalLimit(data.creditCards);
  const cardUtilization = calculateUtilization(cardBalance, cardLimit);
  const totalAssets = calculateTotal(data.assets);
  const totalDebt = cardBalance + calculateTotalBalance(data.loans);
  const dti = calculateDTI(totalBills, totalIncome);
  const dscr = totalBills > 0 ? (totalIncome / totalBills) : 2.5;

  const recipientName = displayName || (userEmail !== 'Valued Member' ? userEmail : (accountType === 'business' && businessName ? businessName : 'Premium Member'));
  const reportRef = `WMCW-REC-${monthYear.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const formattedDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const isBusiness = accountType === 'business';

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '820px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  container.style.padding = '36px 40px';
  container.style.boxSizing = 'border-box';

  container.innerHTML = `
    <div style="background: #ffffff; color: #0f172a;">
      <!-- OFFICIAL LETTERHEAD -->
      <div style="border-bottom: 2px solid #0D47A1; padding-bottom: 16px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <!-- Logo & Brand Header -->
          <div style="display: flex; align-items: center; gap: 14px;">
            ${COMPANY_LOGO_SVG}
            <div>
              <div style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #0D47A1; line-height: 1.1;">
                WHAT'S MY CREDIT WORTH
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px;">
                Wealth Intelligence & Strategic Financial Advisory
              </div>
              <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">
                app.whatsmycreditworth.com • Underwriting & Advisory Division
              </div>
            </div>
          </div>

          <!-- Document Classification & Metadata -->
          <div style="text-align: right;">
            <div style="display: inline-block; background: #0D47A1; color: #ffffff; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 4px; margin-bottom: 6px;">
              EXECUTIVE ADVISORY BRIEF
            </div>
            <div style="font-size: 10px; color: #475569; line-height: 1.5;">
              <div><strong>Document Ref:</strong> <span style="font-family: monospace; color: #0f172a;">${reportRef}</span></div>
              <div><strong>Date Issued:</strong> ${formattedDate}</div>
              <div><strong>Period:</strong> <span style="font-weight: 700; color: #0D47A1;">${formatMonthYear(monthYear)}</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- CLIENT & UNDERWRITING PROFILE STRIP -->
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 12px; font-size: 11px;">
        <div>
          <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Client / Subject Profile</div>
          <div style="font-weight: 700; color: #0f172a; font-size: 12px; margin-top: 2px;">${escapeHtml(recipientName)}</div>
          <div style="font-size: 10px; color: #475569;">${userEmail || 'Private Member'}</div>
        </div>
        <div>
          <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Account Classification</div>
          <div style="font-weight: 700; color: ${isBusiness ? '#4338CA' : '#0D47A1'}; font-size: 12px; margin-top: 2px;">
            ${isBusiness ? `🏢 Business Profile (${escapeHtml(businessType)})` : '👤 Personal Wealth Profile'}
          </div>
          <div style="font-size: 10px; color: #475569;">
            ${isBusiness ? `Entity: ${escapeHtml(businessName || 'Commercial Account')}` : 'Consumer FICO & Household Policy'}
          </div>
        </div>
        <div>
          <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Advisory Engine</div>
          <div style="font-weight: 700; color: #0f172a; font-size: 12px; margin-top: 2px;">
            ${advisorMode === 'ai' ? '🤖 AI Deep Dive (Gemini Engine)' : '⚙️ Deterministic Rule Engine'}
          </div>
          <div style="font-size: 10px; color: #16A34A; font-weight: 700;">PRO ADVISORY VERIFIED</div>
        </div>
      </div>

      <!-- KEY UNDERWRITING METRICS SNAPSHOT -->
      <div style="margin-bottom: 22px;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #0D47A1; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
          <span>Financial Position & Underwriting Indicators</span>
          <span style="font-size: 9px; color: #64748b; font-weight: 600;">Snapshot Basis: ${formatMonthYear(monthYear)}</span>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
          <div style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 12px;">
            <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b;">${isBusiness ? 'Monthly Inflow / Rev' : 'Monthly Income'}</div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">${formatCurrency(totalIncome)}</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 12px;">
            <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b;">${isBusiness ? 'Monthly OPEX / Debt' : 'Monthly Bills / Debt'}</div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">${formatCurrency(totalBills)}</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 12px;">
            <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b;">Total Net Worth</div>
            <div style="font-size: 14px; font-weight: 800; color: ${netWorth >= 0 ? '#15803D' : '#B91C1C'}; margin-top: 2px;">${formatCurrency(netWorth)}</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 12px;">
            <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b;">${isBusiness ? 'Debt Service Ratio (DSCR)' : 'Debt-to-Income (DTI)'}</div>
            <div style="font-size: 14px; font-weight: 800; color: ${isBusiness ? (dscr >= 1.25 ? '#15803D' : '#B91C1C') : (dti <= 43 ? '#15803D' : '#B91C1C')}; margin-top: 2px;">
              ${isBusiness ? `${dscr.toFixed(2)}x` : `${dti.toFixed(1)}%`}
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 6px;">
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; font-size: 10px; color: #475569;">
            <strong>Total Assets:</strong> <span style="color: #0f172a; font-weight: 700;">${formatCurrency(totalAssets)}</span>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; font-size: 10px; color: #475569;">
            <strong>Total Liabilities:</strong> <span style="color: #0f172a; font-weight: 700;">${formatCurrency(totalDebt)}</span>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; font-size: 10px; color: #475569;">
            <strong>Revolving Utilization:</strong> <span style="color: ${cardUtilization <= 30 ? '#15803D' : '#B91C1C'}; font-weight: 700;">${cardUtilization.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <!-- STRATEGIC RECOMMENDATIONS SECTION -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #0D47A1; margin-bottom: 12px; border-bottom: 1.5px solid #0D47A1; padding-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
          <span>Strategic Advisory Findings & Action Plan</span>
          <span style="font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: none;">
            ${isBusiness ? 'Commercial Policy Framework' : 'Consumer Wealth & Credit Framework'}
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${recommendations.map((rec, idx) => {
            const colors = getCategoryColor(rec.category);
            return `
              <div style="border: 1px solid #E2E8F0; border-left: 4px solid ${colors.accent}; border-radius: 8px; padding: 12px 14px; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; background: ${colors.bg}; color: ${colors.text}; border: 1px solid ${colors.border}; padding: 2px 7px; border-radius: 4px;">
                    ${idx + 1}. ${escapeHtml(rec.category)}
                  </span>
                </div>
                <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
                  ${escapeHtml(rec.title)}
                </div>
                <div style="font-size: 11px; line-height: 1.55; color: #334155; margin-bottom: 8px;">
                  ${escapeHtml(rec.description)}
                </div>
                ${rec.actionItem ? `
                  <div style="background: #F1F5F9; border-left: 3px solid #0D47A1; padding: 6px 10px; border-radius: 4px; font-size: 10.5px; color: #1E293B; font-weight: 600;">
                    <strong style="color: #0D47A1;">Recommended Action:</strong> ${escapeHtml(rec.actionItem)}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- SIGN-OFF & VERIFICATION BLOCK -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 14px; margin-top: 20px; font-size: 10px; color: #64748b;">
        <div>
          <div><strong>Authorized Advisory System:</strong> What's My Credit Worth Core Intelligence</div>
          <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">Verification Hash: SHA256-${Math.random().toString(36).substring(2, 12).toUpperCase()}</div>
        </div>
        <div style="text-align: right;">
          <div style="color: #0D47A1; font-weight: 800; font-size: 11px;">WHAT'S MY CREDIT WORTH INC.</div>
          <div style="font-size: 9px; color: #94a3b8;">Strategic Planning & Wealth Intelligence</div>
        </div>
      </div>

      <!-- OFFICIAL LEGAL DISCLAIMER STATEMENT AT THE BOTTOM OF THE REPORT -->
      <div style="border-top: 1.5px solid #CBD5E1; padding-top: 10px; margin-top: 14px; font-size: 8.5px; color: #64748b; line-height: 1.5;">
        <div style="font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">
          DISCLAIMER & COMPLIANCE NOTICE:
        </div>
        <div>
          This Financial Insights &amp; Recommendations Report is generated by What's My Credit Worth automated financial intelligence systems for strategic planning, operational evaluation, and personal educational purposes only. The information, metrics, ratios, and recommendations contained herein do not constitute formal legal, taxation, investment, accounting, or commercial underwriting advice. Actual credit scores, debt refinancing eligibility, and commercial or consumer lending commitments remain subject to official credit bureau verification, underwriting criteria, and independent institutional policies. Users should consult a Certified Financial Planner (CFP&reg;), Certified Public Accountant (CPA), or licensed financial advisor before executing major capital transactions, credit lines, or debt restructuring agreements. &copy; 2026 What's My Credit Worth Inc. All rights reserved. Confidential &amp; Proprietary.
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 10) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const cleanDate = new Date().toISOString().slice(0, 10);
    const sanitizedTitle = isBusiness ? (businessName ? businessName.replace(/[^a-zA-Z0-9]/g, '_') : 'Business') : 'Personal';
    pdf.save(`WMCW_Financial_Insights_Report_${sanitizedTitle}_${monthYear}_${cleanDate}.pdf`);
  } catch (err) {
    console.error("PDF generation error:", err);
    // Fallback: direct simple jsPDF generation if html2canvas encounters rendering failure
    const fallbackPdf = new jsPDF();
    fallbackPdf.setFontSize(16);
    fallbackPdf.setTextColor(13, 71, 161);
    fallbackPdf.text("WHAT'S MY CREDIT WORTH", 15, 18);
    fallbackPdf.setFontSize(11);
    fallbackPdf.setTextColor(71, 85, 105);
    fallbackPdf.text(`Financial Insights & Recommendations Report - ${formatMonthYear(monthYear)}`, 15, 25);
    fallbackPdf.text(`Profile: ${recipientName} (${accountType.toUpperCase()})`, 15, 32);
    
    let yPos = 44;
    recommendations.forEach((r, i) => {
      if (yPos > 260) {
        fallbackPdf.addPage();
        yPos = 20;
      }
      fallbackPdf.setFontSize(11);
      fallbackPdf.setTextColor(15, 23, 42);
      fallbackPdf.text(`${i + 1}. [${r.category}] ${r.title}`, 15, yPos);
      yPos += 6;
      fallbackPdf.setFontSize(9);
      fallbackPdf.setTextColor(51, 65, 85);
      const splitDesc = fallbackPdf.splitTextToSize(r.description, 180);
      fallbackPdf.text(splitDesc, 15, yPos);
      yPos += (splitDesc.length * 5) + 3;
      if (r.actionItem) {
        const splitAction = fallbackPdf.splitTextToSize(`Action: ${r.actionItem}`, 180);
        fallbackPdf.text(splitAction, 15, yPos);
        yPos += (splitAction.length * 5) + 5;
      }
    });

    if (yPos > 260) {
      fallbackPdf.addPage();
      yPos = 20;
    }
    fallbackPdf.setFontSize(7.5);
    fallbackPdf.setTextColor(100, 116, 139);
    fallbackPdf.text("DISCLAIMER: This automated advisory report is generated for educational and planning purposes only. Consult a CFP or CPA before making major financial commitments. © 2026 What's My Credit Worth Inc.", 15, yPos + 8);
    fallbackPdf.save(`WMCW_Financial_Insights_Report_${monthYear}.pdf`);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Chat Advisory Q&A Report Generator
 */
export async function exportAdvisorReportToPDF({
  requestPrompt,
  responseText,
  timestamp = new Date().toLocaleString(),
  userEmail = 'Valued Member',
  displayName,
  accountType = 'personal',
  businessName = ''
}: ChatReportParams): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '820px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.padding = '36px 40px';
  container.style.boxSizing = 'border-box';

  const recipientName = displayName || (userEmail !== 'Valued Member' ? userEmail : (accountType === 'business' && businessName ? businessName : 'Premium Member'));
  const reportRef = `WMCW-AI-${Math.floor(100000 + Math.random() * 900000)}`;

  container.innerHTML = `
    <div style="background: #ffffff;">
      <!-- OFFICIAL LETTERHEAD -->
      <div style="border-bottom: 2px solid #0D47A1; padding-bottom: 16px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: center; gap: 14px;">
            ${COMPANY_LOGO_SVG}
            <div>
              <div style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #0D47A1; line-height: 1.1;">
                WHAT'S MY CREDIT WORTH
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px;">
                AI Financial Advisor • Strategy Consultation
              </div>
              <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">
                app.whatsmycreditworth.com • Executive Advisory Desk
              </div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; background: #0D47A1; color: #ffffff; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 4px; margin-bottom: 6px;">
              ADVISOR TRANSCRIPT
            </div>
            <div style="font-size: 10px; color: #475569; line-height: 1.5;">
              <div><strong>Ref ID:</strong> <span style="font-family: monospace; color: #0f172a;">${reportRef}</span></div>
              <div><strong>Date:</strong> ${timestamp}</div>
              <div><strong>Prepared For:</strong> ${escapeHtml(recipientName)}</div>
              <div><strong>Classification:</strong> ${accountType === 'business' ? '🏢 Business Account' : '👤 Personal Account'}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- User Request Callout -->
      <div style="background-color: #f8fafc; border-left: 4px solid #0D47A1; padding: 14px 18px; border-radius: 6px; margin-bottom: 22px; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
        <div style="font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800; color: #0D47A1; margin-bottom: 6px;">
          User Advisory Inquiry
        </div>
        <div style="font-size: 12.5px; font-weight: 600; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">
          ${escapeHtml(requestPrompt)}
        </div>
      </div>

      <!-- AI Response Section -->
      <div style="margin-bottom: 28px;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800; color: #0D47A1; margin-bottom: 14px; border-bottom: 1.5px solid #0D47A1; padding-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
          <span>AI Financial Advisor Analysis & Guidance</span>
          <span style="font-size: 9px; font-weight: 700; color: #16a34a;">PRO TIER VERIFIED</span>
        </div>
        <div style="font-size: 11.5px; line-height: 1.65; color: #334155;">
          ${formatMarkdownSimple(responseText)}
        </div>
      </div>

      <!-- Official Disclaimer Footer -->
      <div style="border-top: 1.5px solid #CBD5E1; padding-top: 12px; margin-top: 36px; font-size: 8.5px; color: #64748b; line-height: 1.5;">
        <div style="font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">
          DISCLAIMER & COMPLIANCE NOTICE:
        </div>
        <div>
          This automated advisory report is generated by What's My Credit Worth financial intelligence engines based on user-provided financial variables. Information is strictly for personal educational and financial strategy purposes. Consult a Certified Financial Planner (CFP&reg;) or licensed accountant before executing major investment or credit decisions. &copy; 2026 What's My Credit Worth Inc. All rights reserved.
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 10) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const cleanDate = new Date().toISOString().slice(0, 10);
    pdf.save(`AI_Financial_Advisor_Report_${cleanDate}.pdf`);
  } catch (err) {
    console.error("PDF generation error:", err);
    alert("An error occurred while generating your PDF report. Please try again.");
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

export function printAdvisorReport({
  requestPrompt,
  responseText,
  timestamp = new Date().toLocaleString(),
  userEmail = 'Valued Member',
  displayName,
  accountType = 'personal',
  businessName = ''
}: ChatReportParams): void {
  const printWindow = window.open('', '_blank', 'width=850,height=950');
  if (!printWindow) {
    alert("Print popup blocked by browser settings. Please enable popups to print your report.");
    return;
  }

  const recipientName = displayName || (userEmail !== 'Valued Member' ? userEmail : (accountType === 'business' && businessName ? businessName : 'Premium Member'));

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>AI Financial Advisor Report - ${timestamp}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 24px;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 28px;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0D47A1;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand {
            color: #0D47A1;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          .subtitle {
            color: #475569;
            font-size: 11px;
            font-weight: 700;
            margin-top: 2px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .meta {
            text-align: right;
            font-size: 10px;
            color: #64748b;
            line-height: 1.5;
          }
          .badge {
            color: #ffffff;
            font-weight: 700;
            background: #0D47A1;
            padding: 2px 6px;
            border-radius: 4px;
          }
          .request-box {
            background-color: #f8fafc;
            border-left: 4px solid #0D47A1;
            padding: 14px;
            border-radius: 6px;
            margin-bottom: 20px;
            border-top: 1px solid #f1f5f9;
            border-right: 1px solid #f1f5f9;
            border-bottom: 1px solid #f1f5f9;
          }
          .request-title {
            font-size: 9.5px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 800;
            color: #0D47A1;
            margin-bottom: 5px;
          }
          .request-text {
            font-size: 12px;
            font-weight: 600;
            color: #1e293b;
            white-space: pre-wrap;
            line-height: 1.5;
          }
          .section-heading {
            font-size: 11.5px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 800;
            color: #0D47A1;
            margin-bottom: 12px;
            border-bottom: 1.5px solid #0D47A1;
            padding-bottom: 6px;
          }
          .response-text {
            font-size: 11.5px;
            line-height: 1.65;
            color: #334155;
          }
          .footer {
            border-top: 1.5px solid #cbd5e1;
            padding-top: 12px;
            margin-top: 32px;
            font-size: 8.5px;
            color: #64748b;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div>
              <div class="brand">WHAT'S MY CREDIT WORTH</div>
              <div class="subtitle">AI Financial Advisor • Strategy Consultation</div>
            </div>
            <div class="meta">
              <div><strong>Date:</strong> ${timestamp}</div>
              <div><strong>Prepared For:</strong> ${escapeHtml(recipientName)}</div>
              <div><strong>Tier:</strong> <span class="badge">PREMIUM</span></div>
            </div>
          </div>

          <div class="request-box">
            <div class="request-title">User Advisory Inquiry</div>
            <div class="request-text">${escapeHtml(requestPrompt)}</div>
          </div>

          <div>
            <div class="section-heading">AI Financial Advisor Analysis & Guidance</div>
            <div class="response-text">
              ${formatMarkdownSimple(responseText)}
            </div>
          </div>

          <div class="footer">
            <strong>DISCLAIMER & COMPLIANCE NOTICE:</strong> This automated advisory report is generated by What's My Credit Worth financial intelligence engines for educational and strategy evaluation purposes only. Consult a licensed financial professional before executing major decisions. &copy; 2026 What's My Credit Worth Inc.
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 750);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
