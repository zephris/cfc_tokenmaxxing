import {
  Camera,
  ChevronLeft,
  Compass,
  Leaf,
  Map as MapIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";

import { fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export type AppShellTab = "identify" | "explore" | "map";

export interface AppShellProps {
  title: string;
  subtitle?: string;
  /** Which bottom-nav tab is highlighted. Detail pages (e.g. a bushland or
   * event route) should pass whichever tab they were reached from. */
  activeTab: AppShellTab;
  /** If set, shows a back chevron in the header linking here instead of the tab bar being the only way back. */
  backHref?: string;
  children: ReactNode;
}

const TABS: {
  tab: AppShellTab;
  href: string;
  label: string;
  icon: typeof Camera;
}[] = [
  { tab: "identify", href: "/identify", label: "Identify", icon: Camera },
  { tab: "explore", href: "/explore", label: "Explore", icon: Compass },
  { tab: "map", href: "/map", label: "Map", icon: MapIcon },
];

export function AppShell({
  title,
  subtitle,
  activeTab,
  backHref,
  children,
}: AppShellProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-background font-sans",
        fontSans.variable,
      )}
    >
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-4 sm:max-w-2xl">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Back"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-input text-foreground hover:bg-accent"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-foreground">
              {title}
            </p>
            {subtitle && (
              <p className="truncate text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-6 sm:max-w-2xl">
        {children}
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 border-t border-border bg-background"
      >
        <div className="mx-auto flex w-full max-w-md sm:max-w-2xl">
          {TABS.map(({ tab, href, label, icon: Icon }) => {
            const isActive =
              tab === activeTab || router.pathname.startsWith(href);
            return (
              <Link
                key={tab}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
                <span
                  className={cn(
                    "h-1 w-1 rounded-full",
                    isActive ? "bg-primary" : "bg-transparent",
                  )}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
