// routes/slots/_layout.tsx
import { Head } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";
import ShaderBackground from "../../islands/games/slots/ShaderBackground.tsx";

export default function SlotsLayout({ Component }: PageProps) {
  return (
    <>
      <Head>
        <title>Slots</title>
      </Head>

      <div class="min-h-screen w-screen overflow-hidden bg-black relative">
        <ShaderBackground class="pointer-events-none" />
        <div class="relative z-10 min-h-screen w-screen">
          <Component />
        </div>
      </div>
    </>
  );
}
