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
        <div className="px-4 pt-4 flex justify-end">
          <div className="flex items-center bg-[#1c1c1e] rounded-full px-1.5 py-1.5 w-fit gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#26a17b] flex items-center justify-center">
                <span className="text-white font-bold text-xs">₮</span>
              </div>
              <span className="text-white font-semibold text-sm">0</span>
              <Icon name="ChevronDown" size={14} className="text-gray-400" />
            </div>
            <div className="h-6 w-px bg-gray-700" />
            <button className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors text-white font-medium text-sm rounded-full px-4 py-1.5">
              <Icon name="PlusSquare" size={15} className="text-white" />
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