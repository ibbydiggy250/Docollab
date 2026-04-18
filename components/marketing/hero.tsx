import Image from "next/image";
import Link from "next/link";
import { LoginButton } from "@/components/layout/auth-buttons";
import { Button } from "@/components/ui/button";

type HeroProps = {
  isAuthenticated: boolean;
  authConfigured: boolean;
};

export function Hero({ isAuthenticated, authConfigured }: HeroProps) {
  return (
    <section className="border-b bg-[linear-gradient(120deg,#f7fbfa_0%,#ffffff_52%,#fff5f7_100%)]">
      <div className="page-shell grid min-h-[calc(100vh-8rem)] items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex rounded-md border bg-background px-3 py-1 text-sm font-medium text-muted-foreground">
            Built for teacher review workflows
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight tracking-normal sm:text-5xl">
              AI-powered contribution analysis for collaborative Google Docs
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              Docollab helps teachers turn messy group-writing history into a readable report on who contributed,
              what they added, and where deeper review is needed.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <Button asChild size="lg">
                <Link href="/dashboard">Get Started</Link>
              </Button>
            ) : (
              <LoginButton disabled={!authConfigured} label="Get Started" />
            )}
            <Button asChild variant="outline" size="lg">
              <Link href="#features">See the flow</Link>
            </Button>
          </div>
        </div>
        <div className="relative">
          <div className="rounded-lg border bg-background p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b pb-4">
              <Image src="/logo-placeholder.svg" alt="" width={46} height={46} />
              <div>
                <p className="font-semibold">Urban Heat Islands Group Essay</p>
                <p className="text-sm text-muted-foreground">Mock report preview</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {[
                ["Maya Chen", "34%", "Primary drafting and evidence"],
                ["Jordan Rivera", "27%", "Explanatory detail and synthesis"],
                ["Sam Patel", "21%", "Revision and conclusion work"]
              ].map(([name, percent, detail]) => (
                <div key={name} className="rounded-md border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">{name}</p>
                    <p className="text-sm font-semibold text-primary">{percent}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
