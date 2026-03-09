import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const GAME_API = "https://functions.poehali.dev/64bf4a3e-c7fb-44f5-a1a9-b70cae660400";
const MIN_BET_USDT = 1;
const MIN_BET_STARS = 5;
const QUICK_BETS_USDT = [1, 5, 10, 50];
const QUICK_BETS_STARS = [5, 25, 50, 100];
const ROUND_WAIT = 5000;
const JETPACK_GUY = "https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/files/dd353e14-25fa-4b18-9651-4e5f9d732b31.jpg";

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

function BetPanel({ betInput, setBetInput, minBet, bal, quickBets, sym, isFlying, hasBet, cashOut, placeBet, betVal, currentWin, step }: {
  betInput: string; setBetInput: (v: string) => void; minBet: number; bal: number; quickBets: number[]; sym: string;
  isFlying: boolean; hasBet: boolean; cashOut: () => void; placeBet: () => void; betVal: number;
  currentWin: number; step: number;
}) {
  const [autoCashout, setAutoCashout] = useState("2.00");
  const potentialWin = hasBet ? currentWin : 0;

  return (
    <div className="bg-[#1e1b3a] border border-[#2d2755] rounded-2xl p-3 space-y-2.5">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <div className="w-8 h-4 bg-[#2d2755] rounded-full relative">
            <div className="w-3.5 h-3.5 bg-[#4a4570] rounded-full absolute top-0.5 left-0.5" />
          </div>
          <span className="text-white/60 text-xs font-medium">Автоставка</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <div className="w-8 h-4 bg-[#2d2755] rounded-full relative">
            <div className="w-3.5 h-3.5 bg-[#4a4570] rounded-full absolute top-0.5 left-0.5" />
          </div>
          <span className="text-white/60 text-xs font-medium">Автовывод</span>
        </label>
        <div className="ml-auto flex items-center bg-[#2d2755] rounded-lg px-2.5 py-1.5">
          <span className="text-white/40 text-xs mr-1">x</span>
          <input
            type="text"
            value={autoCashout}
            onChange={e => setAutoCashout(e.target.value)}
            className="bg-transparent text-white font-bold text-sm w-10 outline-none text-center"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center bg-[#13112a] border border-[#2d2755] rounded-xl overflow-hidden h-12">
            <button
              onClick={() => setBetInput(String(Math.max(minBet, +(parseFloat(betInput) || 0) - step)))}
              className="w-12 h-full flex items-center justify-center text-white/50 active:text-white transition border-r border-[#2d2755]"
            >
              <Icon name="Minus" size={18} />
            </button>
            <input
              type="number"
              value={betInput}
              onChange={e => setBetInput(e.target.value)}
              className="flex-1 bg-transparent text-white text-center font-extrabold text-xl outline-none min-w-0 [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
              min={minBet}
            />
            <button
              onClick={() => setBetInput(String(Math.min(bal, +(parseFloat(betInput) || 0) + step)))}
              className="w-12 h-full flex items-center justify-center text-white/50 active:text-white transition border-l border-[#2d2755]"
            >
              <Icon name="Plus" size={18} />
            </button>
          </div>
          <div className="flex gap-1.5">
            {quickBets.map(q => (
              <button
                key={q}
                onClick={() => setBetInput(String(q))}
                className="flex-1 py-1.5 rounded-lg bg-[#2d2755] text-white/60 text-xs font-bold active:bg-[#3d3775] transition"
              >
                {q >= 1000 ? `${q / 1000}K` : q}
              </button>
            ))}
          </div>
        </div>
        {isFlying && hasBet ? (
          <button
            onClick={cashOut}
            className="w-[120px] shrink-0 rounded-xl bg-gradient-to-b from-green-400 to-green-600 text-black font-extrabold text-lg active:scale-[0.97] transition-transform flex flex-col items-center justify-center shadow-lg shadow-green-500/20"
          >
            <span>ЗАБРАТЬ</span>
            <span className="text-sm font-bold opacity-80">{potentialWin.toFixed(2)}{sym}</span>
          </button>
        ) : !hasBet ? (
          <button
            onClick={placeBet}
            disabled={betVal < minBet || betVal > bal}
            className="w-[120px] shrink-0 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#c026d3] text-white font-extrabold text-lg active:scale-[0.97] transition-transform disabled:opacity-40 shadow-lg shadow-purple-500/20"
          >
            СТАВКА
          </button>
        ) : (
          <button
            onClick={cashOut}
            className="w-[120px] shrink-0 rounded-xl bg-gradient-to-b from-green-400 to-green-600 text-black font-extrabold text-lg active:scale-[0.97] transition-transform flex flex-col items-center justify-center shadow-lg shadow-green-500/20"
          >
            <span>ЗАБРАТЬ</span>
            <span className="text-sm font-bold opacity-80">{potentialWin.toFixed(2)}{sym}</span>
          </button>
        )}
      </div>
      <div className="h-1 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#c026d3] opacity-60" />
    </div>
  );
}

export default function CrashX({ onClose, userId, usdtBalance, starsBalance, onBalanceChange, onRefreshBalance, initialCurrency }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [loadProg, setLoadProg] = useState(0);
  const [cur, setCur] = useState<Cur>(initialCurrency);
  const [betInput1, setBetInput1] = useState(initialCurrency === "usdt" ? "1" : "5");
  const [betInput2, setBetInput2] = useState(initialCurrency === "usdt" ? "1" : "5");
  const [multiplier, setMultiplier] = useState(1.0);
  const [history, setHistory] = useState<number[]>(generateHistory);
  const [bet1Placed, setBet1Placed] = useState(0);
  const [bet2Placed, setBet2Placed] = useState(0);
  const [roundProgress, setRoundProgress] = useState(0);
  const [rocketPos, setRocketPos] = useState({ x: 0, y: 100 });
  const [flyAway, setFlyAway] = useState(false);
  const [currentWin1, setCurrentWin1] = useState(0);
  const [currentWin2, setCurrentWin2] = useState(0);

  const animRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const crashRef = useRef(0);
  const cashedOut1Ref = useRef(false);
  const cashedOut2Ref = useRef(false);
  const roundTimerRef = useRef<ReturnType<typeof setInterval>>();

  const bal = cur === "usdt" ? usdtBalance : starsBalance;
  const betVal1 = parseFloat(betInput1) || 0;
  const betVal2 = parseFloat(betInput2) || 0;
  const sym = cur === "usdt" ? "$" : "★";
  const minBet = cur === "usdt" ? MIN_BET_USDT : MIN_BET_STARS;
  const quickBets = cur === "usdt" ? QUICK_BETS_USDT : QUICK_BETS_STARS;
  const step = cur === "usdt" ? 1 : 5;

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
    setCurrentWin1(0);
    setCurrentWin2(0);
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
    cashedOut1Ref.current = false;
    cashedOut2Ref.current = false;
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
        if (!cashedOut1Ref.current && !cashedOut2Ref.current) {
          setFlyAway(true);
          setTimeout(() => {
            setPhase("crashed");
            setHistory(prev => [crashRef.current, ...prev.slice(0, 29)]);
            onRefreshBalance();
            setTimeout(() => {
              setBet1Placed(0);
              setBet2Placed(0);
              startRoundWait();
            }, 1200);
          }, 500);
        } else {
          setFlyAway(true);
          setTimeout(() => {
            setPhase("crashed");
            setHistory(prev => [crashRef.current, ...prev.slice(0, 29)]);
            onRefreshBalance();
            setTimeout(() => {
              setBet1Placed(0);
              setBet2Placed(0);
              startRoundWait();
            }, 1200);
          }, 500);
        }
        return;
      }

      setBet1Placed(prev => { if (prev > 0 && !cashedOut1Ref.current) setCurrentWin1(+(prev * m).toFixed(2)); return prev; });
      setBet2Placed(prev => { if (prev > 0 && !cashedOut2Ref.current) setCurrentWin2(+(prev * m).toFixed(2)); return prev; });
      setMultiplier(m);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  }, [onRefreshBalance, startRoundWait]);

  const placeBet1 = useCallback(async () => {
    const bv = parseFloat(betInput1) || 0;
    const b = cur === "usdt" ? usdtBalance : starsBalance;
    const mb = cur === "usdt" ? MIN_BET_USDT : MIN_BET_STARS;
    if (bv < mb || bv > b) return;
    const res = await apiBalance(userId, "bet", bv, cur);
    if (!res || !res.ok) return;
    onBalanceChange(cur, -bv);
    setBet1Placed(bv);
    setCurrentWin1(0);
  }, [betInput1, cur, usdtBalance, starsBalance, userId, onBalanceChange]);

  const placeBet2 = useCallback(async () => {
    const bv = parseFloat(betInput2) || 0;
    const b = cur === "usdt" ? usdtBalance : starsBalance;
    const mb = cur === "usdt" ? MIN_BET_USDT : MIN_BET_STARS;
    if (bv < mb || bv > b) return;
    const res = await apiBalance(userId, "bet", bv, cur);
    if (!res || !res.ok) return;
    onBalanceChange(cur, -bv);
    setBet2Placed(bv);
    setCurrentWin2(0);
  }, [betInput2, cur, usdtBalance, starsBalance, userId, onBalanceChange]);

  const cashOut1 = useCallback(async () => {
    if (phase !== "flying" || cashedOut1Ref.current || bet1Placed <= 0) return;
    cashedOut1Ref.current = true;
    const winnings = +(bet1Placed * multiplier).toFixed(2);
    setCurrentWin1(winnings);
    await apiBalance(userId, "win", winnings, cur);
    onBalanceChange(cur, winnings);
    onRefreshBalance();
    if (cashedOut2Ref.current || bet2Placed <= 0) {
      setPhase("cashedOut");
      setHistory(prev => [crashRef.current, ...prev.slice(0, 29)]);
    }
  }, [phase, bet1Placed, bet2Placed, multiplier, cur, userId, onBalanceChange, onRefreshBalance]);

  const cashOut2 = useCallback(async () => {
    if (phase !== "flying" || cashedOut2Ref.current || bet2Placed <= 0) return;
    cashedOut2Ref.current = true;
    const winnings = +(bet2Placed * multiplier).toFixed(2);
    setCurrentWin2(winnings);
    await apiBalance(userId, "win", winnings, cur);
    onBalanceChange(cur, winnings);
    onRefreshBalance();
    if (cashedOut1Ref.current || bet1Placed <= 0) {
      setPhase("cashedOut");
      setHistory(prev => [crashRef.current, ...prev.slice(0, 29)]);
    }
  }, [phase, bet1Placed, bet2Placed, multiplier, cur, userId, onBalanceChange, onRefreshBalance]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    };
  }, []);

  const renderGraph = () => {
    const w = 360;
    const h = 200;
    const px = (rocketPos.x / 100) * w;
    const py = (rocketPos.y / 100) * h;
    const isCrashedOrAway = phase === "crashed" || flyAway;

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1="0" y1={h * f} x2={w} y2={h * f} stroke="white" strokeOpacity="0.03" strokeDasharray="4 4" />
        ))}
        {!isCrashedOrAway && (
          <>
            <polygon points={`0,${h} 0,${py} ${px},${py} ${px},${h}`} fill="url(#fillGrad)" />
            <path d={`M 0 ${h} Q ${px * 0.3} ${h - (h - py) * 0.2} ${px} ${py}`} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" filter="url(#glow)" />
          </>
        )}
        {!isCrashedOrAway && (
          <image href={JETPACK_GUY} x={px - 24} y={py - 40} width="48" height="48" style={{ filter: "drop-shadow(0 0 8px rgba(124,58,237,0.6))" }} />
        )}
      </svg>
    );
  };

  if (phase === "loading") {
    return (
      <div className="fixed inset-0 z-[200] bg-[#13112a] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src={JETPACK_GUY} alt="Lucky Jet" className="w-20 h-20 object-contain animate-bounce" />
          <span className="text-purple-400 font-extrabold text-2xl tracking-widest">LUCKY JET</span>
          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#7c3aed] to-[#c026d3] rounded-full transition-all" style={{ width: `${Math.min(loadProg, 100)}%` }} />
          </div>
        </div>
      </div>
    );
  }

  const isFlying = phase === "flying";
  const isCrashed = phase === "crashed";
  const isCashedOut = phase === "cashedOut";
  const isWaiting = phase === "roundWait";
  const hasBet1 = bet1Placed > 0;
  const hasBet2 = bet2Placed > 0;
  const totalBetWin = (hasBet1 ? currentWin1 : 0) + (hasBet2 ? currentWin2 : 0);

  return (
    <div className="fixed inset-0 z-[200] bg-[#13112a] flex flex-col overflow-auto">
      <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
        <button onClick={onClose} className="flex items-center gap-1 text-white/60 active:scale-95">
          <Icon name="ChevronLeft" size={20} />
          <span className="text-sm font-medium">Назад</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs uppercase font-medium">{cur === "usdt" ? "USDT" : "Stars"}</span>
          <span className="text-white font-bold text-base">{bal.toFixed(2)} {sym}</span>
        </div>
        <button
          onClick={() => { setCur(c => c === "usdt" ? "stars" : "usdt"); setBetInput1(cur === "usdt" ? "5" : "1"); setBetInput2(cur === "usdt" ? "5" : "1"); }}
          className="bg-[#2d2755] rounded-xl px-3 py-1.5 text-xs text-white/60 font-medium active:scale-95"
        >
          {cur === "usdt" ? "★ Stars" : "$ USDT"}
        </button>
      </div>

      <div className="px-3 py-1.5 shrink-0">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {history.slice(0, 10).map((h, i) => (
            <span key={i} className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg ${
              h < 1.5 ? "bg-[#1e3a5f] text-blue-400" : h < 2 ? "bg-[#2d2755] text-purple-300" : h < 5 ? "bg-[#3d2755] text-pink-300" : "bg-[#2d4035] text-green-400"
            }`}>
              {h.toFixed(2)}x
            </span>
          ))}
          <button className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-[#2d2755]">
            <Icon name="Clock" size={14} className="text-white/30" />
          </button>
        </div>
      </div>

      <div className="mx-3 mt-1 rounded-2xl border border-[#2d2755] bg-[#1a1535] relative overflow-hidden shrink-0" style={{ height: "30vh", minHeight: 180, maxHeight: 260 }}>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1a1535] to-transparent" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute w-0.5 h-0.5 bg-white/20 rounded-full animate-pulse" style={{ left: `${15 + i * 20}%`, top: `${10 + i * 12}%`, animationDelay: `${i * 0.5}s` }} />
          ))}
        </div>

        {isWaiting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <img src={JETPACK_GUY} alt="Lucky Jet" className="w-16 h-16 object-contain mb-3 animate-bounce" />
            <span className="text-white font-extrabold text-sm tracking-wider uppercase">Ожидание раунда</span>
            <div className="w-40 h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#7c3aed] to-[#c026d3] rounded-full transition-all duration-100" style={{ width: `${roundProgress}%` }} />
            </div>
          </div>
        )}
        {isFlying && (
          <div className="absolute inset-0 z-10">
            {renderGraph()}
            <div className="absolute top-4 left-4">
              <div className="text-white font-extrabold text-4xl leading-none" style={{ textShadow: "0 0 20px rgba(124,58,237,0.5)" }}>
                x{multiplier.toFixed(2)}
              </div>
              {(hasBet1 || hasBet2) && <div className="text-purple-300 font-bold text-base mt-1">{totalBetWin.toFixed(2)} {sym}</div>}
            </div>
          </div>
        )}
        {isCrashed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="text-red-500 font-extrabold text-5xl leading-none animate-pulse">x{multiplier.toFixed(2)}</div>
            <div className="text-red-400 font-bold text-base mt-2 uppercase tracking-wider">Улетел!</div>
          </div>
        )}
        {isCashedOut && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="text-green-400 font-extrabold text-5xl leading-none">x{multiplier.toFixed(2)}</div>
            <div className="text-green-300 font-bold text-lg mt-2">+{totalBetWin.toFixed(2)} {sym}</div>
            <div className="text-green-400/50 text-sm mt-1">Забрано!</div>
          </div>
        )}
      </div>

      <div className="px-3 pt-3 pb-4 space-y-2.5 shrink-0">
        <BetPanel
          betInput={betInput1}
          setBetInput={setBetInput1}
          minBet={minBet}
          bal={bal}
          quickBets={quickBets}
          sym={sym}
          isFlying={isFlying}
          hasBet={hasBet1}
          cashOut={cashOut1}
          placeBet={placeBet1}
          betVal={betVal1}
          currentWin={currentWin1}
          step={step}
        />
        <BetPanel
          betInput={betInput2}
          setBetInput={setBetInput2}
          minBet={minBet}
          bal={bal}
          quickBets={quickBets}
          sym={sym}
          isFlying={isFlying}
          hasBet={hasBet2}
          cashOut={cashOut2}
          placeBet={placeBet2}
          betVal={betVal2}
          currentWin={currentWin2}
          step={step}
        />
      </div>
    </div>
  );
}