import { BookOpen, Camera, Heart, User } from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";

import { OnboardingLayout } from "@/components/onboarding-layout";
import { PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Camera,
    title: "Identify invasive weeds",
    description:
      "Photograph a plant and get clear identification cues in seconds.",
  },
  {
    icon: BookOpen,
    title: "Explore local ecology",
    description:
      "Learn about nearby bushland, native habitats and priority species.",
  },
  {
    icon: User,
    title: "Take action in the field",
    description:
      "Report sightings, discover events and support restoration teams.",
  },
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>About Virens</title>
      </Head>
      <OnboardingLayout>
        <PublicHeader />
        <div className="flex flex-1 flex-col px-6 pb-7 sm:px-10 lg:px-16">
          <main className="flex flex-1 flex-col justify-center py-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                About Virens
              </p>
              <h1 className="mt-3 text-4xl font-bold leading-tight text-foreground sm:text-5xl">
                Better bushland, together
              </h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Virens helps local communities recognise invasive weeds and care
                for the places that matter.
              </p>
            </div>

            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <li
                  key={title}
                  className="flex items-start gap-4 rounded-xl border border-border bg-muted p-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#fff1b8] p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-highlight/60 text-highlight-foreground">
                <Heart className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-highlight-foreground">
                Built for volunteers, rangers and everyone who cares for
                Country.
              </p>
            </div>
          </main>

          <footer className="flex flex-col items-center justify-between gap-5 border-t border-border pt-6 text-center md:flex-row md:text-left">
            <p className="text-xs text-muted-foreground">
              Virens · Version 1.0.0
              <br />
              Privacy policy · Terms of use · Contact
            </p>
            <Button
              size="lg"
              className="h-12 w-full rounded-lg px-9 text-base font-semibold md:w-auto"
              onClick={() => router.push("/welcome")}
            >
              Next
            </Button>
          </footer>
        </div>
      </OnboardingLayout>
    </>
  );
}
