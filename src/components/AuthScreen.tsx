import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/components/extensions/auth-email/useAuth";

const AUTH_URL = "https://functions.poehali.dev/92e35473-1c53-44e8-b2d8-d769976a894c";

interface AuthScreenProps {
  onAuth: () => void;
}

type View = "login" | "register" | "reset" | "verify";

const AuthScreen = ({ onAuth }: AuthScreenProps) => {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState<"email" | "code">("email");
  const [newPassword, setNewPassword] = useState("");

  const auth = useAuth({
    apiUrls: {
      login: `${AUTH_URL}?action=login`,
      register: `${AUTH_URL}?action=register`,
      verifyEmail: `${AUTH_URL}?action=verify-email`,
      refresh: `${AUTH_URL}?action=refresh`,
      logout: `${AUTH_URL}?action=logout`,
      resetPassword: `${AUTH_URL}?action=reset-password`,
    },
    onAuthChange: (user) => {
      if (user) onAuth();
    },
  });

  const displayError = auth.error || localError;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);
    if (!email || !password) {
      setLocalError("Заполните все поля");
      return;
    }
    const success = await auth.login({ email, password });
    if (success) onAuth();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);
    if (!email || !password) {
      setLocalError("Заполните все поля");
      return;
    }
    if (password.length < 8) {
      setLocalError("Пароль минимум 8 символов");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Пароли не совпадают");
      return;
    }
    const result = await auth.register({ email, password, name: name || undefined });
    if (result.success) {
      if (result.emailVerificationRequired) {
        setSuccessMsg(result.message || "Код отправлен на email");
        setView("verify");
      } else {
        onAuth();
      }
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (code.length !== 6) {
      setLocalError("Введите 6-значный код");
      return;
    }
    const verified = await auth.verifyEmail(email, code);
    if (verified) {
      const loggedIn = await auth.login({ email, password });
      if (loggedIn) onAuth();
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);
    if (!email) {
      setLocalError("Введите email");
      return;
    }
    const result = await auth.requestPasswordReset(email);
    if (result) {
      setResetStep("code");
      setSuccessMsg("Код для сброса отправлен");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (code.length !== 6 || !newPassword) {
      setLocalError("Заполните все поля");
      return;
    }
    if (newPassword.length < 8) {
      setLocalError("Пароль минимум 8 символов");
      return;
    }
    const success = await auth.resetPassword(email, code, newPassword);
    if (success) {
      setSuccessMsg("Пароль изменён! Войдите с новым паролем");
      setView("login");
      setResetStep("email");
      setCode("");
      setNewPassword("");
    }
  };

  const switchView = (v: View) => {
    setView(v);
    setLocalError(null);
    setSuccessMsg(null);
  };

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#4ade80]/40 transition-colors";
  const inputPassClass =
    "w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#4ade80]/40 transition-colors";
  const btnClass =
    "w-full bg-[#4ade80] text-black font-bold text-sm rounded-xl py-3.5 mt-2 hover:bg-[#4ade80]/90 active:bg-[#4ade80]/80 transition-colors disabled:opacity-50";
  const codeInputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-center text-2xl tracking-[0.5em] font-bold placeholder:text-white/20 focus:outline-none focus:border-[#4ade80]/40 transition-colors";

  const renderMsg = () => (
    <>
      {successMsg && (
        <div className="w-full bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-xl px-4 py-3 text-[#4ade80] text-sm mb-2">
          {successMsg}
        </div>
      )}
      {displayError && (
        <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm mb-2">
          {displayError}
        </div>
      )}
    </>
  );

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

        {view === "verify" && (
          <>
            <h2 className="text-white font-bold text-lg mb-2">Подтверждение email</h2>
            <p className="text-white/40 text-sm text-center mb-4">Введите 6-значный код, отправленный на {email}</p>
            {renderMsg()}
            <form onSubmit={handleVerify} className="w-full flex flex-col gap-3">
              <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className={codeInputClass} />
              <button type="submit" disabled={auth.isLoading} className={btnClass}>{auth.isLoading ? "Проверка..." : "Подтвердить"}</button>
              <button type="button" onClick={() => switchView("register")} className="text-white/40 text-sm hover:text-white/60 transition-colors mt-1">Назад</button>
            </form>
          </>
        )}

        {view === "reset" && (
          <>
            <h2 className="text-white font-bold text-lg mb-2">Сброс пароля</h2>
            <p className="text-white/40 text-sm text-center mb-4">{resetStep === "email" ? "Введите email для получения кода" : "Введите код и новый пароль"}</p>
            {renderMsg()}
            {resetStep === "email" ? (
              <form onSubmit={handleResetRequest} className="w-full flex flex-col gap-3">
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><Icon name="Mail" size={18} className="text-white/30" /></div>
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                </div>
                <button type="submit" disabled={auth.isLoading} className={btnClass}>{auth.isLoading ? "Отправка..." : "Отправить код"}</button>
                <button type="button" onClick={() => { switchView("login"); setResetStep("email"); }} className="text-white/40 text-sm hover:text-white/60 transition-colors mt-1">Назад ко входу</button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="w-full flex flex-col gap-3">
                <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className={codeInputClass} />
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><Icon name="Lock" size={18} className="text-white/30" /></div>
                  <input type="password" placeholder="Новый пароль" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} required />
                </div>
                <button type="submit" disabled={auth.isLoading} className={btnClass}>{auth.isLoading ? "Сохранение..." : "Сменить пароль"}</button>
                <button type="button" onClick={() => { setResetStep("email"); setLocalError(null); setSuccessMsg(null); }} className="text-white/40 text-sm hover:text-white/60 transition-colors mt-1">Назад</button>
              </form>
            )}
          </>
        )}

        {(view === "login" || view === "register") && (
          <>
            <div className="w-full flex bg-white/5 rounded-xl p-1 mb-6">
              <button onClick={() => switchView("login")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${view === "login" ? "bg-[#4ade80] text-black" : "text-white/50 hover:text-white/70"}`}>Вход</button>
              <button onClick={() => switchView("register")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${view === "register" ? "bg-[#4ade80] text-black" : "text-white/50 hover:text-white/70"}`}>Регистрация</button>
            </div>

            {renderMsg()}

            {view === "login" ? (
              <form onSubmit={handleLogin} className="w-full flex flex-col gap-3">
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><Icon name="Mail" size={18} className="text-white/30" /></div>
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><Icon name="Lock" size={18} className="text-white/30" /></div>
                  <input type={showPassword ? "text" : "password"} placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className={inputPassClass} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2"><Icon name={showPassword ? "EyeOff" : "Eye"} size={18} className="text-white/30" /></button>
                </div>
                <button type="button" onClick={() => switchView("reset")} className="text-[#4ade80]/70 text-xs text-right hover:text-[#4ade80] transition-colors">Забыли пароль?</button>
                <button type="submit" disabled={auth.isLoading} className={btnClass}>{auth.isLoading ? "Вход..." : "Войти"}</button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="w-full flex flex-col gap-3">
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><Icon name="User" size={18} className="text-white/30" /></div>
                  <input type="text" placeholder="Имя (необязательно)" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><Icon name="Mail" size={18} className="text-white/30" /></div>
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><Icon name="Lock" size={18} className="text-white/30" /></div>
                  <input type={showPassword ? "text" : "password"} placeholder="Пароль (мин. 8 символов)" value={password} onChange={(e) => setPassword(e.target.value)} className={inputPassClass} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2"><Icon name={showPassword ? "EyeOff" : "Eye"} size={18} className="text-white/30" /></button>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2"><Icon name="Lock" size={18} className="text-white/30" /></div>
                  <input type={showPassword ? "text" : "password"} placeholder="Подтвердите пароль" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} required />
                </div>
                <button type="submit" disabled={auth.isLoading} className={btnClass}>{auth.isLoading ? "Регистрация..." : "Зарегистрироваться"}</button>
                <p className="text-white/25 text-[11px] text-center mt-2 leading-relaxed">Регистрируясь, вы подтверждаете, что вам исполнилось 18 лет и вы принимаете условия использования</p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
