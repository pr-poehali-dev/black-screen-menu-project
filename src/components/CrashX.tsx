import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const GAME_API = "https://functions.poehali.dev/64bf4a3e-c7fb-44f5-a1a9-b70cae660400";
const MIN_BET_USDT = 1;
const MIN_BET_STARS = 5;
const QUICK_BETS_USDT = [1, 5, 10, 50];
const QUICK_BETS_STARS = [5, 25, 50, 100];
const ROUND_WAIT = 5000;

type Cur = "usdt" | "stars";
type Phase = "loading" | "roundWait" | "flying" | "crashed" | "cashedOut";

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

function BetPanel({ cur, betInput, setBetInput, minBet, bal, quickBets, sym, isFlying, hasBet, cashOut, placeBet, betVal, isWaiting, currentWin }: {
  cur: Cur; betInput: string; setBetInput: (v: string) => void; minBet: number; bal: number; quickBets: number[]; sym: string;
  isFlying: boolean; hasBet: boolean; cashOut: () => void; placeBet: () => void; betVal: number;
  isWaiting: boolean; currentWin: number;
}) {
  const step = cur === "usdt" ? 1 : 5;
  return (
    <div className="bg-[#12122e] border border-purple-500/10 rounded-xl p-1.5">
      <div className="flex gap-1.5">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center bg-[#0c0c24] border border-white/10 rounded-lg overflow-hidden h-7">
            <button onClick={() => setBetInput(String(Math.max(minBet, +(parseFloat(betInput) || 0) - step)))} className="px-2 text-white/40 active:text-white transition shrink-0">
              <Icon name="Minus" size={12} />
            </button>
            <input type="number" value={betInput} onChange={e => setBetInput(e.target.value)} className="flex-1 bg-transparent text-white text-center font-bold text-xs outline-none min-w-0 [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden" min={minBet} />
            <button onClick={() => setBetInput(String(Math.min(bal, +(parseFloat(betInput) || 0) + step)))} className="px-2 text-white/40 active:text-white transition shrink-0">
              <Icon name="Plus" size={12} />
            </button>
          </div>
          <div className="flex gap-0.5">
            {quickBets.map(q => (
              <button key={q} onClick={() => setBetInput(String(q))} className="flex-1 py-0.5 rounded bg-white/5 border border-white/8 text-white/50 text-[9px] font-bold active:bg-white/10 transition">
                {q >= 1000 ? `${q / 1000}K` : q}
              </button>
            ))}
          </div>
        </div>
        {isFlying && hasBet ? (
          <button onClick={cashOut} className="w-16 shrink-0 self-stretch rounded-lg bg-gradient-to-b from-green-400 to-green-600 text-black font-extrabold text-[10px] active:scale-[0.96] transition-transform flex flex-col items-center justify-center">
            <span>ЗАБРАТЬ</span>
            <span className="text-[8px] font-bold opacity-80">{currentWin.toFixed(2)}{sym}</span>
          </button>
        ) : !hasBet ? (
          <button onClick={placeBet} disabled={betVal < minBet || betVal > bal} className="w-16 shrink-0 self-stretch rounded-lg bg-gradient-to-b from-purple-500 to-purple-700 text-white font-extrabold text-[10px] active:scale-[0.96] transition-transform disabled:opacity-40">
            СТАВКА
          </button>
        ) : (
          <button disabled className="w-16 shrink-0 self-stretch rounded-lg bg-white/5 text-white/20 font-bold text-[9px]">ЖДИТЕ...</button>
        )}
      </div>
    </div>
  );
}

export default function CrashX({ onClose, userId, usdtBalance, starsBalance, onBalanceChange, onRefreshBalance, initialCurrency }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [loadProg, setLoadProg] = useState(0);
  const [cur, setCur] = useState<Cur>(initialCurrency);
  const [betInput, setBetInput] = useState(initialCurrency === "usdt" ? "1" : "5");
  const [multiplier, setMultiplier] = useState(1.0);
  const [history, setHistory] = useState<number[]>(generateHistory);
  const [betPlaced, setBetPlaced] = useState(0);
  const [roundProgress, setRoundProgress] = useState(0);
  const [rocketPos, setRocketPos] = useState({ x: 0, y: 100 });
  const [flyAway, setFlyAway] = useState(false);
  const [currentWin, setCurrentWin] = useState(0);

  const animRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const crashRef = useRef(0);
  const cashedOutRef = useRef(false);
  const roundTimerRef = useRef<ReturnType<typeof setInterval>>();
  const betInputRef = useRef(betInput);

  const bal = cur === "usdt" ? usdtBalance : starsBalance;
  const betVal = parseFloat(betInput) || 0;
  const sym = cur === "usdt" ? "$" : "★";
  const minBet = cur === "usdt" ? MIN_BET_USDT : MIN_BET_STARS;
  const quickBets = cur === "usdt" ? QUICK_BETS_USDT : QUICK_BETS_STARS;

  useEffect(() => { betInputRef.current = betInput; }, [betInput]);

  useEffect(() => {
    if (phase !== "loading") return;
    const t = setInterval(() => {
      setLoadProg(p => {
        if (p >= 100) { clearInterval(t); setTimeout(() => startRoundWait(), 300); return 100; }
        return p + Math.random() * 12 + 4;
      });
    }, 50);
    return () => clearInterval(t);
  }, [phase]);

  const startRoundWait = useCallback(() => {
    setPhase("roundWait");
    setMultiplier(1.0);
    setRocketPos({ x: 0, y: 100 });
    setFlyAway(false);
    setCurrentWin(0);
    setRoundProgress(0);
    const start = Date.now();
    roundTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const prog = Math.min((elapsed / ROUND_WAIT) * 100, 100);
      setRoundProgress(prog);
      if (prog >= 100) {
        clearInterval(roundTimerRef.current);
        startFlight();
      }
    }, 50);
  }, []);

  const startFlight = useCallback(() => {
    const cp = generateCrashPoint();
    crashRef.current = cp;
    cashedOutRef.current = false;
    startTimeRef.current = Date.now();
    setMultiplier(1.0);
    setFlyAway(false);
    setRocketPos({ x: 0, y: 100 });
    setPhase("flying");

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const m = +(1 + elapsed * 0.15).toFixed(2);
      const xPct = Math.min((elapsed / 20) * 80, 80);
      const yPct = Math.max(100 - elapsed * 8, 10);
      setRocketPos({ x: xPct, y: yPct });

      if (m >= crashRef.current) {
        setMultiplier(crashRef.current);
        if (!cashedOutRef.current) {
          setFlyAway(true);
          setTimeout(() => {
            setPhase("crashed");
            setHistory(prev => [crashRef.current, ...prev.slice(0, 29)]);
            onRefreshBalance();
            setTimeout(() => {
              setBetPlaced(0);
              startRoundWait();
            }, 1200);
          }, 500);
        }
        return;
      }

      if (betPlaced > 0) setCurrentWin(+(betPlaced * m).toFixed(2));
      setMultiplier(m);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  }, [betPlaced, onRefreshBalance, startRoundWait]);

  const placeBet = useCallback(async () => {
    const bv = parseFloat(betInput) || 0;
    const b = cur === "usdt" ? usdtBalance : starsBalance;
    const mb = cur === "usdt" ? MIN_BET_USDT : MIN_BET_STARS;
    if (bv < mb || bv > b) return;
    const res = await apiBalance(userId, "bet", bv, cur);
    if (!res || !res.ok) return;
    onBalanceChange(cur, -bv);
    setBetPlaced(bv);
    setCurrentWin(0);
  }, [betInput, cur, usdtBalance, starsBalance, userId, onBalanceChange]);

  const cashOut = useCallback(async () => {
    if (phase !== "flying" || cashedOutRef.current || betPlaced <= 0) return;
    cashedOutRef.current = true;
    cancelAnimationFrame(animRef.current);
    const winnings = +(betPlaced * multiplier).toFixed(2);
    setCurrentWin(winnings);
    await apiBalance(userId, "win", winnings, cur);
    onBalanceChange(cur, winnings);
    onRefreshBalance();
    setPhase("cashedOut");
    setHistory(prev => [crashRef.current, ...prev.slice(0, 29)]);
    setTimeout(() => {
      setBetPlaced(0);
      startRoundWait();
    }, 1500);
  }, [phase, betPlaced, multiplier, cur, userId, onBalanceChange, onRefreshBalance, startRoundWait]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    };
  }, []);

  const onNewRound = useCallback(() => { setBetPlaced(0); startRoundWait(); }, [startRoundWait]);

  const renderGraph = () => {
    const w = 360;
    const h = 180;
    const px = (rocketPos.x / 100) * w;
    const py = (rocketPos.y / 100) * h;
    const isCrashedOrAway = phase === "crashed" || flyAway;

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1="0" y1={h * f} x2={w} y2={h * f} stroke="white" strokeOpacity="0.04" strokeDasharray="3 3" />
        ))}
        {!isCrashedOrAway && (
          <>
            <polygon points={`0,${h} 0,${py} ${px},${py} ${px},${h}`} fill="url(#fillGrad)" />
            <path d={`M 0 ${h} Q ${px * 0.3} ${h - (h - py) * 0.2} ${px} ${py}`} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)" />
          </>
        )}
        {isCrashedOrAway ? (
          <g style={{ transform: `translate(${w + 40}px, -60px)` }}>
            <text x="0" y="0" fontSize="24" textAnchor="middle">🚀</text>
          </g>
        ) : (
          <g style={{ transform: `translate(${px}px, ${py - 14}px)` }}>
            <text x="0" y="0" fontSize="24" textAnchor="middle" style={{ filter: "drop-shadow(0 0 6px rgba(74,222,128,0.5))" }}>🚀</text>
          </g>
        )}
      </svg>
    );
  };

  if (phase === "loading") {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-green-400 font-extrabold text-xl tracking-widest">CRASH X</span>
          <div className="w-44 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-green-400 rounded-full transition-all" style={{ width: `${Math.min(loadProg, 100)}%` }} />
          </div>
        </div>
      </div>
    );
  }

  const isFlying = phase === "flying";
  const isCrashed = phase === "crashed";
  const isCashedOut = phase === "cashedOut";
  const isWaiting = phase === "roundWait";
  const hasBet = betPlaced > 0;

  const panelProps = { cur, betInput, setBetInput, minBet, bal, quickBets, sym, isFlying, hasBet, cashOut, placeBet, betVal, isWaiting, currentWin };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
    </div>
  );
}