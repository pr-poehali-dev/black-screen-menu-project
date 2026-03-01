import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import {
  Screen, Player, Stats, AdminUser, Withdrawal, Voucher,
  ROLE_OWNER, ROLE_ADMIN, ROLE_NAMES,
  ADMIN_URL, WITHDRAWAL_URL, VOUCHER_URL,
} from "./admin/types";
import { AdminPlayersScreen, AdminStatsScreen } from "./admin/AdminPlayersScreen";
import { AdminsScreen, WithdrawalsScreen, VouchersScreen } from "./admin/AdminManageScreen";

interface AdminPanelProps {
  adminDisplayId: string | number;
  adminRole: number;
  onClose: () => void;
}

export default function AdminPanel({ adminDisplayId, adminRole, onClose }: AdminPanelProps) {
  const [screen, setScreen] = useState<Screen>("home");

  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [newBalance, setNewBalance] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [wdFilter, setWdFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Только Владелец видит раздел Админы
  const canManagePlayers = adminRole <= ROLE_ADMIN;
  const canManageAdmins = adminRole === ROLE_OWNER;

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchPendingCount = useCallback(async () => {
    if (!canManagePlayers) return;
    try {
      const res = await fetch(`${WITHDRAWAL_URL}?action=list&status=pending`);
      const data = await res.json();
      if (res.ok) setPendingCount((data.withdrawals || []).length);
    } catch { /* */ }
  }, [canManagePlayers]);

  useEffect(() => { fetchPendingCount(); }, [fetchPendingCount]);

  const fetchPlayers = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: "players", admin_id: String(adminDisplayId) });
      if (q) params.set("search", q);
      const res = await fetch(`${ADMIN_URL}?${params}`);
      const data = await res.json();
      if (res.ok) setPlayers(data.players || []);
    } catch { /* */ }
    setLoading(false);
  }, [adminDisplayId]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_URL}?action=stats&admin_id=${adminDisplayId}`);
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch { /* */ }
    setLoading(false);
  }, [adminDisplayId]);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_URL}?action=list_admins&admin_id=${adminDisplayId}`);
      const data = await res.json();
      if (res.ok) setAdmins(data.admins || []);
    } catch { /* */ }
    setLoading(false);
  }, [adminDisplayId]);

  const fetchWithdrawals = useCallback(async (status = "pending") => {
    setWithdrawalsLoading(true);
    try {
      const res = await fetch(`${WITHDRAWAL_URL}?action=list&status=${status}`);
      const data = await res.json();
      if (res.ok) setWithdrawals(data.withdrawals || []);
    } catch { /* */ }
    setWithdrawalsLoading(false);
  }, []);

  const fetchVouchers = useCallback(async () => {
    setVouchersLoading(true);
    try {
      const res = await fetch(`${VOUCHER_URL}?action=list&admin_id=${adminDisplayId}`);
      const data = await res.json();
      if (res.ok) setVouchers(data.vouchers || []);
    } catch { /* */ }
    setVouchersLoading(false);
  }, [adminDisplayId]);

  const goTo = (s: Screen) => {
    setScreen(s);
    if (s === "players") fetchPlayers();
    if (s === "stats") fetchStats();
    if (s === "admins") fetchAdmins();
    if (s === "withdrawals") fetchWithdrawals("pending");
    if (s === "vouchers") fetchVouchers();
  };

  const goBack = () => setScreen("home");

  // ── Handlers: Players ─────────────────────────────────────────────────────

  const handleBlock = async (player: Player) => {
    setActionLoading(player.id);
    try {
      await fetch(`${ADMIN_URL}?action=block`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ admin_id: String(adminDisplayId), user_id: String(player.id) }) });
      await fetchPlayers(search);
    } catch { /* */ }
    setActionLoading(null);
  };

  const handleUnblock = async (player: Player) => {
    setActionLoading(player.id);
    try {
      await fetch(`${ADMIN_URL}?action=unblock`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ admin_id: String(adminDisplayId), user_id: String(player.id) }) });
      await fetchPlayers(search);
    } catch { /* */ }
    setActionLoading(null);
  };

  const handleSetBalance = async () => {
    if (!editingPlayer || newBalance === "") return;
    setActionLoading(editingPlayer.id);
    try {
      await fetch(`${ADMIN_URL}?action=set_balance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ admin_id: String(adminDisplayId), user_id: String(editingPlayer.id), balance: parseFloat(newBalance) }) });
      await fetchPlayers(search);
      setEditingPlayer(null);
      setNewBalance("");
    } catch { /* */ }
    setActionLoading(null);
  };

  // ── Handlers: Admins ──────────────────────────────────────────────────────

  const handleAddAdmin = async (displayId: string, role: number) => {
    try {
      await fetch(`${ADMIN_URL}?action=add_admin`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ admin_id: String(adminDisplayId), display_id: parseInt(displayId), role }) });
      await fetchAdmins();
    } catch { /* */ }
  };

  const handleRemoveAdmin = async (admin: AdminUser) => {
    setActionLoading(admin.id);
    try {
      await fetch(`${ADMIN_URL}?action=remove_admin`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ admin_id: String(adminDisplayId), display_id: admin.display_id }) });
      await fetchAdmins();
    } catch { /* */ }
    setActionLoading(null);
  };

  const handleChangeRole = async (newRole: number) => {
    const target = admins.find((a) => actionLoading === null || a.id !== actionLoading);
    if (!target) return;
    setActionLoading(target.id);
    try {
      await fetch(`${ADMIN_URL}?action=change_role`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ admin_id: String(adminDisplayId), display_id: target.display_id, role: newRole }) });
      await fetchAdmins();
    } catch { /* */ }
    setActionLoading(null);
  };

  // ── Handlers: Withdrawals ─────────────────────────────────────────────────

  const handleApproveWithdrawal = async (w: Withdrawal) => {
    setActionLoading(w.id);
    try {
      await fetch(`${WITHDRAWAL_URL}?action=approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ withdrawal_id: w.id, admin_id: String(adminDisplayId) }) });
      await fetchWithdrawals(wdFilter);
      fetchPendingCount();
    } catch { /* */ }
    setActionLoading(null);
  };

  const handleRejectWithdrawal = async (w: Withdrawal) => {
    setActionLoading(w.id);
    try {
      await fetch(`${WITHDRAWAL_URL}?action=reject`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ withdrawal_id: w.id, admin_id: String(adminDisplayId) }) });
      await fetchWithdrawals(wdFilter);
      fetchPendingCount();
    } catch { /* */ }
    setActionLoading(null);
  };

  // ── Handlers: Vouchers ────────────────────────────────────────────────────

  const handleCreateVoucher = async (code: string, amount: string) => {
    try {
      await fetch(`${VOUCHER_URL}?action=create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ admin_id: String(adminDisplayId), code: code.trim().toUpperCase() || undefined, amount: parseFloat(amount) }) });
      await fetchVouchers();
    } catch { /* */ }
  };

  const handleDeactivateVoucher = async (v: Voucher) => {
    setActionLoading(v.id);
    try {
      await fetch(`${VOUCHER_URL}?action=deactivate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ admin_id: String(adminDisplayId), voucher_id: v.id }) });
      await fetchVouchers();
    } catch { /* */ }
    setActionLoading(null);
  };

  // ── Роутинг по экранам ────────────────────────────────────────────────────

  if (screen === "players") {
    return (
      <AdminPlayersScreen
        players={players}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        onSearch={() => fetchPlayers(search)}
        actionLoading={actionLoading}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onEditBalance={(p) => { setEditingPlayer(p); setNewBalance(String(p.balance)); }}
        editingPlayer={editingPlayer}
        newBalance={newBalance}
        onNewBalanceChange={setNewBalance}
        onSetBalance={handleSetBalance}
        onCancelEdit={() => setEditingPlayer(null)}
        onBack={goBack}
      />
    );
  }

  if (screen === "stats") {
    return <AdminStatsScreen stats={stats} loading={loading} onBack={goBack} />;
  }

  if (screen === "admins") {
    return (
      <AdminsScreen
        admins={admins}
        loading={loading}
        adminDisplayId={adminDisplayId}
        adminRole={adminRole}
        actionLoading={actionLoading}
        onRemove={handleRemoveAdmin}
        onChangeRole={handleChangeRole}
        onBack={goBack}
        onAddAdmin={handleAddAdmin}
      />
    );
  }

  if (screen === "withdrawals") {
    return (
      <WithdrawalsScreen
        withdrawals={withdrawals}
        withdrawalsLoading={withdrawalsLoading}
        wdFilter={wdFilter}
        pendingCount={pendingCount}
        actionLoading={actionLoading}
        onFilterChange={(f) => { setWdFilter(f); fetchWithdrawals(f); }}
        onApprove={handleApproveWithdrawal}
        onReject={handleRejectWithdrawal}
        onBack={goBack}
      />
    );
  }

  if (screen === "vouchers") {
    return (
      <VouchersScreen
        vouchers={vouchers}
        vouchersLoading={vouchersLoading}
        actionLoading={actionLoading}
        onDeactivate={handleDeactivateVoucher}
        onCreate={handleCreateVoucher}
        onBack={goBack}
      />
    );
  }

  // ── Главный экран — плитки ────────────────────────────────────────────────

  const tiles = [
    { id: "players" as Screen, icon: "Users", label: "Игроки", desc: "Управление аккаунтами", color: "text-[#4ade80]", bg: "bg-[#4ade80]/10", show: canManagePlayers },
    { id: "stats" as Screen, icon: "BarChart3", label: "Аналитика", desc: "Статистика платформы", color: "text-blue-400", bg: "bg-blue-500/10", show: true },
    { id: "admins" as Screen, icon: "ShieldCheck", label: "Админы", desc: "Управление командой", color: "text-purple-400", bg: "bg-purple-500/10", show: canManageAdmins },
    { id: "withdrawals" as Screen, icon: "ArrowUpRight", label: "Выводы", desc: "Заявки на вывод", color: "text-yellow-400", bg: "bg-yellow-500/10", badge: pendingCount, show: canManagePlayers },
    { id: "vouchers" as Screen, icon: "Ticket", label: "Ваучеры", desc: "Промокоды с балансом", color: "text-pink-400", bg: "bg-pink-500/10", show: canManagePlayers },
  ].filter((t) => t.show);

  return (
    <div className="fixed inset-0 z-[60] bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#4ade80]/12 flex items-center justify-center">
            <Icon name="Shield" size={18} className="text-[#4ade80]" />
          </div>
          <div>
            <div className="text-white font-bold text-[16px] leading-tight">Админ-панель</div>
            <div className="text-white/30 text-[11px]">{ROLE_NAMES[adminRole]}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center active:bg-white/10 transition-colors"
        >
          <Icon name="X" size={17} className="text-white/50" />
        </button>
      </div>

      {/* Плитки */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="grid grid-cols-2 gap-3 pt-1">
          {tiles.map((t) => (
            <button
              key={t.id}
              onClick={() => goTo(t.id)}
              className="relative bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 text-left active:bg-white/[0.07] transition-colors"
            >
              {t.badge !== undefined && t.badge > 0 && (
                <span className="absolute top-3 right-3 min-w-[20px] h-5 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center px-1">
                  {t.badge}
                </span>
              )}
              <div className={`w-10 h-10 rounded-xl ${t.bg} flex items-center justify-center mb-3`}>
                <Icon name={t.icon} size={20} className={t.color} />
              </div>
              <div className="text-white font-bold text-[15px] leading-tight mb-0.5">{t.label}</div>
              <div className="text-white/30 text-[12px]">{t.desc}</div>
              <div className="absolute bottom-4 right-4">
                <Icon name="ChevronRight" size={14} className="text-white/15" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
