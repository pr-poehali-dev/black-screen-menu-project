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
      <div className="flex-1 bg-background" />

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