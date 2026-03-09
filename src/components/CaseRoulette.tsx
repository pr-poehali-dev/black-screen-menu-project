import { useState, useEffect, useRef, useCallback } from "react";

const COIN_IMG = "https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/09505604-ab2c-4739-a8c6-b2fe02b7b598.jpg";

const COIN_SIZE = 80;
const VISIBLE_COINS = 5;
const TOTAL_COINS = 40;
const SPIN_DURATION = 3000;

function generateCoins(currencySymbol: string): { value: number; label: string }[] {
  const lowValues = [1, 1, 1, 1, 1, 3, 3, 3, 5, 5, 5, 2, 2, 4, 4];
  const midValues = [10, 15, 20, 25, 30, 50];
  const highValues = [100, 200, 300, 500, 750, 1000];

  const coins: { value: number; label: string }[] = [];
  for (let i = 0; i < TOTAL_COINS; i++) {
    const rand = Math.random();
    let val: number;
    if (rand < 0.65) {
      val = lowValues[Math.floor(Math.random() * lowValues.length)];
    } else if (rand < 0.9) {
      val = midValues[Math.floor(Math.random() * midValues.length)];
    } else {
      val = highValues[Math.floor(Math.random() * highValues.length)];
    }
    coins.push({ value: val, label: `${val}${currencySymbol}` });
  }
  return coins;
}

function pickWinIndex(): number {
  const rand = Math.random();
  let winValue: number;
  if (rand < 0.45) winValue = 1;
  else if (rand < 0.65) winValue = 3;
  else if (rand < 0.82) winValue = 5;
  else if (rand < 0.90) winValue = 10;
  else if (rand < 0.95) winValue = 25;
  else if (rand < 0.98) winValue = 100;
  else winValue = 500;
  return winValue;
}

interface CaseRouletteProps {
  caseValue: number;
  currency: "usdt" | "stars";
  balance: number;
  onBalanceChange: (delta: number) => void;
  onClose: () => void;
}

export default function CaseRoulette({ caseValue, currency, balance, onBalanceChange, onClose }: CaseRouletteProps) {
  const currencySymbol = currency === "usdt" ? "$" : "★";
  const [coins] = useState(() => generateCoins(currencySymbol));
  const [spinning, setSpinning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [winCoin, setWinCoin] = useState<{ value: number; label: string } | null>(null);
  const [offset, setOffset] = useState(0);
  const [notEnough, setNotEnough] = useState(false);
  const [deducted, setDeducted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  const winIndexRef = useRef(0);

  const startSpin = useCallback(() => {
    if (spinning || finished) return;

    if (balance < caseValue) {
      setNotEnough(true);
      return;
    }

    if (!deducted) {
      onBalanceChange(-caseValue);
      setDeducted(true);
    }

    const desiredWinValue = pickWinIndex();
    let targetIdx = coins.findIndex((c) => c.value === desiredWinValue);
    if (targetIdx === -1 || targetIdx < VISIBLE_COINS + 5) {
      for (let i = TOTAL_COINS - 10; i >= VISIBLE_COINS + 5; i--) {
        if (coins[i].value === desiredWinValue) {
          targetIdx = i;
          break;
        }
      }
    }
    if (targetIdx < VISIBLE_COINS + 5) {
      coins[TOTAL_COINS - 8] = { value: desiredWinValue, label: `${desiredWinValue}${currencySymbol}` };
      targetIdx = TOTAL_COINS - 8;
    }

    winIndexRef.current = targetIdx;
    setSpinning(true);

    const containerWidth = (containerRef.current?.offsetWidth || COIN_SIZE * VISIBLE_COINS);
    const centerOffset = containerWidth / 2 - COIN_SIZE / 2;
    const targetOffset = targetIdx * (COIN_SIZE + 12) - centerOffset;

    const startTime = performance.now();
    const startOffset = 0;

    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      const eased = easeOutCubic(progress);
      const currentOffset = startOffset + (targetOffset - startOffset) * eased;
      setOffset(currentOffset);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setFinished(true);
        setWinCoin(coins[targetIdx]);
        onBalanceChange(coins[targetIdx].value);
      }
    }

    animRef.current = requestAnimationFrame(animate);
  }, [spinning, finished, coins, currencySymbol, balance, caseValue, deducted, onBalanceChange]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => startSpin(), 500);
    return () => clearTimeout(timer);
  }, [startSpin]);

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-white font-bold text-lg">
            Кейс {caseValue}{currencySymbol}
          </span>
        </div>

        <div className="relative w-full overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-3" ref={containerRef}>
          <div className="absolute left-1/2 top-0 -translate-x-1/2 z-20 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-[#4ade80]" />
          </div>

          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 z-20 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-l-transparent border-r-transparent border-b-[#4ade80]" />
          </div>

          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[2px] bg-[#4ade80]/40 z-10" />

          <div className="overflow-hidden">
            <div
              className="flex gap-3 transition-none"
              style={{
                transform: `translateX(-${offset}px)`,
              }}
            >
              {coins.map((coin, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 flex flex-col items-center justify-center rounded-full relative ${
                    finished && i === winIndexRef.current ? "ring-4 ring-[#4ade80] scale-110" : ""
                  }`}
                  style={{ width: COIN_SIZE, height: COIN_SIZE, transition: finished && i === winIndexRef.current ? "all 0.3s" : "none" }}
                >
                  <img
                    src={COIN_IMG}
                    alt="coin"
                    className="w-full h-full rounded-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-white font-extrabold text-[15px] leading-none"
                      style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
                    >
                      {coin.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {notEnough && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <span className="text-red-400 font-bold text-base">Недостаточно средств</span>
            <span className="text-white/50 text-sm">
              Нужно: {caseValue}{currencySymbol} — Баланс: {balance.toFixed(2)}{currencySymbol}
            </span>
          </div>
        )}

        {finished && winCoin && (
          <div className="mt-6 flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
            <div className="text-[#4ade80] font-extrabold text-3xl">
              +{winCoin.label}
            </div>
            <span className="text-white/60 text-sm">Ваш выигрыш</span>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-white/10 text-white font-bold text-sm active:scale-[0.97] transition-transform"
        >
          {finished ? "Забрать" : "Закрыть"}
        </button>
      </div>
    </div>
  );
}