"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type AuthButtonProps = {
  disabled?: boolean;
  label?: string;
};

export function LoginButton({ disabled, label = "Sign in" }: AuthButtonProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);

    if (disabled) {
      setError("Add Supabase environment variables to enable sign in.");
      return;
    }

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`
        }
      });

      if (signInError) {
        setError(signInError.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start sign in.");
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" onClick={handleLogin} variant="default">
        {label}
      </Button>
      {error ? <p className="max-w-56 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button type="button" onClick={handleLogout} variant="outline">
      Sign out
    </Button>
  );
}
