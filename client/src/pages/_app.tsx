import "@/styles/globals.css";
import "leaflet/dist/leaflet.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <QueryClientProvider client={queryClient}>
      {router.pathname === "/map" ? null : (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
