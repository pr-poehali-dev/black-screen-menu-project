import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTelegramAuth } from "@/components/extensions/telegram-bot/useTelegramAuth";

const TG_AUTH_URL = "https://functions.poehali.dev/420b5ea1-6f3d-420d-bb72-398ac6d4f617";
const TG_BOT_USERNAME = "JaguarRrBot";

const TelegramCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  const tgAuth = useTelegramAuth({
    apiUrls: {
      callback: `${TG_AUTH_URL}?action=callback`,
      refresh: `${TG_AUTH_URL}?action=refresh`,
      logout: `${TG_AUTH_URL}?action=logout`,
    },
    botUsername: TG_BOT_USERNAME,
  });

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    tgAuth.handleCallback(token).then((success) => {
      if (success) {
        navigate("/", { replace: true });
      } else {
        setStatus("error");
      }
    });
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      {status === "loading" ? (
        <>
          <div className="text-[#4ade80] font-extrabold text-2xl tracking-wide uppercase animate-pulse mb-4">
            Jaguar Casino
          </div>
          <p className="text-white/40 text-sm">Авторизация через Telegram...</p>
        </>
      ) : (
        <>
          <p className="text-red-400 text-sm mb-4">Ошибка авторизации. Попробуйте снова.</p>
          <button
            onClick={() => navigate("/", { replace: true })}
            className="bg-[#4ade80] text-black font-bold text-sm rounded-xl px-6 py-3 hover:bg-[#4ade80]/90 transition-colors"
          >
            На главную
          </button>
        </>
      )}
    </div>
  );
};

export default TelegramCallback;
