"use client";

import { useEffect, useState } from "react";
import { Mail, Check, Eye } from "lucide-react";

interface SupportRequest {
  id: string;
  message: string;
  email: string | null;
  status: "new" | "read" | "resolved";
  created_at: string;
}

const STATUS_LABEL: Record<SupportRequest["status"], string> = {
  new: "Nouveau",
  read: "Lu",
  resolved: "Résolu",
};

const STATUS_STYLE: Record<SupportRequest["status"], string> = {
  new: "bg-rose-500/15 text-rose-400",
  read: "bg-sky-500/15 text-sky-400",
  resolved: "bg-[#1E8E5A]/15 text-[#34D399]",
};

export default function AdminSupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/support")
      .then((res) => {
        if (!res.ok) throw new Error("Impossible de charger les demandes.");
        return res.json();
      })
      .then((data) => setRequests(data.requests))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: SupportRequest["status"]) {
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Échec de la mise à jour.");
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Support</h1>
      <p className="mt-1 text-sm text-white/50">Messages envoyés depuis le formulaire de contact.</p>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {loading && <p className="mt-6 text-sm text-white/40">Chargement...</p>}

      {!loading && requests.length === 0 && (
        <p className="mt-6 text-sm text-white/40">Aucune demande de support pour le moment.</p>
      )}

      <div className="mt-5 space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-white/40" strokeWidth={1.75} />
                  <span className="truncate text-sm font-medium text-white/80">
                    {r.email ?? "(pas d'adresse fournie)"}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-white/60">{r.message}</p>
                <p className="mt-2 text-xs text-white/30">
                  {new Date(r.created_at).toLocaleString("fr-FR")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                {r.status !== "read" && (
                  <button
                    type="button"
                    onClick={() => updateStatus(r.id, "read")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10"
                  >
                    <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Marquer lu
                  </button>
                )}
                {r.status !== "resolved" && (
                  <button
                    type="button"
                    onClick={() => updateStatus(r.id, "resolved")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E8E5A] px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#166B44]"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Résolu
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
