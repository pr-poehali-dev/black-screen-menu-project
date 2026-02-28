import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Если telegram_id изменился — чистим старую сессию
const tgUser = (window as Window & { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { id: number } } } } })
  .Telegram?.WebApp?.initDataUnsafe?.user;
if (tgUser?.id) {
  const savedTgId = localStorage.getItem("telegram_auth_user_id");
  if (savedTgId && savedTgId !== String(tgUser.id)) {
    localStorage.removeItem("telegram_auth_refresh_token");
  }
  localStorage.setItem("telegram_auth_user_id", String(tgUser.id));
}

createRoot(document.getElementById("root")!).render(<App />);