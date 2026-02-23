import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/components/extensions/auth-email/useAuth";
import { useTelegramAuth } from "@/components/extensions/telegram-bot/useTelegramAuth";

const AUTH_URL = "https://functions.poehali.dev/92e35473-1c53-44e8-b2d8-d769976a894c";
const TG_AUTH_URL = "https://functions.poehali.dev/420b5ea1-6f3d-420d-bb72-398ac6d4f617";
const TG_BOT_USERNAME = "Jaguar_Official_bot";

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

  const tgAuth = useTelegramAuth({
    apiUrls: {
      callback: `${TG_AUTH_URL}?action=callback`,
      refresh: `${TG_AUTH_URL}?action=refresh`,
      logout: `${TG_AUTH_URL}?action=logout`,
    },
    botUsername: TG_BOT_USERNAME,
    onAuthChange: (user) => {
      if (user) onAuth();
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      window.history.replaceState({}, "", window.location.pathname);
      tgAuth.handleCallback(token);
    }
  }, []);

  const displayError = auth.error || tgAuth.error || localError;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);
    if (!email || !password) { setLocalError("Заполните все поля"); return; }
    const success = await auth.login({ email, password });
    if (success) onAuth();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);
    if (!email || !password) { setLocalError("Заполните все поля"); return; }
    if (password.length < 8) { setLocalError("Пароль минимум 8 символов"); return; }
    if (password !== confirmPassword) { setLocalError("Пароли не совпадают"); return; }
    const result = await auth.register({ email, password, name: name || undefined });
    if (result.success) {
      if (result.emailVerificationRequired) {
        setSuccessMsg(result.message || "Код отправлен на email");
        setView("verify");
      } else { onAuth(); }
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (code.length !== 6) { setLocalError("Введите 6-значный код"); return; }
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
    if (!email) { setLocalError("Введите email"); return; }
    const result = await auth.requestPasswordReset(email);
    if (result) { setResetStep("code"); setSuccessMsg("Код для сброса отправлен"); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (code.length !== 6 || !newPassword) { setLocalError("Заполните все поля"); return; }
    if (newPassword.length < 8) { setLocalError("Пароль минимум 8 символов"); return; }
    const success = await auth.resetPassword(email, code, newPassword);
    if (success) {
      setSuccessMsg("Пароль изменён!");
      setView("login");
      setResetStep("email");
      setCode("");
      setNewPassword("");
    }
  };

  const switchView = (v: View) => { setView(v); setLocalError(null); setSuccessMsg(null); };

  const inp = "w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#4ade80]/30 transition-colors";
  const btn = "w-full bg-[#4ade80] text-black font-semibold text-[13px] rounded-lg py-3 hover:bg-[#4ade80]/90 active:bg-[#4ade80]/80 transition-colors disabled:opacity-40";
  const link = "text-white/30 text-[12px] hover:text-white/50 transition-colors";
  const codeInp = "w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-white text-center text-xl tracking-[0.4em] font-semibold placeholder:text-white/15 focus:outline-none focus:border-[#4ade80]/30 transition-colors";

  const renderMsg = () => (
    <>
      {successMsg && <div className="text-[#4ade80]/80 text-[12px] mb-3">{successMsg}</div>}
      {displayError && <div className="text-red-400/80 text-[12px] mb-3">{displayError}</div>}
    </>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="w-full max-w-[340px] flex flex-col items-center px-6">

        <img
          src="https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/bdee33c2-9378-4db9-9a37-c87d8ac6f8cf.jpg"
          alt="Jaguar Casino"
          className="w-24 h-24 object-contain mb-3"
        />
        <span className="text-[#4ade80] font-extrabold text-lg tracking-wider uppercase mb-8">
          Jaguar Casino
        </span>

        {view === "verify" && (
          <div className="w-full flex flex-col items-center">
            <p className="text-white/30 text-[12px] text-center mb-4">Код отправлен на {email}</p>
            {renderMsg()}
            <form onSubmit={handleVerify} className="w-full flex flex-col gap-2.5">
              <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className={codeInp} />
              <button type="submit" disabled={auth.isLoading} className={btn}>{auth.isLoading ? "..." : "Подтвердить"}</button>
              <button type="button" onClick={() => switchView("register")} className={`${link} mt-2`}>Назад</button>
            </form>
          </div>
        )}

        {view === "reset" && (
          <div className="w-full flex flex-col items-center">
            <p className="text-white/30 text-[12px] text-center mb-4">{resetStep === "email" ? "Введите email" : "Введите код и новый пароль"}</p>
            {renderMsg()}
            {resetStep === "email" ? (
              <form onSubmit={handleResetRequest} className="w-full flex flex-col gap-2.5">
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inp} required />
                <button type="submit" disabled={auth.isLoading} className={btn}>{auth.isLoading ? "..." : "Отправить код"}</button>
                <button type="button" onClick={() => { switchView("login"); setResetStep("email"); }} className={`${link} mt-2`}>Назад</button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="w-full flex flex-col gap-2.5">
                <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className={codeInp} />
                <input type="password" placeholder="Новый пароль" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inp} required />
                <button type="submit" disabled={auth.isLoading} className={btn}>{auth.isLoading ? "..." : "Сменить пароль"}</button>
                <button type="button" onClick={() => { setResetStep("email"); setLocalError(null); setSuccessMsg(null); }} className={`${link} mt-2`}>Назад</button>
              </form>
            )}
          </div>
        )}

        {(view === "login" || view === "register") && (
          <div className="w-full flex flex-col items-center">
            <div className="w-full flex bg-white/[0.03] rounded-lg p-0.5 mb-5">
              <button onClick={() => switchView("login")} className={`flex-1 py-2 rounded-md text-[12px] font-medium transition-all ${view === "login" ? "bg-[#4ade80] text-black" : "text-white/30"}`}>Вход</button>
              <button onClick={() => switchView("register")} className={`flex-1 py-2 rounded-md text-[12px] font-medium transition-all ${view === "register" ? "bg-[#4ade80] text-black" : "text-white/30"}`}>Регистрация</button>
            </div>

            {renderMsg()}

            {view === "login" ? (
              <form onSubmit={handleLogin} className="w-full flex flex-col gap-2.5">
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inp} required />
                <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className={inp} required />
                <div className="flex justify-end">
                  <button type="button" onClick={() => switchView("reset")} className={link}>Забыли пароль?</button>
                </div>
                <button type="submit" disabled={auth.isLoading} className={btn}>{auth.isLoading ? "..." : "Войти"}</button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="w-full flex flex-col gap-2.5">
                <input type="text" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} className={inp} />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inp} required />
                <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className={inp} required />
                <input type="password" placeholder="Подтвердите пароль" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inp} required />
                <button type="submit" disabled={auth.isLoading} className={btn}>{auth.isLoading ? "..." : "Создать аккаунт"}</button>
                <p className="text-white/15 text-[10px] text-center mt-1">Мне исполнилось 18 лет</p>
              </form>
            )}

            <div className="w-full flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-white/15 text-[10px]">или</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <button
              onClick={() => tgAuth.login()}
              disabled={tgAuth.isLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#0088cc]/10 border border-[#0088cc]/20 text-[#0088cc] font-medium text-[13px] rounded-lg py-3 hover:bg-[#0088cc]/15 active:bg-[#0088cc]/20 transition-colors disabled:opacity-40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906q-1.168.486-4.666 2.01-.567.225-.595.442c-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294q.39.01.868-.32 3.269-2.206 3.374-2.23c.05-.012.12-.026.166.016s.042.12.037.141c-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8 8 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629q.14.092.27.187c.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.4 1.4 0 0 0-.013-.315.34.34 0 0 0-.114-.217.53.53 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09" />
              </svg>
              Telegram
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
