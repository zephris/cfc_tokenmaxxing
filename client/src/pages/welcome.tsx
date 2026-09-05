import Head from "next/head";
import { useRouter } from "next/router";

import { OnboardingBrandHeader } from "@/components/onboarding-brand-header";
import { OnboardingLayout } from "@/components/onboarding-layout";
import { PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Welcome to Virens</title>
      </Head>
      <OnboardingLayout>
        <PublicHeader />

        <main className="grid flex-1 items-center gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1fr_0.9fr] lg:px-16 lg:py-14">
          <section className="mx-auto w-full max-w-xl lg:mx-0">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Western Australia
            </p>
            <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Protect bushland.
              <br />
              Grow community.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              Virens helps you identify invasive weeds, explore local bushland
              and join people taking action across Western Australia.
            </p>

            <div className="mt-8 flex flex-col items-start gap-4">
              <Button
                size="lg"
                className="h-12 w-full rounded-lg px-7 text-base font-semibold sm:w-auto"
                onClick={() => router.push("/signin")}
              >
                Get started
              </Button>
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our Terms and Privacy Policy.
              </p>
            </div>
          </section>

          <OnboardingBrandHeader variant="hero" className="w-full" />
        </main>
      </OnboardingLayout>
    </>
  );
}
