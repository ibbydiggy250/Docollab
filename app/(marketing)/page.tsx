import { Features } from "@/components/marketing/features";
import { Hero } from "@/components/marketing/hero";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function MarketingPage() {
  const configured = isSupabaseConfigured();
  let isAuthenticated = false;

  if (configured) {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);
  }

  return (
    <main>
      <Hero isAuthenticated={isAuthenticated} authConfigured={configured} />
      <Features />
    </main>
  );
}
