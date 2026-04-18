import { FileText, LayoutDashboard } from "lucide-react";
import Link from "next/link";

const items = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard
  },
  {
    href: "/dashboard#reports",
    label: "Reports",
    icon: FileText
  }
];

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-muted/35 px-4 py-6 md:block">
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
