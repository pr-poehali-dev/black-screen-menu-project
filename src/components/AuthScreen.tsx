import { useEffect } from "react";
import { useTelegramAuth } from "@/components/extensions/telegram-bot/useTelegramAuth";

const TG_AUTH_URL = "https://functions.poehali.dev/420b5ea1-6f3d-420d-bb72-398ac6d4f617";
const TG_BOT_USERNAME = "Jaguar_Official_bot";

interface AuthScreenProps {
  onAuth: () => void;
}

const AuthScreen = ({ onAuth }: AuthScreenProps) => {
  const tgAuth = useTelegramAuth({
    apiUrls: {
      callback: `${TG_AUTH_URL}?action=callback`,
      refresh: `${TG_AUTH_URL}?action=refresh`,
      logout: `${TG_AUTH_URL}?action=logout`,
    },
    botUsername: TG_BOT_USERNAME,
  });

  useEffect(() => {
    if (tgAuth.isAuthenticated) onAuth();
  }, [tgAuth.isAuthenticated]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      window.history.replaceState({}, "", window.location.pathname);
      tgAuth.handleCallback(token);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="w-full max-w-[340px] flex flex-col items-center px-6">

        <img
          src="https://cdn.poehali.dev/projects/0458ff35-1488-42b4-a47d-9a48901b711f/bucket/bdee33c2-9378-4db9-9a37-c87d8ac6f8cf.jpg"
          alt="Jaguar Casino"
          className="w-24 h-24 object-contain mb-3"
        />
        <span className="text-[#4ade80] font-extrabold text-lg tracking-wider uppercase mb-10">
          Jaguar Casino
        </span>

        {tgAuth.error && (
          <div className="text-red-400/80 text-[12px] mb-4 text-center">{tgAuth.error}</div>
        )}

        <button
          onClick={() => tgAuth.login()}
          disabled={tgAuth.isLoading}
          className="w-full flex items-center justify-center gap-3 bg-[#4ade80] text-black font-bold text-[15px] rounded-xl py-4 hover:bg-[#4ade80]/90 active:bg-[#4ade80]/80 transition-colors disabled:opacity-40"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
          </svg>
          {tgAuth.isLoading ? "Загрузка..." : "Войти через Telegram"}
        </button>

        <p className="text-white/20 text-[11px] text-center mt-6 leading-relaxed">
          Нажимая кнопку, вы соглашаетесь с условиями использования сервиса
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;