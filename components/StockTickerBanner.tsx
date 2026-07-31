import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface QuoteData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isIndex?: boolean;
}

interface StockTickerBannerProps {
  onOpenProfile: () => void;
}

const DEFAULT_INDEX_QUOTES: QuoteData[] = [
  { symbol: 'DOW', name: 'Dow Jones', price: 40842.50, change: 142.10, changePercent: 0.35, isIndex: true },
  { symbol: 'S&P 500', name: 'S&P 500', price: 5522.30, change: 26.40, changePercent: 0.48, isIndex: true },
  { symbol: 'NASDAQ', name: 'NASDAQ', price: 17599.40, change: 108.50, changePercent: 0.62, isIndex: true },
];

const KNOWN_STOCK_BASES: Record<string, { name: string; price: number; change: number; changePercent: number }> = {
  AAPL: { name: 'Apple Inc.', price: 224.50, change: 2.80, changePercent: 1.26 },
  NVDA: { name: 'NVIDIA Corp.', price: 118.40, change: 2.45, changePercent: 2.11 },
  MSFT: { name: 'Microsoft', price: 448.20, change: -1.30, changePercent: -0.29 },
  AMZN: { name: 'Amazon.com', price: 182.90, change: 1.10, changePercent: 0.61 },
  TSLA: { name: 'Tesla Inc.', price: 220.10, change: -3.20, changePercent: -1.43 },
  GOOGL: { name: 'Alphabet Inc.', price: 172.30, change: 0.80, changePercent: 0.47 },
  META: { name: 'Meta Platforms', price: 512.40, change: 4.20, changePercent: 0.83 },
  AMD: { name: 'Adv. Micro Devices', price: 154.20, change: -0.90, changePercent: -0.58 },
  SPY: { name: 'SPDR S&P 500', price: 550.80, change: 2.40, changePercent: 0.44 },
  QQQ: { name: 'Invesco QQQ', price: 478.60, change: 3.10, changePercent: 0.65 },
  BTC: { name: 'Bitcoin', price: 64850.00, change: 1240.00, changePercent: 1.95 },
  ETH: { name: 'Ethereum', price: 3420.00, change: 52.00, changePercent: 1.54 },
};

function generateFallbackQuote(symbol: string): QuoteData {
  if (KNOWN_STOCK_BASES[symbol]) {
    const base = KNOWN_STOCK_BASES[symbol];
    return { symbol, name: base.name, price: base.price, change: base.change, changePercent: base.changePercent };
  }
  // Deterministic seed from symbol string
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  const price = Math.abs(hash % 350) + 45 + 0.50;
  const changePercent = ((hash % 300) / 100) - 1.0;
  const change = (price * changePercent) / 100;
  return { symbol, name: `${symbol} Corp`, price: Number(price.toFixed(2)), change: Number(change.toFixed(2)), changePercent: Number(changePercent.toFixed(2)) };
}

function getMarketWatchUrl(symbol: string): string {
  const clean = symbol.trim().toUpperCase();
  if (clean === 'DOW') return 'https://www.marketwatch.com/investing/index/djia';
  if (clean === 'S&P 500' || clean === 'SP500' || clean === 'S&P500') return 'https://www.marketwatch.com/investing/index/spx';
  if (clean === 'NASDAQ') return 'https://www.marketwatch.com/investing/index/comp';
  return `https://www.marketwatch.com/investing/stock/${clean.toLowerCase()}`;
}

const StockTickerBanner: React.FC<StockTickerBannerProps> = ({ onOpenProfile }) => {
  const { savedTickers } = useAuth();
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [flashStatus, setFlashStatus] = useState<Record<string, 'up' | 'down'>>({});
  const [isHovered, setIsHovered] = useState(false);
  const isHoveredRef = useRef(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    isHoveredRef.current = true;
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    isHoveredRef.current = false;
  };

  // Build quotes array whenever savedTickers changes
  useEffect(() => {
    const userQuotes = (savedTickers || ['AAPL', 'NVDA', 'MSFT', 'AMZN', 'TSLA']).map(generateFallbackQuote);
    setQuotes([...DEFAULT_INDEX_QUOTES, ...userQuotes]);
  }, [savedTickers]);

  // Periodic micro-updates to simulate live market price flashing
  useEffect(() => {
    const interval = setInterval(() => {
      // Skip updates and flashing if user is hovering / highlighting the banner
      if (isHoveredRef.current) return;

      setQuotes(prevQuotes => {
        if (prevQuotes.length === 0 || isHoveredRef.current) return prevQuotes;

        // Select 1 random quote to update
        const randomIndex = Math.floor(Math.random() * prevQuotes.length);
        const updated = [...prevQuotes];
        const target = { ...updated[randomIndex] };

        const deltaPercent = (Math.random() * 0.4 - 0.2); // -0.2% to +0.2%
        const oldPrice = target.price;
        const newPrice = Number(Math.max(1, oldPrice + (oldPrice * (deltaPercent / 100))).toFixed(2));
        const direction = newPrice >= oldPrice ? 'up' : 'down';

        target.price = newPrice;
        target.change = Number((target.change + (newPrice - oldPrice)).toFixed(2));
        target.changePercent = Number(((target.change / (newPrice - target.change || 1)) * 100).toFixed(2));

        updated[randomIndex] = target;

        // Trigger flash effect
        setFlashStatus(prev => ({ ...prev, [target.symbol]: direction }));
        setTimeout(() => {
          setFlashStatus(prev => {
            const next = { ...prev };
            delete next[target.symbol];
            return next;
          });
        }, 1200);

        return updated;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  if (quotes.length === 0) return null;

  // Duplicate list to create seamless infinite scrolling marquee track
  const marqueeItems = [...quotes, ...quotes, ...quotes];

  return (
    <div 
      className="w-full bg-gray-950 text-white border-b border-gray-800 py-2.5 px-3 overflow-hidden shadow-md flex items-center relative select-none group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {/* Fixed Left Badge: Live Market Indicator */}
      <div className="z-20 flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1 rounded-lg text-xs font-bold text-gray-200 shadow-sm shrink-0 mr-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 ${isHovered ? 'opacity-0' : 'opacity-75'}`}></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="uppercase tracking-wider text-[10px] text-gray-300 font-extrabold hidden sm:inline">LIVE MARKETS</span>
        {isHovered && (
          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold ml-1">
            PAUSED
          </span>
        )}
      </div>

      {/* Marquee Track Wrapper */}
      <div className="flex-1 overflow-hidden relative">
        <div 
          className="flex items-center space-x-6 animate-ticker whitespace-nowrap"
          style={{ animationPlayState: isHovered ? 'paused' : 'running' }}
        >
          {marqueeItems.map((item, idx) => {
            const isPositive = item.change >= 0;
            const flash = !isHovered && flashStatus[item.symbol];
            const marketWatchUrl = getMarketWatchUrl(item.symbol);

            return (
              <a
                key={`${item.symbol}-${idx}`}
                href={marketWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg transition-all duration-300 cursor-pointer ${
                  flash === 'up'
                    ? 'bg-emerald-900/60 ring-2 ring-emerald-400 scale-105'
                    : flash === 'down'
                    ? 'bg-red-900/60 ring-2 ring-red-400 scale-105'
                    : 'bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-gray-600'
                }`}
                title={`View ${item.symbol} market details on MarketWatch (opens in new window)`}
              >
                {/* Symbol Tag */}
                <span className={`text-xs font-black tracking-tight flex items-center gap-1 ${item.isIndex ? 'text-amber-400' : 'text-blue-400'}`}>
                  {item.symbol}
                  <svg className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </span>

                {/* Price */}
                <span className="text-xs font-bold text-gray-100 font-mono">
                  ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>

                {/* Percentage Change Badge */}
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                    isPositive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {isPositive ? '▲ +' : '▼ '}
                  {Math.abs(item.changePercent).toFixed(2)}%
                </span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Fixed Right Profile Settings Shortcut */}
      <button
        onClick={onOpenProfile}
        className="z-20 shrink-0 ml-3 bg-brand-primary/20 hover:bg-brand-primary/40 text-brand-light border border-brand-primary/40 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5"
        title="Manage saved ticker symbols in profile"
      >
        <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="hidden md:inline">Profile Tickers</span>
      </button>

      {/* Marquee Animation Styles */}
      <style>{`
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333333%);
          }
        }
        .animate-ticker {
          display: flex;
          width: max-content;
          animation: ticker-scroll 32s linear infinite;
        }
        .group:hover .animate-ticker {
          animation-play-state: paused !important;
        }
      `}</style>
    </div>
  );
};

export default StockTickerBanner;
