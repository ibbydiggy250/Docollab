import { BadgeCheck, FileClock, ShieldCheck } from "lucide-react";

const features = [
  {
    title: "Submit a Doc URL",
    description: "Start with the same Google Doc link students already use.",
    icon: FileClock
  },
  {
    title: "Process Revision Chunks",
    description: "The scaffold groups mock revisions by collaborator while leaving room for real Google API work.",
    icon: BadgeCheck
  },
  {
    title: "Review Stored Reports",
    description: "Reports and contributor rows are saved in Supabase with ownership-based access policies.",
    icon: ShieldCheck
  }
];

export function Features() {
  return (
    <section id="features" className="page-shell py-16">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-normal">A starter flow that already feels usable</h2>
        <p className="mt-3 text-muted-foreground">
          The first version is intentionally honest: real navigation, real auth and database structure, mocked revision
          analysis, and clear TODO markers for the hard integrations.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <div key={feature.title} className="rounded-lg border bg-card p-5">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
