import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const GRID = 5;
const CELLS = GRID * GRID;
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

    if (bombs.has(i)) {
      nc[i] = "bomb";
      bombs.forEach(b => { nc[b] = "bomb"; });
      nr.forEach(r => { if (!bombs.has(r)) nc[r] = "gem"; });
      setCells(nc);
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
  }, [phase, revealed, bombs, cells, mines, bet, onBalanceChange, cur]);

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

  if (phase === "loading") {
    return (
      <div className="fixed inset-0 z-[200] bg-[#080b10] flex flex-col items-center justify-center">
        <button onClick={onClose} className="absolute top-3 right-3 p-2 text-white/30">
          <Icon name="X" size={18} />
        </button>
        <span className="text-3xl mb-4">💎</span>
        <p className="text-[#4ade80] text-lg font-bold mb-6">Jaguar Gems</p>
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#4ade80] rounded-full transition-all" style={{ width: `${Math.min(loadProg, 100)}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#080b10] flex flex-col">
      <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
        <button onClick={onClose} className="p-1.5">
          <Icon name="ArrowLeft" size={18} className="text-white/50" />
        </button>
        <div className="flex bg-white/[0.04] rounded-full p-0.5">
          <button
            onClick={() => { if (phase !== "playing") setCur("usdt"); }}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${cur === "usdt" ? "bg-[#4ade80] text-black" : "text-white/35"}`}
          >USDT</button>
          <button
            onClick={() => { if (phase !== "playing") setCur("stars"); }}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${cur === "stars" ? "bg-[#4ade80] text-black" : "text-white/35"}`}
          >Stars</button>
        </div>
        <span className="text-white/70 text-xs font-medium">{bal.toFixed(2)} {sym}</span>
      </div>

      {phase === "playing" && safe > 0 && (
        <div className="mx-3 mb-2 bg-[#4ade80]/8 rounded-xl px-3 py-2 flex items-center justify-between">
          <span className="text-[#4ade80] text-xs">x{mult.toFixed(1)}</span>
          <span className="text-[#4ade80] font-bold text-sm">{winAmount.toFixed(2)} {sym}</span>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-3">
        <div className="w-full max-w-[340px] aspect-square">
          <div className="grid grid-cols-5 gap-[5px] w-full h-full">
            {Array.from({ length: CELLS }).map((_, i) => {
              const c = cells[i];
              return (
                <button
                  key={i}
                  disabled={phase !== "playing" || c !== "hidden"}
                  onClick={() => reveal(i)}
                  className={`rounded-lg flex items-center justify-center transition-all duration-150 text-lg
                    ${c === "hidden" && phase === "playing" ? "bg-[#14202c] border border-[#1e3344]/50 active:scale-90" : ""}
                    ${c === "hidden" && phase !== "playing" ? "bg-[#14202c]/50 border border-[#1e3344]/20" : ""}
                    ${c === "gem" ? "bg-[#4ade80]/10 border border-[#4ade80]/20" : ""}
                    ${c === "bomb" ? "bg-red-500/10 border border-red-500/20" : ""}
                  `}
                >
                  {c === "gem" && "💎"}
                  {c === "bomb" && "💣"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="shrink-0 px-3 pb-4 pt-2 flex flex-col gap-2">
        {phase === "lost" && (
          <div className="bg-red-500/8 rounded-xl px-3 py-2.5 flex items-center justify-between">
            <span className="text-red-400 text-sm font-medium">Проигрыш</span>
            <span className="text-red-400/60 text-xs">-{bet.toFixed(2)} {sym}</span>
          </div>
        )}

        {phase === "won" && (
          <div className="bg-[#4ade80]/8 rounded-xl px-3 py-2.5 flex items-center justify-between">
            <span className="text-[#4ade80] text-sm font-medium">Выигрыш x{mult.toFixed(1)}</span>
            <span className="text-[#4ade80] font-bold text-sm">+{winAmount.toFixed(2)} {sym}</span>
          </div>
        )}

        {phase !== "playing" && (
          <>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 bg-white/[0.03] rounded-xl px-3 py-2 flex-1">
                <button
                  onClick={() => setMines(p => Math.max(1, p - 1))}
                  className="text-white/30 active:text-white/60"
                ><Icon name="Minus" size={14} /></button>
                <div className="flex-1 text-center">
                  <span className="text-white font-bold text-sm">{mines}</span>
                  <span className="text-white/20 text-[10px] ml-1">мин</span>
                </div>
                <button
                  onClick={() => setMines(p => Math.min(MAX_MINES, p + 1))}
                  className="text-white/30 active:text-white/60"
                ><Icon name="Plus" size={14} /></button>
              </div>

              <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl px-3 py-2 flex-[1.5]">
                <button
                  onClick={() => {
                    const v = Math.max(MIN_BET, betVal - (cur === "stars" ? 10 : 0.5));
                    setBetInput(v.toFixed(2));
                  }}
                  className="text-white/30 active:text-white/60"
                ><Icon name="Minus" size={14} /></button>
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
                  className="flex-1 bg-transparent text-center text-white font-bold text-sm outline-none min-w-0"
                />
                <span className="text-white/20 text-xs">{sym}</span>
                <button
                  onClick={() => setBetInput((betVal + (cur === "stars" ? 10 : 0.5)).toFixed(2))}
                  className="text-white/30 active:text-white/60"
                ><Icon name="Plus" size={14} /></button>
              </div>
            </div>

            <div className="flex gap-1.5">
              {["MIN", "x2", "½", "MAX"].map(l => (
                <button
                  key={l}
                  onClick={() => {
                    if (l === "MIN") setBetInput(MIN_BET.toFixed(2));
                    if (l === "x2") setBetInput((betVal * 2).toFixed(2));
                    if (l === "½") setBetInput(Math.max(MIN_BET, betVal / 2).toFixed(2));
                    if (l === "MAX") setBetInput(bal.toFixed(2));
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-white/[0.03] text-white/25 text-[10px] font-medium active:bg-white/[0.06]"
                >{l}</button>
              ))}
            </div>

            <button
              onClick={start}
              disabled={betVal < MIN_BET || betVal > bal}
              className="w-full py-3.5 rounded-xl bg-[#4ade80] text-black font-bold text-sm active:scale-[0.98] transition-transform disabled:opacity-25"
            >
              {betVal > bal ? "Недостаточно средств" : "Играть"}
            </button>
          </>
        )}

        {phase === "playing" && (
          <button
            onClick={cashOut}
            disabled={safe === 0}
            className={`w-full py-3.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform
              ${safe > 0 ? "bg-[#4ade80] text-black" : "bg-white/[0.03] text-white/15"}`}
          >
            {safe > 0 ? `Забрать ${winAmount.toFixed(2)} ${sym}` : "Выберите ячейку"}
          </button>
        )}
      </div>
    </div>
  );
}
