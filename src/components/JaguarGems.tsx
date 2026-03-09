import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const GRID_SIZE = 5;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

type CellState = "hidden" | "gem" | "bomb";
type GamePhase = "loading" | "idle" | "playing" | "won" | "lost";

const gemEmoji = "💎";
const bombEmoji = "💣";

const multipliers: Record<number, number[]> = {
  1: [1.03, 1.08, 1.12, 1.18, 1.24, 1.3, 1.37, 1.46, 1.55, 1.65, 1.77, 1.9, 2.06, 2.25, 2.47, 2.75, 3.09, 3.54, 4.13, 4.95, 6.19, 8.25, 12.38, 24.75],
  3: [1.12, 1.29, 1.48, 1.72, 2.02, 2.4, 2.89, 3.54, 4.41, 5.59, 7.25, 9.65, 13.22, 18.77, 27.83, 43.48, 72.47, 130.44, 260.87, 608.70, 1826.09, 9130.43],
  5: [1.24, 1.56, 2.0, 2.58, 3.39, 4.52, 6.14, 8.5, 12.04, 17.52, 26.27, 40.87, 66.41, 113.85, 208.72, 417.45, 939.26, 2504.7, 8766.45, 52598.68],
  7: [1.38, 1.92, 2.74, 4.01, 6.04, 9.37, 15.04, 25.07, 43.56, 79.44, 153.0, 314.87, 699.71, 1714.33, 4762.04, 15873.47, 68183.93],
  10: [1.67, 2.78, 4.86, 9.0, 17.72, 37.54, 86.35, 220.0, 638.0, 2185.71, 9375.0, 56250.0],
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
  balance: number;
  onBalanceChange: (delta: number) => void;
}

export default function JaguarGems({ onClose, balance, onBalanceChange }: JaguarGemsProps) {
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [bombs, setBombs] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [cellStates, setCellStates] = useState<CellState[]>(Array(TOTAL_CELLS).fill("hidden"));
  const [mineCount, setMineCount] = useState(3);
  const [betAmount, setBetAmount] = useState(0.2);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [loadingProgress, setLoadingProgress] = useState(0);

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
    if (betAmount > balance) return;
    onBalanceChange(-betAmount);

    const bombSet = new Set<number>();
    while (bombSet.size < mineCount) {
      bombSet.add(Math.floor(Math.random() * TOTAL_CELLS));
    }
    setBombs(bombSet);
    setRevealed(new Set());
    setCellStates(Array(TOTAL_CELLS).fill("hidden"));
    setCurrentMultiplier(1);
    setPhase("playing");
  }, [betAmount, mineCount, balance, onBalanceChange]);

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
      const winnings = betAmount * mult;
      onBalanceChange(winnings);
      bombs.forEach(b => { newStates[b] = "bomb"; });
      setCellStates(newStates);
      setPhase("won");
    }
  }, [phase, revealed, bombs, cellStates, mineCount, betAmount, onBalanceChange]);

  const cashOut = useCallback(() => {
    if (phase !== "playing" || revealed.size === 0) return;
    const winnings = betAmount * currentMultiplier;
    onBalanceChange(winnings);

    const newStates = [...cellStates];
    bombs.forEach(b => { newStates[b] = "bomb"; });
    setCellStates(newStates);
    setPhase("won");
  }, [phase, revealed, betAmount, currentMultiplier, onBalanceChange, bombs, cellStates]);

  const safeRevealed = [...revealed].filter(r => !bombs.has(r)).length;
  const maxWin = betAmount * getMultiplier(mineCount, TOTAL_CELLS - mineCount);

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
              <span className="text-4xl">{gemEmoji}</span>
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
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d1117] border-b border-white/5">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
          <Icon name="ArrowLeft" size={18} className="text-white/60" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[#4ade80] font-bold text-sm">Jaguar Gems</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 rounded-xl px-3 py-1.5">
          <Icon name="Wallet" size={14} className="text-[#4ade80]" />
          <span className="text-white text-sm font-semibold">{balance.toFixed(2)} $</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 gap-4 max-w-md mx-auto w-full">
        <div className="bg-[#111820] rounded-2xl p-3 border border-white/5">
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
                    aspect-square rounded-xl flex items-center justify-center text-2xl transition-all duration-200
                    ${isHidden ? "bg-gradient-to-br from-[#1a3a4a] to-[#143040] hover:from-[#1f4a5a] hover:to-[#1a3a4a] active:scale-95 border border-[#2a5a6a]/30 shadow-inner" : ""}
                    ${isGem ? "bg-gradient-to-br from-[#4ade80]/20 to-[#22c55e]/10 border border-[#4ade80]/30 scale-95" : ""}
                    ${isBomb ? "bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 scale-95" : ""}
                    ${phase !== "playing" && isHidden ? "opacity-60" : ""}
                  `}
                >
                  {isGem && <span className="animate-[bounceIn_0.3s_ease-out]">{gemEmoji}</span>}
                  {isBomb && <span className="animate-[bounceIn_0.3s_ease-out]">{bombEmoji}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {phase === "lost" && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
              <span className="text-xl">{bombEmoji}</span>
            </div>
            <div>
              <p className="text-red-400 font-semibold text-sm">Бум! Проигрыш</p>
              <p className="text-red-400/50 text-xs">Ставка {betAmount.toFixed(2)} $ потеряна</p>
            </div>
          </div>
        )}

        {phase === "won" && (
          <div className="bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4ade80]/20 flex items-center justify-center shrink-0">
              <span className="text-xl">🏆</span>
            </div>
            <div>
              <p className="text-[#4ade80] font-semibold text-sm">Выигрыш!</p>
              <p className="text-[#4ade80]/60 text-xs">+{(betAmount * currentMultiplier).toFixed(2)} $ (x{currentMultiplier.toFixed(2)})</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 bg-[#111820] border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-2">
            <Icon name="Star" size={18} className="text-yellow-400" />
            <div>
              <p className="text-[#4ade80] text-xs font-medium">Макс. выигрыш</p>
              <p className="text-white font-bold text-sm">{maxWin.toFixed(2)} $</p>
            </div>
          </div>
          <div className="bg-[#111820] border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setMineCount(prev => Math.max(1, prev - 1))}
              disabled={phase === "playing"}
              className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/50 active:bg-white/10 disabled:opacity-30"
            >
              <Icon name="ChevronLeft" size={14} />
            </button>
            <div className="text-center min-w-[50px]">
              <p className="text-white font-bold text-lg leading-none">{mineCount}</p>
              <p className="text-white/30 text-[10px]">ловушек</p>
            </div>
            <button
              onClick={() => setMineCount(prev => Math.min(24, prev + 1))}
              disabled={phase === "playing"}
              className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/50 active:bg-white/10 disabled:opacity-30"
            >
              <Icon name="ChevronRight" size={14} />
            </button>
          </div>
        </div>

        <div className="bg-[#111820] border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setBetAmount(prev => Math.max(0.1, +(prev - 0.1).toFixed(2)))}
            disabled={phase === "playing"}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 active:bg-white/10 disabled:opacity-30 text-lg font-bold"
          >
            -
          </button>
          <div className="flex-1 text-center">
            <span className="text-white text-xl font-bold">{betAmount.toFixed(2)}</span>
            <span className="text-white/40 text-lg ml-1">$</span>
          </div>
          <button
            onClick={() => setBetAmount(prev => +(prev + 0.1).toFixed(2))}
            disabled={phase === "playing"}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 active:bg-white/10 disabled:opacity-30 text-lg font-bold"
          >
            +
          </button>
        </div>

        {phase === "playing" && safeRevealed > 0 ? (
          <button
            onClick={cashOut}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-[#0a0e14] font-bold text-base active:opacity-90 transition-opacity"
          >
            Забрать {(betAmount * currentMultiplier).toFixed(2)} $ (x{currentMultiplier.toFixed(2)})
          </button>
        ) : phase === "playing" ? (
          <div className="w-full py-4 rounded-2xl bg-white/5 text-center text-white/30 font-medium text-sm">
            Выберите ячейку...
          </div>
        ) : (
          <button
            onClick={startGame}
            disabled={betAmount > balance}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-base active:opacity-90 transition-opacity disabled:opacity-40"
          >
            Играть
          </button>
        )}
      </div>
    </div>
  );
}
