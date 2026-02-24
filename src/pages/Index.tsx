import { useState, useCallback, useEffect } from "react";

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
import { useTelegramAuth } from "@/components/extensions/telegram-bot/useTelegramAuth";

const TG_AUTH_URL = "https://functions.poehali.dev/420b5ea1-6f3d-420d-bb72-398ac6d4f617";
const CRYPTO_PAY_URL = "https://functions.poehali.dev/892f6456-5e1e-4974-9df1-9e4ce3603ae9";
const BALANCE_URL = "https://functions.poehali.dev/9b313374-9637-4e08-aacd-2659b84a6074";
const TG_BOT_USERNAME = "Jaguar_Official_bot";

const navItems = [
  { icon: "Menu", label: "Меню" },
  { icon: "Home", label: "Главная" },
  { icon: "Spade", label: "Казино", fallback: "Clover" },
  { icon: "BadgeDollarSign", label: "Free money" },
  { icon: "Briefcase", label: "Кейсы" },
];

const menuItems = [
  { icon: "Spade", label: "Казино", fallback: "Clover" },
  { icon: "Briefcase", label: "Кейсы" },
  { icon: "Gift", label: "Бонусы" },
  { icon: "Users", label: "Реферальная система" },
  { icon: "Headphones", label: "Поддержка 24/7" },
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
    ],
  },
  {
    items: [
      { icon: "Settings", label: "Настройки", desc: "Редактирование личных данных" },
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
  const [bonusOpen, setBonusOpen] = useState(false);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [depositAmount, setDepositAmount] = useState("5");
  const [depositError, setDepositError] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

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
      if (res.ok) setUserBalance(data.balance || 0);
    } catch { /* ignore */ }
  }, [userId]);

  useEffect(() => {
    if (isAuthed && userId) fetchBalance();
  }, [isAuthed, userId, fetchBalance]);

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
          Jaguar Casino
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

            <div className="h-px bg-[#4ade80]/15 mx-5" />

            <div className="flex flex-col py-3 px-2">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  className="flex items-center gap-4 px-3 py-3.5 rounded-xl hover:bg-[#4ade80]/5 active:bg-[#4ade80]/10 transition-colors"
                >
                  <Icon
                    name={item.icon}
                    fallback={item.fallback || item.icon}
                    size={22}
                    className="text-[#4ade80]/60"
                  />
                  <span className="text-white text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
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
              <div className="text-[22px] font-bold text-white mt-0.5 tracking-tight">{userBalance.toFixed(2)} USDT</div>
              <div className="flex gap-2.5 mt-3">
                <button
                  onClick={() => { setProfileOpen(false); setDepositOpen(true); }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#4ade80] text-black font-semibold text-[13px] rounded-lg py-2.5"
                >
                  <Icon name="Plus" size={15} />
                  Пополнить
                </button>
                <button className="flex-1 flex items-center justify-center bg-white/10 text-white font-semibold text-[13px] rounded-lg py-2.5">
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
            <p className="text-white/40 text-[13px] mb-5">
              Деньги зачислятся на счёт{" "}
              <span className="text-white/40">Правила и условия</span>
            </p>

            <input
              type="text"
              placeholder="Код"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3.5 text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-[#4ade80]/30 transition-colors mb-4"
            />

            <button
              disabled={!voucherCode.trim()}
              className="w-full bg-[#4ade80] text-black font-bold text-[15px] rounded-xl py-3.5 active:bg-[#3ecb6e] transition-colors disabled:opacity-40"
            >
              Активировать
            </button>
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

      <header className="w-full px-2 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-1.5 shrink-0">
          <img
            src="https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/e726b3e3-32de-440a-ba25-e16781598615.jpg"
            alt="Logo"
            className="h-10 w-auto object-contain"
          />
          <div className="flex flex-col leading-none">
            <span className="text-[#4ade80] font-extrabold text-sm tracking-wide uppercase">Jaguar</span>
            <span className="text-white font-extrabold text-[8px] tracking-[0.55em] uppercase text-right">casino</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1.5">
            <div className="w-6 h-6 rounded-full shrink-0 overflow-hidden">
              <img
                src="https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/521d6370-ca4b-47aa-9be0-a7e2edc0027f.jpg"
                alt="USDT"
                className="w-full h-full object-cover scale-[1.8]"
              />
            </div>
            <span className="text-white text-xs font-medium">{userBalance.toFixed(2)}</span>
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
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <Icon name="Clover" size={48} className="text-[#4ade80]/30 mb-4" />
            <span className="text-white/40 text-sm">Казино — скоро</span>
          </div>
        )}

        {active === 3 && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <Icon name="BadgeDollarSign" size={48} className="text-[#4ade80]/30 mb-4" />
            <span className="text-white/40 text-sm">Free money — скоро</span>
          </div>
        )}

        {active === 4 && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <Icon name="Briefcase" size={48} className="text-[#4ade80]/30 mb-4" />
            <span className="text-white/40 text-sm">Кейсы — скоро</span>
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
    </div>
  );
};

export default Index;