"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Crown, MessageSquare, LifeBuoy } from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import GrowthChart from "@/components/admin/GrowthChart";

interface AdminStats {
  totalUsers: number;
  proUsers: number;
  totalConversations: number;
  totalMessages: number;
  pendingSupport: number;
  growth: { month: string; signups: number }[];
  recentUsers: { id: string; email: string | null; plan: string; created_at: string }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Impossible de charger les statistiques.");
        return res.json();
      })
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
      <p className="mt-1 text-sm text-white/50">Vue d'ensemble de l'activité Asexcel.</p>

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {!stats && !error && <p className="mt-6 text-sm text-white/40">Chargement...</p>}

      {stats && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Users}
              iconClassName="bg-sky-500/15 text-sky-400"
              label="Utilisateurs"
              value={stats.totalUsers.toLocaleString("fr-FR")}
            />
            <StatCard
              icon={Crown}
              iconClassName="bg-amber-500/15 text-amber-400"
              label="Abonnés Pro"
              value={stats.proUsers.toLocaleString("fr-FR")}
            />
            <StatCard
              icon={MessageSquare}
              iconClassName="bg-[#1E8E5A]/15 text-[#34D399]"
              label="Réponses IA envoyées"
              value={stats.totalMessages.toLocaleString("fr-FR")}
            />
            <StatCard
              icon={LifeBuoy}
              iconClassName="bg-rose-500/15 text-rose-400"
              label="Demandes support en attente"
              value={stats.pendingSupport.toLocaleString("fr-FR")}
            />
          </div>

          <div className="mt-6">
            <GrowthChart data={stats.growth} />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Derniers inscrits</h3>
              <Link href="/admin/utilisateurs" className="text-xs font-medium text-[#34D399] hover:text-[#1E8E5A]">
                Voir tous les utilisateurs
              </Link>
            </div>
            <div className="mt-4 space-y-1">
              {stats.recentUsers.length === 0 && (
                <p className="py-4 text-center text-sm text-white/40">Aucun utilisateur pour le moment.</p>
              )}
              {stats.recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm hover:bg-white/5"
                >
                  <span className="text-white/80">{u.email ?? "(sans e-mail)"}</span>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        u.plan === "pro" ? "bg-amber-500/15 text-amber-400" : "bg-white/10 text-white/50"
                      }`}
                    >
                      {u.plan === "pro" ? "Pro" : "Gratuit"}
                    </span>
                    <span className="w-24 text-right text-xs text-white/40">
                      {new Date(u.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
