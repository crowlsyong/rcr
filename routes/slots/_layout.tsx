// routes/slots/_layout.tsx
import { Head } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";
import ShaderBackground from "../../islands/games/slots/ShaderBackground.tsx";

export default function SlotsLayout({ Component }: PageProps) {
  return (
    <>
      <Head>
        <title>Slots</title>
        <style />
      </Head>

      <div class="min-h-[100svh] overflow-hidden bg-black relative">
        <ShaderBackground class="pointer-events-none" />

        <div class="absolute inset-0 bg-black/80 pointer-events-none z-5" />

        <div class="relative z-10 min-h-[100svh] w-screen overflow-hidden">
          <Component />
        </div>
      </div>
    </>
  );
}
