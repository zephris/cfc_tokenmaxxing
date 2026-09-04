import dynamic from "next/dynamic";

const BushlandMap = dynamic(() => import("@/components/bushland-map"), {
  loading: () => <div className="h-screen w-screen" />,
  ssr: false,
});

export default function MapPage() {
  return (
    <main aria-label="Interactive map of Perth" className="h-screen w-screen">
      <BushlandMap />
    </main>
  );
}
