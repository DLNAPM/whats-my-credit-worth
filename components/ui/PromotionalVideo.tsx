
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import Button from './Button';
import { PlayCircleIcon, MaximizeIcon, AlertTriangleIcon } from './Icons';

interface PromotionalVideoProps {
  isOpen: boolean;
  onClose: () => void;
}

const PromotionalVideo: React.FC<PromotionalVideoProps> = ({ isOpen, onClose }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing production...');
  const [error, setError] = useState<string | null>(null);

  const messages = [
    "Capturing dashboard layout...",
    "Rendering net worth growth animations...",
    "Simulating credit score improvements...",
    "Polishing instructional transitions...",
    "Optimizing video for playback...",
    "Finalizing your financial tour...",
    "Almost there, making it look amazing!"
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isGenerating) {
      let idx = 0;
      interval = setInterval(() => {
        setLoadingMessage(messages[idx % messages.length]);
        idx++;
      }, 6000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const generateVideo = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = "A high-definition promotional instructional video for the 'What's my Credit Worth' app. The video features realistic UI screenshots of a financial dashboard with a Net Worth line chart trending upwards and Credit Score gauges using sample data like '$150,000 Net Worth' and '780 FICO Score'. An animated cursor interacts with the 'AI Advisor' button, revealing sophisticated tips. Smooth cinematic pans across the 'Credit Cards' and 'Mortgages' sections show colorful progress bars. The palette is a professional blue and white, ending with a call to action showing a secure vault icon and the text 'Take Control of Your Future'.";

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
      } else {
        throw new Error("Video generation failed to return a link.");
      }
    } catch (err: any) {
      console.error("Video Generation Error:", err);
      if (err?.message?.includes("Requested entity was not found") && window.aistudio) {
        setError("API Key Error. Please ensure you have a valid paid project key selected.");
        await window.aistudio.openSelectKey();
      } else {
        setError("Unable to generate the video at this time. Please try again later.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnlarge = () => {
    if (videoUrl) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>WMCW Promotional Tour - Fullscreen</title>
              <style>
                body { margin: 0; background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
                video { max-width: 100%; max-height: 100%; box-shadow: 0 0 50px rgba(0,0,0,0.5); border-radius: 8px; }
              </style>
            </head>
            <body>
              <video controls autoplay>
                <source src="${videoUrl}" type="video/mp4">
                Your browser does not support the video tag.
              </video>
            </body>
          </html>
        `);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border border-brand-primary/20">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-brand-primary text-white">
          <div className="flex items-center gap-3">
            <PlayCircleIcon />
            <h2 className="text-xl font-bold">WMCW Promotional Tour</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-2 text-2xl font-light">✕</button>
        </div>

        {/* Content Area */}
        <div className="aspect-video bg-black flex items-center justify-center relative group">
          {videoUrl ? (
            <video 
              controls 
              className="w-full h-full"
              autoPlay
              src={videoUrl}
            />
          ) : isGenerating ? (
            <div className="text-center p-8 space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-brand-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-4 bg-brand-primary/10 rounded-full flex items-center justify-center">
                   <PlayCircleIcon />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Generating Experience</h3>
                <p className="text-brand-light/60 text-sm font-medium animate-pulse">{loadingMessage}</p>
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest max-w-xs mx-auto">
                Veo AI is crafting a custom animation for you. This usually takes 1-2 minutes.
              </p>
            </div>
          ) : error ? (
            <div className="text-center p-8 space-y-4">
              <div className="text-red-500 flex justify-center"><AlertTriangleIcon /></div>
              <p className="text-white font-medium">{error}</p>
              <Button onClick={generateVideo} variant="secondary">Retry Generation</Button>
            </div>
          ) : (
            <div className="text-center p-8 space-y-6">
              <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto text-brand-primary">
                <PlayCircleIcon />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">See WMCW in Action</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Click below to generate a real-time promotional video explaining how to master your finances.
                </p>
              </div>
              <Button onClick={generateVideo} className="bg-brand-primary hover:bg-brand-secondary text-white py-4 px-10 rounded-2xl shadow-xl">
                Start AI Video Production
              </Button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium italic">
             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline hover:text-brand-primary">Billing Required for Veo AI</a>
          </div>
          <div className="flex gap-4">
            {videoUrl && (
              <Button onClick={handleEnlarge} variant="secondary">
                <MaximizeIcon /> Enlarge Outside App
              </Button>
            )}
            <Button onClick={onClose} variant="secondary">Close Tour</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionalVideo;
