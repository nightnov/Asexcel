import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AUTH_DISABLED } from "@/lib/dev-auth";
import CheckoutPage from "@/components/CheckoutPage";

export const metadata = {
  title: "Passer au plan Pro — Asexcel",
};

export default async function Checkout() {
  if (AUTH_DISABLED) {
    // No real Supabase session to read in the dev bypass — render with the
    // mock user so the page is still exercisable locally. See src/lib/dev-auth.ts.
    return <CheckoutPage email={null} />;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/checkout");
  }

  return <CheckoutPage email={user.email ?? null} />;
}
