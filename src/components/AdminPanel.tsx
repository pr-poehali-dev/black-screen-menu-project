import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const ADMIN_URL = "https://functions.poehali.dev/6eb840f4-abc2-453e-a7d9-5f9a989722bf";
const WITHDRAWAL_URL = "https://functions.poehali.dev/9cfe3eb3-a1dd-4e28-806b-4476909e4725";
const VOUCHER_URL = "https://functions.poehali.dev/67465d27-c387-428b-a82c-c47b677094b2";

const ROLE_OWNER = 0;
const ROLE_CHIEF = 1;
const ROLE_ADMIN = 2;
const ROLE_TECH = 3;

const ROLE_NAMES: Record<number, string> = {
  [ROLE_OWNER]: "Владелец",
  [ROLE_CHIEF]: "Гл.Администратор",
  [ROLE_ADMIN]: "Администратор",
  [ROLE_TECH]: "Тех.Специалист",
};

const ROLE_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  [ROLE_OWNER]: { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30" },
  [ROLE_CHIEF]: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
  [ROLE_ADMIN]: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" },
  [ROLE_TECH]: { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30" },
};

interface Player {
  id: number;
  display_id: number;
  name: string;
  telegram_id: string;
  is_blocked: boolean;
  created_at: string | null;
  balance: number;
}

interface Stats {
  total_users: number;
  blocked_users: number;
  total_balance: number;
  total_payments: number;
}

interface AdminUser {
  id: number;
  display_id: number;
  role: number;
  role_name: string;
  created_at: string | null;
  custom_name: string;
  user_name: string;
  telegram_id: string;
}

interface Withdrawal {
  id: number;
  user_id: number;
  display_id: number;
  user_name: string;
  network: string;
  address: string;
  amount: number;
  status: string;
  created_at: string | null;
  processed_at: string | null;
}

interface Voucher {
  id: number;
  code: string;
  amount: number;
  is_active: boolean;
  used_by: number | null;
  used_at: string | null;
  created_at: string | null;
}

interface AdminPanelProps {
  adminDisplayId: string | number;
  adminRole: number;
  onClose: () => void;
}

type Tab = "players" | "stats" | "admins" | "withdrawals" | "vouchers";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function AdminPanel({ adminDisplayId, adminRole, onClose }: AdminPanelProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [newBalance, setNewBalance] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>(adminRole <= ROLE_ADMIN ? "players" : "stats");
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [addAdminId, setAddAdminId] = useState("");
  const [addAdminRole, setAddAdminRole] = useState(ROLE_ADMIN);
  const [addAdminError, setAddAdminError] = useState("");
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [changeRoleAdmin, setChangeRoleAdmin] = useState<AdminUser | null>(null);
  const [changeRoleValue, setChangeRoleValue] = useState(ROLE_ADMIN);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [wdFilter, setWdFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  // Vouchers
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherAmount, setVoucherAmount] = useState("");
  const [voucherCreating, setVoucherCreating] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  const canManagePlayers = adminRole <= ROLE_ADMIN;
  const canManageAdmins = adminRole <= ROLE_CHIEF;

  const fetchPlayers = useCallback(async (q = "") => {
    if (!canManagePlayers) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: "players", admin_id: String(adminDisplayId) });
      if (q) params.set("search", q);
      const res = await fetch(`${ADMIN_URL}?${params}`);
      const data = await res.json();
      if (res.ok) setPlayers(data.players || []);
    } catch { /* */ }
    setLoading(false);
  }, [adminDisplayId, canManagePlayers]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${ADMIN_URL}?action=stats&admin_id=${adminDisplayId}`);
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch { /* */ }
  }, [adminDisplayId]);

  const fetchAdmins = useCallback(async () => {
    if (!canManagePlayers) return;
    try {
      const res = await fetch(`${ADMIN_URL}?action=list_admins&admin_id=${adminDisplayId}`);
      const data = await res.json();
      if (res.ok) setAdmins(data.admins || []);
    } catch { /* */ }
  }, [adminDisplayId, canManagePlayers]);

  const fetchWithdrawals = useCallback(async (status = "pending") => {
    if (!canManagePlayers) return;
    setWithdrawalsLoading(true);
    try {
      const res = await fetch(`${WITHDRAWAL_URL}?action=list&status=${status}`);
      const data = await res.json();
      if (res.ok) setWithdrawals(data.withdrawals || []);
    } catch { /* */ }
    setWithdrawalsLoading(false);
  }, [canManagePlayers]);

  const fetchVouchers = useCallback(async () => {
    setVouchersLoading(true);
    try {
      const res = await fetch(`${VOUCHER_URL}?action=list&admin_id=${adminDisplayId}`);
      const data = await res.json();
      if (res.ok) setVouchers(data.vouchers || []);
    } catch { /* */ }
    setVouchersLoading(false);
  }, [adminDisplayId]);

  useEffect(() => {
    fetchStats();
    if (canManagePlayers) {
      fetchPlayers();
      fetchAdmins();
      fetchWithdrawals("pending");
    } else {
      setLoading(false);
    }
  }, [fetchPlayers, fetchStats, fetchAdmins, fetchWithdrawals, canManagePlayers]);

  useEffect(() => {
    if (tab === "vouchers") fetchVouchers();
  }, [tab, fetchVouchers]);

  const handleSearch = () => fetchPlayers(search);

  const handleBlock = async (player: Player) => {
    setActionLoading(player.id);
    try {
      await fetch(`${ADMIN_URL}?action=block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: String(adminDisplayId), user_id: String(player.id) }),
      });
      await fetchPlayers(search);
    } catch { /* */ }
    setActionLoading(null);
  };

  const handleUnblock = async (player: Player) => {
    setActionLoading(player.id);
    try {
      await fetch(`${ADMIN_URL}?action=unblock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: String(adminDisplayId), user_id: String(player.id) }),
      });
      await fetchPlayers(search);
    } catch { /* */ }
    setActionLoading(null);
  };

  const handleSetBalance = async () => {
    if (!editingPlayer || newBalance === "") return;
    setActionLoading(editingPlayer.id);
    try {
      await fetch(`${ADMIN_URL}?action=set_balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: String(adminDisplayId),
          user_id: String(editingPlayer.id),
          balance: parseFloat(newBalance),
        }),
      });
      await fetchPlayers(search);
      await fetchStats();
      setEditingPlayer(null);
      setNewBalance("");
    } catch { /* */ }
    setActionLoading(null);
  };

  const handleAddAdmin = async () => {
    if (!addAdminId.trim()) { setAddAdminError("Введите ID игрока"); return; }
    setAddAdminError("");
    setAddAdminLoading(true);
    try {
      const res = await fetch(`${ADMIN_URL}?action=add_admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: String(adminDisplayId),
          display_id: parseInt(addAdminId.trim()),
          role: addAdminRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddAdminError(data.error || "Ошибка");
        setAddAdminLoading(false);
        return;
      }
      await fetchAdmins();
      setAddAdminOpen(false);
      setAddAdminId("");
      setAddAdminRole(ROLE_ADMIN);
    } catch { setAddAdminError("Ошибка соединения"); }
    setAddAdminLoading(false);
  };

  const handleRemoveAdmin = async (admin: AdminUser) => {
    setActionLoading(admin.id);
    try {
      await fetch(`${ADMIN_URL}?action=remove_admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: String(adminDisplayId), display_id: admin.display_id }),
      });
      await fetchAdmins();
    } catch { /* */ }
    setActionLoading(null);
  };

  const handleChangeRole = async () => {
    if (!changeRoleAdmin) return;
    setActionLoading(changeRoleAdmin.id);
    try {
      await fetch(`${ADMIN_URL}?action=change_role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: String(adminDisplayId),
          display_id: changeRoleAdmin.display_id,
          role: changeRoleValue,
        }),
      });
      await fetchAdmins();
      setChangeRoleAdmin(null);
    } catch { /* */ }
    setActionLoading(null);
  };

  const handleApproveWithdrawal = async (w: Withdrawal) => {
    setActionLoading(w.id);
    try {
      await fetch(`${WITHDRAWAL_URL}?action=approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawal_id: w.id, admin_id: String(adminDisplayId) }),
      });
      await fetchWithdrawals(wdFilter);
    } catch { /* */ }
    setActionLoading(null);
  };

  const handleRejectWithdrawal = async (w: Withdrawal) => {
    setActionLoading(w.id);
    try {
      await fetch(`${WITHDRAWAL_URL}?action=reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawal_id: w.id, admin_id: String(adminDisplayId) }),
      });
      await fetchWithdrawals(wdFilter);
    } catch { /* */ }
    setActionLoading(null);
  };

  const handleCreateVoucher = async () => {
    if (!voucherAmount) { setVoucherError("Укажите сумму"); return; }
    setVoucherError("");
    setVoucherCreating(true);
    try {
      const res = await fetch(`${VOUCHER_URL}?action=create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: String(adminDisplayId),
          code: voucherCode.trim().toUpperCase() || undefined,
          amount: parseFloat(voucherAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setVoucherError(data.error || "Ошибка"); setVoucherCreating(false); return; }
      await fetchVouchers();
      setVoucherModalOpen(false);
      setVoucherCode("");
      setVoucherAmount("");
    } catch { setVoucherError("Ошибка соединения"); }
    setVoucherCreating(false);
  };

  const handleDeactivateVoucher = async (v: Voucher) => {
    setActionLoading(v.id);
    try {
      await fetch(`${VOUCHER_URL}?action=deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: String(adminDisplayId), voucher_id: v.id }),
      });
      await fetchVouchers();
    } catch { /* */ }
    setActionLoading(null);
  };

  const roleOptions = [
    { role: ROLE_CHIEF, label: "Гл.Администратор", desc: "Все возможности платформы" },
    { role: ROLE_ADMIN, label: "Администратор", desc: "Все функции админ-панели" },
    { role: ROLE_TECH, label: "Тех.Специалист", desc: "Только аналитика" },
  ];

  const roleDotColor = (role: number) =>
    role === ROLE_OWNER ? "rgb(192 132 252)" : role === ROLE_CHIEF ? "rgb(248 113 113)" : role === ROLE_ADMIN ? "rgb(96 165 250)" : "rgb(250 204 21)";

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;

  const navItems: { id: Tab; icon: string; label: string; show: boolean; badge?: number }[] = [
    { id: "players", icon: "Users", label: "Игроки", show: canManagePlayers },
    { id: "stats", icon: "BarChart3", label: "Аналитика", show: true },
    { id: "admins", icon: "ShieldCheck", label: "Админы", show: canManagePlayers },
    { id: "withdrawals", icon: "ArrowUpRight", label: "Выводы", show: canManagePlayers, badge: tab !== "withdrawals" ? pendingCount : 0 },
    { id: "vouchers", icon: "Ticket", label: "Ваучеры", show: canManagePlayers },
  ].filter((i) => i.show);

  return (
    <div className="fixed inset-0 z-[60] bg-[#0a0a0a] flex overflow-hidden">

      {/* Sidebar */}
      <aside className="w-[200px] shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0d0d0d]">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4ade80]/15 flex items-center justify-center shrink-0">
              <Icon name="Shield" size={16} className="text-[#4ade80]" />
            </div>
            <div>
              <div className="text-white font-bold text-[13px] leading-tight">Admin</div>
              <div className="text-white/25 text-[10px]">{ROLE_NAMES[adminRole]}</div>
            </div>
          </div>
        </div>

        <div className="px-3 mb-2">
          <div className="h-px bg-white/[0.05]" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  if (item.id === "stats") fetchStats();
                  if (item.id === "admins") fetchAdmins();
                  if (item.id === "withdrawals") fetchWithdrawals(wdFilter);
                }}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  active
                    ? "bg-[#4ade80]/10 text-[#4ade80]"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                }`}
              >
                <Icon name={item.icon} size={16} className="shrink-0" />
                <span className="text-[13px] font-medium">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto w-5 h-5 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#4ade80] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-5 pt-3 border-t border-white/[0.05]">
          <button
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
          >
            <Icon name="LogOut" size={16} className="shrink-0" />
            <span className="text-[13px] font-medium">Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ===== ИГРОКИ ===== */}
        {tab === "players" && canManagePlayers && (
          <div className="flex flex-col h-full">
            <div className="px-7 pt-7 pb-4 border-b border-white/[0.06]">
              <h2 className="text-white font-bold text-[22px] mb-1">Игроки</h2>
              <p className="text-white/30 text-[13px]">Управление пользователями платформы</p>
              <div className="flex gap-2 mt-4">
                <div className="flex-1 flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 gap-2.5">
                  <Icon name="Search" size={15} className="text-white/25 shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Поиск по ID, имени или Telegram..."
                    className="bg-transparent text-white text-[13px] py-3 outline-none w-full placeholder:text-white/20"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="bg-[#4ade80] text-black font-semibold text-[13px] rounded-xl px-5 transition-colors hover:bg-[#3ecb6e] active:bg-[#3ecb6e]"
                >
                  Найти
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-7 py-4">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Icon name="Loader2" size={32} className="text-[#4ade80] animate-spin" />
                </div>
              ) : players.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <Icon name="UserX" size={48} className="text-white/10 mb-3" />
                  <span className="text-white/30 text-[14px]">Игроки не найдены</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {players.map((p) => (
                    <div
                      key={p.id}
                      className={`bg-white/[0.03] border rounded-2xl px-5 py-4 ${p.is_blocked ? "border-red-500/20" : "border-white/[0.07]"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${p.is_blocked ? "bg-red-500/10" : "bg-[#4ade80]/8"}`}>
                            <Icon name={p.is_blocked ? "Ban" : "User"} size={18} className={p.is_blocked ? "text-red-400" : "text-[#4ade80]/60"} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold text-[14px]">{p.name || "Без имени"}</span>
                              {p.is_blocked && (
                                <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Заблокирован</span>
                              )}
                            </div>
                            <div className="text-white/30 text-[12px] mt-0.5">
                              ID: {p.display_id} · TG: {p.telegram_id || "—"} · {formatDate(p.created_at)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right mr-2">
                            <div className="text-[#4ade80] font-bold text-[16px]">{p.balance.toFixed(2)}</div>
                            <div className="text-white/20 text-[10px]">USDT</div>
                          </div>
                          <button
                            onClick={() => { setEditingPlayer(p); setNewBalance(String(p.balance)); }}
                            className="w-8 h-8 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center transition-colors"
                            title="Изменить баланс"
                          >
                            <Icon name="Pencil" size={14} className="text-blue-400" />
                          </button>
                          {p.is_blocked ? (
                            <button
                              onClick={() => handleUnblock(p)}
                              disabled={actionLoading === p.id}
                              className="w-8 h-8 rounded-lg bg-[#4ade80]/10 hover:bg-[#4ade80]/20 flex items-center justify-center transition-colors disabled:opacity-40"
                              title="Разблокировать"
                            >
                              {actionLoading === p.id
                                ? <Icon name="Loader2" size={14} className="text-[#4ade80] animate-spin" />
                                : <Icon name="Unlock" size={14} className="text-[#4ade80]" />}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlock(p)}
                              disabled={actionLoading === p.id}
                              className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors disabled:opacity-40"
                              title="Заблокировать"
                            >
                              {actionLoading === p.id
                                ? <Icon name="Loader2" size={14} className="text-red-400 animate-spin" />
                                : <Icon name="Ban" size={14} className="text-red-400" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== АНАЛИТИКА ===== */}
        {tab === "stats" && (
          <div className="flex flex-col h-full overflow-y-auto">
            <div className="px-7 pt-7 pb-4 border-b border-white/[0.06]">
              <h2 className="text-white font-bold text-[22px] mb-1">Аналитика</h2>
              <p className="text-white/30 text-[13px]">Статистика платформы в реальном времени</p>
            </div>
            <div className="px-7 py-6">
              {!stats ? (
                <div className="flex items-center justify-center h-40">
                  <Icon name="Loader2" size={32} className="text-[#4ade80] animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-w-[600px]">
                  <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-[#4ade80]/10 flex items-center justify-center">
                        <Icon name="Users" size={18} className="text-[#4ade80]" />
                      </div>
                      <span className="text-white/40 text-[13px]">Игроков</span>
                    </div>
                    <div className="text-white font-bold text-[36px] leading-none">{stats.total_users}</div>
                  </div>
                  <div className="bg-white/[0.03] border border-red-500/15 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <Icon name="Ban" size={18} className="text-red-400" />
                      </div>
                      <span className="text-white/40 text-[13px]">Заблокировано</span>
                    </div>
                    <div className="text-red-400 font-bold text-[36px] leading-none">{stats.blocked_users}</div>
                  </div>
                  <div className="bg-white/[0.03] border border-[#4ade80]/15 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-[#4ade80]/10 flex items-center justify-center">
                        <Icon name="Wallet" size={18} className="text-[#4ade80]" />
                      </div>
                      <span className="text-white/40 text-[13px]">Общий баланс</span>
                    </div>
                    <div className="text-[#4ade80] font-bold text-[28px] leading-none">
                      {stats.total_balance.toFixed(2)}
                      <span className="text-[14px] text-white/25 ml-1.5">USDT</span>
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border border-blue-500/15 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Icon name="CreditCard" size={18} className="text-blue-400" />
                      </div>
                      <span className="text-white/40 text-[13px]">Платежей</span>
                    </div>
                    <div className="text-blue-400 font-bold text-[36px] leading-none">{stats.total_payments}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== АДМИНЫ ===== */}
        {tab === "admins" && canManagePlayers && (
          <div className="flex flex-col h-full">
            <div className="px-7 pt-7 pb-4 border-b border-white/[0.06] flex items-end justify-between">
              <div>
                <h2 className="text-white font-bold text-[22px] mb-1">Админы</h2>
                <p className="text-white/30 text-[13px]">Список администраторов платформы</p>
              </div>
              {canManageAdmins && (
                <button
                  onClick={() => setAddAdminOpen(true)}
                  className="flex items-center gap-2 bg-[#4ade80] text-black font-semibold text-[13px] rounded-xl px-4 py-2.5 hover:bg-[#3ecb6e] transition-colors"
                >
                  <Icon name="Plus" size={15} />
                  Добавить
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-7 py-4">
              {admins.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <Icon name="ShieldOff" size={48} className="text-white/10 mb-3" />
                  <span className="text-white/30 text-[14px]">Нет администраторов</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {admins.map((a) => {
                    const rc = ROLE_COLORS[a.role] || ROLE_COLORS[ROLE_TECH];
                    const isMe = a.display_id === Number(adminDisplayId);
                    return (
                      <div key={a.id} className={`bg-white/[0.03] border rounded-2xl px-5 py-4 ${rc.border}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${rc.bg}`}>
                              <Icon name="Shield" size={18} className={rc.text} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-semibold text-[14px]">{a.user_name || a.custom_name || "Администратор"}</span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rc.bg} ${rc.text}`}>
                                  {ROLE_NAMES[a.role]}
                                </span>
                                {isMe && <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded-full">Вы</span>}
                              </div>
                              <div className="text-white/30 text-[12px] mt-0.5">
                                ID: {a.display_id} · Добавлен {formatDate(a.created_at)}
                              </div>
                            </div>
                          </div>
                          {!isMe && canManageAdmins && a.role > adminRole && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setChangeRoleAdmin(a); setChangeRoleValue(a.role); }}
                                className="w-8 h-8 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center transition-colors"
                                title="Изменить роль"
                              >
                                <Icon name="Pencil" size={14} className="text-blue-400" />
                              </button>
                              <button
                                onClick={() => handleRemoveAdmin(a)}
                                disabled={actionLoading === a.id}
                                className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors disabled:opacity-40"
                                title="Удалить"
                              >
                                {actionLoading === a.id
                                  ? <Icon name="Loader2" size={14} className="text-red-400 animate-spin" />
                                  : <Icon name="Trash2" size={14} className="text-red-400" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== ВЫВОДЫ ===== */}
        {tab === "withdrawals" && canManagePlayers && (
          <div className="flex flex-col h-full">
            <div className="px-7 pt-7 pb-4 border-b border-white/[0.06]">
              <h2 className="text-white font-bold text-[22px] mb-1">Выводы</h2>
              <p className="text-white/30 text-[13px]">Заявки на вывод средств</p>
              <div className="flex gap-1 mt-4">
                {(["pending", "approved", "rejected", "all"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setWdFilter(f); fetchWithdrawals(f); }}
                    className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                      wdFilter === f ? "bg-[#4ade80] text-black" : "bg-white/[0.05] text-white/40 hover:text-white/60"
                    }`}
                  >
                    {f === "pending" ? "Ожидают" : f === "approved" ? "Одобрены" : f === "rejected" ? "Отклонены" : "Все"}
                    {f === "pending" && pendingCount > 0 && (
                      <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${wdFilter === "pending" ? "bg-black/20 text-black" : "bg-red-500 text-white"}`}>
                        {pendingCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-7 py-4">
              {withdrawalsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Icon name="Loader2" size={32} className="text-[#4ade80] animate-spin" />
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <Icon name="Inbox" size={48} className="text-white/10 mb-3" />
                  <span className="text-white/30 text-[14px]">Заявок нет</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {withdrawals.map((w) => (
                    <div
                      key={w.id}
                      className={`bg-white/[0.03] border rounded-2xl px-5 py-4 ${
                        w.status === "pending" ? "border-yellow-500/20" : w.status === "approved" ? "border-[#4ade80]/15" : "border-white/[0.07]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-semibold text-[14px]">{w.user_name || "Игрок"}</span>
                            <span className="text-[10px] font-mono text-white/30 bg-white/[0.05] px-2 py-0.5 rounded-full">{w.network}</span>
                            {w.status === "pending" && <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">Ожидает</span>}
                            {w.status === "approved" && <span className="text-[10px] text-[#4ade80] bg-[#4ade80]/10 px-2 py-0.5 rounded-full">Одобрен</span>}
                            {w.status === "rejected" && <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Отклонён</span>}
                          </div>
                          <div className="text-white/25 text-[11px] font-mono truncate max-w-[300px]">{w.address}</div>
                          <div className="text-white/20 text-[11px] mt-0.5">ID: {w.display_id} · {formatDate(w.created_at)}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-yellow-400 font-bold text-[18px]">{w.amount.toFixed(2)}</div>
                            <div className="text-white/20 text-[10px]">USDT</div>
                          </div>
                          {w.status === "pending" && (
                            <div className="flex flex-col gap-1.5">
                              <button
                                onClick={() => handleApproveWithdrawal(w)}
                                disabled={actionLoading === w.id}
                                className="w-8 h-8 rounded-lg bg-[#4ade80]/10 hover:bg-[#4ade80]/20 flex items-center justify-center transition-colors disabled:opacity-40"
                                title="Одобрить"
                              >
                                {actionLoading === w.id
                                  ? <Icon name="Loader2" size={14} className="text-[#4ade80] animate-spin" />
                                  : <Icon name="Check" size={14} className="text-[#4ade80]" />}
                              </button>
                              <button
                                onClick={() => handleRejectWithdrawal(w)}
                                disabled={actionLoading === w.id}
                                className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors disabled:opacity-40"
                                title="Отклонить"
                              >
                                <Icon name="X" size={14} className="text-red-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== ВАУЧЕРЫ ===== */}
        {tab === "vouchers" && canManagePlayers && (
          <div className="flex flex-col h-full">
            <div className="px-7 pt-7 pb-4 border-b border-white/[0.06] flex items-end justify-between">
              <div>
                <h2 className="text-white font-bold text-[22px] mb-1">Ваучеры</h2>
                <p className="text-white/30 text-[13px]">Промокоды с зачислением на баланс</p>
              </div>
              <button
                onClick={() => { setVoucherModalOpen(true); setVoucherCode(""); setVoucherAmount(""); setVoucherError(""); }}
                className="flex items-center gap-2 bg-[#4ade80] text-black font-semibold text-[13px] rounded-xl px-4 py-2.5 hover:bg-[#3ecb6e] transition-colors"
              >
                <Icon name="Plus" size={15} />
                Создать ваучер
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-7 py-4">
              {vouchersLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Icon name="Loader2" size={32} className="text-[#4ade80] animate-spin" />
                </div>
              ) : vouchers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <Icon name="Ticket" size={48} className="text-white/10 mb-3" />
                  <span className="text-white/30 text-[14px]">Ваучеров нет</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {vouchers.map((v) => (
                    <div
                      key={v.id}
                      className={`bg-white/[0.03] border rounded-2xl px-5 py-4 ${v.is_active ? "border-[#4ade80]/15" : "border-white/[0.06]"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${v.is_active ? "bg-[#4ade80]/10" : "bg-white/[0.04]"}`}>
                            <Icon name="Ticket" size={18} className={v.is_active ? "text-[#4ade80]" : "text-white/20"} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white text-[15px] tracking-widest">{v.code}</span>
                              {v.is_active
                                ? <span className="text-[10px] text-[#4ade80] bg-[#4ade80]/10 px-2 py-0.5 rounded-full">Активен</span>
                                : <span className="text-[10px] text-white/25 bg-white/[0.05] px-2 py-0.5 rounded-full">Использован</span>}
                            </div>
                            <div className="text-white/25 text-[12px] mt-0.5">
                              {v.used_by ? `Активирован · ${formatDate(v.used_at)}` : `Создан · ${formatDate(v.created_at)}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-[#4ade80] font-bold text-[18px]">{v.amount.toFixed(2)}</div>
                            <div className="text-white/20 text-[10px]">USDT</div>
                          </div>
                          {v.is_active && (
                            <button
                              onClick={() => handleDeactivateVoucher(v)}
                              disabled={actionLoading === v.id}
                              className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors disabled:opacity-40"
                              title="Деактивировать"
                            >
                              {actionLoading === v.id
                                ? <Icon name="Loader2" size={14} className="text-red-400 animate-spin" />
                                : <Icon name="X" size={14} className="text-red-400" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ===== МОДАЛ: Изменить баланс ===== */}
      {editingPlayer && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-6 w-[320px] shadow-2xl">
            <h3 className="text-white font-bold text-[16px] mb-1">Изменить баланс</h3>
            <p className="text-white/40 text-[12px] mb-5">{editingPlayer.name || "Игрок"} · ID {editingPlayer.display_id}</p>
            <input
              type="number"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              placeholder="Новый баланс USDT"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-[14px] outline-none focus:border-[#4ade80]/40 mb-4 placeholder:text-white/20"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditingPlayer(null)} className="flex-1 bg-white/[0.05] text-white/50 font-semibold text-[13px] rounded-xl py-2.5 hover:bg-white/[0.08] transition-colors">
                Отмена
              </button>
              <button
                onClick={handleSetBalance}
                disabled={actionLoading === editingPlayer.id}
                className="flex-1 bg-[#4ade80] text-black font-bold text-[13px] rounded-xl py-2.5 hover:bg-[#3ecb6e] transition-colors disabled:opacity-50"
              >
                {actionLoading === editingPlayer.id ? "..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== МОДАЛ: Добавить админа ===== */}
      {addAdminOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-6 w-[360px] shadow-2xl">
            <h3 className="text-white font-bold text-[16px] mb-1">Добавить администратора</h3>
            <p className="text-white/40 text-[12px] mb-5">Введите ID игрока и выберите роль</p>
            <input
              type="number"
              value={addAdminId}
              onChange={(e) => setAddAdminId(e.target.value)}
              placeholder="ID игрока"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-[14px] outline-none focus:border-[#4ade80]/40 mb-3 placeholder:text-white/20"
            />
            <div className="flex flex-col gap-1.5 mb-4">
              {roleOptions.map((r) => {
                if (!isOwner && r.role === ROLE_CHIEF) return null;
                const rc = ROLE_COLORS[r.role];
                return (
                  <button
                    key={r.role}
                    onClick={() => setAddAdminRole(r.role)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                      addAdminRole === r.role ? `${rc.border} ${rc.bg}` : "border-white/[0.05] bg-white/[0.02]"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${addAdminRole === r.role ? rc.border : "border-white/20"}`}>
                      {addAdminRole === r.role && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: roleDotColor(r.role) }} />}
                    </div>
                    <span className={`text-[13px] font-semibold ${addAdminRole === r.role ? rc.text : "text-white/50"}`}>{r.label}</span>
                  </button>
                );
              })}
            </div>
            {addAdminError && <div className="text-red-400 text-[12px] mb-3">{addAdminError}</div>}
            <div className="flex gap-2">
              <button onClick={() => { setAddAdminOpen(false); setAddAdminError(""); }} className="flex-1 bg-white/[0.05] text-white/50 font-semibold text-[13px] rounded-xl py-2.5">
                Отмена
              </button>
              <button
                onClick={handleAddAdmin}
                disabled={addAdminLoading}
                className="flex-1 bg-[#4ade80] text-black font-bold text-[13px] rounded-xl py-2.5 disabled:opacity-50"
              >
                {addAdminLoading ? "..." : "Добавить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== МОДАЛ: Изменить роль ===== */}
      {changeRoleAdmin && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-6 w-[360px] shadow-2xl">
            <h3 className="text-white font-bold text-[16px] mb-1">Изменить роль</h3>
            <p className="text-white/40 text-[12px] mb-5">{changeRoleAdmin.user_name || "Админ"} · ID {changeRoleAdmin.display_id}</p>
            <div className="flex flex-col gap-1.5 mb-4">
              {roleOptions.map((r) => {
                const rc = ROLE_COLORS[r.role];
                return (
                  <button
                    key={r.role}
                    onClick={() => setChangeRoleValue(r.role)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                      changeRoleValue === r.role ? `${rc.border} ${rc.bg}` : "border-white/[0.05] bg-white/[0.02]"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${changeRoleValue === r.role ? rc.border : "border-white/20"}`}>
                      {changeRoleValue === r.role && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: roleDotColor(r.role) }} />}
                    </div>
                    <span className={`text-[13px] font-semibold ${changeRoleValue === r.role ? rc.text : "text-white/50"}`}>{r.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setChangeRoleAdmin(null)} className="flex-1 bg-white/[0.05] text-white/50 font-semibold text-[13px] rounded-xl py-2.5">
                Отмена
              </button>
              <button
                onClick={handleChangeRole}
                disabled={actionLoading === changeRoleAdmin.id}
                className="flex-1 bg-[#4ade80] text-black font-bold text-[13px] rounded-xl py-2.5 disabled:opacity-50"
              >
                {actionLoading === changeRoleAdmin.id ? "..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== МОДАЛ: Создать ваучер ===== */}
      {voucherModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-6 w-[360px] shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#4ade80]/10 flex items-center justify-center">
                <Icon name="Ticket" size={20} className="text-[#4ade80]" />
              </div>
              <div>
                <h3 className="text-white font-bold text-[16px] leading-tight">Создать ваучер</h3>
                <p className="text-white/30 text-[12px]">Игрок введёт код и получит деньги на счёт</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="text-white/40 text-[11px] uppercase tracking-wide mb-1.5 block">Код ваучера (необязательно)</label>
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Авто-генерация"
                  maxLength={20}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white font-mono text-[14px] tracking-widest outline-none focus:border-[#4ade80]/40 placeholder:text-white/15 placeholder:font-sans placeholder:tracking-normal"
                />
              </div>
              <div>
                <label className="text-white/40 text-[11px] uppercase tracking-wide mb-1.5 block">Сумма USDT</label>
                <input
                  type="number"
                  value={voucherAmount}
                  onChange={(e) => setVoucherAmount(e.target.value)}
                  placeholder="Например: 100"
                  min="0.01"
                  step="0.01"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-[14px] outline-none focus:border-[#4ade80]/40 placeholder:text-white/15"
                />
              </div>
            </div>
            {voucherError && <div className="text-red-400 text-[12px] mb-3">{voucherError}</div>}
            <div className="flex gap-2">
              <button
                onClick={() => setVoucherModalOpen(false)}
                className="flex-1 bg-white/[0.05] text-white/50 font-semibold text-[13px] rounded-xl py-2.5 hover:bg-white/[0.08] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateVoucher}
                disabled={voucherCreating}
                className="flex-1 bg-[#4ade80] text-black font-bold text-[13px] rounded-xl py-2.5 hover:bg-[#3ecb6e] transition-colors disabled:opacity-50"
              >
                {voucherCreating ? "Создаём..." : "Применить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
