import { useState } from "react";
import Icon from "@/components/ui/icon";

interface AuthScreenProps {
  onAuth: () => void;
}

const AuthScreen = ({ onAuth }: AuthScreenProps) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuth();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-[400px] flex flex-col items-center px-6 pt-12 pb-8">
        <div className="flex flex-col items-center mb-8">
          <span className="text-[#4ade80] font-extrabold text-2xl tracking-wide uppercase mb-4">
            Jaguar Casino
          </span>
          <img
            src="https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/bdee33c2-9378-4db9-9a37-c87d8ac6f8cf.jpg"
            alt="Jaguar Casino"
            className="w-36 h-36 object-contain"
          />
        </div>

        <div className="w-full flex bg-white/5 rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              mode === "login"
                ? "bg-[#4ade80] text-black"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            Вход
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              mode === "register"
                ? "bg-[#4ade80] text-black"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
              <Icon name="Mail" size={18} className="text-white/30" />
            </div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#4ade80]/40 transition-colors"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
              <Icon name="Lock" size={18} className="text-white/30" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#4ade80]/40 transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2"
            >
              <Icon
                name={showPassword ? "EyeOff" : "Eye"}
                size={18}
                className="text-white/30"
              />
            </button>
          </div>

          {mode === "register" && (
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <Icon name="Lock" size={18} className="text-white/30" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Подтвердите пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#4ade80]/40 transition-colors"
                required
              />
            </div>
          )}

          {mode === "login" && (
            <button
              type="button"
              className="text-[#4ade80]/70 text-xs text-right hover:text-[#4ade80] transition-colors"
            >
              Забыли пароль?
            </button>
          )}

          <button
            type="submit"
            className="w-full bg-[#4ade80] text-black font-bold text-sm rounded-xl py-3.5 mt-2 hover:bg-[#4ade80]/90 active:bg-[#4ade80]/80 transition-colors"
          >
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>

        {mode === "register" && (
          <p className="text-white/25 text-[11px] text-center mt-4 leading-relaxed">
            Регистрируясь, вы подтверждаете, что вам исполнилось 18 лет и вы
            принимаете условия использования
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
