"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { exportBackup, importBackup } from "@/lib/backup";
import { FeatureIcon } from "@/lib/icons";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import CategoryLimitsSheet from "@/components/CategoryLimitsSheet";
import WalletsSheet from "@/components/WalletsSheet";
import TrashSheet from "@/components/TrashSheet";
import ActivityLogSheet from "@/components/ActivityLogSheet";

type Settings = {
  daily_reminder_enabled: boolean;
  daily_reminder_time: string;
  small_expense_limit: number;
  last_backup_at: string | null;
};

/** TASK 18-19: preferências de notificação (best-effort, ver limitação abaixo) + backup JSON. */
export default function SettingsSheet({ userId, email, onClose, onLogout }: {
  userId: string; email: string; onClose: () => void; onLogout: () => void;
}) {
  useLockBodyScroll();
  const [s, setS] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null);
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [walletsOpen, setWalletsOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSupabase().from("user_settings").select("daily_reminder_enabled,daily_reminder_time,small_expense_limit,last_backup_at")
      .eq("user_id", userId).maybeSingle().then(({ data }) => {
        setS(data as Settings ?? { daily_reminder_enabled: true, daily_reminder_time: "21:00", small_expense_limit: 5, last_backup_at: null });
      });
    setNotifSupported(typeof window !== "undefined" && "Notification" in window);
    if (typeof window !== "undefined" && "Notification" in window) setNotifPermission(Notification.permission);
  }, [userId]);

  async function save(patch: Partial<Settings>) {
    if (!s) return;
    const next = { ...s, ...patch };
    setS(next);
    await getSupabase().from("user_settings").upsert({ user_id: userId, ...next }, { onConflict: "user_id" });
  }

  async function requestNotifPermission() {
    if (!notifSupported) return;
    const p = await Notification.requestPermission();
    setNotifPermission(p);
    if (p === "granted") new Notification("NextP", { body: "Lembretes ativados! 🎉" });
  }

  async function doExport() {
    setBusy(true); setMsg(null);
    const { error } = await exportBackup(userId);
    setBusy(false);
    if (error) return setMsg(error);
    setMsg("Backup descarregado. ✅");
    setS((prev) => prev ? { ...prev, last_backup_at: new Date().toISOString() } : prev);
  }

  async function doImport(file: File) {
    setBusy(true); setMsg(null);
    const text = await file.text();
    const report = await importBackup(userId, text);
    setBusy(false);
    if (report.error) return setMsg(report.error);
    const perTable = Object.entries(report.imported)
      .filter(([, n]) => n > 0)
      .map(([t, n]) => `${t}: ${n}`)
      .join(" · ");
    setMsg(
      `Restauro concluído: ${report.totalImported} registos importados` +
      (report.totalSkipped ? `, ${report.totalSkipped} ignorados (referências não encontradas)` : "") +
      (perTable ? ` (${perTable})` : "")
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-4 max-h-[85dvh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Configurações</h2>
          <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
        </div>

        <div className="clay-card-soft text-sm">
          <p className="text-nextp-muted">Sessão</p>
          <p className="font-bold">{email}</p>
        </div>

        {/* Backup */}
        <div className="clay-card space-y-3">
          <div className="flex items-center gap-3">
            <FeatureIcon name="cloud-backup" size={40} />
            <div>
              <h3 className="font-black">Backup</h3>
              <p className="text-nextp-muted text-xs">
                {s?.last_backup_at ? `Último backup: ${new Date(s.last_backup_at).toLocaleString("pt-PT")}` : "Ainda sem backup manual."}
              </p>
            </div>
          </div>
          <p className="text-nextp-muted text-xs">
            Os teus dados já vivem na nuvem (Supabase) — isto é uma cópia extra em JSON, útil para guardar localmente ou migrar de conta.
          </p>
          <div className="flex gap-2">
            <button onClick={doExport} disabled={busy} className="clay-btn flex-1 text-sm py-2">Exportar backup (JSON)</button>
            <button onClick={() => fileRef.current?.click()} disabled={busy} className="clay-btn-ghost flex-1 text-sm py-2">Restaurar</button>
          </div>
          <input ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = ""; }} />
          {msg && <p className="text-xs text-center text-nextp-muted">{msg}</p>}
        </div>

        {/* Notificações */}
        <div className="clay-card space-y-3">
          <div className="flex items-center gap-3">
            <FeatureIcon name="bell" size={40} />
            <h3 className="font-black">Notificações</h3>
          </div>
          {!notifSupported ? (
            <p className="text-nextp-muted text-xs">Notificações não suportadas neste navegador.</p>
          ) : notifPermission !== "granted" ? (
            <button onClick={requestNotifPermission} className="clay-btn-ghost w-full text-sm py-2">Ativar notificações no telemóvel</button>
          ) : (
            <label className="flex items-center justify-between">
              <span className="text-sm font-bold">Lembrete diário</span>
              <input type="checkbox" checked={s?.daily_reminder_enabled ?? true} onChange={(e) => save({ daily_reminder_enabled: e.target.checked })} className="w-5 h-5 accent-nextp-blue" />
            </label>
          )}
          {notifPermission === "granted" && s?.daily_reminder_enabled && (
            <input type="time" className="clay-input" value={s.daily_reminder_time} onChange={(e) => save({ daily_reminder_time: e.target.value })} />
          )}
          <p className="text-nextp-muted text-xs">
            No iPhone, notificações automáticas em segundo plano exigem a app instalada no ecrã inicial (Safari → Partilhar → Adicionar ao ecrã inicial) e ainda estão em desenvolvimento — por agora a preferência fica guardada.
          </p>
        </div>

        {/* Gastos Invisíveis */}
        <div className="clay-card space-y-2">
          <h3 className="font-black">Limite de "gasto pequeno"</h3>
          <p className="text-nextp-muted text-xs">Usado na estatística Gastos Invisíveis (Resumo).</p>
          <input className="clay-input" inputMode="decimal" value={s?.small_expense_limit ?? 5}
            onChange={(e) => { const v = parseFloat(e.target.value.replace(",", ".")); if (!isNaN(v)) save({ small_expense_limit: v }); }} />
        </div>

        {/* BUDGET-02 */}
        <button onClick={() => setLimitsOpen(true)} className="clay-btn-ghost w-full text-sm py-2.5">
          Limites por categoria
        </button>

        {/* FINANCE-12 */}
        <button onClick={() => setWalletsOpen(true)} className="clay-btn-ghost w-full text-sm py-2.5">
          Carteiras
        </button>

        {/* SAFETY-03 */}
        <button onClick={() => setTrashOpen(true)} className="clay-btn-ghost w-full text-sm py-2.5">
          Lixeira
        </button>

        {/* SAFETY-02 */}
        <button onClick={() => setActivityOpen(true)} className="clay-btn-ghost w-full text-sm py-2.5">
          Histórico de alterações
        </button>

        <button onClick={onLogout} className="w-full text-nextp-danger font-bold py-2">Sair da conta</button>
        {limitsOpen && <CategoryLimitsSheet userId={userId} onClose={() => setLimitsOpen(false)} />}
        {walletsOpen && <WalletsSheet userId={userId} onClose={() => setWalletsOpen(false)} />}
        {trashOpen && <TrashSheet userId={userId} onClose={() => setTrashOpen(false)} />}
        {activityOpen && <ActivityLogSheet userId={userId} onClose={() => setActivityOpen(false)} />}
      </div>
    </div>
  );
}
