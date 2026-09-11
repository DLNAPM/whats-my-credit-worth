import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { SystemIncident, IncidentCategory, IncidentSeverity } from '../types';

export const APP_ADMIN_EMAIL = 'dlaniger.napm.consulting@gmail.com';

// Cache recent incidents in memory to avoid duplicate spam within 3 minutes
const recentIncidentHashes = new Map<string, number>();

/**
 * Parses and categorizes errors automatically to detect API restrictions, quota limits, billing, or integration failures.
 */
export function analyzeErrorForIncident(error: any, source: string): {
  isIncident: boolean;
  category: IncidentCategory;
  severity: IncidentSeverity;
  title: string;
  message: string;
  details: string;
} {
  const errStr = String(error?.message || error?.toString?.() || error || '');
  const codeStr = String(error?.code || error?.status || '');
  const combined = `${errStr} ${codeStr}`.toLowerCase();

  // 1. Quota & Rate Limit (Resource Exhausted)
  if (
    combined.includes('resource_exhausted') ||
    combined.includes('quota') ||
    combined.includes('rate limit') ||
    combined.includes('rate-limit') ||
    combined.includes('429')
  ) {
    return {
      isIncident: true,
      category: 'api_restriction',
      severity: 'critical',
      title: 'Gemini API Quota Exceeded (Resource Exhausted)',
      message: `The application reached its Gemini API quota limit or rate restriction during "${source}". Requests cannot be completed until the quota resets or billing/tier is adjusted.`,
      details: `${errStr} | Code: ${codeStr}`
    };
  }

  // 2. Missing or Invalid API Key / Auth Restriction
  if (
    combined.includes('api_key') ||
    combined.includes('api key') ||
    combined.includes('unauthenticated') ||
    combined.includes('unauthorized') ||
    combined.includes('401') ||
    combined.includes('403') ||
    combined.includes('forbidden')
  ) {
    return {
      isIncident: true,
      category: 'api_restriction',
      severity: 'high',
      title: 'API Authentication / Restriction Error',
      message: `An API key authentication failure or permission restriction occurred during "${source}".`,
      details: `${errStr} | Code: ${codeStr}`
    };
  }

  // 3. Billing or Subscription Issue
  if (
    combined.includes('billing') ||
    combined.includes('payment') ||
    combined.includes('stripe') ||
    combined.includes('subscription') ||
    combined.includes('card_error')
  ) {
    return {
      isIncident: true,
      category: 'billing',
      severity: 'high',
      title: 'Billing / Subscription Processing Issue',
      message: `A payment or subscription transaction encountered an error during "${source}".`,
      details: `${errStr} | Code: ${codeStr}`
    };
  }

  // 4. Firestore / Cloud Storage / Integration Failure
  if (
    combined.includes('permission-denied') ||
    combined.includes('unavailable') ||
    combined.includes('deadline-exceeded') ||
    combined.includes('failed to fetch') ||
    combined.includes('network')
  ) {
    return {
      isIncident: true,
      category: 'integration',
      severity: combined.includes('permission-denied') ? 'high' : 'medium',
      title: 'Integration or Cloud Connectivity Incident',
      message: `A backend cloud service or database integration issue occurred during "${source}".`,
      details: `${errStr} | Code: ${codeStr}`
    };
  }

  // Generic fallback if explicitly reported as an incident
  return {
    isIncident: false,
    category: 'system',
    severity: 'medium',
    title: `Application Error in ${source}`,
    message: errStr || 'An unexpected error occurred.',
    details: errStr
  };
}

export interface ReportIncidentOptions {
  title: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  message: string;
  errorDetails?: string;
  source: string;
  userEmail?: string;
  userId?: string;
  forceEmail?: boolean;
}

/**
 * Creates an incident in Firestore and sends an alert email to the App Admin.
 */
export async function reportIncident(options: ReportIncidentOptions): Promise<string | null> {
  const {
    title,
    category,
    severity,
    message,
    errorDetails,
    source,
    userEmail,
    userId,
    forceEmail = false
  } = options;

  // Deduplication check: prevent flooding with identical errors within 3 minutes
  const dedupeKey = `${title}_${category}_${source}`;
  const now = Date.now();
  const lastReported = recentIncidentHashes.get(dedupeKey);
  if (!forceEmail && lastReported && now - lastReported < 3 * 60 * 1000) {
    console.warn(`[IncidentReporter] Suppressed duplicate incident within 3 minutes: ${title}`);
    return null;
  }
  recentIncidentHashes.set(dedupeKey, now);

  const incidentId = `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const occurredAt = new Date().toISOString();

  const incidentData: SystemIncident = {
    id: incidentId,
    title: title.slice(0, 195),
    category,
    severity,
    status: 'open',
    message: message.slice(0, 4900),
    errorDetails: errorDetails ? errorDetails.slice(0, 4900) : undefined,
    source,
    userEmail: userEmail || 'Anonymous',
    userId: userId || 'system',
    occurredAt,
    emailSent: true,
    emailRecipient: APP_ADMIN_EMAIL,
    occurrenceCount: 1
  };

  try {
    // 1. Write to system_incidents collection in Firestore
    await setDoc(doc(db, 'system_incidents', incidentId), incidentData);

    // 2. Queue Email via support_requests (Trigger Email extension)
    const emailSubject = `[ALERT: ${severity.toUpperCase()}] ${title} - WMCW App`;
    
    const emailText = `
WMCW APP INCIDENT ALERT
==========================================
Severity: ${severity.toUpperCase()}
Category: ${category.toUpperCase()}
Source: ${source}
Title: ${title}
Timestamp: ${new Date().toLocaleString()} (UTC: ${occurredAt})
Affected User: ${userEmail || 'N/A'} (UID: ${userId || 'N/A'})

SUMMARY:
${message}

TECHNICAL ERROR DETAILS:
${errorDetails || 'None provided'}

INCIDENT ID: ${incidentId}

ACTION REQUIRED:
Please log in to the WMCW Admin Dashboard to review and acknowledge this incident:
- If this is a Gemini API quota issue, check plan & limits at: https://ai.google.dev/gemini-api/docs/rate-limits
- If this is a billing/Stripe issue, check the Stripe dashboard.
- Acknowledge this alert in the Admin Dashboard.
==========================================
    `.trim();

    const severityColor = 
      severity === 'critical' ? '#dc2626' : 
      severity === 'high' ? '#ea580c' : 
      severity === 'medium' ? '#d97706' : '#2563eb';

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: ${severityColor}; padding: 20px 24px; color: #ffffff;">
          <div style="display: inline-block; background-color: rgba(255,255,255,0.25); padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">
            ${severity.toUpperCase()} ALERT • ${category.toUpperCase()}
          </div>
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; line-height: 1.3;">
            ${title}
          </h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">
            Source: ${source} • ${new Date().toLocaleString()}
          </p>
        </div>

        <div style="padding: 24px; color: #374151;">
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #111827;">Incident Summary</h3>
            <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #4b5563; background-color: #f9fafb; padding: 12px 16px; border-radius: 8px; border-left: 4px solid ${severityColor};">
              ${message}
            </p>
          </div>

          ${errorDetails ? `
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #111827;">Technical Error Log</h3>
            <pre style="margin: 0; font-family: monospace; font-size: 11px; line-height: 1.4; color: #b91c1c; background-color: #fef2f2; padding: 12px; border-radius: 8px; border: 1px solid #fee2e2; overflow-x: auto; white-space: pre-wrap;">${errorDetails}</pre>
          </div>
          ` : ''}

          <div style="margin-bottom: 20px; padding: 12px 16px; background-color: #f3f4f6; border-radius: 8px; font-size: 12px; color: #4b5563;">
            <div><strong>User Context:</strong> ${userEmail || 'N/A'} (UID: ${userId || 'N/A'})</div>
            <div><strong>Incident ID:</strong> <code style="font-family: monospace; background: #e5e7eb; padding: 1px 4px; border-radius: 4px;">${incidentId}</code></div>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
            <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #111827;">Recommended Admin Actions:</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #4b5563;">
              <li>Log in to the <strong>Admin Dashboard</strong> to review and <strong>Acknowledge</strong> this alert.</li>
              <li>Check your <strong>Google AI Studio / Gemini API Quotas & Billing</strong> if rate-limited: <a href="https://ai.google.dev/gemini-api/docs/rate-limits" style="color: #2563eb; text-decoration: underline;">AI Studio Rate Limits</a>.</li>
              <li>Check Stripe / cloud integrations if related to payments or storage.</li>
            </ul>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 14px 24px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #6b7280;">
          This is an automated operational alert sent to App Administrator <strong>${APP_ADMIN_EMAIL}</strong> from What's My Credit Worth.
        </div>
      </div>
    `;

    await setDoc(doc(db, 'support_requests', `alert_${incidentId}`), {
      to: APP_ADMIN_EMAIL,
      message: {
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      },
      userId: userId || 'system',
      createdAt: serverTimestamp(),
      status: {
        state: 'PENDING',
        updatedAt: serverTimestamp()
      }
    });

    console.info(`[IncidentReporter] Created incident ${incidentId} and dispatched alert email to ${APP_ADMIN_EMAIL}`);
    return incidentId;
  } catch (err) {
    console.error("[IncidentReporter] Failed to record incident or send alert email:", err);
    return null;
  }
}

/**
 * Acknowledges an incident in Firestore.
 */
export async function acknowledgeIncident(incidentId: string, adminEmail: string, note?: string): Promise<void> {
  const ref = doc(db, 'system_incidents', incidentId);
  await updateDoc(ref, {
    status: 'acknowledged',
    acknowledgedAt: new Date().toISOString(),
    acknowledgedBy: adminEmail,
    actionTaken: note || 'Acknowledged by Administrator'
  });
}

/**
 * Resolves an incident in Firestore.
 */
export async function resolveIncident(incidentId: string, adminEmail: string, note?: string): Promise<void> {
  const ref = doc(db, 'system_incidents', incidentId);
  await updateDoc(ref, {
    status: 'resolved',
    resolvedAt: new Date().toISOString(),
    resolvedBy: adminEmail,
    actionTaken: note || 'Resolved by Administrator'
  });
}

/**
 * Deletes an incident record from Firestore.
 */
export async function deleteIncident(incidentId: string): Promise<void> {
  const ref = doc(db, 'system_incidents', incidentId);
  await deleteDoc(ref);
}
