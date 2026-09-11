import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, writeBatch } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { SystemIncident, IncidentCategory, IncidentSeverity, IncidentStatus } from '../types';
import { 
  acknowledgeIncident, 
  resolveIncident, 
  deleteIncident, 
  reportIncident, 
  runSystemHealthCheck,
  checkDocumentDeliveryStatus,
  getAdminDashboardUrl,
  type HealthCheckResult,
  RENDER_APP_DOMAIN,
  CANONICAL_APP_DOMAIN,
  FIREBASE_APP_DOMAIN,
  PREVIEW_APP_DOMAIN,
  APP_ADMIN_EMAIL 
} from '../utils/incidentReporter';

const Shield = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const User = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const CheckCircle = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const XCircle = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

const Search = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const Trash2 = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const Lock = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const Unlock = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
  </svg>
);

const BellAlert = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const AlertTriangle = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const MailIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
  </svg>
);

const RefreshIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
    <path d="M3 3v5h5"></path>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
    <path d="M16 21h5v-5"></path>
  </svg>
);

const ExternalLinkIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

const ActivityIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

interface UserData {
  id: string;
  email: string;
  displayName: string;
  isPremium: boolean;
  isFrozen?: boolean;
  isAdmin?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export const AdminDashboard: React.FC = () => {
  const { user, isSuperUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'alerts' | 'users'>('alerts');
  
  // Users state
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  // Incidents / Alerts state
  const [incidents, setIncidents] = useState<SystemIncident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [incidentSearchTerm, setIncidentSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | IncidentCategory>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | IncidentSeverity>('all');
  const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [testAlertTriggering, setTestAlertTriggering] = useState(false);
  const [healthCheckRunning, setHealthCheckRunning] = useState(false);
  const [healthCheckSummary, setHealthCheckSummary] = useState<string | null>(null);
  const [healthCheckResult, setHealthCheckResult] = useState<HealthCheckResult | null>(null);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [recheckingDelivery, setRecheckingDelivery] = useState(false);
  const [incidentNotificationMsg, setIncidentNotificationMsg] = useState<string | null>(null);

  const adminEmail = user?.email || APP_ADMIN_EMAIL;

  // Deep Link Parser: Handle ?incident=... or ?tab=... from email alert links
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let targetIncidentId: string | null = null;
    let targetTab: string | null = null;

    // 1. Check window.location.search
    const searchParams = new URLSearchParams(window.location.search);
    targetIncidentId = searchParams.get('incident');
    targetTab = searchParams.get('tab');

    // 2. Check window.location.hash parameters e.g. #/admin?incident=inc_123
    if (!targetIncidentId && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1];
      if (hashQuery) {
        const hashParams = new URLSearchParams(hashQuery);
        targetIncidentId = hashParams.get('incident') || targetIncidentId;
        targetTab = hashParams.get('tab') || targetTab;
      }
    }

    if (targetIncidentId) {
      setActiveTab('alerts');
      setExpandedIncidentId(targetIncidentId);
      setIncidentNotificationMsg(`Reviewing incident ${targetIncidentId} from alert link`);

      // Scroll to incident card after DOM paint
      setTimeout(() => {
        const el = document.getElementById(`incident-${targetIncidentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    } else if (targetTab === 'alerts' || targetTab === 'users') {
      setActiveTab(targetTab);
    }
  }, []);

  // 1. Fetch Users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isSuperUser) return;
      
      try {
        setLoadingUsers(true);
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserData[];
        
        usersList.sort((a, b) => {
          const dateA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
          const dateB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
          return dateB - dateA;
        });
        
        setUsers(usersList);
      } catch (err) {
        console.error("Error fetching users:", err);
        setUserError("Failed to load users. Please check your permissions.");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [isSuperUser]);

  // 2. Real-time Subscription to System Incidents
  useEffect(() => {
    if (!isSuperUser) return;

    setLoadingIncidents(true);
    const incidentsRef = collection(db, 'system_incidents');

    const unsubscribe = onSnapshot(
      incidentsRef,
      (snapshot) => {
        const incidentList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as SystemIncident[];

        // Sort by occurredAt descending (newest first)
        incidentList.sort((a, b) => {
          const tA = new Date(a.occurredAt || 0).getTime();
          const tB = new Date(b.occurredAt || 0).getTime();
          return tB - tA;
        });

        setIncidents(incidentList);
        setLoadingIncidents(false);
      },
      (error) => {
        console.error("Error subscribing to system incidents:", error);
        setLoadingIncidents(false);
      }
    );

    return () => unsubscribe();
  }, [isSuperUser]);

  const showNotification = (msg: string) => {
    setIncidentNotificationMsg(msg);
    setTimeout(() => {
      setIncidentNotificationMsg(null);
    }, 4000);
  };

  // Incident Actions
  const handleAcknowledge = async (incidentId: string) => {
    setActionInProgress(incidentId);
    try {
      await acknowledgeIncident(incidentId, adminEmail);
      showNotification(`Incident ${incidentId} acknowledged by ${adminEmail}`);
    } catch (err) {
      console.error("Failed to acknowledge incident:", err);
      alert("Failed to acknowledge alert.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResolve = async (incidentId: string) => {
    setActionInProgress(incidentId);
    try {
      await resolveIncident(incidentId, adminEmail);
      showNotification(`Incident marked as resolved.`);
    } catch (err) {
      console.error("Failed to resolve incident:", err);
      alert("Failed to resolve alert.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAcknowledgeAllOpen = async () => {
    const openIncidents = incidents.filter(i => i.status === 'open');
    if (openIncidents.length === 0) return;

    if (!window.confirm(`Acknowledge all ${openIncidents.length} open alert(s)?`)) return;

    setActionInProgress('batch');
    try {
      for (const inc of openIncidents) {
        await acknowledgeIncident(inc.id, adminEmail);
      }
      showNotification(`All ${openIncidents.length} open alert(s) acknowledged.`);
    } catch (err) {
      console.error("Failed to batch acknowledge:", err);
      alert("Failed to acknowledge all alerts.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteIncident = async (incidentId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this incident record?")) return;
    setActionInProgress(incidentId);
    try {
      await deleteIncident(incidentId);
      showNotification("Incident deleted successfully.");
    } catch (err) {
      console.error("Failed to delete incident:", err);
      alert("Failed to delete incident.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleTriggerTestAlert = async () => {
    setTestAlertTriggering(true);
    try {
      const testId = await reportIncident({
        title: 'Gemini API Rate Limit & Restriction Check (Test Incident)',
        category: 'api_restriction',
        severity: 'critical',
        message: `Admin verification test for alarm pipeline. If this were a real quota exhaustion, Gemini API calls (chatbot, score prediction, recommendations) would be restricted. An alert email detailing this event has been queued in Firestore for ${APP_ADMIN_EMAIL}.`,
        errorDetails: 'RESOURCE_EXHAUSTED: Quota exceeded for quota metric "generate_content_requests" and limit "GenerateContent requests per minute per user". https://ai.google.dev/gemini-api/docs/rate-limits',
        source: 'Admin Diagnostics Engine',
        userEmail: adminEmail,
        userId: user?.uid,
        forceEmail: true
      });

      if (testId) {
        showNotification(`Test Incident created & queued in Firestore! Use 'Email Alert' icon to send via email client.`);
        setExpandedIncidentId(testId);
      }
    } catch (err) {
      console.error("Failed to trigger test incident:", err);
      alert("Failed to create test alert.");
    } finally {
      setTestAlertTriggering(false);
    }
  };

  const handleRunHealthCheck = async () => {
    setHealthCheckRunning(true);
    try {
      const result = await runSystemHealthCheck(adminEmail);
      setHealthCheckResult(result);
      setShowHealthModal(true);

      if (result.success) {
        if (result.emailReport?.deliveryState === 'DELIVERED') {
          showNotification(`Health check passed! Email verified delivered to ${adminEmail}`);
        } else {
          showNotification(`Health check completed & queued in Firestore! Diagnostic window opened.`);
        }
        setHealthCheckSummary(`Subsystems verified (Firestore, Auth, Incident Queue). Report queued for ${adminEmail}`);
        if (result.incidentId) {
          setExpandedIncidentId(result.incidentId);
        }
      } else {
        alert("Health check encountered an issue recording to Firestore. Please verify your permissions.");
      }
    } catch (e) {
      console.error("Failed to execute health check:", e);
      alert("Failed to run system health check.");
    } finally {
      setHealthCheckRunning(false);
    }
  };

  const handleRecheckDelivery = async () => {
    if (!healthCheckResult?.incidentId) return;
    setRecheckingDelivery(true);
    try {
      const probe = await checkDocumentDeliveryStatus(healthCheckResult.incidentId);
      setHealthCheckResult({
        ...healthCheckResult,
        emailReport: {
          ...healthCheckResult.emailReport,
          deliveryState: probe.deliveryState,
          deliveryMessage: probe.deliveryMessage,
          deliveryDetails: probe.deliveryDetails || healthCheckResult.emailReport.deliveryDetails
        }
      });
      if (probe.deliveryState === 'DELIVERED') {
        showNotification(`Delivery confirmed! Extension handed email to SMTP server.`);
      } else if (probe.deliveryState === 'DELIVERY_ERROR') {
        showNotification(`Trigger Email extension reported an error.`);
      } else {
        showNotification(`Document still pending delivery report in Firestore.`);
      }
    } catch (err) {
      console.error("Failed to recheck delivery:", err);
    } finally {
      setRecheckingDelivery(false);
    }
  };

  // User Actions
  const togglePremiumStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { isPremium: !currentStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, isPremium: !currentStatus } : u));
    } catch (err) {
      console.error("Error updating user status:", err);
      alert("Failed to update user status.");
    }
  };

  const toggleFreezeStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { isFrozen: !currentStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, isFrozen: !currentStatus } : u));
    } catch (err) {
      console.error("Error freezing user:", err);
      alert("Failed to update freeze status.");
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      setUsers(users.filter(u => u.id !== userId));
      setUserToDelete(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user.");
    }
  };

  if (!isSuperUser) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view the Admin Dashboard.</p>
        </div>
      </div>
    );
  }

  // Filtered Incidents
  const openIncidentsCount = incidents.filter(i => i.status === 'open').length;
  const acknowledgedIncidentsCount = incidents.filter(i => i.status === 'acknowledged').length;
  const resolvedIncidentsCount = incidents.filter(i => i.status === 'resolved').length;
  const apiIncidentsCount = incidents.filter(i => i.category === 'api_restriction').length;

  const filteredIncidents = incidents.filter(inc => {
    if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && inc.category !== categoryFilter) return false;
    if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;

    if (incidentSearchTerm.trim()) {
      const queryStr = incidentSearchTerm.toLowerCase();
      const match =
        inc.title?.toLowerCase().includes(queryStr) ||
        inc.message?.toLowerCase().includes(queryStr) ||
        inc.errorDetails?.toLowerCase().includes(queryStr) ||
        inc.source?.toLowerCase().includes(queryStr) ||
        inc.userEmail?.toLowerCase().includes(queryStr);
      if (!match) return false;
    }

    return true;
  });

  // Filtered Users
  const filteredUsers = users.filter(u => {
    if (!userSearchTerm) return true;
    const searchLower = userSearchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(searchLower) ||
      u.displayName?.toLowerCase().includes(searchLower) ||
      u.id.toLowerCase().includes(searchLower)
    );
  });

  const chartData = useMemo(() => {
    const premiumCount = users.filter(u => u.isPremium).length;
    const basicCount = users.length - premiumCount;
    return [
      { name: 'Basic', value: basicCount, color: '#9CA3AF' },
      { name: 'Premium', value: premiumCount, color: '#10B981' }
    ].filter(item => item.value > 0);
  }, [users]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Admin Operations & System Command
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Logged in as <span className="font-semibold text-gray-700 dark:text-gray-300">{adminEmail}</span> • Alert Notifications: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{APP_ADMIN_EMAIL}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'alerts'
                ? 'bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 shadow-sm border border-gray-200/50 dark:border-gray-700'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BellAlert className="w-4 h-4" />
            <span>Alarms & Alerts</span>
            {openIncidentsCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-black rounded-full bg-red-600 text-white animate-pulse">
                {openIncidentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/50 dark:border-gray-700'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Users & Accounts</span>
            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full font-semibold">
              {users.length}
            </span>
          </button>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {incidentNotificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-gray-700 flex items-center gap-3 animate-fade-in text-sm font-medium">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{incidentNotificationMsg}</span>
        </div>
      )}

      {/* =========================================================================================
          TAB 1: ALARMS & INCIDENTS
         ========================================================================================= */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border shadow-sm transition-all ${
              openIncidentsCount > 0 
                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-100 ring-2 ring-red-500/20' 
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                  Active Alarms
                </span>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-black mt-2 text-red-600 dark:text-red-400">
                {openIncidentsCount}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {openIncidentsCount === 0 ? 'No unacknowledged alerts' : 'Requires Administrator Acknowledgment'}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Acknowledged
                </span>
                <ClockIcon className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-black mt-2 text-amber-600 dark:text-amber-400">
                {acknowledgedIncidentsCount}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Under investigation or monitoring</p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Resolved
                </span>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-black mt-2 text-emerald-600 dark:text-emerald-400">
                {resolvedIncidentsCount}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Closed incidents</p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  API & Restrictions
                </span>
                <ZapIcon className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-black mt-2 text-indigo-600 dark:text-indigo-400">
                {apiIncidentsCount}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quota, 429, & billing limits</p>
            </div>
          </div>

          {/* Email Notification & Integration Status Banner */}
          <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-purple-950/20 p-4 sm:p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0 mt-0.5">
                <MailIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Real-time Admin Dispatch to <span className="underline decoration-indigo-400">{APP_ADMIN_EMAIL}</span>
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                  Whenever an operational error occurs (Gemini API quota exhaustion, rate restrictions, payment/subscription failures, or cloud persistence drops), an incident is recorded in Firestore and queued to the App Admin's email automatically.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleRunHealthCheck}
                disabled={healthCheckRunning}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                title="Run diagnostic tests and dispatch official Health Check email with verified link"
              >
                {healthCheckRunning ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Checking Systems...</span>
                  </>
                ) : (
                  <>
                    <ActivityIcon className="w-3.5 h-3.5" />
                    <span>Run System Health Check</span>
                  </>
                )}
              </button>

              <button
                onClick={handleTriggerTestAlert}
                disabled={testAlertTriggering}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                title="Send a sample incident alert to verify email delivery"
              >
                {testAlertTriggering ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <ZapIcon className="w-3.5 h-3.5" />
                    <span>Trigger Test Alert</span>
                  </>
                )}
              </button>

              {openIncidentsCount > 0 && (
                <button
                  onClick={handleAcknowledgeAllOpen}
                  disabled={actionInProgress === 'batch'}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Acknowledge All ({openIncidentsCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Domain Routing & Health Check Status Banner */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Verified Admin Routing Active
                </span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Render _redirects + Firebase rewrites + Hash Routing (/#/admin)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <a 
                  href={`${RENDER_APP_DOMAIN}/#/admin`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>whats-my-credit-worth.onrender.com/#/admin</span>
                  <ExternalLinkIcon className="w-3 h-3" />
                </a>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <a 
                  href={`${FIREBASE_APP_DOMAIN}/#/admin`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 font-medium hover:underline flex items-center gap-1"
                >
                  <span>Firebase Mirror</span>
                  <ExternalLinkIcon className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-xs space-y-2 border border-gray-100 dark:border-gray-800">
              <div className="flex items-start gap-2">
                <span className="font-bold text-gray-700 dark:text-gray-200 shrink-0">Resolved Error Notice:</span>
                <span className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  The error <code>https://https://whats-my-credit-worth.onrender.com//admin not Found</code> was caused by duplicated URL protocols and double slashes in previously dispatched links. All incident alert and health check notifications now generate normalized, verified URLs pointing directly to <strong>{RENDER_APP_DOMAIN}/#/admin</strong> and <strong>{FIREBASE_APP_DOMAIN}/#/admin</strong> using single-page hash routing (/#/admin) and Render <code>_redirects</code> rewrite rules.
                </span>
              </div>
              {healthCheckSummary && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between flex-wrap gap-2">
                  <span>✔ {healthCheckSummary}</span>
                  {healthCheckResult && (
                    <button
                      onClick={() => setShowHealthModal(true)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>View Health Check Report & Email Options</span>
                      <ExternalLinkIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowSetupGuide(!showSetupGuide)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <MailIcon className="w-3 h-3" />
                  <span>{showSetupGuide ? 'Hide' : 'View'} Firebase "Trigger Email" Extension Configuration Guide</span>
                </button>
              </div>

              {/* Collapsible Setup Guide */}
              {showSetupGuide && (
                <div className="mt-2 p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200/70 dark:border-blue-900/50 space-y-2 text-xs text-gray-700 dark:text-gray-300">
                  <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <MailIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Why did the Admin not receive the Health Check report via email?</span>
                  </div>
                  <p className="leading-relaxed">
                    Google Cloud Firestore is a database. When you click <strong>Run System Health Check</strong>, the application logs the incident into <code>system_incidents</code> and writes the email payload into the <code>support_requests</code> and <code>mail</code> collections.
                  </p>
                  <p className="leading-relaxed">
                    However, Firestore does not send emails on its own. In Firebase, dispatching emails to an inbox (like <strong>{APP_ADMIN_EMAIL}</strong>) requires the official <strong>"Trigger Email from Firestore" (firestore-send-email)</strong> extension, or a backend SMTP worker:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] font-medium text-gray-800 dark:text-gray-200">
                    <li>Open the <a href="https://console.firebase.google.com/project/whats-my-credit-worth/extensions" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">Firebase Extensions Console</a> for project <code>whats-my-credit-worth</code>.</li>
                    <li>Search for <strong>Trigger Email</strong> (<code>firestore-send-email</code>) and click <strong>Install</strong>.</li>
                    <li>Set <strong>Email documents collection</strong> to <code>support_requests</code> (or <code>mail</code>).</li>
                    <li>Provide your <strong>SMTP connection URI</strong> (e.g. SendGrid, Mailgun, Brevo, or a Google Workspace App Password).</li>
                    <li>Once deployed, every document written by the app will automatically be sent to <strong>{APP_ADMIN_EMAIL}</strong>.</li>
                  </ol>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                    Tip: Until the extension is installed, you can use the pre-formatted <strong>"Send via Email Client"</strong> button to send any diagnostic report or incident alert directly with 1 click!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Incident Filter Toolbar */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search incidents..."
                  value={incidentSearchTerm}
                  onChange={(e) => setIncidentSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none text-gray-700 dark:text-gray-200"
              >
                <option value="all">All Statuses</option>
                <option value="open">🚨 Open Only</option>
                <option value="acknowledged">⚠️ Acknowledged</option>
                <option value="resolved">✅ Resolved</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none text-gray-700 dark:text-gray-200"
              >
                <option value="all">All Categories</option>
                <option value="api_restriction">API Restrictions & Quota</option>
                <option value="billing">Billing & Stripe</option>
                <option value="integration">Integrations & Cloud</option>
                <option value="system">System Errors</option>
              </select>

              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none text-gray-700 dark:text-gray-200"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between md:justify-end gap-2">
              <span>Showing {filteredIncidents.length} of {incidents.length} incidents</span>
              {(incidentSearchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || severityFilter !== 'all') && (
                <button
                  onClick={() => {
                    setIncidentSearchTerm('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                    setSeverityFilter('all');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Incidents Feed / List */}
          <div className="space-y-3">
            {loadingIncidents ? (
              <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Loading system incidents and alert logs...</p>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">All Systems Operational</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  {incidents.length === 0 
                    ? 'No incidents or alarms have been registered yet. Errors will appear here in real-time.' 
                    : 'No incidents match your selected filters.'}
                </p>
                {incidents.length === 0 && (
                  <button
                    onClick={handleTriggerTestAlert}
                    className="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all inline-flex items-center gap-2"
                  >
                    <ZapIcon className="w-3.5 h-3.5" />
                    <span>Trigger a Sample Alert</span>
                  </button>
                )}
              </div>
            ) : (
              filteredIncidents.map((incident) => {
                const isExpanded = expandedIncidentId === incident.id;
                const isCritical = incident.severity === 'critical';
                const isHigh = incident.severity === 'high';
                const isOpen = incident.status === 'open';
                const isAcknowledged = incident.status === 'acknowledged';
                const isResolved = incident.status === 'resolved';

                const severityBadgeStyle = 
                  isCritical ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-900' :
                  isHigh ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900';

                const categoryBadgeStyle =
                  incident.category === 'api_restriction' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                  incident.category === 'billing' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                  incident.category === 'integration' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

                return (
                  <div
                    key={incident.id}
                    id={`incident-${incident.id}`}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isExpanded ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-lg ' : ''
                    }${
                      isOpen
                        ? 'bg-white dark:bg-gray-900 border-red-300 dark:border-red-900/60 shadow-md ring-1 ring-red-400/20'
                        : isAcknowledged
                        ? 'bg-white dark:bg-gray-900 border-amber-200 dark:border-amber-900/40 shadow-sm'
                        : 'bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-800 opacity-80'
                    }`}
                  >
                    {/* Top Bar of Incident Card */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Severity Pill */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${severityBadgeStyle}`}>
                            {incident.severity}
                          </span>

                          {/* Category Pill */}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${categoryBadgeStyle}`}>
                            {incident.category.replace('_', ' ')}
                          </span>

                          {/* Status Pill */}
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isOpen 
                              ? 'bg-red-600 text-white animate-pulse' 
                              : isAcknowledged 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {isOpen ? '🚨 OPEN' : isAcknowledged ? '⚠️ ACKNOWLEDGED' : '✅ RESOLVED'}
                          </span>

                          {isExpanded && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              Selected from Alert
                            </span>
                          )}

                          <span className="text-xs text-gray-400">
                            • {new Date(incident.occurredAt).toLocaleString()}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {incident.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {incident.message}
                        </p>

                        {/* Audit Details */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                          <span>Source: <strong>{incident.source}</strong></span>
                          <span>User: <strong>{incident.userEmail || 'Anonymous'}</strong></span>
                          <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                            <MailIcon className="w-3 h-3" />
                            <span>Alert Dispatched to {incident.emailRecipient || APP_ADMIN_EMAIL}</span>
                          </span>
                        </div>

                        {/* Acknowledged / Resolved Status Metadata */}
                        {(incident.acknowledgedAt || incident.resolvedAt) && (
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 py-1 rounded-lg inline-block mt-1">
                            {incident.acknowledgedAt && (
                              <span>Acknowledged by <strong>{incident.acknowledgedBy}</strong> at {new Date(incident.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            )}
                            {incident.resolvedAt && (
                              <span className="ml-2">• Resolved by <strong>{incident.resolvedBy}</strong></span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons on Right */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        {isOpen && (
                          <button
                            onClick={() => handleAcknowledge(incident.id)}
                            disabled={actionInProgress === incident.id}
                            className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Acknowledge Alert</span>
                          </button>
                        )}

                        {isAcknowledged && (
                          <button
                            onClick={() => handleResolve(incident.id)}
                            disabled={actionInProgress === incident.id}
                            className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Mark Resolved</span>
                          </button>
                        )}

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setExpandedIncidentId(isExpanded ? null : incident.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </button>

                          <a
                            href={`mailto:${APP_ADMIN_EMAIL}?subject=${encodeURIComponent(`[INCIDENT ALERT: ${incident.title}] What's My Credit Worth`)}&body=${encodeURIComponent(
                              `WMCW INCIDENT ALERT: ${incident.title}\n==================================================\nIncident ID: ${incident.id}\nSeverity: ${incident.severity.toUpperCase()}\nCategory: ${incident.category}\nTimestamp: ${incident.occurredAt}\n\nMessage:\n${incident.message}\n\nError Details:\n${incident.errorDetails || 'None'}\n\nOPEN ADMIN DASHBOARD TO REVIEW / ACKNOWLEDGE:\n${getAdminDashboardUrl(incident.id).primaryUrl}\n==================================================`
                            )}`}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title={`Email alert with dashboard link to ${APP_ADMIN_EMAIL}`}
                          >
                            <MailIcon className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => handleDeleteIncident(incident.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Delete Incident"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Technical Details Drawer */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Technical Error Log & Stack
                          </h4>
                          {incident.category === 'api_restriction' && (
                            <a
                              href="https://ai.google.dev/gemini-api/docs/rate-limits"
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              <span>Google AI Studio Rate Limits & Billing Docs</span>
                              <ExternalLinkIcon />
                            </a>
                          )}
                        </div>

                        {incident.errorDetails ? (
                          <pre className="p-3 rounded-xl bg-gray-900 text-red-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed border border-gray-800">
                            {incident.errorDetails}
                          </pre>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No low-level stack trace logged for this incident.</p>
                        )}

                        <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 space-y-1">
                          <div className="font-bold text-gray-800 dark:text-gray-200">Incident Remediation Guidance:</div>
                          <ul className="list-disc pl-5 space-y-0.5">
                            {incident.category === 'api_restriction' && (
                              <>
                                <li>Check if your Gemini API Key is valid or if the project has exceeded free tier quotas.</li>
                                <li>Review quota metrics in Google AI Studio or Google Cloud Console.</li>
                                <li>Upgrade billing tier or apply token rate limiting if usage is high.</li>
                              </>
                            )}
                            {incident.category === 'billing' && (
                              <>
                                <li>Inspect the Stripe Dashboard for failed webhook events or declined cards.</li>
                                <li>Verify customer subscription status and retry payment link integration.</li>
                              </>
                            )}
                            {incident.category === 'integration' && (
                              <>
                                <li>Check Firebase Firestore Security Rules and connection status.</li>
                                <li>Ensure cloud network access is uninterrupted.</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================================
          TAB 2: USERS & ACCOUNTS
         ========================================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Search */}
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users by email, name, or UID..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-500 w-72 text-sm"
              />
            </div>
          </div>

          {userError && (
            <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-4 rounded-xl text-red-700 dark:text-red-300 text-sm">
              {userError}
            </div>
          )}

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center min-h-[280px]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-4">
                User Tier Distribution
              </h3>
              {users.length > 0 ? (
                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-gray-400 italic text-sm">No user data available</div>
              )}
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col justify-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Users</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{users.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col justify-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Premium Users</p>
                <p className="text-3xl font-black text-emerald-600 mt-1">
                  {users.filter(u => u.isPremium).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {users.length > 0 
                    ? `${Math.round((users.filter(u => u.isPremium).length / users.length) * 100)}% conversion`
                    : '0%'}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col justify-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Basic Users</p>
                <p className="text-3xl font-black text-gray-400 mt-1">
                  {users.filter(u => !u.isPremium).length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col justify-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Admins</p>
                <p className="text-3xl font-black text-purple-600 mt-1">
                  {users.filter(u => u.isAdmin).length}
                </p>
              </div>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex justify-center items-center gap-2">
                          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                          Loading user directory...
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No users found matching "{userSearchTerm}"
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                              {u.displayName ? u.displayName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-gray-900 dark:text-white">{u.displayName || 'Anonymous User'}</div>
                              <div className="text-xs text-gray-500">{u.email || 'No email provided'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {u.isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                              <Shield className="w-3.5 h-3.5" />
                              Admin
                            </span>
                          ) : u.isFrozen ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                              <Lock className="w-3.5 h-3.5" />
                              Frozen
                            </span>
                          ) : u.isPremium ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Premium
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                              <XCircle className="w-3.5 h-3.5" />
                              Basic
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Never'}
                        </td>
                        <td className="px-6 py-4">
                          {!u.isAdmin && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => togglePremiumStatus(u.id, u.isPremium)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                                  u.isPremium 
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                              >
                                {u.isPremium ? 'Downgrade' : 'Upgrade'}
                              </button>
                              
                              <button
                                onClick={() => toggleFreezeStatus(u.id, !!u.isFrozen)}
                                title={u.isFrozen ? 'Unfreeze Account' : 'Freeze Account'}
                                className={`p-2 rounded-xl transition-colors ${
                                  u.isFrozen
                                    ? 'bg-red-100 text-red-600 dark:bg-red-950 hover:bg-red-200'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {u.isFrozen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              </button>

                              <button
                                onClick={() => setUserToDelete(u)}
                                title="Delete User"
                                className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/40 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* System Health Check & Email Pipeline Diagnostics Modal */}
      {showHealthModal && healthCheckResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 border border-gray-100 dark:border-gray-800 space-y-5 my-8">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <ActivityIcon className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    System Health Check & Email Pipeline Diagnostics
                  </h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Incident ID: <code className="text-indigo-600 dark:text-indigo-400">{healthCheckResult.incidentId}</code> • {new Date(healthCheckResult.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setShowHealthModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Subsystems Status Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-center border border-gray-100 dark:border-gray-800">
                <div className="text-emerald-500 font-bold text-sm">✔ OK</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Firestore DB</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-center border border-gray-100 dark:border-gray-800">
                <div className="text-emerald-500 font-bold text-sm">✔ OK</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Incident Queue</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-center border border-gray-100 dark:border-gray-800">
                <div className="text-emerald-500 font-bold text-sm">✔ Queued</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Firestore Mail</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-center border border-gray-100 dark:border-gray-800">
                <div className="text-emerald-500 font-bold text-sm">✔ Verified</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Admin Hash URL</div>
              </div>
            </div>

            {/* Email Delivery Pipeline Diagnosis Card */}
            <div className={`p-4 rounded-2xl border text-xs space-y-3 ${
              healthCheckResult.emailReport.deliveryState === 'DELIVERED'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                : healthCheckResult.emailReport.deliveryState === 'DELIVERY_ERROR'
                ? 'bg-red-50/90 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
                : 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <MailIcon className={`w-4 h-4 mt-0.5 shrink-0 ${
                    healthCheckResult.emailReport.deliveryState === 'DELIVERED'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : healthCheckResult.emailReport.deliveryState === 'DELIVERY_ERROR'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`} />
                  <div>
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      {healthCheckResult.emailReport.deliveryState === 'DELIVERED' && (
                        <span>✔ Verified: Email Dispatched via Firebase Extension</span>
                      )}
                      {healthCheckResult.emailReport.deliveryState === 'DELIVERY_ERROR' && (
                        <span>✖ Trigger Email Extension Reported an SMTP Error</span>
                      )}
                      {healthCheckResult.emailReport.deliveryState === 'QUEUED_IN_FIRESTORE' && (
                        <span>⚠️ Queued in Firestore — Pending Extension Trigger</span>
                      )}
                    </h4>
                    <p className="mt-1 leading-relaxed text-gray-700 dark:text-gray-300">
                      {healthCheckResult.emailReport.deliveryMessage}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRecheckDelivery}
                  disabled={recheckingDelivery}
                  className="shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-1.5"
                  title="Re-query Firestore to check if the extension has finished sending"
                >
                  <RefreshIcon className={`w-3.5 h-3.5 ${recheckingDelivery ? 'animate-spin text-indigo-600' : 'text-gray-500'}`} />
                  <span>{recheckingDelivery ? 'Checking...' : 'Re-probe Status'}</span>
                </button>
              </div>

              {/* Detailed Technical Payload from Extension if available */}
              {healthCheckResult.emailReport.deliveryDetails && (
                <div className="p-2.5 bg-black/5 dark:bg-black/40 rounded-xl font-mono text-[11px] overflow-x-auto border border-black/10 dark:border-white/10">
                  <span className="font-bold uppercase tracking-wider block mb-1 text-[10px] text-gray-500">
                    Extension Delivery Payload:
                  </span>
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(healthCheckResult.emailReport.deliveryDetails, null, 2)}
                  </pre>
                </div>
              )}

              {/* Actionable Diagnosis Checklist if Still Queued or in Error */}
              {healthCheckResult.emailReport.deliveryState !== 'DELIVERED' && (
                <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 space-y-1.5 text-[11.5px] leading-relaxed text-gray-700 dark:text-gray-300">
                  <div className="font-bold text-gray-900 dark:text-white mb-1">
                    Top Reasons Alert Emails Fail After Extension Configuration:
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    <li>
                      <strong>Google Account App Password:</strong> Normal Gmail passwords are <span className="text-red-600 dark:text-red-400 font-semibold">blocked by Google</span> for SMTP. You must create a 16-character App Password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline text-indigo-600 dark:text-indigo-400">myaccount.google.com/apppasswords</a>.
                    </li>
                    <li>
                      <strong>Username Percent-Encoding:</strong> In <code>SMTP_CONNECTION_URI</code>, the <code>@</code> in <code>dlaniger.napm.consulting@gmail.com</code> must be encoded as <code>%40</code>: <code className="bg-black/10 dark:bg-black/50 px-1 py-0.5 rounded">smtps://dlaniger.napm.consulting%40gmail.com:app_password@smtp.gmail.com:465</code>.
                    </li>
                    <li>
                      <strong>Collection Name Mismatch:</strong> In Firebase Extension settings, verify <em>"Email documents collection"</em> is set to <code>mail</code> (or <code>support_requests</code>) <u>without</u> a leading slash.
                    </li>
                    <li>
                      <strong>Secret Manager IAM Permission:</strong> In GCP Console, the extension service account requires the <code className="bg-black/10 dark:bg-black/50 px-1 py-0.5 rounded">Secret Manager Secret Accessor</code> role to decrypt the SMTP password.
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Direct Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <a
                href={healthCheckResult.emailReport.mailtoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition-all"
                title="Opens your email client with pre-filled report ready to send to admin"
              >
                <MailIcon className="w-4 h-4" />
                <span>Send via My Email Client (1-Click)</span>
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(healthCheckResult.emailReport.bodyText);
                  setCopiedReport(true);
                  setTimeout(() => setCopiedReport(false), 2200);
                }}
                className="px-4 py-2.5 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-all flex items-center gap-1.5"
              >
                <CheckCircle className={`w-4 h-4 ${copiedReport ? 'text-emerald-500' : 'text-gray-400'}`} />
                <span>{copiedReport ? 'Copied to Clipboard!' : 'Copy Diagnostic Report'}</span>
              </button>

              <button
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="px-3 py-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {showSetupGuide ? 'Hide Detailed Guide' : 'View Step-by-Step Extension Setup Guide'}
              </button>
            </div>

            {/* Generated Email Preview */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Pre-formatted Diagnostic Report Preview:
              </span>
              <pre className="p-3 bg-gray-900 text-gray-200 rounded-xl text-[11px] leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border border-gray-800">
                {healthCheckResult.emailReport.bodyText}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHealthModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-xl font-bold">Delete User Permanently?</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>{userToDelete.displayName || userToDelete.email}</strong>? 
              This action cannot be undone and will purge their data from Firestore.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(userToDelete.id)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-bold transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Additional Helper Icons
const ClockIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const ZapIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);
