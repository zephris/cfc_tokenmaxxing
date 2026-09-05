import dynamic from "next/dynamic";

const BushlandMap = dynamic(() => import("@/components/bushland-map"), {
  loading: () => <div className="h-full w-full bg-[#e6ead7]" />,
  ssr: false,
});

export default function MapPage() {
  return (
    <main
      aria-label="Interactive map of Perth"
      className="grid min-h-screen place-items-center bg-[#edf0eb] font-sans"
    >
      <section className="grid h-[100dvh] w-full grid-rows-[112px_minmax(0,1fr)] overflow-hidden bg-white shadow-xl sm:max-h-[844px] sm:max-w-[390px] md:max-h-none md:max-w-none md:grid-rows-[88px_minmax(0,1fr)]">
        <header className="flex items-end justify-between bg-white px-5 pb-4 md:items-center md:px-8 md:pb-0">
          <div>
            <h1 className="text-[20px] font-bold leading-tight text-[#17211d]">
              Field map
            </h1>
            <p className="mt-0.5 text-[9px] text-[#747b77]">
              Perth metro · live event view
            </p>
          </div>
          <div
            aria-label="Profile for JR"
            className="grid h-9 w-9 place-items-center rounded-full bg-[#f7c625] text-[11px] font-bold text-[#244638]"
          >
            JR
          </div>
        </header>

        <div className="relative min-h-0 overflow-hidden">
          <BushlandMap />
        </div>
      </section>
    </main>
  );
}
