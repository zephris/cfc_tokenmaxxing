import Link from "next/link";

import { VirensLogo } from "@/components/virens-logo";

export function PublicHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-20 items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/welcome" className="flex items-center gap-2.5">
          <VirensLogo className="h-10 w-8" labelled />
          <span className="text-2xl font-bold tracking-tight text-primary">
            virens
          </span>
        </Link>

        <nav
          aria-label="Public navigation"
          className="flex items-center gap-4 text-sm font-medium sm:gap-7"
        >
          <Link
            href="/"
            className="hidden text-muted-foreground transition-colors hover:text-primary sm:inline"
          >
            About
          </Link>
          <Link
            href="/explore"
            className="hidden text-muted-foreground transition-colors hover:text-primary md:inline"
          >
            Explore
          </Link>
          <Link
            href="/map"
            className="hidden text-muted-foreground transition-colors hover:text-primary md:inline"
          >
            Map
          </Link>
          <Link
            href="/signin"
            className="rounded-lg bg-primary px-5 py-2.5 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
