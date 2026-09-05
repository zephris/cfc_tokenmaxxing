import { cn } from "@/lib/utils";

export interface VirensLogoProps {
  className?: string;
  labelled?: boolean;
}

/** The shared Virens botanical mark. Use this everywhere the product logo appears. */
export function VirensLogo({ className, labelled = false }: VirensLogoProps) {
  return (
    <svg
      viewBox="0 0 52 66"
      className={cn("text-primary", className)}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? "Virens" : undefined}
      aria-hidden={labelled ? undefined : "true"}
    >
      <path
        d="M15 60C18 47 24 35 36 10M20 48l-11-2c-1 8 4 13 11 12M25 38l-12-5c-3 8 2 14 10 15M31 28l-11-7c-4 7 0 14 8 16M36 19l-8-8c-5 6-2 13 5 16M22 47l10-5c4 7 1 13-7 16M28 36l11-7c5 7 1 14-7 17M34 25l9-9c6 6 3 14-5 18M39 14l4-10c7 3 8 10 1 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
