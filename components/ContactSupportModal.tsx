
import React, { useState } from 'react';
import Button from './ui/Button';
import { SupportIcon, EmailIcon, CheckIcon, AlertTriangleIcon } from './ui/Icons';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactSupportModal: React.FC<ContactSupportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const SUPPORT_EMAIL = 'dlaniger.napm.consulting@gmail.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message || isSending) return;

    setIsSending(true);
    setErrorMessage(null);

    try {
      /**
       * TRIGGER EMAIL EXTENSION SCHEMA:
       * To actually receive these in your inbox, install the "Trigger Email" 
       * extension in your Firebase Console and point it to the 'support_requests' collection.
       */
      const emailBody = `
NEW SUPPORT REQUEST FROM WMCW APP
---------------------------------
User Name: ${user?.displayName || 'Guest'}
User Email: ${user?.email || 'N/A'}
User UID: ${user?.uid}
Timestamp: ${new Date().toLocaleString()}

MESSAGE:
${message}
      `.trim();

      await addDoc(collection(db, 'support_requests'), {
        // These fields are specifically for the 'Trigger Email' Extension
        to: SUPPORT_EMAIL,
        message: {
          subject: `[WMCW Support] ${subject}`,
          text: emailBody,
          html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                  <h2 style="color: #0D47A1;">WMCW Support Request</h2>
                  <p><strong>Subject:</strong> ${subject}</p>
                  <hr style="border: 0; border-top: 1px solid #eee;" />
                  <p style="white-space: pre-wrap;">${message}</p>
                  <hr style="border: 0; border-top: 1px solid #eee;" />
                  <div style="font-size: 11px; color: #666;">
                    <p><strong>User:</strong> ${user?.displayName || 'Guest'}</p>
                    <p><strong>Email:</strong> ${user?.email || 'N/A'}</p>
                    <p><strong>UID:</strong> ${user?.uid}</p>
                  </div>
                </div>`
        },
        // Audit metadata
        userId: user?.uid || 'anonymous',
        createdAt: serverTimestamp(),
        status: {
          state: 'PENDING',
          updatedAt: serverTimestamp()
        }
      });

      setIsSent(true);
      setTimeout(() => {
        onClose();
        setIsSent(false);
        setSubject('');
        setMessage('');
      }, 2500);
    } catch (error: any) {
      console.error("Support submission error:", error);
      
      if (error.code === 'permission-denied') {
        setErrorMessage("Database Permission Denied. Please ensure Firestore Security Rules allow 'create' on the 'support_requests' collection.");
      } else {
        setErrorMessage("Failed to send message. Please check your internet connection and try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-fade-in border border-gray-100 dark:border-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-brand-primary text-white">
          <div className="flex items-center gap-3">
            <SupportIcon />
            <h2 className="text-xl font-bold">Contact Support</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-2 text-2xl font-light">✕</button>
        </div>

        <div className="p-8">
          {isSent ? (
            <div className="py-12 text-center space-y-4 animate-fade-in">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckIcon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold">Message Sent!</h3>
              <p className="text-gray-500 max-w-xs mx-auto">
                Our team has received your request. We'll get back to you at <strong>{user?.email || 'your email'}</strong> as soon as possible.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Found a bug or have a feature request? Let us know! Your request will be sent directly to our support desk.
              </p>

              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-700 text-xs animate-fade-in">
                  <AlertTriangleIcon className="shrink-0 w-4 h-4" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What can we help you with?"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Your Message</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or suggestion in detail..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-brand-primary outline-none transition-all resize-none"
                ></textarea>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isSending} 
                  className="w-full py-4 text-lg bg-brand-primary hover:bg-brand-secondary shadow-lg disabled:opacity-50"
                >
                  {isSending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </div>
                  ) : (
                    <><EmailIcon /> Send Request</>
                  )}
                </Button>
              </div>

              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                  Securely powered by Firebase Cloud Systems
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactSupportModal;
