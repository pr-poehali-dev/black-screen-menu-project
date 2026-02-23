import { useState } from "react";
import Icon from "@/components/ui/icon";

const navItems = [
  { icon: "Menu", label: "Меню" },
  { icon: "Home", label: "Главная" },
  { icon: "Spade", label: "Казино", fallback: "Clover" },
  { icon: "BadgeDollarSign", label: "Free money" },
  { icon: "Goal", label: "Спорт", fallback: "Circle" },
];

const Index = () => {
  const [active, setActive] = useState(1);

  return (
    <div className="w-full flex flex-col touch-manipulation" style={{ minHeight: "100svh" }}>
      <div className="flex-1 bg-background">
        <div className="w-full bg-[#1a1a2e] px-4 py-3 flex items-center justify-between">
          <div className="text-white font-bold text-lg tracking-wide">LOGO</div>
          <div className="flex items-center bg-[#2a2a3e] rounded-full pl-1 pr-1 py-1 gap-1">
            <div className="flex items-center gap-1.5 pl-1 pr-2">
              <img
                src="https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/205c3f8a-d2ba-450b-a973-b1dd08565edd.jpg"
                alt="USDT"
                className="w-6 h-6 rounded-full shrink-0 object-cover"
              />
              <span className="text-white font-semibold text-xs">0</span>
              <Icon name="ChevronDown" size={12} className="text-gray-400" />
            </div>
            <button className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors text-white font-semibold text-xs rounded-full px-3 py-1.5">
              <Icon name="PlusSquare" size={13} className="text-white" />
              Пополнить
            </button>
          </div>
        </div>
      </div>

      <nav className="w-full bg-background px-3 pb-6 pt-3">
        <div className="flex items-center justify-around gap-2">
          {navItems.map((item, index) => (
            <button
              key={item.label}
              onClick={() => setActive(index)}
              className="flex flex-col items-center gap-1.5 min-w-0 flex-1"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                  active === index
                    ? "bg-blue-600"
                    : "bg-[#2a2a3e]"
                }`}
              >
                <Icon
                  name={item.icon}
                  fallback={item.fallback || item.icon}
                  size={22}
                  className={active === index ? "text-white" : "text-gray-400"}
                />
              </div>
              <span
                className={`text-[11px] leading-tight truncate ${
                  active === index ? "text-blue-400 font-medium" : "text-gray-500"
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