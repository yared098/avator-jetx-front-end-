

import { useState, useEffect, useCallback, useRef } from "react";
import GameScene from "./GameScene";
import { socket, socketEvents } from "./socket";
import { AppProvider, useTheme, useLanguage } from "./Providers.jsx";

function AviatorGame() {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const { lang, setLang, t } = useLanguage();

  const [multiplier, setMultiplier] = useState(1.0);
  const [gameState, setGameState] = useState("WAITING");
  const [balance, setBalance] = useState(3000.00);
  const [history, setHistory] = useState([]);
  const [isBetPlaced, setIsBetPlaced] = useState(false);
  const [liveBets, setLiveBets] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [maxCountdown, setMaxCountdown] = useState(10);
  const [currentBetAmount, setCurrentBetAmount] = useState(0);
  
  const [autoStopValue, setAutoStopValue] = useState(2.0);
  const [isAutoStopEnabled, setIsAutoStopEnabled] = useState(false);

  const autoCashoutRef = useRef({ enabled: false, value: 2.0 });
  useEffect(() => {
    autoCashoutRef.current = { enabled: isAutoStopEnabled, value: autoStopValue };
  }, [isAutoStopEnabled, autoStopValue]);

  const handleCashOut = useCallback(() => {
    socketEvents.requestCashout();
  }, []);

  const handlePlaceBet = (amount) => {
    if (gameState === "WAITING" && balance >= amount && !isBetPlaced) {
      socketEvents.placeBet(amount);
      setBalance(prev => prev - amount);
      setCurrentBetAmount(amount);
      setIsBetPlaced(true);
    }
  };

  useEffect(() => {
    socket.on("initial_sync", (data) => {
      setGameState(data.state);
      setHistory(data.history || []);
      setMultiplier(Number(data.multiplier) || 1.0);
    });

    socket.on("tick", (data) => {
      const newMult = Number(data.multiplier);
      setMultiplier(newMult);
      setGameState("FLYING");
      if (isBetPlaced && autoCashoutRef.current.enabled && newMult >= autoCashoutRef.current.value) {
        handleCashOut();
      }
    });

    socket.on("game_crash", (data) => {
      setMultiplier(Number(data.multiplier));
      setGameState("CRASHED");
      setHistory(data.history || []);
      setIsBetPlaced(false);
      setCountdown(0);
    });

    socket.on("game_status", (data) => {
      setGameState(data.state);
      if (data.state === "WAITING") {
        setMultiplier(1.0);
        setIsBetPlaced(false);
        setLiveBets([]);
        const time = Number(data.countdown) || 10;
        setCountdown(time);
        setMaxCountdown(time);
      }
    });

    socket.on("bet_update", (newBet) => {
      setLiveBets(prev => [newBet, ...prev]);
    });

    socket.on("player_won", (data) => {
      setLiveBets(prev => prev.map(bet =>
        bet.id === data.id ? { ...bet, won: true, winMultiplier: data.multiplier } : bet
      ));
    });

    socket.on("cashout_ok", (data) => {
      setBalance(b => b + parseFloat(data.win));
      setIsBetPlaced(false);
    });

    return () => socket.removeAllListeners();
  }, [isBetPlaced, handleCashOut]);

  useEffect(() => {
    let timer;
    if (gameState === "WAITING" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 0.05));
      }, 50);
    }
    return () => clearInterval(timer);
  }, [gameState, countdown]);

  return (
    <div className={`flex flex-col h-screen w-screen font-sans overflow-hidden select-none transition-colors duration-500 ${isDarkMode ? 'bg-[#060608] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* HEADER */}
      <nav className={`h-[50px] md:h-[60px] flex justify-between items-center px-2 md:px-4 shrink-0 border-b z-50 transition-colors ${isDarkMode ? 'bg-[#0f1014] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-rose-600 rounded flex items-center justify-center">
              <span className="font-black text-white italic text-base">A</span>
            </div>
            <span className="hidden sm:block font-black text-xs tracking-widest text-rose-500 uppercase">Aviator</span>
          </div>

          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
            className={`text-[10px] p-1 rounded border bg-transparent font-bold outline-none cursor-pointer ${isDarkMode ? 'text-white border-white/10' : 'text-slate-800 border-slate-200'}`}
          >
            <option value="en">EN</option>
            <option value="am">አማ</option>
            <option value="ti">ትግር</option>
            <option value="or">ORO</option>
          </select>

          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-sm">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className={`px-2 py-1 rounded-lg border flex flex-col items-end ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
          <span className="text-[6px] font-black text-slate-400 uppercase">{t.wallet}</span>
          <span className="text-[10px] md:text-sm font-black text-green-500">
            {balance.toFixed(2)} <span className="text-[8px]">ETB</span>
          </span>
        </div>
      </nav>

      <div className="flex flex-row flex-1 overflow-hidden">
        
        {/* LEFT SIDEBAR: LIVE BETS */}
        <aside className={`w-[70px] xs:w-[95px] md:w-64 border-r flex flex-col overflow-hidden shrink-0 transition-colors ${isDarkMode ? 'bg-[#0b0c10] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="p-2 border-b border-white/5 bg-black/20">
            <span className="text-[8px] md:text-[10px] font-black text-rose-500 uppercase">{t.liveBets}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-1 space-y-1 no-scrollbar">
            {liveBets.map((bet, i) => (
              <div key={i} className={`p-1 md:p-2 rounded border text-[8px] md:text-[11px] ${bet.won ? 'bg-green-500/10 border-green-500/20' : (isDarkMode ? 'bg-white/5 border-transparent' : 'bg-slate-50')}`}>
                <div className="font-bold truncate">{bet.amount} <span className="opacity-50 text-[6px]">ETB</span></div>
                {bet.won && <div className="text-green-500 font-black">{bet.winMultiplier}x</div>}
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER: MAIN GAME AREA */}
        <div className="flex flex-col flex-1 p-1 md:p-4 gap-2 overflow-hidden">
          <div className={`relative flex-1 rounded-xl md:rounded-[2.5rem] overflow-hidden border transition-colors ${isDarkMode ? 'bg-[#030305] border-white/5' : 'bg-white border-slate-200'}`}>
            
            <GameScene multiplier={multiplier} isCrashed={gameState === "CRASHED"} gameState={gameState} showPath={true} theme={isDarkMode ? 'dark' : 'light'} />

            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black z-10 tabular-nums text-center transition-transform ${gameState === "CRASHED" ? 'text-rose-600 scale-110' : (isDarkMode ? 'text-white' : 'text-slate-900')}`}>
              <div className="text-4xl md:text-8xl lg:text-9xl tracking-tighter">
                {multiplier.toFixed(2)}x
              </div>
            </div>

            {gameState === "WAITING" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 backdrop-blur-sm bg-black/40">
                <div className="text-3xl md:text-6xl font-black text-white italic mb-2">{Math.ceil(countdown)}s</div>
                <div className="w-32 md:w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-600" style={{ width: `${(countdown / maxCountdown) * 100}%` }} />
                </div>
              </div>
            )}
          </div>

          <BetPanel
            isDarkMode={isDarkMode}
            gameState={gameState}
            isBetPlaced={isBetPlaced}
            multiplier={multiplier}
            currentBetAmount={currentBetAmount}
            onBet={handlePlaceBet}
            onCashOut={handleCashOut}
            autoStopValue={autoStopValue}
            setAutoStopValue={setAutoStopValue}
            isAutoStopEnabled={isAutoStopEnabled}
            setIsAutoStopEnabled={setIsAutoStopEnabled}
            t={t}
          />
        </div>

        {/* RIGHT SIDEBAR: HISTORY */}
        <aside className={`w-[60px] md:w-48 border-l flex flex-col shrink-0 transition-colors ${isDarkMode ? 'bg-[#0b0c10] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="p-2 border-b border-white/5 bg-black/20">
            <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase">{t.history}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-1 space-y-1 no-scrollbar">
            {history.map((h, i) => (
              <div key={i} className={`p-1 md:p-2 rounded border text-center transition-colors ${isDarkMode ? 'bg-white/5 border-transparent' : 'bg-slate-50'}`}>
                <span className={`font-black text-[9px] md:text-xs tabular-nums ${Number(h) < 2 ? 'text-blue-500' : 'text-fuchsia-500'}`}>
                  {Number(h).toFixed(2)}x
                </span>
              </div>
            ))}
          </div>
        </aside>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AviatorGame />
    </AppProvider>
  );
}

function BetPanel({
  isDarkMode, gameState, isBetPlaced, multiplier, currentBetAmount, onBet, onCashOut,
  autoStopValue, setAutoStopValue, isAutoStopEnabled, setIsAutoStopEnabled, t
}) {
  const [amount, setAmount] = useState(10.0);
  const liveWinnings = (currentBetAmount * multiplier).toFixed(2);

  return (
    <div className={`rounded-xl md:rounded-3xl p-2 md:p-4 border shadow-xl transition-colors ${isDarkMode ? 'bg-[#0f1014] border-white/5' : 'bg-white border-slate-200'}`}>
      <div className="flex flex-col xs:flex-row gap-2 md:gap-4">
        <div className="flex flex-col gap-2 flex-1">
          {/* STAKE CONTROL + QUICK BETS */}
          <div className={`p-2 rounded-lg border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100'}`}>
            <div className="flex justify-between items-center mb-2 px-1">
              <button onClick={() => setAmount(Math.max(1, amount - 10))} className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-rose-500 font-bold">-</button>
              <span className="text-xs md:text-lg font-black">{amount} <span className="text-[8px] opacity-40">ETB</span></span>
              <button onClick={() => setAmount(amount + 10)} className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-green-500 font-bold">+</button>
            </div>
            {/* Quick Bet Buttons Re-added */}
            <div className="grid grid-cols-4 gap-1">
              {[10, 50, 100, 500].map(val => (
                <button 
                  key={val} 
                  onClick={() => setAmount(val)} 
                  className={`py-1 rounded text-[8px] font-black transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-white border border-slate-200 text-slate-600'}`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* AUTO OPTIONS */}
          <div className="flex items-center justify-between px-1">
             <span className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase">{t.autoOut}</span>
             <input 
               type="number" 
               step="0.1"
               value={autoStopValue} 
               onChange={(e) => setAutoStopValue(parseFloat(e.target.value) || 1.1)}
               className={`w-12 text-center font-black text-amber-500 text-xs focus:outline-none rounded ${isDarkMode ? 'bg-black/40' : 'bg-white border border-slate-200'}`}
             />
             <button 
               onClick={() => setIsAutoStopEnabled(!isAutoStopEnabled)}
               className={`w-8 h-4 rounded-full transition-all ${isAutoStopEnabled ? 'bg-green-600' : 'bg-slate-500'}`}
             >
               <div className={`w-3 h-3 bg-white rounded-full m-0.5 transition-transform ${isAutoStopEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
             </button>
          </div>
        </div>

        {/* ACTION BUTTON */}
        <button
          disabled={(gameState !== "WAITING" && !isBetPlaced) || (gameState === "CRASHED")}
          onClick={() => isBetPlaced ? onCashOut() : onBet(amount)}
          className={`flex-[1.2] h-14 md:h-20 rounded-xl font-black transition-all active:scale-95 flex flex-col items-center justify-center shadow-lg ${isBetPlaced ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-black' : 'bg-gradient-to-b from-green-500 to-green-700 text-white'} disabled:opacity-20`}
        >
          <span className="text-[8px] md:text-[10px] uppercase tracking-tighter mb-1">
            {isBetPlaced ? (gameState === "FLYING" ? t.cashOut : t.wait) : t.bet}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-sm md:text-3xl font-black">{isBetPlaced ? liveWinnings : amount}</span>
            <span className="text-[8px] opacity-60">ETB</span>
          </div>
        </button>
      </div>
    </div>
  );
}