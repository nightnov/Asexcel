"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Crown, X } from "lucide-react";

interface AdminUser {
  id: string;
  email: string | null;
  plan: string;
  plan_type: string | null;
  daily_quota_used: number;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async (currentPage: number, currentSearch: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(currentPage) });
      if (currentSearch) params.set("search", currentSearch);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Impossible de charger les utilisateurs.");
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, search);
  }, [load, page, search]);

  async function togglePlan(user: AdminUser) {
    const nextPlan = user.plan === "pro" ? "free" : "pro";
    setUpdatingId(user.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, plan: nextPlan }),
      });
      if (!res.ok) throw new Error("Échec de la mise à jour.");
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, plan: nextPlan } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setUpdatingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Utilisateurs</h1>
      <p className="mt-1 text-sm text-white/50">{total} compte{total > 1 ? "s" : ""} au total.</p>

      <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
        <Search className="h-4 w-4 text-white/40" strokeWidth={1.75} />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Rechercher par e-mail..."
          className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label="Effacer">
            <X className="h-4 w-4 text-white/40 hover:text-white" />
          </button>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Quota IA (jour)</th>
              <th className="px-4 py-3 font-medium">Inscrit le</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-white/40">
                  Chargement...
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-white/40">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}
            {!loading &&
              users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-white/80">{u.email ?? "(sans e-mail)"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        u.plan === "pro" ? "bg-amber-500/15 text-amber-400" : "bg-white/10 text-white/50"
                      }`}
                    >
                      {u.plan === "pro" ? `Pro${u.plan_type ? ` (${u.plan_type})` : ""}` : "Gratuit"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/60">{u.daily_quota_used}</td>
                  <td className="px-4 py-3 text-white/60">{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => togglePlan(u)}
                      disabled={updatingId === u.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 disabled:opacity-50"
                    >
                      <Crown className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {u.plan === "pro" ? "Retirer Pro" : "Passer Pro"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="text-xs text-white/40">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
