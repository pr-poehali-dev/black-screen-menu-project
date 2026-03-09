import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const GRID_SIZE = 5;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
const MAX_MINES = 7;
const MIN_BET = 0.5;

type CellState = "hidden" | "gem" | "bomb";
type GamePhase = "loading" | "idle" | "playing" | "won" | "lost";
type Currency = "usdt" | "stars";

const multipliers: Record<number, number[]> = {
  1: [0.52, 0.54, 0.56, 0.59, 0.62, 0.65, 0.69, 0.73, 0.78, 0.83, 0.89, 0.95, 1.03, 1.13, 1.24, 1.38, 1.55, 1.77, 2.07, 2.48, 3.1, 4.13, 6.19, 12.38],
  2: [0.56, 0.61, 0.67, 0.74, 0.82, 0.91, 1.02, 1.15, 1.31, 1.5, 1.75, 2.06, 2.47, 3.02, 3.79, 4.91, 6.63, 9.42, 14.42, 24.41, 49.22, 130.44, 608.7],
  3: [0.56, 0.65, 0.74, 0.86, 1.01, 1.2, 1.45, 1.77, 2.21, 2.8, 3.63, 4.83, 6.61, 9.39, 13.92, 21.74, 36.24, 65.22, 130.44, 304.35, 913.04, 4565.22],
  4: [0.6, 0.73, 0.9, 1.12, 1.42, 1.83, 2.42, 3.27, 4.56, 6.57, 9.86, 15.5, 25.8, 46.0, 89.23, 192.01, 475.45, 1426.36, 5705.43, 39938.01],
  5: [0.62, 0.78, 1.0, 1.29, 1.7, 2.26, 3.07, 4.25, 6.02, 8.76, 13.14, 20.44, 33.21, 56.93, 104.36, 208.72, 469.63, 1252.34, 4383.19, 26299.34],
  6: [0.66, 0.88, 1.2, 1.66, 2.34, 3.39, 5.04, 7.73, 12.27, 20.28, 35.13, 64.48, 127.23, 274.28, 658.27, 1810.24, 5936.0, 24726.66],
  7: [0.69, 0.96, 1.37, 2.01, 3.02, 4.69, 7.52, 12.54, 21.78, 39.72, 76.5, 157.44, 349.86, 857.17, 2381.02, 7936.74, 34086.96],
};

function getMultiplier(mines: number, revealed: number): number {
  const key = Object.keys(multipliers).map(Number).reduce((prev, curr) =>
    Math.abs(curr - mines) < Math.abs(prev - mines) ? curr : prev
  );
  const table = multipliers[key];
  if (revealed <= 0) return 1;
  return table[Math.min(revealed - 1, table.length - 1)] || 1;
}

interface JaguarGemsProps {
  onClose: () => void;
  usdtBalance: number;
  starsBalance: number;
  onBalanceChange: (currency: Currency, delta: number) => void;
}

export default function JaguarGems({ onClose, usdtBalance, starsBalance, onBalanceChange }: JaguarGemsProps) {
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [bombs, setBombs] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [cellStates, setCellStates] = useState<CellState[]>(Array(TOTAL_CELLS).fill("hidden"));
  const [mineCount, setMineCount] = useState(3);
  const [betInput, setBetInput] = useState("0.50");
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currency, setCurrency] = useState<Currency>("usdt");
  const [lockedBet, setLockedBet] = useState(0);

  const balance = currency === "usdt" ? usdtBalance : starsBalance;
  const betAmount = parseFloat(betInput) || 0;
  const currencySymbol = currency === "usdt" ? "$" : "★";

  useEffect(() => {
    if (phase !== "loading") return;
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setPhase("idle"), 300);
          return 100;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [phase]);

  const startGame = useCallback(() => {
    if (betAmount < MIN_BET || betAmount > balance) return;
    onBalanceChange(currency, -betAmount);
    setLockedBet(betAmount);

    const bombSet = new Set<number>();
    while (bombSet.size < mineCount) {
      bombSet.add(Math.floor(Math.random() * TOTAL_CELLS));
    }
    setBombs(bombSet);
    setRevealed(new Set());
    setCellStates(Array(TOTAL_CELLS).fill("hidden"));
    setCurrentMultiplier(1);
    setPhase("playing");
  }, [betAmount, mineCount, balance, onBalanceChange, currency]);

  const revealCell = useCallback((idx: number) => {
    if (phase !== "playing" || revealed.has(idx)) return;

    const newRevealed = new Set(revealed);
    newRevealed.add(idx);
    setRevealed(newRevealed);

    const newStates = [...cellStates];

    if (bombs.has(idx)) {
      newStates[idx] = "bomb";
      bombs.forEach(b => { newStates[b] = "bomb"; });
      for (let i = 0; i < TOTAL_CELLS; i++) {
        if (!bombs.has(i) && newRevealed.has(i)) newStates[i] = "gem";
      }
      setCellStates(newStates);
      setPhase("lost");
      return;
    }

    newStates[idx] = "gem";
    setCellStates(newStates);

    const safeRevealed = [...newRevealed].filter(r => !bombs.has(r)).length;
    const mult = getMultiplier(mineCount, safeRevealed);
    setCurrentMultiplier(mult);

    if (safeRevealed >= TOTAL_CELLS - mineCount) {
      const winnings = lockedBet * mult;
      onBalanceChange(currency, winnings);
      bombs.forEach(b => { newStates[b] = "bomb"; });
      setCellStates(newStates);
      setPhase("won");
    }
  }, [phase, revealed, bombs, cellStates, mineCount, lockedBet, onBalanceChange, currency]);

  const cashOut = useCallback(() => {
    if (phase !== "playing" || revealed.size === 0) return;
    const safeCount = [...revealed].filter(r => !bombs.has(r)).length;
    if (safeCount === 0) return;
    const winnings = lockedBet * currentMultiplier;
    onBalanceChange(currency, winnings);

    const newStates = [...cellStates];
    bombs.forEach(b => { newStates[b] = "bomb"; });
    setCellStates(newStates);
    setPhase("won");
  }, [phase, revealed, lockedBet, currentMultiplier, onBalanceChange, bombs, cellStates, currency]);

  const activeBet = phase === "playing" || phase === "won" || phase === "lost" ? lockedBet : betAmount;
  const safeRevealed = [...revealed].filter(r => !bombs.has(r)).length;
  const maxWin = activeBet * getMultiplier(mineCount, TOTAL_CELLS - mineCount) / 2;

  if (phase === "loading") {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0a0e14] flex flex-col items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
        >
          <Icon name="X" size={20} className="text-white/60" />
        </button>
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center shadow-lg shadow-[#4ade80]/20">
              <span className="text-4xl">💎</span>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#4ade80] animate-ping" />
          </div>
          <h1 className="text-[#4ade80] text-2xl font-bold tracking-wide">Jaguar Gems</h1>
          <div className="w-56 h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-full transition-all duration-200"
              style={{ width: `${Math.min(loadingProgress, 100)}%` }}
            />
          </div>
          <span className="text-white/30 text-xs">{Math.min(Math.round(loadingProgress), 100)}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0e14] flex flex-col overflow-auto">
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d1117]/80 backdrop-blur-lg border-b border-white/5">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
          <Icon name="ArrowLeft" size={18} className="text-white/60" />
        </button>
        <div className="flex items-center bg-white/[0.04] rounded-full p-0.5 border border-white/[0.06]">
          <button
            onClick={() => { if (phase !== "playing") setCurrency("usdt"); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${currency === "usdt" ? "bg-[#4ade80] text-[#0a0e14]" : "text-white/40"}`}
          >
            USDT
          </button>
          <button
            onClick={() => { if (phase !== "playing") setCurrency("stars"); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${currency === "stars" ? "bg-[#4ade80] text-[#0a0e14]" : "text-white/40"}`}
          >
            Stars ★
          </button>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 rounded-xl px-3 py-1.5">
          <span className="text-white text-sm font-semibold">{balance.toFixed(2)} {currencySymbol}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 gap-3 max-w-md mx-auto w-full">
        <div className="bg-[#111820] rounded-2xl p-2.5 border border-white/5">
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: TOTAL_CELLS }).map((_, idx) => {
              const state = cellStates[idx];
              const isHidden = state === "hidden";
              const isGem = state === "gem";
              const isBomb = state === "bomb";

              return (
                <button
                  key={idx}
                  disabled={phase !== "playing" || !isHidden}
                  onClick={() => revealCell(idx)}
                  className={`
                    aspect-square rounded-xl flex items-center justify-center text-xl transition-all duration-200
                    ${isHidden && phase === "playing" ? "bg-gradient-to-br from-[#1a3a4a] to-[#143040] hover:from-[#1f4a5a] hover:to-[#1a3a4a] active:scale-90 border border-[#2a5a6a]/30 cursor-pointer" : ""}
                    ${isHidden && phase !== "playing" ? "bg-gradient-to-br from-[#1a3a4a]/60 to-[#143040]/60 border border-[#2a5a6a]/15" : ""}
                    ${isGem ? "bg-[#4ade80]/10 border border-[#4ade80]/25 scale-[0.92]" : ""}
                    ${isBomb ? "bg-red-500/10 border border-red-500/25 scale-[0.92]" : ""}
                  `}
                >
                  {isGem && <span className="animate-[bounceIn_0.3s_ease-out]">💎</span>}
                  {isBomb && <span className="animate-[bounceIn_0.3s_ease-out]">💣</span>}
                </button>
              );
            })}
          </div>
        </div>

        {phase === "lost" && (
          <div className="bg-red-500/8 border border-red-500/15 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
              <span className="text-lg">💣</span>
            </div>
            <div>
              <p className="text-red-400 font-semibold text-sm">Проигрыш</p>
              <p className="text-red-400/50 text-xs">-{lockedBet.toFixed(2)} {currencySymbol}</p>
            </div>
          </div>
        )}

        {phase === "won" && (
          <div className="bg-[#4ade80]/8 border border-[#4ade80]/15 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#4ade80]/15 flex items-center justify-center shrink-0">
              <span className="text-lg">🏆</span>
            </div>
            <div>
              <p className="text-[#4ade80] font-semibold text-sm">Выигрыш!</p>
              <p className="text-[#4ade80]/60 text-xs">+{(lockedBet * currentMultiplier).toFixed(2)} {currencySymbol} (x{currentMultiplier.toFixed(2)})</p>
            </div>
          </div>
        )}

        <div className="flex gap-2.5">
          <div className="flex-1 bg-[#111820] border border-white/5 rounded-2xl px-3 py-2.5">
            <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1">Макс. выигрыш</p>
            <p className="text-[#4ade80] font-bold text-sm">{maxWin.toFixed(2)} {currencySymbol}</p>
          </div>
          <div className="bg-[#111820] border border-white/5 rounded-2xl px-3 py-2.5 flex items-center gap-2">
            <button
              onClick={() => setMineCount(prev => Math.max(1, prev - 1))}
              disabled={phase === "playing"}
              className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 active:bg-white/10 disabled:opacity-20"
            >
              <Icon name="ChevronLeft" size={14} />
            </button>
            <div className="text-center min-w-[44px]">
              <p className="text-white font-bold text-base leading-none">{mineCount}</p>
              <p className="text-white/25 text-[9px] mt-0.5">ловушек</p>
            </div>
            <button
              onClick={() => setMineCount(prev => Math.min(MAX_MINES, prev + 1))}
              disabled={phase === "playing"}
              className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 active:bg-white/10 disabled:opacity-20"
            >
              <Icon name="ChevronRight" size={14} />
            </button>
          </div>
        </div>

        <div className="bg-[#111820] border border-white/5 rounded-2xl px-3 py-2.5 flex items-center gap-2">
          <button
            onClick={() => {
              const val = Math.max(MIN_BET, betAmount - (currency === "stars" ? 10 : 0.5));
              setBetInput(val.toFixed(2));
            }}
            disabled={phase === "playing"}
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 active:bg-white/10 disabled:opacity-20 text-lg font-bold shrink-0"
          >
            -
          </button>
          <div className="flex-1 flex items-center justify-center gap-1">
            <input
              type="text"
              inputMode="decimal"
              value={phase === "playing" ? lockedBet.toFixed(2) : betInput}
              disabled={phase === "playing"}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, "");
                if (v.split(".").length <= 2) setBetInput(v);
              }}
              onBlur={() => {
                const val = parseFloat(betInput);
                if (isNaN(val) || val < MIN_BET) setBetInput(MIN_BET.toFixed(2));
                else setBetInput(val.toFixed(2));
              }}
              className="bg-transparent text-center text-white text-xl font-bold outline-none w-full disabled:opacity-60"
            />
            <span className="text-white/30 text-lg">{currencySymbol}</span>
          </div>
          <button
            onClick={() => {
              const val = betAmount + (currency === "stars" ? 10 : 0.5);
              setBetInput(val.toFixed(2));
            }}
            disabled={phase === "playing"}
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 active:bg-white/10 disabled:opacity-20 text-lg font-bold shrink-0"
          >
            +
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setBetInput(MIN_BET.toFixed(2))}
            disabled={phase === "playing"}
            className="flex-1 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 text-xs font-medium active:bg-white/[0.08] disabled:opacity-20"
          >
            MIN
          </button>
          <button
            onClick={() => setBetInput((betAmount * 2).toFixed(2))}
            disabled={phase === "playing"}
            className="flex-1 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 text-xs font-medium active:bg-white/[0.08] disabled:opacity-20"
          >
            x2
          </button>
          <button
            onClick={() => setBetInput((betAmount / 2 < MIN_BET ? MIN_BET : betAmount / 2).toFixed(2))}
            disabled={phase === "playing"}
            className="flex-1 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 text-xs font-medium active:bg-white/[0.08] disabled:opacity-20"
          >
            ½
          </button>
          <button
            onClick={() => setBetInput(balance.toFixed(2))}
            disabled={phase === "playing"}
            className="flex-1 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 text-xs font-medium active:bg-white/[0.08] disabled:opacity-20"
          >
            MAX
          </button>
        </div>

        {phase === "playing" && safeRevealed > 0 ? (
          <button
            onClick={cashOut}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0a0e14] font-bold text-base active:scale-[0.98] transition-transform"
          >
            Забрать {(lockedBet * currentMultiplier).toFixed(2)} {currencySymbol} (x{currentMultiplier.toFixed(2)})
          </button>
        ) : phase === "playing" ? (
          <div className="w-full py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center text-white/20 font-medium text-sm">
            Выберите ячейку...
          </div>
        ) : (
          <button
            onClick={startGame}
            disabled={betAmount < MIN_BET || betAmount > balance}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0a0e14] font-bold text-base active:scale-[0.98] transition-transform disabled:opacity-30 disabled:active:scale-100"
          >
            {betAmount > balance ? "Недостаточно средств" : betAmount < MIN_BET ? `Мин. ставка ${MIN_BET} ${currencySymbol}` : "Играть"}
          </button>
        )}
      </div>
    </div>
  );
}
