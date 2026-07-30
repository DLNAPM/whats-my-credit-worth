import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportParams {
  requestPrompt: string;
  responseText: string;
  timestamp?: string;
  userEmail?: string;
  displayName?: string;
}

const escapeHtml = (str: string): string => {
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
  html = html.replace(/^### (.*$)/gim, '<h3 style="color:#1e3a8a; font-size:14px; font-weight:700; margin-top:14px; margin-bottom:6px;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="color:#1e3a8a; font-size:16px; font-weight:800; margin-top:18px; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="color:#1e3a8a; font-size:18px; font-weight:800; margin-top:20px; margin-bottom:10px;">$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0f172a; font-weight:700;">$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Bullet lists
  html = html.replace(/^\* (.*$)/gim, '<li style="margin-left:20px; margin-bottom:4px; list-style-type:disc;">$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li style="margin-left:20px; margin-bottom:4px; list-style-type:disc;">$1</li>');
  
  // Paragraph line breaks
  html = html.replace(/\n\n/g, '<br/><br/>');
  html = html.replace(/\n/g, '<br/>');

  return html;
};

export async function exportAdvisorReportToPDF({
  requestPrompt,
  responseText,
  timestamp = new Date().toLocaleString(),
  userEmail = 'Valued Member',
  displayName
}: ReportParams): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.padding = '40px';
  container.style.boxSizing = 'border-box';

  const recipientName = displayName || (userEmail !== 'Valued Member' ? userEmail : 'Premium Member');

  container.innerHTML = `
    <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <!-- Document Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 24px;">
        <div>
          <div style="color: #1e3a8a; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">WHAT'S MY CREDIT WORTH</div>
          <div style="color: #475569; font-size: 12px; font-weight: 700; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em;">AI Financial Advisor • Executive Report</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b; line-height: 1.5;">
          <div><strong>Report Date:</strong> ${timestamp}</div>
          <div><strong>Prepared For:</strong> ${escapeHtml(recipientName)}</div>
          <div><strong>Account Tier:</strong> <span style="color: #1e3a8a; font-weight: 700; background: #dbeafe; padding: 2px 6px; border-radius: 4px;">PREMIUM</span></div>
        </div>
      </div>

      <!-- Request Callout Box -->
      <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800; color: #2563eb; margin-bottom: 6px;">User Advisory Request</div>
        <div style="font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(requestPrompt)}</div>
      </div>

      <!-- AI Response Section -->
      <div style="margin-bottom: 30px;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800; color: #0f172a; margin-bottom: 14px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
          <span>AI Financial Advisor Analysis & Guidance</span>
        </div>
        <div style="font-size: 12px; line-height: 1.7; color: #334155;">
          ${formatMarkdownSimple(responseText)}
        </div>
      </div>

      <!-- Professional Disclaimer Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 40px; font-size: 9px; color: #94a3b8; line-height: 1.5; display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="max-width: 80%;">
          <strong>Confidentiality Notice & Disclaimer:</strong> This automated advisory report is generated by AI based on user financial inputs. Information is strictly for personal educational and financial strategy purposes. Consult a licensed financial professional prior to executing major investment or debt decisions.
        </div>
        <div style="text-align: right; font-weight: 700; color: #64748b;">
          Page 1 of 1
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
  displayName
}: ReportParams): void {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert("Print popup blocked by browser settings. Please enable popups to print your report.");
    return;
  }

  const recipientName = displayName || (userEmail !== 'Valued Member' ? userEmail : 'Premium Member');

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
            border-bottom: 3px solid #1e3a8a;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .brand {
            color: #1e3a8a;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          .subtitle {
            color: #475569;
            font-size: 12px;
            font-weight: 700;
            margin-top: 2px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .meta {
            text-align: right;
            font-size: 11px;
            color: #64748b;
            line-height: 1.5;
          }
          .badge {
            color: #1e3a8a;
            font-weight: 700;
            background: #dbeafe;
            padding: 2px 6px;
            border-radius: 4px;
          }
          .request-box {
            background-color: #f8fafc;
            border-left: 4px solid #2563eb;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
            border-top: 1px solid #f1f5f9;
            border-right: 1px solid #f1f5f9;
            border-bottom: 1px solid #f1f5f9;
          }
          .request-title {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 800;
            color: #2563eb;
            margin-bottom: 6px;
          }
          .request-text {
            font-size: 13px;
            font-weight: 600;
            color: #1e293b;
            white-space: pre-wrap;
            line-height: 1.5;
          }
          .section-heading {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 12px;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 6px;
          }
          .response-text {
            font-size: 12px;
            line-height: 1.7;
            color: #334155;
          }
          .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 16px;
            margin-top: 36px;
            font-size: 9px;
            color: #94a3b8;
            line-height: 1.5;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div>
              <div class="brand">WHAT'S MY CREDIT WORTH</div>
              <div class="subtitle">AI Financial Advisor • Executive Report</div>
            </div>
            <div class="meta">
              <div><strong>Report Date:</strong> ${timestamp}</div>
              <div><strong>Prepared For:</strong> ${escapeHtml(recipientName)}</div>
              <div><strong>Account Tier:</strong> <span class="badge">PREMIUM</span></div>
            </div>
          </div>

          <div class="request-box">
            <div class="request-title">User Advisory Request</div>
            <div class="request-text">${escapeHtml(requestPrompt)}</div>
          </div>

          <div>
            <div class="section-heading">AI Financial Advisor Analysis & Guidance</div>
            <div class="response-text">
              ${formatMarkdownSimple(responseText)}
            </div>
          </div>

          <div class="footer">
            <div style="max-width: 80%;">
              <strong>Confidentiality Notice & Disclaimer:</strong> This automated advisory report is generated by AI based on user financial inputs. Information is strictly for personal educational and financial strategy purposes. Consult a licensed financial professional prior to executing major decisions.
            </div>
            <div style="text-align: right; font-weight: 700; color: #64748b;">
              Printed Copy
            </div>
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
