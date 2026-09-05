import dynamic from "next/dynamic";

import { AppShell } from "@/components/app-shell";

const BushlandMap = dynamic(() => import("@/components/bushland-map"), {
  loading: () => <div className="h-full w-full bg-[#e6ead7]" />,
  ssr: false,
});

export default function MapPage() {
  return (
    <AppShell
      activeTab="map"
      fullBleed
      subtitle="Perth metro · live event view"
      title="Field map"
    >
      <div aria-label="Interactive map of Perth" className="h-full w-full">
        <BushlandMap />
      </div>
    </AppShell>
  );
}
