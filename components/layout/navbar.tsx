import Image from "next/image";
import Link from "next/link";
import { LoginButton, LogoutButton } from "@/components/layout/auth-buttons";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function Navbar() {
  let user = null;
  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = createClient();
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();
    user = currentUser;
  }

  return (
    <header className="border-b bg-background/95">
      <div className="page-shell flex min-h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <Image src="/logo-placeholder.svg" alt="" width={34} height={34} priority />
          <span>Docollab</span>
        </Link>
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Button asChild variant="ghost">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <LogoutButton />
            </>
          ) : (
            <LoginButton disabled={!configured} />
          )}
        </nav>
      </div>
    </header>
  );
}
