import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { type FormEvent, useState } from "react";

import { OnboardingBrandHeader } from "@/components/onboarding-brand-header";
import { OnboardingLayout } from "@/components/onboarding-layout";
import { PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const INPUT_CLASSES =
  "h-12 w-full rounded-xl border border-input bg-background py-2 pl-10 pr-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Frontend-only, clickable sign-in prototype. Performs basic required-field
 * validation only — no credentials, tokens, cookies or sessions are created
 * or stored anywhere.
 */
export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setError(null);
    router.push("/identify");
  }

  return (
    <>
      <Head>
        <title>Sign in to Virens</title>
      </Head>
      <OnboardingLayout>
        <PublicHeader />

        <main className="grid flex-1 items-center gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-16 lg:py-14">
          <OnboardingBrandHeader
            variant="hero"
            className="hidden w-full lg:flex"
          />

          <section className="mx-auto flex w-full max-w-lg flex-col gap-7 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-9">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Member access
              </p>
              <h1 className="text-[32px] font-bold text-foreground sm:text-4xl">
                Welcome back
              </h1>
              <p className="text-base leading-7 text-muted-foreground">
                Sign in to continue identifying weeds and joining local field
                events.
              </p>
            </div>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="signin-email"
                  className="text-sm font-semibold text-foreground"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    placeholder="jordan.ranger@example.com"
                    className={INPUT_CLASSES}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="signin-password"
                  className="text-sm font-semibold text-foreground"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    className={cn(INPUT_CLASSES, "pr-9")}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <p className="text-right text-sm font-medium text-primary">
                Forgot password?
              </p>

              <Button type="submit" size="lg" className="mt-1 h-12 rounded-lg">
                Sign in
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              New to Virens?{" "}
              <span className="font-semibold text-primary">
                Create an account
              </span>
            </p>
          </section>
        </main>
      </OnboardingLayout>
    </>
  );
}
