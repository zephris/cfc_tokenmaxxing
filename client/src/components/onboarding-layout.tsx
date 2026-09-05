import type { ReactNode } from "react";

import { fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export interface OnboardingLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Responsive public-site shell. It deliberately omits the signed-in
 * Identify/Explore/Map navigation while sharing the same brand tokens.
 */
export function OnboardingLayout({
  children,
  className,
}: OnboardingLayoutProps) {
  return (
    <div
      className={cn("min-h-screen bg-[#f7f8f6] font-sans", fontSans.variable)}
    >
      <div
        className={cn(
          "mx-auto flex min-h-screen w-full max-w-6xl flex-col bg-background lg:my-6 lg:min-h-[calc(100vh-3rem)] lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border lg:shadow-sm",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
