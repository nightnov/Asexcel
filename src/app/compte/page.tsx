import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AUTH_DISABLED, MOCK_USER_ID } from "@/lib/dev-auth";
import { getDailyQuotaStatus } from "@/lib/quota";
import AccountPage from "@/components/AccountPage";
import type { UserPlan, ProPlanType } from "@/types/database";

export const metadata = {
  title: "Mon compte — Asexcel",
};

export default async function ComptePage() {
  if (AUTH_DISABLED) {
    // No real Supabase session to read in the dev bypass — show the mock
    // user as a free member so the page (and the "upgrade" path) is still
    // exercisable locally. See src/lib/dev-auth.ts.
    return (
      <AccountPage
        userId={MOCK_USER_ID}
        email="dev@localhost"
        name={null}
        plan="free"
        planType={null}
        transactionId={null}
        memberSince={null}
        conversationCount={0}
        aiReplyCount={0}
        aiUsedToday={0}
        aiDailyLimit={15}
      />
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/compte");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_type, tebex_transaction_id, created_at")
    .eq("id", user.id)
    .single();

  // Real counts only — head:true fetches the count without transferring
  // any rows. RLS already scopes both tables to the caller's own records,
  // the explicit user_id filter just avoids relying on that alone.
  const [{ count: conversationCount }, { count: aiReplyCount }] = await Promise.all([
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("role", "assistant"),
  ]);

  const quota = await getDailyQuotaStatus(supabase, user.id).catch(() => null);

  const name = (user.user_metadata?.full_name as string | undefined) ?? (user.user_metadata?.name as string | undefined) ?? null;

  return (
    <AccountPage
      userId={user.id}
      email={user.email ?? null}
      name={name}
      plan={(profile?.plan ?? "free") as UserPlan}
      planType={(profile?.plan_type ?? null) as ProPlanType | null}
      transactionId={profile?.tebex_transaction_id ?? null}
      memberSince={profile?.created_at ?? null}
      conversationCount={conversationCount ?? 0}
      aiReplyCount={aiReplyCount ?? 0}
      aiUsedToday={quota?.used ?? 0}
      aiDailyLimit={quota?.limit ?? 0}
    />
  );
}
