import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BotIcon, CloseIcon, SparklesIcon } from './ui/Icons';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';
import Markdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface FinancialChatbotProps {
  financialData: any;
  onOpenMembership: () => void;
}

const FinancialChatbot: React.FC<FinancialChatbotProps> = ({ financialData, onOpenMembership }) => {
  const { isPremium } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hi! I am your AI Financial Advisor. Ask me anything about your financial data or scenarios.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chatRef = useRef<any>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && isPremium && !chatRef.current) {
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
  }, [isOpen, isPremium, financialData]);

  const handleSend = async () => {
    if (!input.trim() || !isPremium) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      if (!chatRef.current) {
        throw new Error("Chat session not initialized");
      }
      
      const response = await chatRef.current.sendMessage({ message: userText });
      
      setMessages(prev => [...prev, { role: 'model', text: response.text || '' }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error processing your request. Please try again later.' }]);
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

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl text-white transition-all transform hover:scale-105 z-40 ${
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

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] max-h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <BotIcon className="w-5 h-5" />
              <h3 className="font-bold">AI Financial Advisor</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          {!isPremium ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-800">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                <SparklesIcon className="w-8 h-8 text-brand-primary" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Premium Feature</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Upgrade to Premium to chat with our AI Financial Advisor. Ask about scenarios, get personalized insights, and more based on your data.
              </p>
              <Button onClick={() => { setIsOpen(false); onOpenMembership(); }} className="w-full bg-brand-primary hover:bg-brand-secondary">
                Upgrade to Premium
              </Button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user' 
                        ? 'bg-brand-primary text-white rounded-br-sm' 
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm rounded-bl-sm border border-gray-100 dark:border-gray-600'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-700 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 border border-gray-100 dark:border-gray-600">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about your finances..."
                    className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none focus:ring-0 resize-none px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none"
                    rows={1}
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors mb-1 mr-1"
                  >
                    <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
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
