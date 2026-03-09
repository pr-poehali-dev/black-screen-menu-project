import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const COIN_SIZE = 90;
const VISIBLE_COINS = 5;
const TOTAL_COINS = 50;
const SPIN_DURATION = 4500;

type Rarity = "common" | "rare" | "epic" | "legendary";

interface Coin {
  value: number;
  label: string;
  rarity: Rarity;
}

const RARITY_COLORS: Record<Rarity, {
  bg1: string; bg2: string; bg3: string;
  glow: string; border: string; text: string;
  confetti: string[];
}> = {
  common: {
    bg1: "#6b7280", bg2: "#4b5563", bg3: "#374151",
    glow: "rgba(156,163,175,0.7)", border: "#9ca3af", text: "#e5e7eb",
    confetti: ["#9ca3af", "#d1d5db", "#6b7280", "#f3f4f6"],
  },
  rare: {
    bg1: "#3b82f6", bg2: "#1d4ed8", bg3: "#1e3a8a",
    glow: "rgba(59,130,246,0.8)", border: "#60a5fa", text: "#bfdbfe",
    confetti: ["#3b82f6", "#60a5fa", "#93c5fd", "#1d4ed8", "#06b6d4"],
  },
  epic: {
    bg1: "#a855f7", bg2: "#7c3aed", bg3: "#581c87",
    glow: "rgba(168,85,247,0.85)", border: "#c084fc", text: "#e9d5ff",
    confetti: ["#a855f7", "#c084fc", "#d8b4fe", "#f472b6", "#ec4899", "#7c3aed"],
  },
  legendary: {
    bg1: "#f59e0b", bg2: "#d97706", bg3: "#b45309",
    glow: "rgba(251,191,36,0.95)", border: "#fbbf24", text: "#fef08a",
    confetti: ["#fbbf24", "#fde68a", "#f59e0b", "#fb923c", "#ef4444", "#a3e635", "#34d399"],
  },
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
    coins.push({ value: val, label: `${val}${currencySymbol}`, rarity });
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

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  rotation: number;
  scale: number;
  shape: "rect" | "circle" | "star";
  delay: number;
  duration: number;
}

function Confetti({ active, rarity }: { active: boolean; rarity: Rarity }) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const colors = RARITY_COLORS[rarity].confetti;
  const count = rarity === "legendary" ? 90 : rarity === "epic" ? 70 : rarity === "rare" ? 50 : 30;

  useEffect(() => {
    if (!active) return;
    const pts: ConfettiParticle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 1.2,
      shape: (["rect", "circle", "star"] as const)[Math.floor(Math.random() * 3)],
      delay: Math.random() * 0.6,
      duration: 1.8 + Math.random() * 2,
    }));
    setParticles(pts);
    const timeout = setTimeout(() => setParticles([]), 4000);
    return () => clearTimeout(timeout);
  }, [active]);

  if (!particles.length) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: "-20px",
            width: p.shape === "star" ? 12 : p.shape === "circle" ? 8 : 8,
            height: p.shape === "star" ? 12 : p.shape === "circle" ? 8 : 12,
            background: p.shape === "circle" ? p.color : undefined,
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "rect" ? "2px" : "0",
            color: p.shape === "star" ? p.color : undefined,
            fontSize: p.shape === "star" ? 14 : undefined,
            backgroundColor: p.shape === "rect" ? p.color : undefined,
            transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
            animation: `confettiFall ${p.duration}s ease-in forwards`,
            animationDelay: `${p.delay}s`,
            opacity: 0,
          }}
        >
          {p.shape === "star" ? "★" : null}
        </div>
      ))}
    </div>
  );
}

function CoinVisual({
  rarity,
  value,
  symbol,
  size,
  isWin,
  spinning,
}: {
  rarity: Rarity;
  value: number;
  symbol: string;
  size: number;
  isWin?: boolean;
  spinning?: boolean;
}) {
  const rc = RARITY_COLORS[rarity];
  const fontSize = size < 70 ? (value >= 100 ? 11 : 13) : size < 100 ? (value >= 100 ? 13 : 16) : (value >= 1000 ? 28 : value >= 100 ? 34 : 40);
  const symSize = size < 70 ? 10 : size < 100 ? 14 : 20;

  return (
    <div
      className="relative flex-shrink-0 flex flex-col items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 28%, ${rc.bg1}, ${rc.bg2} 50%, ${rc.bg3})`,
        border: `${size >= 140 ? 3 : 2}px solid ${isWin ? rc.border : rc.border + "88"}`,
        boxShadow: isWin
          ? `0 0 30px ${rc.glow}, 0 0 60px ${rc.glow}66, inset 0 1px 0 rgba(255,255,255,0.3)`
          : `0 0 10px ${rc.glow}44, inset 0 1px 0 rgba(255,255,255,0.2)`,
        animation: isWin ? "coinPulse 0.8s ease-in-out infinite" : spinning ? "coinSpin 0.3s linear infinite" : "none",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle at 35% 25%, rgba(255,255,255,0.35), transparent 55%)" }}
      />
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle at 65% 80%, rgba(0,0,0,0.3), transparent 50%)" }}
      />
      {size >= 140 && (
        <div
          className="absolute inset-3 rounded-full pointer-events-none"
          style={{ border: `1px solid ${rc.border}44` }}
        />
      )}
      <span
        className="font-extrabold relative z-10 leading-none"
        style={{
          fontSize,
          color: "#fff",
          textShadow: `0 0 12px ${rc.glow}, 0 2px 4px rgba(0,0,0,0.9)`,
        }}
      >
        {value}
      </span>
      <span
        className="font-bold relative z-10 leading-none"
        style={{
          fontSize: symSize,
          color: rc.text,
          textShadow: `0 0 8px ${rc.glow}`,
        }}
      >
        {symbol}
      </span>
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
      coins[TOTAL_COINS - 8] = { value: desiredWinValue, label: `${desiredWinValue}${currencySymbol}`, rarity };
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
          setConfettiActive(true);
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
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes spinnerGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(74,222,128,0.4); }
          50%       { box-shadow: 0 0 50px rgba(74,222,128,1), 0 0 80px rgba(74,222,128,0.5); }
        }
        @keyframes coinPulse {
          0%, 100% { transform: scale(1.08); }
          50%       { transform: scale(1.16); }
        }
        @keyframes coinSpin {
          0%   { filter: brightness(1); }
          50%  { filter: brightness(1.3); }
          100% { filter: brightness(1); }
        }
        @keyframes resultSlideUp {
          from { opacity: 0; transform: translateY(50px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bigCoinAppear {
          0%   { opacity: 0; transform: scale(0.2) rotate(-30deg); }
          60%  { transform: scale(1.18) rotate(6deg); }
          80%  { transform: scale(0.94) rotate(-2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes starSparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50%       { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes floatDot {
          0%   { opacity: 0; transform: translateY(0) scale(0.8); }
          30%  { opacity: 1; transform: translateY(-6px) scale(1); }
          100% { opacity: 0; transform: translateY(-20px) scale(0.6); }
        }
        @keyframes shimmerBar {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }
        @keyframes rarityBadgePop {
          0%   { opacity: 0; transform: scale(0.5); }
          70%  { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[300] flex flex-col"
        style={{ background: "linear-gradient(180deg, #080812 0%, #0d0d1f 50%, #08080f 100%)" }}
      >
        {phase === "spin" && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 pt-5 pb-4">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors"
              >
                <Icon name="ChevronLeft" size={18} />
                <span className="text-sm">Другие кейсы</span>
              </button>
              <div className="text-center">
                <div className="text-white/40 text-[10px] uppercase tracking-widest">Кейс</div>
                <div className="text-white font-bold text-base">{caseValue}{currencySymbol}</div>
              </div>
              <div className="w-20" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8">
              <div className="w-full relative">
                <div
                  className="absolute left-1/2 -translate-x-1/2 -top-4 z-30"
                  style={{ filter: "drop-shadow(0 0 10px #4ade80)" }}
                >
                  <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[20px] border-l-transparent border-r-transparent border-t-[#4ade80]" />
                </div>
                <div
                  className="absolute left-1/2 -translate-x-1/2 -bottom-4 z-30"
                  style={{ filter: "drop-shadow(0 0 10px #4ade80)" }}
                >
                  <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-b-[20px] border-l-transparent border-r-transparent border-b-[#4ade80]" />
                </div>

                <div
                  className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] z-20 rounded-full"
                  style={{
                    background: "linear-gradient(180deg, transparent, #4ade80 30%, #4ade80 70%, transparent)",
                    animation: spinning ? "spinnerGlow 0.7s ease-in-out infinite" : "none",
                    boxShadow: "0 0 14px rgba(74,222,128,0.8)",
                  }}
                />

                <div
                  className="overflow-hidden rounded-2xl"
                  ref={containerRef}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: spinning
                      ? "0 0 50px rgba(74,222,128,0.2), inset 0 0 40px rgba(0,0,0,0.5)"
                      : "inset 0 0 40px rgba(0,0,0,0.5)",
                  }}
                >
                  <div className="py-3 px-2">
                    <div
                      className="flex gap-4"
                      style={{ transform: `translateX(-${offset}px)`, willChange: "transform" }}
                    >
                      {coins.map((coin, i) => {
                        const isWin = finished && i === winIndexRef.current;
                        return (
                          <CoinVisual
                            key={i}
                            rarity={coin.rarity}
                            value={coin.value}
                            symbol={currencySymbol}
                            size={COIN_SIZE}
                            isWin={isWin}
                            spinning={spinning}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div
                  className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none rounded-l-2xl"
                  style={{ background: "linear-gradient(90deg, #080812, transparent)" }}
                />
                <div
                  className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none rounded-r-2xl"
                  style={{ background: "linear-gradient(270deg, #080812, transparent)" }}
                />
              </div>

              {spinning && (
                <div className="flex gap-2 items-end h-6">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: `hsl(${120 + i * 30}, 80%, 60%)`,
                        animation: `floatDot 1s ease-in-out infinite`,
                        animationDelay: `${i * 0.15}s`,
                      }}
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
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {spinning ? "Крутим..." : "Закрыть"}
              </button>
            </div>
          </div>
        )}

        {phase === "result" && winCoin && winRarityData && showResult && (
          <div className="relative flex flex-col h-full items-center overflow-hidden">
            <Confetti active={confettiActive} rarity={winCoin.rarity} />

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 35%, ${winRarityData.glow}30 0%, transparent 65%)`,
                animation: "glowPulse 2s ease-in-out infinite",
              }}
            />

            <div className="flex items-center justify-between w-full px-4 pt-5 pb-2">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors"
              >
                <Icon name="ChevronLeft" size={18} />
                <span className="text-sm">Другие кейсы</span>
              </button>
              <div className="w-16" />
            </div>

            <div
              className="flex flex-col items-center flex-1 justify-center px-8 w-full"
              style={{ animation: "resultSlideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}
            >
              <div className="text-white/50 text-sm mb-1 tracking-wide uppercase">Поздравляем!</div>
              <div className="text-white font-extrabold text-3xl mb-8">Вы выиграли</div>

              <div className="relative mb-6">
                {[...Array(winCoin.rarity === "legendary" ? 12 : winCoin.rarity === "epic" ? 10 : 8)].map((_, i) => {
                  const total = winCoin.rarity === "legendary" ? 12 : winCoin.rarity === "epic" ? 10 : 8;
                  const sparkleColors = winRarityData.confetti;
                  return (
                    <div
                      key={i}
                      className="absolute text-base"
                      style={{
                        top: `${50 + 58 * Math.sin((i * Math.PI * 2) / total)}%`,
                        left: `${50 + 58 * Math.cos((i * Math.PI * 2) / total)}%`,
                        transform: "translate(-50%, -50%)",
                        animation: `starSparkle 1.8s ease-in-out infinite`,
                        animationDelay: `${i * 0.15}s`,
                        color: sparkleColors[i % sparkleColors.length],
                        filter: `drop-shadow(0 0 4px ${sparkleColors[i % sparkleColors.length]})`,
                      }}
                    >
                      {winCoin.rarity === "legendary" ? "★" : "✦"}
                    </div>
                  );
                })}

                <CoinVisual
                  rarity={winCoin.rarity}
                  value={winCoin.value}
                  symbol={currencySymbol}
                  size={192}
                />
              </div>

              <div
                className="px-5 py-1.5 rounded-full text-sm font-bold mb-8"
                style={{
                  background: `${winRarityData.border}25`,
                  border: `1px solid ${winRarityData.border}77`,
                  color: winRarityData.text,
                  animation: "rarityBadgePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both",
                  boxShadow: `0 0 16px ${winRarityData.glow}44`,
                }}
              >
                {rarityLabel[winCoin.rarity]}
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={handleOpenAgain}
                  className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.97]"
                  style={{
                    background: `linear-gradient(135deg, ${winRarityData.bg1}, ${winRarityData.bg2})`,
                    color: winCoin.rarity === "legendary" ? "#1a0a00" : "#fff",
                    boxShadow: `0 4px 24px ${winRarityData.glow}77`,
                    border: `1px solid ${winRarityData.border}55`,
                  }}
                >
                  Открыть ещё раз за {caseValue}{currencySymbol}
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl font-semibold text-sm text-white/70 transition-all active:scale-[0.97]"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Забрать и выйти
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
