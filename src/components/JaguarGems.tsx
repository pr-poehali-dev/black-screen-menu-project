import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

const CELLS = 25;
const MAX_MINES = 7;
const MIN_BET = 0.5;
const MULT_STEP = 0.5;

type Cell = "hidden" | "gem" | "bomb";
type Phase = "loading" | "idle" | "playing" | "won" | "lost";
type Cur = "usdt" | "stars";

interface Props {
  onClose: () => void;
  usdtBalance: number;
  starsBalance: number;
  onBalanceChange: (c: Cur, d: number) => void;
}

export default function JaguarGems({ onClose, usdtBalance, starsBalance, onBalanceChange }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [bombs, setBombs] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [cells, setCells] = useState<Cell[]>(Array(CELLS).fill("hidden"));
  const [mines, setMines] = useState(3);
  const [betInput, setBetInput] = useState("0.50");
  const [mult, setMult] = useState(1);
  const [loadProg, setLoadProg] = useState(0);
  const [cur, setCur] = useState<Cur>("usdt");
  const [bet, setBet] = useState(0);
  const [justRevealed, setJustRevealed] = useState<number | null>(null);
  const [shakeGrid, setShakeGrid] = useState(false);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const bal = cur === "usdt" ? usdtBalance : starsBalance;
  const betVal = parseFloat(betInput) || 0;
  const sym = cur === "usdt" ? "$" : "★";

  useEffect(() => {
    if (phase !== "loading") return;
    const t = setInterval(() => {
      setLoadProg(p => {
        if (p >= 100) { clearInterval(t); setTimeout(() => setPhase("idle"), 200); return 100; }
        return p + Math.random() * 10 + 3;
      });
    }, 60);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    return () => { if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current); };
  }, []);

  const triggerRevealAnim = useCallback((idx: number) => {
    setJustRevealed(idx);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    revealTimeoutRef.current = setTimeout(() => setJustRevealed(null), 400);
  }, []);

  const start = useCallback(() => {
    if (betVal < MIN_BET || betVal > bal) return;
    onBalanceChange(cur, -betVal);
    setBet(betVal);
    const b = new Set<number>();
    while (b.size < mines) b.add(Math.floor(Math.random() * CELLS));
    setBombs(b);
    setRevealed(new Set());
    setCells(Array(CELLS).fill("hidden"));
    setMult(1);
    setPhase("playing");
  }, [betVal, mines, bal, onBalanceChange, cur]);

  const reveal = useCallback((i: number) => {
    if (phase !== "playing" || revealed.has(i)) return;
    const nr = new Set(revealed); nr.add(i);
    setRevealed(nr);
    const nc = [...cells];

    triggerRevealAnim(i);

    if (bombs.has(i)) {
      nc[i] = "bomb";
      bombs.forEach(b => { nc[b] = "bomb"; });
      nr.forEach(r => { if (!bombs.has(r)) nc[r] = "gem"; });
      setCells(nc);
      setShakeGrid(true);
      setTimeout(() => setShakeGrid(false), 500);
      setPhase("lost");
      return;
    }
    nc[i] = "gem";
    setCells(nc);
    const safe = [...nr].filter(r => !bombs.has(r)).length;
    const newMult = 1 + safe * MULT_STEP;
    setMult(newMult);
    if (safe >= CELLS - mines) {
      onBalanceChange(cur, bet * newMult);
      bombs.forEach(b => { nc[b] = "bomb"; });
      setCells(nc);
      setPhase("won");
    }
  }, [phase, revealed, bombs, cells, mines, bet, onBalanceChange, cur, triggerRevealAnim]);

  const cashOut = useCallback(() => {
    if (phase !== "playing") return;
    const safe = [...revealed].filter(r => !bombs.has(r)).length;
    if (safe === 0) return;
    onBalanceChange(cur, bet * mult);
    const nc = [...cells];
    bombs.forEach(b => { nc[b] = "bomb"; });
    setCells(nc);
    setPhase("won");
  }, [phase, revealed, bet, mult, onBalanceChange, bombs, cells, cur]);

  const safe = [...revealed].filter(r => !bombs.has(r)).length;
  const winAmount = bet * mult;
  const maxWin = (phase === "playing" || phase === "won" || phase === "lost" ? bet : betVal) * (1 + (CELLS - mines) * MULT_STEP);

  if (phase === "loading") {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0a0e14] flex flex-col items-center justify-center">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <Icon name="X" size={20} className="text-white/60" />
        </button>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center shadow-lg shadow-[#4ade80]/20">
              <span className="text-4xl">💎</span>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#4ade80] animate-ping" />
          </div>
          <h1 className="text-[#4ade80] text-2xl font-bold tracking-wide">Jaguar Gems</h1>
          <div className="w-56 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-full transition-all duration-200" style={{ width: `${Math.min(loadProg, 100)}%` }} />
          </div>
          <span className="text-white/30 text-xs">{Math.min(Math.round(loadProg), 100)}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0e14] flex flex-col overflow-auto">
      <style>{`
        @keyframes cellPop { 0% { transform: scale(0.3) rotate(-10deg); opacity: 0; } 50% { transform: scale(1.15) rotate(3deg); } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes cellBomb { 0% { transform: scale(0.3); opacity: 0; } 40% { transform: scale(1.3); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes gridShake { 0%,100% { transform: translateX(0); } 15% { transform: translateX(-4px); } 30% { transform: translateX(4px); } 45% { transform: translateX(-3px); } 60% { transform: translateX(3px); } 75% { transform: translateX(-2px); } 90% { transform: translateX(2px); } }
        @keyframes cellFlip { 0% { transform: rotateY(0deg) scale(1); } 50% { transform: rotateY(90deg) scale(0.9); } 100% { transform: rotateY(0deg) scale(0.93); } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); } 50% { box-shadow: 0 0 12px 2px rgba(74,222,128,0.3); } }
        .cell-pop { animation: cellPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .cell-bomb { animation: cellBomb 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .grid-shake { animation: gridShake 0.5s ease-in-out; }
        .cell-flip { animation: cellFlip 0.35s ease forwards; }
        .pulse-glow { animation: pulseGlow 1.5s ease-in-out infinite; }
      `}</style>

      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1117]/80 backdrop-blur-lg border-b border-white/5 shrink-0">
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
          <Icon name="ArrowLeft" size={16} className="text-white/60" />
        </button>
        <div className="flex bg-white/[0.04] rounded-full p-0.5 border border-white/[0.06]">
          <button
            onClick={() => { if (phase !== "playing") setCur("usdt"); }}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${cur === "usdt" ? "bg-[#4ade80] text-[#0a0e14]" : "text-white/40"}`}
          >USDT</button>
          <button
            onClick={() => { if (phase !== "playing") setCur("stars"); }}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${cur === "stars" ? "bg-[#4ade80] text-[#0a0e14]" : "text-white/40"}`}
          >Stars ★</button>
        </div>
        <div className="flex items-center gap-1 bg-white/5 rounded-xl px-2.5 py-1.5">
          <Icon name="Wallet" size={12} className="text-[#4ade80]" />
          <span className="text-white text-xs font-semibold">{bal.toFixed(2)} {sym}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-3 py-3 gap-2.5 max-w-md mx-auto w-full">
        <div className={`bg-[#111820] rounded-2xl p-2 border border-white/5 ${shakeGrid ? "grid-shake" : ""}`}>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: CELLS }).map((_, i) => {
              const c = cells[i];
              const isJust = justRevealed === i;
              return (
                <button
                  key={i}
                  disabled={phase !== "playing" || c !== "hidden"}
                  onClick={() => reveal(i)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-lg transition-all duration-150
                    ${c === "hidden" && phase === "playing" ? "bg-gradient-to-br from-[#1a3a4a] to-[#143040] border border-[#2a5a6a]/30 active:scale-90 cursor-pointer" : ""}
                    ${c === "hidden" && phase !== "playing" ? "bg-gradient-to-br from-[#1a3a4a]/50 to-[#143040]/50 border border-[#2a5a6a]/15" : ""}
                    ${c === "gem" ? "bg-[#4ade80]/10 border border-[#4ade80]/25" : ""}
                    ${c === "bomb" ? "bg-red-500/10 border border-red-500/25" : ""}
                    ${c === "gem" && isJust ? "pulse-glow" : ""}
                  `}
                  style={c !== "hidden" ? { transform: "scale(0.93)" } : undefined}
                >
                  {c === "gem" && <span className={isJust ? "cell-pop" : "cell-flip"}>💎</span>}
                  {c === "bomb" && <span className={isJust ? "cell-bomb" : "cell-bomb"}>💣</span>}
                </button>
              );
            })}
          </div>
        </div>

        {phase === "playing" && safe > 0 && (
          <div className="bg-[#4ade80]/8 border border-[#4ade80]/15 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[#4ade80]/70 text-xs">Текущий x{mult.toFixed(1)}</span>
            <span className="text-[#4ade80] font-bold text-sm">{winAmount.toFixed(2)} {sym}</span>
          </div>
        )}

        {phase === "lost" && (
          <div className="bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
              <span className="text-sm">💣</span>
            </div>
            <div>
              <p className="text-red-400 font-semibold text-xs">Проигрыш</p>
              <p className="text-red-400/50 text-[10px]">-{bet.toFixed(2)} {sym}</p>
            </div>
          </div>
        )}

        {phase === "won" && (
          <div className="bg-[#4ade80]/8 border border-[#4ade80]/15 rounded-xl px-3 py-2 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4ade80]/15 flex items-center justify-center shrink-0">
              <span className="text-sm">🏆</span>
            </div>
            <div>
              <p className="text-[#4ade80] font-semibold text-xs">Выигрыш!</p>
              <p className="text-[#4ade80]/60 text-[10px]">+{winAmount.toFixed(2)} {sym} (x{mult.toFixed(1)})</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 bg-[#111820] border border-white/5 rounded-xl px-3 py-2">
            <p className="text-white/20 text-[9px] uppercase tracking-wider">Макс. выигрыш</p>
            <p className="text-[#4ade80] font-bold text-xs mt-0.5">{maxWin.toFixed(2)} {sym}</p>
          </div>
          <div className="bg-[#111820] border border-white/5 rounded-xl px-2.5 py-2 flex items-center gap-1.5">
            <button
              onClick={() => setMines(p => Math.max(1, p - 1))}
              disabled={phase === "playing"}
              className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-white/40 active:bg-white/10 disabled:opacity-20"
            ><Icon name="ChevronLeft" size={12} /></button>
            <div className="text-center min-w-[36px]">
              <p className="text-white font-bold text-sm leading-none">{mines}</p>
              <p className="text-white/20 text-[8px] mt-0.5">ловушек</p>
            </div>
            <button
              onClick={() => setMines(p => Math.min(MAX_MINES, p + 1))}
              disabled={phase === "playing"}
              className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-white/40 active:bg-white/10 disabled:opacity-20"
            ><Icon name="ChevronRight" size={12} /></button>
          </div>
        </div>

        {phase !== "playing" && (
          <>
            <div className="bg-[#111820] border border-white/5 rounded-xl px-2.5 py-2 flex items-center gap-2">
              <button
                onClick={() => setBetInput(Math.max(MIN_BET, betVal - (cur === "stars" ? 10 : 0.5)).toFixed(2))}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 active:bg-white/10 text-base font-bold shrink-0"
              >-</button>
              <div className="flex-1 flex items-center justify-center gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={betInput}
                  onChange={e => {
                    const v = e.target.value.replace(/[^0-9.]/g, "");
                    if (v.split(".").length <= 2) setBetInput(v);
                  }}
                  onBlur={() => {
                    const v = parseFloat(betInput);
                    setBetInput(isNaN(v) || v < MIN_BET ? MIN_BET.toFixed(2) : v.toFixed(2));
                  }}
                  className="bg-transparent text-center text-white text-lg font-bold outline-none w-full"
                />
                <span className="text-white/30 text-sm">{sym}</span>
              </div>
              <button
                onClick={() => setBetInput((betVal + (cur === "stars" ? 10 : 0.5)).toFixed(2))}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 active:bg-white/10 text-base font-bold shrink-0"
              >+</button>
            </div>

            <div className="flex gap-1.5">
              {[
                { l: "MIN", fn: () => setBetInput(MIN_BET.toFixed(2)) },
                { l: "x2", fn: () => setBetInput((betVal * 2).toFixed(2)) },
                { l: "½", fn: () => setBetInput(Math.max(MIN_BET, betVal / 2).toFixed(2)) },
                { l: "MAX", fn: () => setBetInput(bal.toFixed(2)) },
              ].map(b => (
                <button key={b.l} onClick={b.fn} className="flex-1 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-white/25 text-[10px] font-medium active:bg-white/[0.06]">{b.l}</button>
              ))}
            </div>

            <button
              onClick={start}
              disabled={betVal < MIN_BET || betVal > bal}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0a0e14] font-bold text-sm active:scale-[0.98] transition-transform disabled:opacity-25"
            >
              {betVal > bal ? "Недостаточно средств" : betVal < MIN_BET ? `Мин. ${MIN_BET} ${sym}` : "Играть"}
            </button>
          </>
        )}

        {phase === "playing" && (
          <button
            onClick={cashOut}
            disabled={safe === 0}
            className={`w-full py-3 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform
              ${safe > 0 ? "bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0a0e14]" : "bg-white/[0.03] border border-white/5 text-white/15"}`}
          >
            {safe > 0 ? `Забрать ${winAmount.toFixed(2)} ${sym} (x${mult.toFixed(1)})` : "Выберите ячейку..."}
          </button>
        )}
      </div>
    </div>
  );
}
