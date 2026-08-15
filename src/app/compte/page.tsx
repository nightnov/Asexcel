import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AUTH_DISABLED, MOCK_USER_ID } from "@/lib/dev-auth";
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
    return <AccountPage userId={MOCK_USER_ID} email={null} name={null} plan="free" planType={null} linkedProviders={["email"]} />;
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
    .select("plan, plan_type")
    .eq("id", user.id)
    .single();

  const name = (user.user_metadata?.full_name as string | undefined) ?? (user.user_metadata?.name as string | undefined) ?? null;
  const linkedProviders = (user.identities ?? []).map((identity) => identity.provider);

  return (
    <AccountPage
      userId={user.id}
      email={user.email ?? null}
      name={name}
      plan={(profile?.plan ?? "free") as UserPlan}
      planType={(profile?.plan_type ?? null) as ProPlanType | null}
      linkedProviders={linkedProviders}
    />
  );
}
