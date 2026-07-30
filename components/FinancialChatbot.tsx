import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BotIcon, CloseIcon, SparklesIcon, SaveIcon, DeleteIcon, CheckIcon, MaximizeIcon } from './ui/Icons';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';
import Markdown from 'react-markdown';
import { exportAdvisorReportToPDF, printAdvisorReport } from '../utils/pdfGenerator';
import type { SavedAdvisorRequest } from '../types';
import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  promptText?: string;
  timestamp?: string;
  isSaved?: boolean;
}

interface FinancialChatbotProps {
  financialData: any;
  onOpenMembership: () => void;
}

const FinancialChatbot: React.FC<FinancialChatbotProps> = ({ financialData, onOpenMembership }) => {
  const { isPremium, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'saved'>('chat');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: 'Hi! I am your AI Financial Advisor. Ask me anything about your financial data, debt strategy, or investment scenarios.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedRequests, setSavedRequests] = useState<SavedAdvisorRequest[]>([]);
  const [savedSearchQuery, setSavedSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current && activeTab === 'chat') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Load Saved Requests from Firestore & LocalStorage for Premium Users
  useEffect(() => {
    const loadSavedRequests = async () => {
      if (!isPremium) return;

      const userId = user?.uid || 'guest';
      const localKey = `saved_advisor_requests_${userId}`;

      // 1. Try local storage first for fast render
      const localData = localStorage.getItem(localKey);
      if (localData) {
        try {
          setSavedRequests(JSON.parse(localData));
        } catch (e) {
          console.error("Error parsing local saved requests:", e);
        }
      }

      // 2. Fetch from Firestore if user logged in
      if (user?.uid) {
        try {
          const reqsRef = collection(db, 'users', user.uid, 'saved_requests');
          const q = query(reqsRef, orderBy('createdAt', 'desc'));
          const querySnap = await getDocs(q);
          const docs: SavedAdvisorRequest[] = [];
          querySnap.forEach((d) => {
            docs.push({ id: d.id, ...d.data() } as SavedAdvisorRequest);
          });

          if (docs.length > 0) {
            setSavedRequests(docs);
            localStorage.setItem(localKey, JSON.stringify(docs));
          }
        } catch (err) {
          console.error("Error fetching saved requests from Firestore:", err);
        }
      }
    };

    if (isOpen) {
      loadSavedRequests();
    }
  }, [isOpen, isPremium, user?.uid]);

  useEffect(() => {
    const initChat = async () => {
      if (isOpen && isPremium && !chatRef.current) {
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) {
            setMessages(prev => [
              ...prev,
              {
                id: 'key-req-msg',
                role: 'model',
                text: 'API Key must be selected. Please click the button below to configure your API key.'
              }
            ]);
            return;
          }
        }
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
          setMessages(prev => [
            ...prev,
            {
              id: 'no-key-msg',
              role: 'model',
              text: 'AI is not configured. Please set the GEMINI_API_KEY environment variable.'
            }
          ]);
          return;
        }
        const ai = new GoogleGenAI({ apiKey });
        chatRef.current = ai.chats.create({
          model: 'gemini-3.1-pro-preview',
          config: {
            systemInstruction: `You are an expert financial advisor. You help the user understand their financial situation, run scenarios, and provide actionable advice.
Here is the user's current financial data (JSON format):
${JSON.stringify(financialData)}

Base your answers on this data when relevant. Be concise, professional, and helpful. Format your responses using Markdown.`,
          }
        });
      }
    };
    initChat();
  }, [isOpen, isPremium, financialData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      chatRef.current = null;
      setMessages([
        {
          id: 'welcome-msg',
          role: 'model',
          text: 'Hi! I am your AI Financial Advisor. Ask me anything about your financial data or scenarios.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !isPremium) return;

    const userText = input.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = 'msg_user_' + Date.now();
    
    setInput('');
    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', text: userText, timestamp: timeStr }
    ]);
    setIsLoading(true);

    try {
      if (!chatRef.current) {
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) {
            throw new Error("API Key must be selected. Please click the button below to configure your API key.");
          }
        }
        throw new Error("Chat session not initialized. Please set the GEMINI_API_KEY environment variable.");
      }
      
      const response = await chatRef.current.sendMessage({ message: userText });
      const modelMsgId = 'msg_model_' + Date.now();

      setMessages(prev => [
        ...prev,
        {
          id: modelMsgId,
          role: 'model',
          text: response.text || '',
          promptText: userText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (error: any) {
      console.error("Chatbot error:", error);
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'model',
          text: error.message || 'Sorry, I encountered an error processing your request. Please try again later.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Save Request & Result to Firestore & Local Storage
  const handleSaveRequest = async (msg: Message) => {
    if (!isPremium) return;

    const promptText = msg.promptText || 'AI Financial Analysis';
    const responseText = msg.text;
    const reqId = msg.id || 'saved_' + Date.now();
    const title = promptText.length > 55 ? promptText.substring(0, 55) + '...' : promptText;
    const createdAt = new Date().toLocaleString();

    const newSaved: SavedAdvisorRequest = {
      id: reqId,
      userId: user?.uid,
      title,
      prompt: promptText,
      response: responseText,
      createdAt
    };

    // Update state
    const updated = [newSaved, ...savedRequests.filter(s => s.id !== reqId)];
    setSavedRequests(updated);

    // Update message state as saved
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isSaved: true } : m));

    // Save to localStorage
    const userId = user?.uid || 'guest';
    const localKey = `saved_advisor_requests_${userId}`;
    localStorage.setItem(localKey, JSON.stringify(updated));

    // Save to Firestore if user exists
    if (user?.uid) {
      try {
        const docRef = doc(db, 'users', user.uid, 'saved_requests', reqId);
        await setDoc(docRef, newSaved);
      } catch (err) {
        console.error("Failed to save request to Firestore:", err);
      }
    }

    showToast("Request & Result saved successfully!");
  };

  // Delete Saved Request
  const handleDeleteSavedRequest = async (reqId: string) => {
    const updated = savedRequests.filter(s => s.id !== reqId);
    setSavedRequests(updated);

    const userId = user?.uid || 'guest';
    const localKey = `saved_advisor_requests_${userId}`;
    localStorage.setItem(localKey, JSON.stringify(updated));

    if (user?.uid) {
      try {
        const docRef = doc(db, 'users', user.uid, 'saved_requests', reqId);
        await deleteDoc(docRef);
      } catch (err) {
        console.error("Failed to delete request from Firestore:", err);
      }
    }

    showToast("Saved request deleted.");
  };

  // Print Request Result
  const handlePrintResult = (promptText: string, responseText: string) => {
    if (!isPremium) return;
    printAdvisorReport({
      requestPrompt: promptText,
      responseText: responseText,
      displayName: user?.displayName || undefined,
      userEmail: user?.email || undefined,
      timestamp: new Date().toLocaleString()
    });
  };

  // Export Request Result to Professional PDF
  const handleExportPdf = async (reqId: string, promptText: string, responseText: string) => {
    if (!isPremium) return;
    setIsExportingPdf(reqId);
    showToast("Generating professional PDF report...");

    try {
      await exportAdvisorReportToPDF({
        requestPrompt: promptText,
        responseText: responseText,
        displayName: user?.displayName || undefined,
        userEmail: user?.email || undefined,
        timestamp: new Date().toLocaleString()
      });
      showToast("PDF report exported successfully!");
    } catch (e) {
      console.error(e);
      showToast("Failed to generate PDF. Please try again.");
    } finally {
      setIsExportingPdf(null);
    }
  };

  if (!isVisible) return null;

  const filteredSavedRequests = savedRequests.filter(sr =>
    sr.title.toLowerCase().includes(savedSearchQuery.toLowerCase()) ||
    sr.prompt.toLowerCase().includes(savedSearchQuery.toLowerCase()) ||
    sr.response.toLowerCase().includes(savedSearchQuery.toLowerCase())
  );

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-gray-700 flex items-center gap-2 animate-fade-in">
          <CheckIcon className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-4 animate-fade-in">
        {!isOpen && (
          <div className="bg-brand-primary text-white px-4 py-2 rounded-xl shadow-lg font-semibold animate-bounce relative">
            Chat With Us
            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-brand-primary"></div>
          </div>
        )}
        <button
          onClick={() => setIsOpen(true)}
          className={`p-4 rounded-full shadow-2xl text-white transition-all transform hover:scale-105 ${
            isPremium ? 'bg-brand-primary hover:bg-brand-secondary' : 'bg-gray-800 hover:bg-gray-700'
          }`}
          aria-label="Open AI Financial Advisor"
        >
          <BotIcon className="w-6 h-6" />
          {!isPremium && (
            <span className="absolute -top-2 -right-2 bg-brand-accent text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white">
              PRO
            </span>
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-fade-in transition-all ${
            isExpanded
              ? 'bottom-6 right-6 left-6 top-6 sm:left-auto sm:top-12 sm:w-[700px] sm:h-[80vh]'
              : 'bottom-24 right-6 w-96 h-[540px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-3.5 sm:p-4 flex flex-col gap-3 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BotIcon className="w-5 h-5" />
                <h3 className="font-bold text-base">AI Financial Advisor</h3>
                {isPremium && (
                  <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    PRO
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {isPremium && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? "Collapse Window" : "Expand Window"}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                  >
                    <MaximizeIcon className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Premium Navigation Tabs */}
            {isPremium && (
              <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'chat'
                      ? 'bg-white text-brand-primary shadow-sm font-bold'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Advisor Chat
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'saved'
                      ? 'bg-white text-brand-primary shadow-sm font-bold'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <SaveIcon className="w-3.5 h-3.5" />
                  Saved Requests
                  {savedRequests.length > 0 && (
                    <span className="bg-brand-primary text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ml-1">
                      {savedRequests.length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Non-Premium Content */}
          {!isPremium ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-800">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                <SparklesIcon className="w-8 h-8 text-brand-primary" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Premium AI Financial Advisor</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Upgrade to Premium to unlock AI Financial Advisor, save your requests, print custom advisory results, and export professional PDF financial reports.
              </p>
              <Button onClick={() => { setIsOpen(false); onOpenMembership(); }} className="w-full bg-brand-primary hover:bg-brand-secondary">
                Upgrade to Premium
              </Button>
            </div>
          ) : activeTab === 'saved' ? (
            /* Saved Requests Tab */
            <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-800 overflow-hidden p-3.5 sm:p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search saved requests..."
                  value={savedSearchQuery}
                  onChange={(e) => setSavedSearchQuery(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {filteredSavedRequests.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/80">
                    <SaveIcon className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-60" />
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">No saved requests found</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      Click the "Save" icon on any AI response in your chat to store requests for printing and PDF exports.
                    </p>
                  </div>
                ) : (
                  filteredSavedRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white dark:bg-gray-900 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2">
                            {req.title}
                          </h4>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {req.createdAt}
                          </span>
                        </div>

                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 mb-2">
                          <p className="text-[11px] text-gray-600 dark:text-gray-300 font-medium line-clamp-2">
                            <span className="font-bold text-brand-primary dark:text-blue-400">Prompt:</span> {req.prompt}
                          </p>
                        </div>

                        <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-3 prose dark:prose-invert max-w-none">
                          <Markdown>{req.response}</Markdown>
                        </div>
                      </div>

                      {/* Actions Toolbar */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 gap-1 text-[11px]">
                        <button
                          onClick={() => {
                            setActiveTab('chat');
                            setMessages([
                              {
                                id: 'user_req_' + req.id,
                                role: 'user',
                                text: req.prompt,
                                timestamp: req.createdAt
                              },
                              {
                                id: req.id,
                                role: 'model',
                                text: req.response,
                                promptText: req.prompt,
                                timestamp: req.createdAt,
                                isSaved: true
                              }
                            ]);
                          }}
                          className="px-2.5 py-1 text-brand-primary dark:text-blue-400 hover:bg-brand-primary/10 rounded-md font-semibold transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View in Chat
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handlePrintResult(req.prompt, req.response)}
                            title="Print Request Result"
                            className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-brand-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors flex items-center gap-1 font-medium"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                          </button>

                          <button
                            onClick={() => handleExportPdf(req.id, req.prompt, req.response)}
                            disabled={isExportingPdf === req.id}
                            title="Export Professional PDF Report"
                            className="px-2 py-1 bg-brand-primary/10 text-brand-primary dark:text-blue-300 hover:bg-brand-primary hover:text-white rounded-md transition-colors font-bold flex items-center gap-1 disabled:opacity-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export PDF
                          </button>

                          <button
                            onClick={() => handleDeleteSavedRequest(req.id)}
                            title="Delete Saved Request"
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                          >
                            <DeleteIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Active Chat Tab */
            <>
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[88%] sm:max-w-[85%] rounded-2xl px-4 py-2.5 ${
                        msg.role === 'user'
                          ? 'bg-brand-primary text-white rounded-br-sm shadow-sm'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm rounded-bl-sm border border-gray-100 dark:border-gray-600'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <div>
                          <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                          {msg.timestamp && (
                            <span className="text-[10px] text-white/70 block text-right mt-1">
                              {msg.timestamp}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs sm:text-sm prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                            <Markdown>{msg.text}</Markdown>

                            {msg.text.includes("API Key must be selected") && window.aistudio && (
                              <div className="mt-2 flex flex-col gap-2 items-start">
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                  To use this feature, you need to select a paid API key from a Google Cloud project.
                                  For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline font-semibold">billing documentation</a>.
                                </p>
                                <Button onClick={handleSelectKey} size="small" className="bg-brand-primary text-white">
                                  Select API Key
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Response Action Bar for Premium Users */}
                          {isPremium && msg.id !== 'welcome-msg' && msg.id !== 'key-req-msg' && msg.id !== 'no-key-msg' && !msg.text.includes("API Key must be selected") && (
                            <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-600 flex items-center justify-between gap-1 text-[11px]">
                              <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                {msg.timestamp || 'Advisor Result'}
                              </div>

                              <div className="flex items-center gap-1">
                                {/* Save Request Button */}
                                <button
                                  onClick={() => handleSaveRequest(msg)}
                                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                                    msg.isSaved || savedRequests.some(s => s.id === msg.id)
                                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                                  }`}
                                  title="Save Request & Result"
                                >
                                  {msg.isSaved || savedRequests.some(s => s.id === msg.id) ? (
                                    <>
                                      <CheckIcon className="w-3.5 h-3.5" />
                                      Saved
                                    </>
                                  ) : (
                                    <>
                                      <SaveIcon className="w-3.5 h-3.5" />
                                      Save
                                    </>
                                  )}
                                </button>

                                {/* Print Result Button */}
                                <button
                                  onClick={() => handlePrintResult(msg.promptText || 'Financial Request', msg.text)}
                                  className="px-2 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors flex items-center gap-1 font-medium"
                                  title="Print Request Result"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                  </svg>
                                  Print
                                </button>

                                {/* Export PDF Report Button */}
                                <button
                                  onClick={() => handleExportPdf(msg.id, msg.promptText || 'Financial Request', msg.text)}
                                  disabled={isExportingPdf === msg.id}
                                  className="px-2 py-1 bg-brand-primary/10 text-brand-primary dark:text-blue-300 hover:bg-brand-primary hover:text-white rounded-md transition-colors font-bold flex items-center gap-1 disabled:opacity-50"
                                  title="Export Professional PDF Format Report"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Export PDF
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-700 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 border border-gray-100 dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Analyzing financial metrics...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about your finances, debt, savings..."
                    className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none focus:ring-0 resize-none px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-100 outline-none"
                    rows={1}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors mb-1 mr-1"
                    title="Send Prompt"
                  >
                    <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default FinancialChatbot;
