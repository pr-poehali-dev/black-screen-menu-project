import { useState, useCallback, useEffect } from "react";
import JaguarGems from "@/components/JaguarGems";
import CrashX from "@/components/CrashX";
import CaseRoulette from "@/components/CaseRoulette";

const copyId = (id: string | number) => {
  navigator.clipboard.writeText(String(id));
};

const bannerSlides = [
  {
    image: "https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/119e1251-5c5f-4c3d-9acd-794f1155e812.png",
  },
  {
    image: "https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/69dd2a08-18b8-4b2a-a6ed-c437a5509da5.png",
  },

];
import Icon from "@/components/ui/icon";
import AuthScreen from "@/components/AuthScreen";
import AdminPanel from "@/components/AdminPanel";
import { useTelegramAuth } from "@/components/extensions/telegram-bot/useTelegramAuth";

const TG_AUTH_URL = "https://functions.poehali.dev/420b5ea1-6f3d-420d-bb72-398ac6d4f617";
const CRYPTO_PAY_URL = "https://functions.poehali.dev/892f6456-5e1e-4974-9df1-9e4ce3603ae9";
const BALANCE_URL = "https://functions.poehali.dev/9b313374-9637-4e08-aacd-2659b84a6074";
const PAYMENTS_URL = "https://functions.poehali.dev/6f062055-7c07-4741-9e3a-0ae795f0c0df";
const TG_BOT_USERNAME = "Jaguar_Official_bot";
const ADMIN_CHECK_URL = "https://functions.poehali.dev/6eb840f4-abc2-453e-a7d9-5f9a989722bf";
const WITHDRAWAL_URL = "https://functions.poehali.dev/9cfe3eb3-a1dd-4e28-806b-4476909e4725";
const VOUCHER_URL = "https://functions.poehali.dev/67465d27-c387-428b-a82c-c47b677094b2";

const USDT_ICON = "https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/521d6370-ca4b-47aa-9be0-a7e2edc0027f.jpg";
const TG_STARS_ICON = "https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/files/182f0046-3f4d-43a9-b878-2bbee30070c6.jpg";

const STARS_RATE = 0.02;
const usdtToStars = (usdt: number) => Math.round(usdt / STARS_RATE);

const WITHDRAW_NETWORKS = [
  { id: "ERC20", name: "Tether ERC20", label: "ERC20", color: "#50AF95" },
  { id: "TRC20", name: "Tether TRC20", label: "TRC20", color: "#50AF95" },
  { id: "BEP20", name: "Tether BEP20", label: "BEP20", color: "#50AF95" },
  { id: "TON", name: "Tether TON", label: "TON", color: "#50AF95" },
];

const navItems = [
  { icon: "Menu", label: "Меню" },
  { icon: "Home", label: "Главная" },
  { icon: "Spade", label: "Казино", fallback: "Clover" },
  { icon: "BadgeDollarSign", label: "Free money" },
  { icon: "Briefcase", label: "Кейсы" },
];

const menuItems = [
  { icon: "Spade", label: "Казино", fallback: "Clover", desc: "Слоты и игры", color: "#4ade80" },
  { icon: "Briefcase", label: "Кейсы", desc: "Открывай и выигрывай", color: "#3b82f6" },
  { icon: "Gift", label: "Бонусы", desc: "Фриспины и акции", color: "#f5a623" },
  { icon: "Headphones", label: "Поддержка 24/7", desc: "Быстрая помощь", color: "#a78bfa" },
];

const profileSections = [
  {
    items: [
      { icon: "Gift", label: "Бонусы", desc: "Фриспины и другие предложения" },
      { icon: "Ticket", label: "Ваучеры", desc: "Активация кода" },
    ],
  },
  {
    items: [
      { icon: "Coins", label: "История платежей", desc: "Статусы депозитов и выводов", fallback: "Wallet" },
      { icon: "Headphones", label: "Поддержка 24/7", desc: "Все способы связи" },
    ],
  },
];

const Index = () => {
  const [active, setActive] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [cryptoPayOpen, setCryptoPayOpen] = useState(false);
  const [tgStarsOpen, setTgStarsOpen] = useState(false);
  const [tgStarsAmount, setTgStarsAmount] = useState("10");
  const [tgStarsError, setTgStarsError] = useState("");
  const [tgStarsLoading, setTgStarsLoading] = useState(false);
  const [bonusOpen, setBonusOpen] = useState(false);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [voucherSuccess, setVoucherSuccess] = useState<{ amount: number } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<"all" | "deposits" | "withdrawals">("all");
  const [payments, setPayments] = useState<Array<{id:number;amount:number;status:string;type:string;created_at:string|null;paid_at:string|null}>>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState("5");
  const [depositError, setDepositError] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [starsBalance, setStarsBalance] = useState(0);
  const [currency, setCurrency] = useState<"usdt" | "stars">("usdt");
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState(0);
  const [adminOpen, setAdminOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState(1);
  const [withdrawNetwork, setWithdrawNetwork] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("15");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawSearch, setWithdrawSearch] = useState("");
  const [starsWithdrawOpen, setStarsWithdrawOpen] = useState(false);
  const [starsWithdrawAmount, setStarsWithdrawAmount] = useState("100");
  const [starsWithdrawUsername, setStarsWithdrawUsername] = useState("");
  const [starsWithdrawError, setStarsWithdrawError] = useState("");
  const [starsWithdrawLoading, setStarsWithdrawLoading] = useState(false);
  const [starsWithdrawSuccess, setStarsWithdrawSuccess] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [crashOpen, setCrashOpen] = useState(false);
  const [caseRouletteOpen, setCaseRouletteOpen] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const tgAuth = useTelegramAuth({
    apiUrls: {
      callback: `${TG_AUTH_URL}?action=callback`,
      refresh: `${TG_AUTH_URL}?action=refresh`,
      logout: `${TG_AUTH_URL}?action=logout`,
    },
    botUsername: TG_BOT_USERNAME,
  });

  const isAuthed = tgAuth.isAuthenticated;
  const isLoadingAuth = tgAuth.isLoading;
  const currentUser = tgAuth.user;

  const userId = currentUser?.id != null ? String(currentUser.id) : "";

  const fetchBalance = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${BALANCE_URL}?user_id=${encodeURIComponent(String(userId))}`);
      const data = await res.json();
      if (res.ok) {
        setUserBalance(data.balance || 0);
        setStarsBalance(data.stars_balance || 0);
      }
    } catch { /* ignore */ }
  }, [userId]);

  useEffect(() => {
    if (isAuthed && userId) fetchBalance();
  }, [isAuthed, userId, fetchBalance]);

  useEffect(() => {
    if (!isAuthed || !currentUser?.display_id) return;
    (async () => {
      try {
        const res = await fetch(`${ADMIN_CHECK_URL}?action=check&display_id=${currentUser.display_id}`);
        const data = await res.json();
        if (data.is_admin) { setIsAdmin(true); setAdminRole(data.role); }
      } catch { /* */ }
    })();
  }, [isAuthed, currentUser?.display_id]);

  const fetchPayments = useCallback(async (type: string) => {
    if (!userId) return;
    setPaymentsLoading(true);
    try {
      const res = await fetch(`${PAYMENTS_URL}?user_id=${encodeURIComponent(userId)}&type=${type}`);
      const data = await res.json();
      if (res.ok) setPayments(data.payments || []);
    } catch { /* ignore */ }
    setPaymentsLoading(false);
  }, [userId]);

  const handleLogout = useCallback(async () => {
    await tgAuth.logout();
    window.location.reload();
  }, [tgAuth]);

  const handleNavClick = (index: number) => {
    if (index === 0) {
      setMenuOpen(true);
    } else {
      setActive(index);
    }
  };

  const openProfile = () => {
    setMenuOpen(false);
    setProfileOpen(true);
  };

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-[#4ade80] font-extrabold text-2xl tracking-wide uppercase animate-pulse">
          Jaguar
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return <AuthScreen onAuth={() => window.location.reload()} />;
  }

  return (
    <div className="w-full flex flex-col touch-manipulation relative" style={{ minHeight: "100svh" }}>
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative w-[85%] max-w-[360px] h-full bg-black border-r border-[#4ade80]/30 flex flex-col animate-slide-in overflow-y-auto">
            <button
              onClick={openProfile}
              className="flex items-center gap-3 px-5 pt-5 pb-4 active:bg-white/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-full border border-[#4ade80]/30 bg-white/5 flex items-center justify-center">
                <Icon name="User" size={24} className="text-[#4ade80]/70" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-white font-bold text-base">{currentUser?.name || currentUser?.email || "Игрок"}</span>
                <span className="text-white/40 text-xs">ID {currentUser?.display_id || currentUser?.id || "—"}</span>
              </div>
              <Icon name="ChevronRight" size={18} className="text-white/30 ml-auto" />
            </button>

            <div className="px-4 pt-4 pb-3 grid grid-cols-2 gap-2.5">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  className="flex flex-col gap-2.5 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-3.5 active:bg-white/[0.08] transition-colors text-left"
                  onClick={() => {
                    if (item.label === "Казино") { setMenuOpen(false); setActive(2); }
                    if (item.label === "Кейсы") { setMenuOpen(false); setActive(4); }
                    if (item.label === "Бонусы") { setMenuOpen(false); setActive(3); }
                    if (item.label === "Поддержка 24/7") { window.open("https://t.me/Jaguar_helpi_bot", "_blank"); }
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <Icon
                      name={item.icon}
                      fallback={item.fallback || item.icon}
                      size={20}
                      style={{ color: item.color }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-[13px] font-semibold">{item.label}</span>
                    <span className="text-white/30 text-[11px] leading-tight mt-0.5">{item.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            {isAdmin && (
              <div className="px-4 pb-3">
                <button
                  className="w-full flex items-center gap-3 bg-red-500/[0.06] border border-red-500/10 rounded-2xl px-4 py-3 active:bg-red-500/10 transition-colors"
                  onClick={() => { setMenuOpen(false); setAdminOpen(true); }}
                >
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <Icon name="Shield" size={18} className="text-red-400" />
                  </div>
                  <span className="text-red-400 text-[13px] font-semibold">Админ-панель</span>
                  <Icon name="ChevronRight" size={16} className="text-red-400/30 ml-auto" />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute right-3 top-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center z-10"
          >
            <Icon name="X" size={20} className="text-white/80" />
          </button>
        </div>
      )}

      {profileOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h1 className="text-[22px] font-bold text-white">Профиль</h1>
            <button
              onClick={() => setProfileOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Icon name="X" size={16} className="text-white/60" />
            </button>
          </div>

          <div className="flex flex-col items-center pt-3 pb-4">
            <span className="text-lg font-bold text-white">{currentUser?.name || currentUser?.email || "Игрок"}</span>
            <button
              onClick={() => copyId(currentUser?.display_id || currentUser?.id || "")}
              className="flex items-center gap-1.5 mt-0.5 active:opacity-60 transition-opacity"
            >
              <Icon name="Copy" size={12} className="text-white/30" />
              <span className="text-[12px] text-white/40">ID {currentUser?.display_id || currentUser?.id || "—"}</span>
            </button>
          </div>

          <div className="px-4 pb-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <span className="text-[12px] text-white/40">Счет</span>
              <div className="text-[22px] font-bold text-white mt-0.5 tracking-tight">
                {currency === "usdt"
                  ? `${userBalance.toFixed(userBalance < 0.01 && userBalance > 0 ? 5 : 2)} USDT`
                  : `${starsBalance.toLocaleString()} Stars`}
              </div>
              <div className="flex gap-2.5 mt-3">
                <button
                  onClick={() => { setProfileOpen(false); setDepositOpen(true); }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#4ade80] text-black font-semibold text-[13px] rounded-lg py-2.5"
                >
                  <Icon name="Plus" size={15} />
                  Пополнить
                </button>
                <button
                  onClick={() => { setProfileOpen(false); setWithdrawOpen(true); setWithdrawStep(1); setWithdrawNetwork(""); setWithdrawAddress(""); setWithdrawAmount("15"); setWithdrawError(""); setWithdrawSuccess(false); setWithdrawSearch(""); }}
                  className="flex-1 flex items-center justify-center bg-white/10 text-white font-semibold text-[13px] rounded-lg py-2.5"
                >
                  Вывести
                </button>
              </div>
            </div>
          </div>

          {profileSections.map((section, sIdx) => (
            <div key={sIdx} className="px-4 pb-2">
              <div className="bg-white/5 border border-[#4ade80]/20 rounded-xl overflow-hidden">
                {section.items.map((item, iIdx) => (
                  <div key={item.label}>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3"
                      onClick={() => {
                        if (item.label === "Бонусы") { setProfileOpen(false); setBonusOpen(true); }
                        if (item.label === "Ваучеры") { setProfileOpen(false); setVoucherOpen(true); setVoucherCode(""); }
                        if (item.label === "История платежей") { setProfileOpen(false); setHistoryOpen(true); setHistoryTab("all"); fetchPayments("all"); }
                        if (item.label === "Поддержка 24/7") { window.open("https://t.me/Jaguar_helpi_bot", "_blank"); }
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center relative shrink-0">
                        <Icon
                          name={item.icon}
                          fallback={item.fallback || item.icon}
                          size={16}
                          className="text-white/40"
                        />
                        {item.badge && (
                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-[13px] font-semibold text-white">{item.label}</span>
                        <span className="text-[11px] text-white/35">{item.desc}</span>
                      </div>
                    </button>
                    {iIdx < section.items.length - 1 && (
                      <div className="h-px bg-white/5 ml-[60px] mr-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="px-4 pt-4 pb-8">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-[13px] rounded-xl py-3"
            >
              <Icon name="LogOut" size={16} />
              Выйти из аккаунта
            </button>
          </div>
        </div>
      )}

      {depositOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h1 className="text-[22px] font-bold text-white">Пополнение</h1>
            <button
              onClick={() => setDepositOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Icon name="X" size={16} className="text-white/60" />
            </button>
          </div>

          <div className="px-4 pt-4 flex flex-col gap-3">
            <button
              onClick={() => { setDepositOpen(false); setCryptoPayOpen(true); setDepositAmount("5"); }}
              className="w-full flex items-center gap-3 bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3 active:bg-white/5 transition-colors relative"
            >
              <div className="absolute top-2.5 left-2.5">
                <div className="w-5 h-5 rounded-md bg-[#4ade80]/15 flex items-center justify-center">
                  <Icon name="Zap" size={12} className="text-[#4ade80]" />
                </div>
              </div>
              <div className="w-[52px] h-[52px] rounded-xl bg-[#2a2a2a] flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src="https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/4f68fa41-4b39-404a-9c4e-8c337614b5d1.jpg"
                  alt="CryptoBot"
                  className="w-[36px] h-[36px] rounded-full object-cover"
                />
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-white font-bold text-[15px]">@CryptoBot</span>
                <span className="text-white/40 text-[12px]">от 5 до 5000</span>
              </div>
              <Icon name="ChevronRight" size={18} className="text-white/30 shrink-0" />
            </button>

            <button
              onClick={() => { setDepositOpen(false); setTgStarsOpen(true); setTgStarsAmount("10"); }}
              className="w-full flex items-center gap-3 bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3 active:bg-white/5 transition-colors relative"
            >
              <div className="absolute top-2.5 left-2.5">
                <div className="w-5 h-5 rounded-md bg-[#f5a623]/15 flex items-center justify-center">
                  <Icon name="Star" size={12} className="text-[#f5a623]" />
                </div>
              </div>
              <div className="w-[52px] h-[52px] rounded-xl bg-[#2a2a2a] flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={TG_STARS_ICON}
                  alt="Telegram Stars"
                  className="w-[36px] h-[36px] rounded-full object-cover"
                />
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-white font-bold text-[15px]">Телеграм Звёзды</span>
                <span className="text-white/40 text-[12px]">от 10 до 10000</span>
              </div>
              <Icon name="ChevronRight" size={18} className="text-white/30 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {cryptoPayOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <button
              onClick={() => { setCryptoPayOpen(false); setDepositOpen(true); }}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Icon name="ArrowLeft" size={16} className="text-white/60" />
            </button>
            <h1 className="text-[18px] font-bold text-white">Пополнение</h1>
            <button
              onClick={() => setCryptoPayOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Icon name="X" size={16} className="text-white/60" />
            </button>
          </div>

          <div className="px-4 pt-4">
            <div className="bg-[#111] border border-white/10 rounded-2xl px-4 py-4 flex items-center gap-3">
              <div className="w-[52px] h-[52px] rounded-xl bg-[#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src="https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/4f68fa41-4b39-404a-9c4e-8c337614b5d1.jpg"
                  alt="CryptoBot"
                  className="w-[36px] h-[36px] rounded-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-[15px]">@CryptoBot</span>
                <span className="text-white/40 text-[13px]">от 5USDT до 5000USDT</span>
              </div>
            </div>
          </div>

          <div className="px-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-[14px] font-medium">Вы платите</span>
              <span className="text-white/30 text-[12px]">Минимальная сумма: 5USDT</span>
            </div>
            <div className="bg-[#111] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden">
                <img
                  src="https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/521d6370-ca4b-47aa-9be0-a7e2edc0027f.jpg"
                  alt="USDT"
                  className="w-full h-full object-cover scale-[1.8]"
                />
              </div>
              <span className="text-white font-bold text-[15px]">USDT</span>
              <input
                type="number"
                inputMode="decimal"
                value={depositAmount}
                onChange={(e) => { setDepositAmount(e.target.value); setDepositError(""); }}
                className="ml-auto bg-transparent text-white text-right text-[20px] font-bold w-[120px] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="5"
                max="5000"
              />
            </div>
            {depositError && (
              <div className="mt-2 text-red-400 text-[13px] font-medium">{depositError}</div>
            )}
          </div>

          <div className="px-4 pt-6">
            <button
              disabled={depositLoading}
              onClick={async () => {
                const amount = parseFloat(depositAmount);
                if (!depositAmount || isNaN(amount)) {
                  setDepositError("Введите сумму");
                  return;
                }
                if (amount < 5) {
                  setDepositError("Минимальная сумма пополнения — 5 USDT");
                  return;
                }
                if (amount > 5000) {
                  setDepositError("Максимальная сумма пополнения — 5000 USDT");
                  return;
                }
                const currentUserId = tgAuth.user?.id;
                if (!currentUserId) {
                  setDepositError("Ошибка идентификации. Перезайдите в аккаунт");
                  return;
                }
                setDepositError("");
                setDepositLoading(true);
                try {
                  const res = await fetch(CRYPTO_PAY_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount, user_id: String(currentUserId) }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setDepositError(data.error || "Ошибка создания платежа");
                    return;
                  }
                  if (data.pay_url) {
                    window.open(data.pay_url, "_blank");
                    const pollBalance = setInterval(async () => {
                      await fetchBalance();
                    }, 5000);
                    setTimeout(() => clearInterval(pollBalance), 300000);
                  }
                } catch {
                  setDepositError("Ошибка соединения с сервером");
                } finally {
                  setDepositLoading(false);
                }
              }}
              className="w-full bg-[#4ade80] text-black font-bold text-[15px] rounded-xl py-3.5 active:bg-[#3ecb6e] transition-colors disabled:opacity-50"
            >
              {depositLoading ? "Создаём платёж..." : `Пополнить ${depositAmount || "0"} USDT`}
            </button>
          </div>
        </div>
      )}

      {tgStarsOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <button
              onClick={() => { setTgStarsOpen(false); setDepositOpen(true); }}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Icon name="ArrowLeft" size={16} className="text-white/60" />
            </button>
            <h1 className="text-[18px] font-bold text-white">Пополнение</h1>
            <button
              onClick={() => setTgStarsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Icon name="X" size={16} className="text-white/60" />
            </button>
          </div>

          <div className="px-4 pt-4">
            <div className="bg-[#111] border border-white/10 rounded-2xl px-4 py-4 flex items-center gap-3">
              <div className="w-[52px] h-[52px] rounded-xl bg-[#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={TG_STARS_ICON}
                  alt="Telegram Stars"
                  className="w-[36px] h-[36px] rounded-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-[15px]">Телеграм Звёзды</span>
                <span className="text-white/40 text-[13px]">от 10 до 10000 звёзд</span>
              </div>
            </div>
          </div>

          <div className="px-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-[14px] font-medium">Вы платите</span>
              <span className="text-white/30 text-[12px]">Минимум: 10 звёзд</span>
            </div>
            <div className="bg-[#111] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f5a623]/20 flex items-center justify-center shrink-0">
                <Icon name="Star" size={16} className="text-[#f5a623]" />
              </div>
              <span className="text-white font-bold text-[15px]">Stars</span>
              <input
                type="number"
                inputMode="numeric"
                value={tgStarsAmount}
                onChange={(e) => { setTgStarsAmount(e.target.value); setTgStarsError(""); }}
                className="ml-auto bg-transparent text-white text-right text-[20px] font-bold w-[120px] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="10"
                max="10000"
              />
            </div>
            {tgStarsError && (
              <div className="mt-2 text-red-400 text-[13px] font-medium">{tgStarsError}</div>
            )}
          </div>

          <div className="px-4 pt-6">
            <button
              disabled={tgStarsLoading}
              onClick={async () => {
                const amount = parseInt(tgStarsAmount);
                if (!tgStarsAmount || isNaN(amount)) {
                  setTgStarsError("Введите количество звёзд");
                  return;
                }
                if (amount < 10) {
                  setTgStarsError("Минимальное количество — 10 звёзд");
                  return;
                }
                if (amount > 10000) {
                  setTgStarsError("Максимальное количество — 10000 звёзд");
                  return;
                }
                const currentUserId = tgAuth.user?.id;
                if (!currentUserId) {
                  setTgStarsError("Ошибка идентификации. Перезайдите в аккаунт");
                  return;
                }
                setTgStarsError("");
                setTgStarsLoading(true);
                try {
                  const deepLink = `https://t.me/${TG_BOT_USERNAME}?start=stars_${amount}_${currentUserId}`;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const tg = (window as unknown as Record<string, any>).Telegram?.WebApp;
                  if (tg) {
                    tg.openTelegramLink(deepLink);
                    setTimeout(() => tg.close(), 300);
                  } else {
                    window.open(deepLink, "_blank");
                  }
                } catch {
                  setTgStarsError("Ошибка соединения");
                } finally {
                  setTgStarsLoading(false);
                }
              }}
              className="w-full bg-[#f5a623] text-black font-bold text-[15px] rounded-xl py-3.5 active:bg-[#d9911e] transition-colors disabled:opacity-50"
            >
              {tgStarsLoading ? "Открываем бота..." : `Пополнить ${tgStarsAmount || "0"} Stars`}
            </button>
          </div>

          <div className="px-4 pt-4">
            <div className="bg-[#111] border border-white/5 rounded-xl px-4 py-3">
              <p className="text-white/30 text-[12px] leading-relaxed">
                После нажатия приложение закроется и бот отправит вам счёт для оплаты звёздами. Нажмите «Оплатить» — баланс начислится автоматически.
              </p>
            </div>
          </div>
        </div>
      )}

      {historyOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <button
              onClick={() => { setHistoryOpen(false); setProfileOpen(true); }}
              className="flex items-center gap-1.5 text-[#4ade80] text-[14px] font-medium"
            >
              <Icon name="ChevronLeft" size={18} />
              Назад
            </button>
            <button
              onClick={() => setHistoryOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Icon name="X" size={16} className="text-white/60" />
            </button>
          </div>

          <div className="px-5 pb-3">
            <h1 className="text-[22px] font-bold text-white mb-4">История платежей</h1>
            <div className="flex bg-white/[0.05] rounded-xl p-1 gap-1">
              {(["all", "deposits", "withdrawals"] as const).map((tab) => {
                const labels = { all: "Все", deposits: "Депозиты", withdrawals: "Выводы" };
                return (
                  <button
                    key={tab}
                    onClick={() => { setHistoryTab(tab); fetchPayments(tab === "withdrawals" ? "withdrawals" : tab === "deposits" ? "deposits" : "all"); }}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                      historyTab === tab
                        ? "bg-[#4ade80] text-black"
                        : "text-white/50"
                    }`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-20">
            {paymentsLoading ? (
              <div className="flex items-center justify-center h-40">
                <Icon name="Loader2" size={32} className="text-[#4ade80] animate-spin" />
              </div>
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40">
                <Icon name="ReceiptText" size={56} className="text-white/15 mb-4" fallback="FileText" />
                <span className="text-white/50 font-semibold text-[16px] mb-1">Операций пока нет</span>
                <span className="text-white/25 text-[13px] text-center px-8">
                  Здесь будет отображаться история ваших платежей
                </span>
              </div>
            ) : (
              <div className="px-5 flex flex-col gap-2">
                {payments.map((p) => {
                  const date = p.paid_at || p.created_at;
                  const dateStr = date ? new Date(date).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
                  const isPaid = p.status === "paid";
                  const isRejected = p.status === "rejected";
                  const isWithdrawal = p.type === "withdrawal";
                  const iconName = isWithdrawal ? "ArrowUpRight" : "ArrowDownLeft";
                  const label = isWithdrawal ? "Вывод" : "Депозит";
                  const amountPrefix = isWithdrawal ? "−" : "+";
                  const activeColor = isRejected ? "text-red-400" : isWithdrawal ? "text-red-400" : "text-[#4ade80]";
                  const activeBg = isRejected ? "bg-red-400/15" : isWithdrawal ? "bg-red-400/15" : "bg-[#4ade80]/15";
                  const statusLabel = isRejected ? "Отклонено" : isPaid ? (isWithdrawal ? "Выведено" : "Оплачен") : "Ожидание";
                  return (
                    <div key={p.id} className="flex items-center justify-between bg-white/[0.05] rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${(isPaid || isRejected) ? activeBg : "bg-white/10"}`}>
                          <Icon name={isRejected ? "X" : iconName} size={18} className={(isPaid || isRejected) ? activeColor : "text-white/40"} />
                        </div>
                        <div>
                          <div className="text-white text-[14px] font-semibold">{label}</div>
                          <div className="text-white/40 text-[12px]">{dateStr}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-[15px] font-bold ${(isPaid || isRejected) ? activeColor : "text-white/50"}`}>{amountPrefix}{p.amount} USDT</div>
                        <div className={`text-[11px] font-medium ${isRejected ? "text-red-400/70" : isPaid ? `${activeColor}/70` : "text-yellow-400/70"}`}>
                          {statusLabel}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {voucherOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <button
              onClick={() => { setVoucherOpen(false); setProfileOpen(true); }}
              className="flex items-center gap-1.5 text-[#4ade80] text-[14px] font-medium"
            >
              <Icon name="ChevronLeft" size={18} />
              Назад
            </button>
            <button
              onClick={() => setVoucherOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Icon name="X" size={16} className="text-white/60" />
            </button>
          </div>

          <div className="px-5 pt-3">
            <h1 className="text-[22px] font-bold text-white mb-1.5">Активация ваучера</h1>
            <p className="text-white/40 text-[13px] mb-6">
              Введите код — деньги сразу зачислятся на баланс
            </p>

            {voucherSuccess ? (
              <div className="flex flex-col items-center py-10">
                <div className="w-16 h-16 rounded-full bg-[#4ade80]/15 flex items-center justify-center mb-4">
                  <Icon name="Check" size={32} className="text-[#4ade80]" />
                </div>
                <div className="text-white font-bold text-[22px] mb-1">+{voucherSuccess.amount.toFixed(2)} USDT</div>
                <div className="text-white/40 text-[14px] mb-8">Зачислено на счёт</div>
                <button
                  onClick={() => { setVoucherOpen(false); setVoucherSuccess(null); setVoucherCode(""); setVoucherError(""); }}
                  className="bg-[#4ade80] text-black font-bold text-[15px] rounded-xl px-8 py-3 active:bg-[#3ecb6e] transition-colors"
                >
                  Отлично!
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Введите код ваучера"
                  value={voucherCode}
                  onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(""); }}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3.5 text-white font-mono text-[16px] tracking-widest placeholder:text-white/20 placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:border-[#4ade80]/30 transition-colors mb-3"
                />
                {voucherError && (
                  <div className="text-red-400 text-[13px] mb-3">{voucherError}</div>
                )}
                <button
                  disabled={!voucherCode.trim() || voucherLoading}
                  onClick={async () => {
                    if (!userId) return;
                    setVoucherLoading(true);
                    setVoucherError("");
                    try {
                      const res = await fetch(`${VOUCHER_URL}?action=redeem`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ user_id: userId, code: voucherCode.trim() }),
                      });
                      const data = await res.json();
                      if (!res.ok) { setVoucherError(data.error || "Ошибка активации"); }
                      else { setVoucherSuccess({ amount: data.amount }); await fetchBalance(); }
                    } catch { setVoucherError("Ошибка соединения"); }
                    setVoucherLoading(false);
                  }}
                  className="w-full bg-[#4ade80] text-black font-bold text-[15px] rounded-xl py-3.5 active:bg-[#3ecb6e] transition-colors disabled:opacity-40"
                >
                  {voucherLoading ? "Активируем..." : "Активировать"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {bonusOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h1 className="text-[22px] font-bold text-white">Бонусы</h1>
            <button
              onClick={() => setBonusOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Icon name="X" size={16} className="text-white/60" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
            <Icon name="Gift" size={64} className="text-white/20 mb-5" />
            <span className="text-white font-bold text-[18px] mb-2">Бонусов пока нет</span>
            <span className="text-white/40 text-[14px] text-center leading-relaxed">
              Как только они появятся, вы увидите их в этом разделе
            </span>
          </div>
        </div>
      )}

      {withdrawOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-y-auto">
          {withdrawStep === 1 && (
            <>
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <h1 className="text-[22px] font-bold text-white">Вывод</h1>
                <button
                  onClick={() => setWithdrawOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <Icon name="X" size={16} className="text-white/60" />
                </button>
              </div>
              <div className="px-5 pt-4 flex flex-col gap-3">
                <button
                  onClick={() => setWithdrawStep(2)}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 w-full active:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#50AF95]/20 flex items-center justify-center">
                    <img src={USDT_ICON} alt="USDT" className="w-full h-full object-cover scale-[1.8]" />
                  </div>
                  <div className="flex flex-col items-start flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#50AF95] font-bold text-[15px]">ERC20</span>
                      <span className="text-white/30 text-[11px] bg-white/5 rounded-full px-2 py-0.5">4</span>
                    </div>
                    <span className="text-white/50 text-[12px]">Криптовалюта</span>
                  </div>
                  <Icon name="ChevronRight" size={18} className="text-white/30 shrink-0" />
                </button>

                <button
                  onClick={() => { setWithdrawOpen(false); setStarsWithdrawOpen(true); setStarsWithdrawAmount("100"); setStarsWithdrawUsername(""); setStarsWithdrawError(""); setStarsWithdrawSuccess(false); }}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 w-full active:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden">
                    <img src={TG_STARS_ICON} alt="Stars" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col items-start flex-1">
                    <span className="text-[#f5a623] font-bold text-[15px]">Звёзды ТГ</span>
                    <span className="text-white/50 text-[12px]">Telegram Stars</span>
                  </div>
                  <Icon name="ChevronRight" size={18} className="text-white/30 shrink-0" />
                </button>
              </div>
            </>
          )}

          {withdrawStep === 2 && (
            <>
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <button
                  onClick={() => setWithdrawStep(1)}
                  className="flex items-center gap-1.5 text-[#4ade80] text-[14px] font-medium"
                >
                  <Icon name="ChevronLeft" size={18} />
                  Назад
                </button>
                <button
                  onClick={() => setWithdrawOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <Icon name="X" size={16} className="text-white/60" />
                </button>
              </div>
              <div className="px-5 pt-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#f7931a]/20 flex items-center justify-center">
                    <span className="text-[#f7931a] font-bold text-[16px]">B</span>
                  </div>
                  <h2 className="text-white font-bold text-[20px]">Криптовалюта</h2>
                </div>

                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 gap-2 mb-4">
                  <Icon name="Search" size={16} className="text-white/30" />
                  <input
                    type="text"
                    value={withdrawSearch}
                    onChange={(e) => setWithdrawSearch(e.target.value)}
                    placeholder="Поиск"
                    className="bg-transparent text-white text-[14px] py-2.5 outline-none w-full placeholder:text-white/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {WITHDRAW_NETWORKS
                    .filter(n => !withdrawSearch || n.name.toLowerCase().includes(withdrawSearch.toLowerCase()) || n.label.toLowerCase().includes(withdrawSearch.toLowerCase()))
                    .map((net) => (
                    <button
                      key={net.id}
                      onClick={() => { setWithdrawNetwork(net.id); setWithdrawStep(3); setWithdrawError(""); }}
                      className="flex flex-col gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 active:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-[#50AF95]/20 flex items-center justify-center">
                          <img src={USDT_ICON} alt={net.label} className="w-full h-full object-cover scale-[1.8]" />
                        </div>
                        <span className="text-[#50AF95] font-bold text-[14px]">{net.label}</span>
                      </div>
                      <span className="text-white/50 text-[12px]">{net.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {withdrawStep === 3 && (
            <>
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <button
                  onClick={() => setWithdrawStep(2)}
                  className="flex items-center gap-1.5 text-[#4ade80] text-[14px] font-medium"
                >
                  <Icon name="ChevronLeft" size={18} />
                  Назад
                </button>
                <button
                  onClick={() => setWithdrawOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <Icon name="X" size={16} className="text-white/60" />
                </button>
              </div>
              <div className="px-5 pt-2">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#50AF95]/20 flex items-center justify-center">
                    <img src={USDT_ICON} alt={withdrawNetwork} className="w-full h-full object-cover scale-[1.8]" />
                  </div>
                  <div>
                    <span className="text-[#50AF95] font-bold text-[14px] mr-2">{withdrawNetwork}</span>
                    <span className="text-white font-bold text-[18px]">Tether {withdrawNetwork}</span>
                  </div>
                </div>

                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="Адрес получателя USDT"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-[14px] outline-none mb-3 placeholder:text-white/30"
                />

                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 mb-1">
                  <span className="text-white/40 text-[11px]">Сумма</span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="bg-transparent text-white text-[16px] font-bold outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min="15"
                    />
                    <span className="text-white/40 text-[14px] shrink-0">USDT</span>
                  </div>
                </div>
                <div className="text-white/30 text-[12px] mb-1 px-1">от 15 USDT до 10 000 000 USDT</div>
                <div className="text-white/30 text-[12px] mb-4 px-1">Баланс: <span className="text-[#4ade80]">{userBalance.toFixed(2)} USDT</span></div>

                {withdrawError && (
                  <div className="text-red-400 text-[13px] font-medium mb-3 px-1">{withdrawError}</div>
                )}

                {withdrawSuccess ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-14 h-14 rounded-full bg-[#4ade80]/15 flex items-center justify-center">
                      <Icon name="Check" size={28} className="text-[#4ade80]" />
                    </div>
                    <span className="text-white font-bold text-[16px]">Заявка отправлена</span>
                    <span className="text-white/40 text-[13px] text-center">Ваша заявка на вывод принята и будет обработана в ближайшее время</span>
                    <button
                      onClick={() => setWithdrawOpen(false)}
                      className="mt-2 bg-[#4ade80] text-black font-bold text-[15px] rounded-xl py-3.5 px-8 active:bg-[#3ecb6e] transition-colors"
                    >
                      Закрыть
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={withdrawLoading}
                    onClick={async () => {
                      const amt = parseFloat(withdrawAmount);
                      if (!withdrawAddress.trim()) { setWithdrawError("Введите адрес кошелька"); return; }
                      if (!withdrawAmount || isNaN(amt) || amt < 15) { setWithdrawError("Минимальная сумма вывода — 15 USDT"); return; }
                      if (amt > userBalance) { setWithdrawError("Недостаточно средств"); return; }
                      setWithdrawError("");
                      setWithdrawLoading(true);
                      try {
                        const res = await fetch(`${WITHDRAWAL_URL}?action=create`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            user_id: userId ? parseInt(userId) : 0,
                            network: withdrawNetwork,
                            address: withdrawAddress.trim(),
                            amount: amt,
                          }),
                        });
                        const data = await res.json();
                        if (!res.ok) { setWithdrawError(data.error || "Ошибка вывода"); }
                        else { setWithdrawSuccess(true); fetchBalance(); }
                      } catch { setWithdrawError("Ошибка соединения"); }
                      setWithdrawLoading(false);
                    }}
                    className="w-full bg-[#3b82f6] text-white font-bold text-[15px] rounded-xl py-3.5 active:bg-[#2563eb] transition-colors disabled:opacity-50"
                  >
                    {withdrawLoading ? "Отправка..." : "Вывести"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {starsWithdrawOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <button
              onClick={() => { setStarsWithdrawOpen(false); setWithdrawOpen(true); setWithdrawStep(1); }}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Icon name="ArrowLeft" size={16} className="text-white/60" />
            </button>
            <h1 className="text-[18px] font-bold text-white">Вывод Stars</h1>
            <button
              onClick={() => setStarsWithdrawOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Icon name="X" size={16} className="text-white/60" />
            </button>
          </div>

          <div className="px-4 pt-4">
            <div className="bg-[#111] border border-white/10 rounded-2xl px-4 py-4 flex items-center gap-3">
              <div className="w-[52px] h-[52px] rounded-xl bg-[#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden">
                <img src={TG_STARS_ICON} alt="Stars" className="w-[36px] h-[36px] rounded-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-[15px]">Звёзды ТГ</span>
                <span className="text-white/40 text-[13px]">Вывод на Telegram</span>
              </div>
            </div>
          </div>

          <div className="px-4 pt-5">
            <div className="mb-3">
              <span className="text-white/70 text-[14px] font-medium">Ваш username</span>
              <div className="bg-[#111] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2 mt-1.5">
                <span className="text-white/40 text-[15px]">@</span>
                <input
                  type="text"
                  value={starsWithdrawUsername}
                  onChange={(e) => { setStarsWithdrawUsername(e.target.value.replace(/^@/, "")); setStarsWithdrawError(""); }}
                  placeholder="username"
                  className="bg-transparent text-white text-[15px] outline-none w-full placeholder:text-white/25"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/70 text-[14px] font-medium">Количество</span>
              <span className="text-white/30 text-[12px]">Минимум: 100 звёзд</span>
            </div>
            <div className="bg-[#111] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f5a623]/20 flex items-center justify-center shrink-0">
                <Icon name="Star" size={16} className="text-[#f5a623]" />
              </div>
              <span className="text-white font-bold text-[15px]">Stars</span>
              <input
                type="number"
                inputMode="numeric"
                value={starsWithdrawAmount}
                onChange={(e) => { setStarsWithdrawAmount(e.target.value); setStarsWithdrawError(""); }}
                className="ml-auto bg-transparent text-white text-right text-[20px] font-bold w-[120px] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="100"
              />
            </div>
            <div className="text-white/30 text-[12px] mt-1.5 px-1">Баланс: <span className="text-[#f5a623]">{starsBalance.toLocaleString()} Stars</span></div>

            {starsWithdrawError && (
              <div className="mt-2 text-red-400 text-[13px] font-medium">{starsWithdrawError}</div>
            )}
          </div>

          <div className="px-4 pt-6">
            {starsWithdrawSuccess ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-14 h-14 rounded-full bg-[#4ade80]/15 flex items-center justify-center">
                  <Icon name="Check" size={28} className="text-[#4ade80]" />
                </div>
                <span className="text-white font-bold text-[16px]">Заявка отправлена</span>
                <span className="text-white/40 text-[13px] text-center">Ваша заявка на вывод звёзд принята и будет обработана в ближайшее время</span>
                <button
                  onClick={() => setStarsWithdrawOpen(false)}
                  className="mt-2 bg-[#f5a623] text-black font-bold text-[15px] rounded-xl py-3.5 px-8 active:bg-[#d9911e] transition-colors"
                >
                  Закрыть
                </button>
              </div>
            ) : (
              <button
                disabled={starsWithdrawLoading}
                onClick={async () => {
                  const amt = parseInt(starsWithdrawAmount);
                  if (!starsWithdrawUsername.trim()) {
                    setStarsWithdrawError("Введите ваш username");
                    return;
                  }
                  if (!starsWithdrawAmount || isNaN(amt) || amt < 100) {
                    setStarsWithdrawError("Минимальное количество — 100 звёзд");
                    return;
                  }
                  if (amt > starsBalance) {
                    setStarsWithdrawError("Недостаточно звёзд");
                    return;
                  }
                  setStarsWithdrawError("");
                  setStarsWithdrawLoading(true);
                  try {
                    const res = await fetch(`${WITHDRAWAL_URL}?action=create`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        user_id: userId ? parseInt(userId) : 0,
                        network: "TG_STARS",
                        address: `@${starsWithdrawUsername.trim()}`,
                        amount: amt,
                        currency: "stars",
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) { setStarsWithdrawError(data.error || "Ошибка вывода"); }
                    else { setStarsWithdrawSuccess(true); fetchBalance(); }
                  } catch { setStarsWithdrawError("Ошибка соединения"); }
                  setStarsWithdrawLoading(false);
                }}
                className="w-full bg-[#f5a623] text-black font-bold text-[15px] rounded-xl py-3.5 active:bg-[#d9911e] transition-colors disabled:opacity-50"
              >
                {starsWithdrawLoading ? "Отправка..." : `Вывести ${starsWithdrawAmount || "0"} Stars`}
              </button>
            )}
          </div>
        </div>
      )}

      {adminOpen && isAdmin && (
        <AdminPanel
          adminDisplayId={currentUser?.display_id || ""}
          adminRole={adminRole}
          onClose={() => setAdminOpen(false)}
        />
      )}

      <header className="w-full px-2 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-1.5 shrink-0">
          <img
            src="https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/e726b3e3-32de-440a-ba25-e16781598615.jpg"
            alt="Logo"
            className="h-10 w-auto object-contain"
          />
          <div className="flex flex-col leading-none">
            <span className="text-[#4ade80] font-extrabold text-sm tracking-wide uppercase">Jaguar</span>
            <span className="text-white font-extrabold text-[8px] tracking-[0.55em] uppercase text-right">official</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <div className="relative">
            <button
              onClick={() => setCurrencyPickerOpen(!currencyPickerOpen)}
              className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1.5"
            >
              {currency === "usdt" ? (
                <div className="w-6 h-6 rounded-full shrink-0 overflow-hidden">
                  <img src={USDT_ICON} alt="USDT" className="w-full h-full object-cover scale-[1.8]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#f5a623]/20 flex items-center justify-center shrink-0">
                  <Icon name="Star" size={13} className="text-[#f5a623]" />
                </div>
              )}
              <span className="text-white text-xs font-medium">
                {currency === "usdt" ? userBalance.toFixed(userBalance < 0.01 && userBalance > 0 ? 5 : 2) : starsBalance.toLocaleString()}
              </span>
              <Icon name="ChevronDown" size={12} className="text-white/40" />
            </button>
            {currencyPickerOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCurrencyPickerOpen(false)} />
                <div className="absolute top-full right-0 mt-1.5 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-50 min-w-[160px] shadow-xl">
                  <button
                    onClick={() => { setCurrency("usdt"); setCurrencyPickerOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 transition-colors ${currency === "usdt" ? "bg-white/10" : "active:bg-white/5"}`}
                  >
                    <div className="w-5 h-5 rounded-full shrink-0 overflow-hidden">
                      <img src={USDT_ICON} alt="USDT" className="w-full h-full object-cover scale-[1.8]" />
                    </div>
                    <span className="text-white text-[13px] font-medium flex-1 text-left">USDT</span>
                    {currency === "usdt" && <Icon name="Check" size={14} className="text-[#4ade80]" />}
                  </button>
                  <div className="h-px bg-white/5" />
                  <button
                    onClick={() => { setCurrency("stars"); setCurrencyPickerOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 transition-colors ${currency === "stars" ? "bg-white/10" : "active:bg-white/5"}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-[#f5a623]/20 flex items-center justify-center shrink-0">
                      <Icon name="Star" size={11} className="text-[#f5a623]" />
                    </div>
                    <span className="text-white text-[13px] font-medium flex-1 text-left">Stars</span>
                    {currency === "stars" && <Icon name="Check" size={14} className="text-[#4ade80]" />}
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setDepositOpen(true)}
            className="flex items-center gap-1.5 bg-white text-black text-xs font-semibold rounded-full px-4 py-2 hover:bg-white/90 active:bg-white/80 transition-colors"
          >
            <Icon name="Plus" size={14} />
            Пополнить
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {active === 1 && (
          <div className="px-3 pt-3 pb-4">
            <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "16/7" }}>
              {bannerSlides.map((slide, idx) => (
                <img
                  key={idx}
                  src={slide.image}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${idx === currentSlide ? "opacity-100" : "opacity-0"}`}
                />
              ))}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {bannerSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentSlide ? "bg-[#4ade80] w-4" : "bg-white/30"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {active === 2 && (
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon name="Zap" size={20} className="text-white" />
                <span className="text-white font-semibold text-base">Быстрые игры</span>
              </div>
              <button className="flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.08] rounded-full px-4 py-2">
                <span className="text-white/70 text-sm">Все игры</span>
                <Icon name="ChevronRight" size={14} className="text-white/40" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setGameOpen(true)}
                className="group flex flex-col bg-[#111820] border border-white/5 rounded-2xl overflow-hidden active:scale-[0.97] transition-transform"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                  <img
                    src="https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/f1e4916f-f48b-4540-9264-37fcf20a1da1.jpg"
                    alt="Mines"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </button>
              <button
                onClick={() => setCrashOpen(true)}
                className="group flex flex-col bg-[#111820] border border-white/5 rounded-2xl overflow-hidden active:scale-[0.97] transition-transform"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                  <img
                    src="https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/31800339-f971-426e-83e0-567f722a924c.jpg"
                    alt="Crash X"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </button>
            </div>
          </div>
        )}

        {active === 3 && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <Icon name="BadgeDollarSign" size={48} className="text-[#4ade80]/30 mb-4" />
            <span className="text-white/40 text-sm">Free money — скоро</span>
          </div>
        )}

        {active === 4 && (
          <div className="px-4 py-4 pb-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Briefcase" size={20} className="text-white" />
              <span className="text-white font-semibold text-base">Кейсы</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[10, 15, 20, 25, 50, 100, 260, 500, 670, 999].map((val) => (
                <div
                  key={val}
                  className="flex flex-col items-center bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 gap-3"
                >
                  <div className="w-[90px] h-[90px] relative">
                    <img
                      src="https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/b2287a6f-856d-4fb5-8514-12e1e32994d5.jpg"
                      alt={`${val} ${currency === "usdt" ? "$" : "★"}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-extrabold text-[18px] leading-none" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>{val}</span>
                      <span className="text-white font-bold text-[14px] leading-none ml-1" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{currency === "usdt" ? "$" : "★"}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setCaseRouletteOpen(val)}
                    className="w-full py-2 rounded-xl bg-[#4ade80] text-black font-bold text-[13px] active:scale-[0.97] transition-transform"
                  >
                    Купить
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <nav className="w-full px-4 pb-6 pt-3">
        <div className="flex items-center justify-around">
          {navItems.map((item, index) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(index)}
              className="flex flex-col items-center gap-1.5 min-w-0 flex-1"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                  active === index ? "bg-white text-black" : "bg-white/5 text-white/30"
                }`}
              >
                <Icon
                  name={item.icon}
                  fallback={item.fallback || item.icon}
                  size={20}
                />
              </div>
              <span
                className={`text-[10px] leading-tight truncate transition-colors ${
                  active === index ? "text-white" : "text-white/25"
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {caseRouletteOpen !== null && (
        <CaseRoulette
          caseValue={caseRouletteOpen}
          currency={currency}
          balance={currency === "usdt" ? userBalance : starsBalance}
          onBalanceChange={(delta) => {
            if (currency === "usdt") setUserBalance(prev => +(prev + delta).toFixed(2));
            else setStarsBalance(prev => +(prev + delta).toFixed(2));
          }}
          onClose={() => { setCaseRouletteOpen(null); fetchBalance(); }}
        />
      )}

      {crashOpen && (
        <CrashX
          onClose={() => { setCrashOpen(false); fetchBalance(); }}
          userId={userId}
          usdtBalance={userBalance}
          starsBalance={starsBalance}
          onBalanceChange={(cur, delta) => {
            if (cur === "usdt") setUserBalance(prev => +(prev + delta).toFixed(2));
            else setStarsBalance(prev => +(prev + delta).toFixed(2));
          }}
          onRefreshBalance={fetchBalance}
          initialCurrency={currency}
        />
      )}

      {gameOpen && (
        <JaguarGems
          onClose={() => { setGameOpen(false); fetchBalance(); }}
          userId={userId}
          usdtBalance={userBalance}
          starsBalance={starsBalance}
          onBalanceChange={(cur, delta) => {
            if (cur === "usdt") setUserBalance(prev => +(prev + delta).toFixed(2));
            else setStarsBalance(prev => +(prev + delta).toFixed(2));
          }}
          onRefreshBalance={fetchBalance}
        />
      )}
    </div>
  );
};

export default Index;