import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const COIN_IMG = "https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/09505604-ab2c-4739-a8c6-b2fe02b7b598.jpg";

const COIN_SIZE = 90;
const VISIBLE_COINS = 5;
const TOTAL_COINS = 50;
const SPIN_DURATION = 4500;

type Rarity = "common" | "rare" | "epic" | "legendary";

interface Coin {
  value: number;
  label: string;
  rarity: Rarity;
  color: string;
  glow: string;
}

const RARITY_COLORS: Record<Rarity, { bg: string; glow: string; border: string; text: string }> = {
  common:    { bg: "from-gray-500 to-gray-700",     glow: "rgba(150,150,150,0.6)",  border: "#888",    text: "#ccc" },
  rare:      { bg: "from-blue-500 to-blue-800",     glow: "rgba(59,130,246,0.7)",   border: "#3b82f6", text: "#93c5fd" },
  epic:      { bg: "from-purple-500 to-purple-900", glow: "rgba(168,85,247,0.7)",   border: "#a855f7", text: "#d8b4fe" },
  legendary: { bg: "from-yellow-400 to-orange-600", glow: "rgba(251,191,36,0.9)",   border: "#fbbf24", text: "#fef08a" },
};

function getRarity(multiplier: number): Rarity {
  if (multiplier >= 5) return "legendary";
  if (multiplier >= 1.5) return "epic";
  if (multiplier >= 0.6) return "rare";
  return "common";
}

function getMultipliers(caseValue: number) {
  const decimals = caseValue < 10 ? 2 : caseValue < 100 ? 1 : 0;
  const round = (n: number) => parseFloat(n.toFixed(decimals));
  return {
    low:  [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5].map(m => round(caseValue * m)),
    mid:  [0.6, 0.75, 0.9, 1.1, 1.3, 1.5].map(m => round(caseValue * m)),
    high: [2, 3, 5, 8, 12].map(m => round(caseValue * m)),
  };
}

function generateCoins(currencySymbol: string, caseValue: number): Coin[] {
  const { low, mid, high } = getMultipliers(caseValue);
  const coins: Coin[] = [];
  for (let i = 0; i < TOTAL_COINS; i++) {
    const rand = Math.random();
    let val: number;
    if (rand < 0.65) val = low[Math.floor(Math.random() * low.length)];
    else if (rand < 0.90) val = mid[Math.floor(Math.random() * mid.length)];
    else val = high[Math.floor(Math.random() * high.length)];
    const rarity = getRarity(val / caseValue);
    const rc = RARITY_COLORS[rarity];
    coins.push({ value: val, label: `${val}${currencySymbol}`, rarity, color: rc.bg, glow: rc.glow });
  }
  return coins;
}

function pickWinValue(caseValue: number): number {
  const { low, mid, high } = getMultipliers(caseValue);
  const rand = Math.random();
  if (rand < 0.45) return low[Math.floor(Math.random() * low.length)];
  if (rand < 0.77) return mid[Math.floor(Math.random() * mid.length)];
  if (rand < 0.95) return high[0];
  if (rand < 0.98) return high[Math.floor(Math.random() * 3) + 1];
  return high[high.length - 1];
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  vx: number;
  vy: number;
}

function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const colors = ["#fbbf24", "#4ade80", "#f472b6", "#60a5fa", "#a78bfa", "#fb923c", "#f87171"];

  useEffect(() => {
    if (!active) return;
    const pts: Particle[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      y: -10,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 1,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
    }));
    setParticles(pts);
    const timeout = setTimeout(() => setParticles([]), 3500);
    return () => clearTimeout(timeout);
  }, [active]);

  if (!particles.length) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: p.color,
            transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
            animation: `confettiFall ${1.5 + Math.random() * 2}s ease-in forwards`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
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
  const [coins, setCoins] = useState<Coin[]>(() => generateCoins(currencySymbol, caseValue));
  const [spinning, setSpinning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [winCoin, setWinCoin] = useState<Coin | null>(null);
  const [offset, setOffset] = useState(0);
  const [notEnough, setNotEnough] = useState(false);
  const [deducted, setDeducted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [phase, setPhase] = useState<"spin" | "result">("spin");
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

    const desiredWinValue = pickWinValue(caseValue);
    let targetIdx = coins.findIndex((c) => c.value === desiredWinValue);
    if (targetIdx === -1 || targetIdx < VISIBLE_COINS + 5) {
      for (let i = TOTAL_COINS - 10; i >= VISIBLE_COINS + 5; i--) {
        if (coins[i].value === desiredWinValue) { targetIdx = i; break; }
      }
    }
    if (targetIdx < VISIBLE_COINS + 5) {
      const rarity = getRarity(desiredWinValue / caseValue);
      const rc = RARITY_COLORS[rarity];
      coins[TOTAL_COINS - 8] = { value: desiredWinValue, label: `${desiredWinValue}${currencySymbol}`, rarity, color: rc.bg, glow: rc.glow };
      targetIdx = TOTAL_COINS - 8;
    }

    winIndexRef.current = targetIdx;
    setSpinning(true);

    const containerWidth = containerRef.current?.offsetWidth || COIN_SIZE * VISIBLE_COINS;
    const centerOffset = containerWidth / 2 - COIN_SIZE / 2;
    const targetOffset = targetIdx * (COIN_SIZE + 16) - centerOffset;

    const startTime = performance.now();

    function easeOutQuart(t: number) {
      return 1 - Math.pow(1 - t, 4);
    }

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      const eased = easeOutQuart(progress);
      setOffset(targetOffset * eased);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setFinished(true);
        const wc = coins[targetIdx];
        setWinCoin(wc);
        onBalanceChange(wc.value);
        setTimeout(() => {
          setShowResult(true);
          setPhase("result");
          if (wc.rarity === "epic" || wc.rarity === "legendary") {
            setConfettiActive(true);
          }
        }, 600);
      }
    }

    animRef.current = requestAnimationFrame(animate);
  }, [spinning, finished, coins, currencySymbol, balance, caseValue, deducted, onBalanceChange]);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => startSpin(), 600);
    return () => clearTimeout(timer);
  }, [startSpin]);

  const handleOpenAgain = () => {
    if (balance < caseValue) { setNotEnough(true); return; }
    const newCoins = generateCoins(currencySymbol, caseValue);
    setCoins(newCoins);
    setSpinning(false);
    setFinished(false);
    setWinCoin(null);
    setOffset(0);
    setNotEnough(false);
    setDeducted(false);
    setShowResult(false);
    setConfettiActive(false);
    setPhase("spin");
    setTimeout(() => startSpin(), 100);
  };

  const winRarityData = winCoin ? RARITY_COLORS[winCoin.rarity] : null;

  const rarityLabel: Record<Rarity, string> = {
    common: "Обычный",
    rare: "Редкий",
    epic: "Эпический",
    legendary: "Легендарный",
  };

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
        }
        @keyframes spinnerGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(74,222,128,0.4); }
          50% { box-shadow: 0 0 40px rgba(74,222,128,0.9), 0 0 60px rgba(74,222,128,0.4); }
        }
        @keyframes coinPulse {
          0%, 100% { transform: scale(1.1); }
          50% { transform: scale(1.18); }
        }
        @keyframes resultSlideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.85); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bigCoinAppear {
          0% { opacity: 0; transform: scale(0.3) rotate(-20deg); }
          60% { transform: scale(1.15) rotate(5deg); }
          80% { transform: scale(0.95) rotate(-2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes starSparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(0); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-60px); }
        }
        @keyframes scanLine {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>

      <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: "linear-gradient(180deg, #0a0a1a 0%, #0d0d20 50%, #0a0a18 100%)" }}>
        
        {phase === "spin" && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 pt-5 pb-4">
              <button onClick={onClose} className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors">
                <Icon name="ChevronLeft" size={18} />
                <span className="text-sm">Другие кейсы</span>
              </button>
              <div className="text-center">
                <div className="text-white/40 text-[10px] uppercase tracking-widest">Кейс</div>
                <div className="text-white font-bold text-base">{caseValue}{currencySymbol}</div>
              </div>
              <div className="w-20" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
              <div className="w-full relative">
                <div
                  className="absolute left-1/2 -translate-x-1/2 -top-3 z-30"
                  style={{ filter: "drop-shadow(0 0 8px #4ade80)" }}
                >
                  <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[18px] border-l-transparent border-r-transparent border-t-[#4ade80]" />
                </div>
                <div
                  className="absolute left-1/2 -translate-x-1/2 -bottom-3 z-30"
                  style={{ filter: "drop-shadow(0 0 8px #4ade80)" }}
                >
                  <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[18px] border-l-transparent border-r-transparent border-b-[#4ade80]" />
                </div>

                <div
                  className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] z-20 rounded-full"
                  style={{
                    background: "linear-gradient(180deg, transparent, #4ade80, transparent)",
                    animation: spinning ? "spinnerGlow 0.8s ease-in-out infinite" : "none",
                    boxShadow: "0 0 12px rgba(74,222,128,0.6)",
                  }}
                />

                <div
                  className="overflow-hidden rounded-2xl"
                  ref={containerRef}
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: spinning ? "0 0 40px rgba(74,222,128,0.15), inset 0 0 30px rgba(0,0,0,0.4)" : "inset 0 0 30px rgba(0,0,0,0.4)",
                  }}
                >
                  <div className="py-3 px-2">
                    <div
                      className="flex gap-4"
                      style={{ transform: `translateX(-${offset}px)`, willChange: "transform" }}
                    >
                      {coins.map((coin, i) => {
                        const rc = RARITY_COLORS[coin.rarity];
                        const isWin = finished && i === winIndexRef.current;
                        return (
                          <div
                            key={i}
                            className="flex-shrink-0 flex flex-col items-center justify-center rounded-full relative"
                            style={{
                              width: COIN_SIZE,
                              height: COIN_SIZE,
                              background: `radial-gradient(circle at 35% 35%, ${rc.border}33, transparent 70%)`,
                              border: `2px solid ${isWin ? rc.border : rc.border + "55"}`,
                              boxShadow: isWin ? `0 0 24px ${rc.glow}, 0 0 48px ${rc.glow}55` : `0 0 8px ${rc.glow}33`,
                              animation: isWin ? "coinPulse 0.8s ease-in-out infinite" : "none",
                              transition: "all 0.3s ease",
                            }}
                          >
                            <img src={COIN_IMG} alt="coin" className="w-full h-full rounded-full object-cover opacity-70" draggable={false} />
                            <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.25), transparent 60%)` }} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-white font-extrabold leading-none" style={{ fontSize: coin.value >= 100 ? 13 : 16, textShadow: `0 0 10px ${rc.glow}, 0 2px 4px rgba(0,0,0,0.9)` }}>
                                {coin.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none rounded-l-2xl" style={{ background: "linear-gradient(90deg, #0a0a1a, transparent)" }} />
                <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none rounded-r-2xl" style={{ background: "linear-gradient(270deg, #0a0a1a, transparent)" }} />
              </div>

              {spinning && (
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#4ade80]"
                      style={{ animation: `floatUp 1.2s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              )}

              {notEnough && !spinning && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Icon name="AlertCircle" size={28} className="text-red-400" />
                  </div>
                  <span className="text-red-400 font-bold text-base">Недостаточно средств</span>
                  <span className="text-white/40 text-sm text-center">
                    Нужно {caseValue}{currencySymbol} — у тебя {balance.toFixed(2)}{currencySymbol}
                  </span>
                </div>
              )}
            </div>

            <div className="px-4 pb-8 pt-4">
              <button
                onClick={onClose}
                disabled={spinning}
                className="w-full py-4 rounded-2xl text-white/60 text-sm font-medium transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {spinning ? "Открываем..." : "Закрыть"}
              </button>
            </div>
          </div>
        )}

        {phase === "result" && winCoin && winRarityData && showResult && (
          <div className="relative flex flex-col h-full items-center overflow-hidden">
            <Confetti active={confettiActive} />

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 40%, ${winRarityData.glow}22 0%, transparent 70%)`,
              }}
            />

            <div className="flex items-center justify-between w-full px-4 pt-5 pb-2">
              <button onClick={onClose} className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors">
                <Icon name="ChevronLeft" size={18} />
                <span className="text-sm">Другие кейсы</span>
              </button>
              <div className="w-16" />
            </div>

            <div
              className="flex flex-col items-center flex-1 justify-center px-8 w-full"
              style={{ animation: "resultSlideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}
            >
              <div className="text-white/60 text-base mb-1">Поздравляем!</div>
              <div className="text-white font-extrabold text-2xl mb-6">Вы выиграли</div>

              <div className="relative mb-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3"
                    style={{
                      top: `${50 + 55 * Math.sin((i * Math.PI * 2) / 8)}%`,
                      left: `${50 + 55 * Math.cos((i * Math.PI * 2) / 8)}%`,
                      transform: "translate(-50%, -50%)",
                      animation: `starSparkle 1.5s ease-in-out infinite`,
                      animationDelay: `${i * 0.18}s`,
                    }}
                  >
                    <div className="w-full h-full" style={{ color: winRarityData.text }}>✦</div>
                  </div>
                ))}

                <div
                  className="w-48 h-48 rounded-full flex flex-col items-center justify-center relative overflow-hidden"
                  style={{
                    background: `radial-gradient(circle at 35% 30%, ${winRarityData.border}99, ${winRarityData.border}22)`,
                    border: `3px solid ${winRarityData.border}`,
                    boxShadow: `0 0 40px ${winRarityData.glow}, 0 0 80px ${winRarityData.glow}66, 0 0 120px ${winRarityData.glow}33`,
                    animation: "bigCoinAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                  }}
                >
                  <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.3), transparent 60%)" }} />
                  <div className="absolute inset-1 rounded-full" style={{ border: `1px solid ${winRarityData.border}55` }} />

                  <span
                    className="font-extrabold relative z-10"
                    style={{
                      fontSize: winCoin.value >= 1000 ? 28 : winCoin.value >= 100 ? 34 : 40,
                      color: "#fff",
                      textShadow: `0 0 20px ${winRarityData.glow}, 0 2px 8px rgba(0,0,0,0.8)`,
                    }}
                  >
                    {winCoin.value}
                  </span>
                  <span className="font-bold text-xl relative z-10" style={{ color: winRarityData.text, textShadow: `0 0 10px ${winRarityData.glow}` }}>
                    {currencySymbol}
                  </span>
                </div>
              </div>

              <div
                className="px-4 py-1.5 rounded-full text-sm font-bold mb-8"
                style={{
                  background: `${winRarityData.border}22`,
                  border: `1px solid ${winRarityData.border}66`,
                  color: winRarityData.text,
                }}
              >
                {rarityLabel[winCoin.rarity]}
              </div>

              <div className="flex flex-col gap-3 w-full px-0">
                <button
                  onClick={handleOpenAgain}
                  className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.97]"
                  style={{
                    background: `linear-gradient(135deg, ${winRarityData.border}, ${winRarityData.border}88)`,
                    color: winCoin.rarity === "legendary" ? "#000" : "#fff",
                    boxShadow: `0 4px 20px ${winRarityData.glow}66`,
                  }}
                >
                  Открыть ещё раз за {caseValue}{currencySymbol}
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl font-semibold text-sm text-white/70 transition-all active:scale-[0.97]"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Забрать
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}