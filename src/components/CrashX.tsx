import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const GAME_API = "https://functions.poehali.dev/64bf4a3e-c7fb-44f5-a1a9-b70cae660400";
const MIN_BET_USDT = 1;
const MIN_BET_STARS = 5;
const QUICK_BETS_USDT = [1, 5, 10, 50];
const QUICK_BETS_STARS = [5, 25, 50, 100];

type Cur = "usdt" | "stars";
type Phase = "loading" | "waiting" | "flying" | "crashed" | "cashedOut";

async function apiBalance(userId: string, action: "bet" | "win", amount: number, currency: Cur) {
  try {
    const res = await fetch(GAME_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, action, amount, currency }),
    });
    return await res.json();
  } catch { return null; }
}

interface Props {
  onClose: () => void;
  userId: string;
  usdtBalance: number;
  starsBalance: number;
  onBalanceChange: (c: Cur, d: number) => void;
  onRefreshBalance: () => void;
  initialCurrency: Cur;
}

function generateCrashPoint(): number {
  const r = Math.random();
  if (r < 0.35) return +(1 + Math.random() * 0.5).toFixed(2);
  if (r < 0.6) return +(1.5 + Math.random() * 1.5).toFixed(2);
  if (r < 0.8) return +(3 + Math.random() * 5).toFixed(2);
  if (r < 0.95) return +(8 + Math.random() * 15).toFixed(2);
  return +(23 + Math.random() * 80).toFixed(2);
}

function generateHistory(): number[] {
  return Array.from({ length: 30 }, () => generateCrashPoint());
}

export default function CrashX({ onClose, userId, usdtBalance, starsBalance, onBalanceChange, onRefreshBalance, initialCurrency }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [loadProg, setLoadProg] = useState(0);
  const [cur, setCur] = useState<Cur>(initialCurrency);
  const [betInput, setBetInput] = useState(initialCurrency === "usdt" ? "1" : "5");
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [history, setHistory] = useState<number[]>(generateHistory);
  const [autoBet, setAutoBet] = useState(false);
  const [autoCashOut, setAutoCashOut] = useState(false);
  const [autoCashOutVal, setAutoCashOutVal] = useState("2.00");
  const [betPlaced, setBetPlaced] = useState(0);
  const [graphPoints, setGraphPoints] = useState<{x:number;y:number}[]>([]);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const crashRef = useRef(0);
  const cashedOutRef = useRef(false);
  const autoCashRef = useRef(false);
  const autoValRef = useRef(2);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const bal = cur === "usdt" ? usdtBalance : starsBalance;
  const betVal = parseFloat(betInput) || 0;
  const sym = cur === "usdt" ? "$" : "★";
  const minBet = cur === "usdt" ? MIN_BET_USDT : MIN_BET_STARS;
  const quickBets = cur === "usdt" ? QUICK_BETS_USDT : QUICK_BETS_STARS;

  useEffect(() => {
    autoCashRef.current = autoCashOut;
    autoValRef.current = parseFloat(autoCashOutVal) || 2;
  }, [autoCashOut, autoCashOutVal]);

  useEffect(() => {
    if (phase !== "loading") return;
    const t = setInterval(() => {
      setLoadProg(p => {
        if (p >= 100) { clearInterval(t); setTimeout(() => setPhase("waiting"), 200); return 100; }
        return p + Math.random() * 12 + 4;
      });
    }, 50);
    return () => clearInterval(t);
  }, [phase]);

  const animateFlight = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const m = 1 + Math.pow(elapsed * 0.4, 1.7);
    const currentMult = +m.toFixed(2);

    if (currentMult >= crashRef.current) {
      setMultiplier(crashRef.current);
      if (!cashedOutRef.current) {
        setPhase("crashed");
        setHistory(prev => [crashRef.current, ...prev.slice(0, 29)]);
        onRefreshBalance();
        if (autoBet) {
          waitTimerRef.current = setTimeout(() => placeBet(), 2000);
        }
      }
      return;
    }

    if (autoCashRef.current && currentMult >= autoValRef.current && !cashedOutRef.current) {
      cashedOutRef.current = true;
      const winnings = betPlaced * autoValRef.current;
      apiBalance(userId, "win", winnings, cur).then(() => onRefreshBalance());
      onBalanceChange(cur, winnings);
      setMultiplier(autoValRef.current);
      setPhase("cashedOut");
      setHistory(prev => [crashRef.current, ...prev.slice(0, 29)]);
      return;
    }

    setMultiplier(currentMult);
    setGraphPoints(prev => [...prev, { x: elapsed, y: currentMult }]);
    animRef.current = requestAnimationFrame(animateFlight);
  }, [autoBet, betPlaced, cur, onBalanceChange, onRefreshBalance, userId]);

  const startFlight = useCallback(() => {
    const cp = generateCrashPoint();
    crashRef.current = cp;
    setCrashPoint(cp);
    cashedOutRef.current = false;
    startTimeRef.current = Date.now();
    setMultiplier(1.0);
    setGraphPoints([]);
    setPhase("flying");
    animRef.current = requestAnimationFrame(animateFlight);
  }, [animateFlight]);

  const placeBet = useCallback(async () => {
    const bv = parseFloat(betInput) || 0;
    const b = cur === "usdt" ? usdtBalance : starsBalance;
    const mb = cur === "usdt" ? MIN_BET_USDT : MIN_BET_STARS;
    if (bv < mb || bv > b) return;
    const res = await apiBalance(userId, "bet", bv, cur);
    if (!res || !res.ok) return;
    onBalanceChange(cur, -bv);
    setBetPlaced(bv);
    setTimeout(() => startFlight(), 1500 + Math.random() * 1500);
    setPhase("waiting");
  }, [betInput, cur, usdtBalance, starsBalance, userId, onBalanceChange, startFlight]);

  const cashOut = useCallback(async () => {
    if (phase !== "flying" || cashedOutRef.current) return;
    cashedOutRef.current = true;
    cancelAnimationFrame(animRef.current);
    const winnings = +(betPlaced * multiplier).toFixed(2);
    await apiBalance(userId, "win", winnings, cur);
    onBalanceChange(cur, winnings);
    onRefreshBalance();
    setPhase("cashedOut");
    setHistory(prev => [crashRef.current, ...prev.slice(0, 29)]);
  }, [phase, betPlaced, multiplier, cur, userId, onBalanceChange, onRefreshBalance]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    };
  }, []);

  const renderGraph = () => {
    const w = 340;
    const h = 180;
    if (graphPoints.length < 2) return null;
    const maxX = Math.max(...graphPoints.map(p => p.x), 3);
    const maxY = Math.max(...graphPoints.map(p => p.y), 2);
    const pts = graphPoints.map(p => `${(p.x / maxX) * w},${h - ((p.y - 1) / (maxY - 1)) * h}`).join(" ");
    const lastPt = graphPoints[graphPoints.length - 1];
    const lx = (lastPt.x / maxX) * w;
    const ly = h - ((lastPt.y - 1) / (maxY - 1)) * h;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        <defs>
          <linearGradient id="crashLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="crashFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,${h} ${pts} ${lx},${h}`} fill="url(#crashFill)" />
        <polyline points={pts} fill="none" stroke="url(#crashLine)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lx} cy={ly} r="5" fill="#06b6d4" />
      </svg>
    );
  };

  if (phase === "loading") {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-green-400 font-bold text-xl tracking-wide">CRASH X</span>
          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all" style={{ width: `${Math.min(loadProg, 100)}%` }} />
          </div>
        </div>
      </div>
    );
  }

  const isActive = phase === "flying";
  const isCrashed = phase === "crashed";
  const isCashedOut = phase === "cashedOut";
  const isWaiting = phase === "waiting" && betPlaced > 0;
  const canBet = phase === "waiting" && betPlaced === 0;

  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0a1a] flex flex-col overflow-auto">
      <div className="flex items-center justify-between px-4 py-3 bg-[#0f0f2a] border-b border-white/5">
        <button onClick={onClose} className="flex items-center gap-1.5 text-white/70">
          <Icon name="ChevronLeft" size={20} />
          <span className="text-sm">Назад</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs">{cur === "usdt" ? "USDT" : "STARS"}</span>
          <span className="text-white font-bold text-base">{bal.toFixed(2)} {sym}</span>
        </div>
        <button
          onClick={() => { setCur(c => c === "usdt" ? "stars" : "usdt"); setBetInput(cur === "usdt" ? "5" : "1"); }}
          className="bg-white/10 rounded-full px-3 py-1 text-xs text-white/70"
        >
          {cur === "usdt" ? "★ Stars" : "$ USDT"}
        </button>
      </div>

      <div className="px-4 pt-3">
        <h1 className="text-white font-extrabold text-xl tracking-wider text-center">CRASH X</h1>
      </div>

      <div className="px-4 py-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {history.slice(0, 15).map((h, i) => (
            <span
              key={i}
              className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                h < 2 ? "bg-red-500/20 text-red-400" : h < 5 ? "bg-purple-500/20 text-purple-400" : "bg-green-500/20 text-green-400"
              }`}
            >
              {h.toFixed(2)}x
            </span>
          ))}
        </div>
      </div>

      <div className="mx-4 rounded-2xl bg-[#12122e] border border-white/5 p-4 relative overflow-hidden" style={{ height: 220 }}>
        <div className="absolute inset-0 opacity-20">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute w-full border-t border-dashed border-white/10" style={{ top: `${(i + 1) * 16}%` }} />
          ))}
        </div>

        <div className="relative w-full h-full flex items-center justify-center">
          {(isActive || isCrashed || isCashedOut) && (
            <div className="absolute inset-0">
              {renderGraph()}
            </div>
          )}

          {isWaiting && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-white/50 text-sm">Ожидание раунда...</span>
            </div>
          )}

          {canBet && !isActive && !isCrashed && !isCashedOut && !isWaiting && (
            <div className="flex flex-col items-center gap-2">
              <Icon name="Rocket" size={40} className="text-purple-400" />
              <span className="text-white/40 text-sm">Сделай ставку</span>
            </div>
          )}

          <div className={`absolute top-4 left-4 text-left ${isCrashed ? 'text-red-500' : isCashedOut ? 'text-green-400' : 'text-white'}`}>
            <div className={`font-extrabold ${multiplier >= 10 ? 'text-4xl' : 'text-5xl'} leading-none tracking-tight`}>
              x{multiplier.toFixed(2)}
            </div>
            {isCrashed && <div className="text-red-400 text-sm font-bold mt-1">CRASHED</div>}
            {isCashedOut && <div className="text-green-400 text-sm font-bold mt-1">+{(betPlaced * multiplier).toFixed(2)} {sym}</div>}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setAutoBet(v => !v)}
              className={`w-10 h-5 rounded-full relative transition-colors ${autoBet ? 'bg-purple-500' : 'bg-white/10'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoBet ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-white/70 text-sm">Автоставка</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setAutoCashOut(v => !v)}
              className={`w-10 h-5 rounded-full relative transition-colors ${autoCashOut ? 'bg-purple-500' : 'bg-white/10'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoCashOut ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-white/70 text-sm">Автовывод</span>
          </label>

          {autoCashOut && (
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
              <span className="text-white/40 text-xs">x</span>
              <input
                type="number"
                value={autoCashOutVal}
                onChange={e => setAutoCashOutVal(e.target.value)}
                className="w-14 bg-transparent text-white text-sm font-bold text-center outline-none"
                step="0.1"
                min="1.1"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center bg-[#12122e] border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setBetInput(v => String(Math.max(minBet, (parseFloat(v) || 0) - (cur === "usdt" ? 1 : 5))))}
                className="px-3 py-3 text-white/50 hover:text-white active:scale-90 transition"
              >
                <Icon name="Minus" size={18} />
              </button>
              <input
                type="number"
                value={betInput}
                onChange={e => setBetInput(e.target.value)}
                className="flex-1 bg-transparent text-white text-center font-bold text-lg outline-none"
                min={minBet}
              />
              <button
                onClick={() => setBetInput(v => String(Math.min(bal, (parseFloat(v) || 0) + (cur === "usdt" ? 1 : 5))))}
                className="px-3 py-3 text-white/50 hover:text-white active:scale-90 transition"
              >
                <Icon name="Plus" size={18} />
              </button>
            </div>
            <div className="flex gap-1.5">
              {quickBets.map(q => (
                <button
                  key={q}
                  onClick={() => setBetInput(String(q))}
                  className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs font-bold hover:bg-white/10 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {canBet ? (
            <button
              onClick={placeBet}
              disabled={betVal < minBet || betVal > bal}
              className="w-[130px] rounded-xl bg-gradient-to-b from-purple-500 to-purple-700 text-white font-extrabold text-lg active:scale-[0.96] transition-transform disabled:opacity-40"
            >
              СТАВКА
            </button>
          ) : isActive ? (
            <button
              onClick={cashOut}
              className="w-[130px] rounded-xl bg-gradient-to-b from-green-400 to-green-600 text-black font-extrabold text-lg active:scale-[0.96] transition-transform animate-pulse"
            >
              ЗАБРАТЬ
              <div className="text-xs font-bold opacity-80">{(betPlaced * multiplier).toFixed(2)} {sym}</div>
            </button>
          ) : isCrashed ? (
            <button
              onClick={() => { setBetPlaced(0); setPhase("waiting"); }}
              className="w-[130px] rounded-xl bg-gradient-to-b from-red-500 to-red-700 text-white font-extrabold text-base active:scale-[0.96] transition-transform"
            >
              ПОВТОРИТЬ
            </button>
          ) : isCashedOut ? (
            <button
              onClick={() => { setBetPlaced(0); setPhase("waiting"); }}
              className="w-[130px] rounded-xl bg-gradient-to-b from-purple-500 to-purple-700 text-white font-extrabold text-base active:scale-[0.96] transition-transform"
            >
              ЕЩЁ РАЗ
            </button>
          ) : (
            <button
              disabled
              className="w-[130px] rounded-xl bg-white/5 text-white/30 font-extrabold text-base"
            >
              ЖДИТЕ...
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-3 mt-auto">
        <div className="flex items-center justify-between text-white/30 text-xs">
          <span>Мин. ставка: {minBet} {sym}</span>
          <span>Crash X — Turbo Games</span>
        </div>
      </div>
    </div>
  );
}
