import { useState } from "react";
import Icon from "@/components/ui/icon";

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
      { icon: "Clock", label: "История ставок", desc: "Открытые и рассчитанные" },
      { icon: "Coins", label: "История платежей", desc: "Статусы депозитов и выводов", fallback: "Wallet" },
    ],
  },
  {
    items: [
      { icon: "Settings", label: "Настройки", desc: "Редактирование личных данных", badge: true },
      { icon: "Headphones", label: "Поддержка 24/7", desc: "Все способы связи" },
    ],
  },
];

const Index = () => {
  const [active, setActive] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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
                <span className="text-white font-bold text-base">Игрок</span>
                <span className="text-white/40 text-xs">ID 000000</span>
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
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h1 className="text-lg font-semibold text-white">Профиль</h1>
            <button
              onClick={() => setProfileOpen(false)}
              className="w-8 h-8 flex items-center justify-center"
            >
              <Icon name="X" size={18} className="text-white/50" />
            </button>
          </div>

          <div className="flex flex-col items-center pt-2 pb-5">
            <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center mb-3">
              <Icon name="User" size={26} className="text-white/30" />
            </div>
            <span className="text-base font-semibold text-white">Серия</span>
            <span className="text-xs text-white/30 mt-0.5">ID 334654318</span>
          </div>

          <div className="px-4 pb-5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-white/30">Баланс</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">0,000000 TON</div>
            <div className="flex gap-2.5 mt-3">
              <button className="flex-1 bg-[#4ade80] text-black font-medium text-sm rounded-lg py-2.5 text-center">
                Пополнить
              </button>
              <button className="flex-1 bg-white/8 text-white/70 font-medium text-sm rounded-lg py-2.5 text-center">
                Вывести
              </button>
            </div>
          </div>

          <div className="h-px bg-white/5 mx-4" />

          <div className="flex flex-col px-4 py-2">
            {profileSections.flatMap((s) => s.items).map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-3 py-3.5 active:opacity-60 transition-opacity"
              >
                <Icon
                  name={item.icon}
                  fallback={item.fallback || item.icon}
                  size={18}
                  className="text-white/25"
                />
                <span className="text-sm text-white/70">{item.label}</span>
                {item.badge && (
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
                <Icon name="ChevronRight" size={14} className="text-white/15 ml-auto" />
              </button>
            ))}
          </div>

          <div className="pb-8" />
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
            <span className="text-white text-xs font-medium">0</span>
          </div>
          <button className="flex items-center gap-1.5 bg-white text-black text-xs font-semibold rounded-full px-4 py-2 hover:bg-white/90 active:bg-white/80 transition-colors">
            <Icon name="Plus" size={14} />
            Пополнить
          </button>
        </div>
      </header>

      <div className="flex-1" />

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