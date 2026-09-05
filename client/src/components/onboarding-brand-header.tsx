import { cn } from "@/lib/utils";

import { VirensLogo } from "./virens-logo";

export interface OnboardingBrandHeaderProps {
  /** "plain": centered mark for a plain white screen (e.g. About).
   * "hero": mark sits over a decorative gradient banner (e.g. Welcome, Sign in). */
  variant?: "plain" | "hero";
  className?: string;
}

/**
 * Shared brand mark for the pre-sign-in onboarding screens (About, Welcome,
 * Sign in). Reuses the same Leaf-in-badge treatment as the authenticated
 * AppShell header (see app-shell.tsx) instead of a separate logo, since no
 * dedicated Virens logo asset exists in the repo.
 */
export function OnboardingBrandHeader({
  variant = "plain",
  className,
}: OnboardingBrandHeaderProps) {
  const content = (
    <div className="flex flex-col items-center text-center">
      <VirensLogo className="h-[52px] w-11" labelled />
      <p className="mt-1 text-[32px] font-bold leading-none tracking-tight text-primary">
        virens
      </p>
      <p className="mt-3 text-[15px] font-semibold text-muted-foreground">
        let the good greens flourish
      </p>
    </div>
  );

  if (variant === "plain") {
    return <div className={cn("pt-7", className)}>{content}</div>;
  }

  return (
    <div
      className={cn(
        "relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-3xl border border-border bg-[#f1f6ee] px-8 py-12 sm:min-h-[440px]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#dbe8d6] sm:h-64 sm:w-64"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#fff0bd] sm:h-64 sm:w-64"
      />
      <div className="relative">{content}</div>
    </div>
  );
}
