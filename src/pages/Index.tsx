import { useState } from "react";
import Icon from "@/components/ui/icon";

const navItems = [
  { icon: "Menu", label: "Меню" },
  { icon: "Home", label: "Главная" },
  { icon: "Spade", label: "Казино", fallback: "Clover" },
  { icon: "BadgeDollarSign", label: "Free money" },
  { icon: "Briefcase", label: "Кейсы" },
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
  const [profileOpen, setProfileOpen] = useState(false);

  const handleNavClick = (index: number) => {
    if (index === 0) {
      setProfileOpen(true);
    } else {
      setActive(index);
    }
  };

  return (
    <div className="w-full flex flex-col touch-manipulation relative" style={{ minHeight: "100svh" }}>
      {profileOpen && (
        <div className="fixed inset-0 z-50 bg-[#f2f2f7] flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h1 className="text-[22px] font-bold text-black">Профиль</h1>
            <button
              onClick={() => setProfileOpen(false)}
              className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center"
            >
              <Icon name="X" size={16} className="text-black/60" />
            </button>
          </div>

          <div className="flex flex-col items-center pt-4 pb-6">
            <span className="text-[22px] font-bold text-black">Серия</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Icon name="Copy" size={14} className="text-black/30" />
              <span className="text-[13px] text-black/40">ID 334654318</span>
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="bg-white rounded-2xl p-5">
              <span className="text-[13px] text-black/40">Счет</span>
              <div className="text-[26px] font-bold text-black mt-1 tracking-tight">0,000000 TON</div>
              <div className="flex gap-3 mt-4">
                <button className="flex-1 flex items-center justify-center gap-2 bg-[#34C759] text-white font-semibold text-[15px] rounded-xl py-3.5">
                  <Icon name="Plus" size={18} />
                  Пополнить
                </button>
                <button className="flex-1 flex items-center justify-center bg-[#f2f2f7] text-black font-semibold text-[15px] rounded-xl py-3.5">
                  Вывести
                </button>
              </div>
            </div>
          </div>

          {profileSections.map((section, sIdx) => (
            <div key={sIdx} className="px-4 pb-3">
              <div className="bg-white rounded-2xl overflow-hidden">
                {section.items.map((item, iIdx) => (
                  <div key={item.label}>
                    <button className="w-full flex items-center gap-4 px-5 py-4">
                      <div className="w-10 h-10 rounded-xl bg-[#f2f2f7] flex items-center justify-center relative shrink-0">
                        <Icon
                          name={item.icon}
                          fallback={item.fallback || item.icon}
                          size={20}
                          className="text-black/40"
                        />
                        {item.badge && (
                          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
                        )}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-[15px] font-semibold text-black">{item.label}</span>
                        <span className="text-[13px] text-black/40">{item.desc}</span>
                      </div>
                    </button>
                    {iIdx < section.items.length - 1 && (
                      <div className="h-px bg-black/5 ml-[72px] mr-5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

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
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1.5"
          >
            <div className="w-6 h-6 rounded-full shrink-0 overflow-hidden">
              <img
                src="https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/521d6370-ca4b-47aa-9be0-a7e2edc0027f.jpg"
                alt="USDT"
                className="w-full h-full object-cover scale-[1.8]"
              />
            </div>
            <span className="text-white text-xs font-medium">0</span>
          </button>
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