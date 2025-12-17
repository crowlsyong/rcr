// routes/slots/_layout.tsx
import { Head } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";
import ShaderBackground from "../../islands/games/slots/ShaderBackground.tsx";

export default function SlotsLayout({ Component }: PageProps) {
  return (
    <>
      <Head>
        <title>Slots</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
@font-face{
  font-family:"AntiHero";
  src:url("/styles/slots/Anti%20Hero.TTF") format("truetype");
  font-display:swap;
}
@font-face{
  font-family:"PeyoteHandwrite";
  src:url("/styles/slots/PeyoteHandwrite.otf") format("opentype");
  font-display:swap;
}
.slots-title{font-family:"AntiHero",serif}
.slots-body{font-family:"PeyoteHandwrite",serif}
html,body{width:100%;height:100%;overflow:hidden}
`,
          }}
        />
      </Head>

      <div class="min-h-[100svh] w-screen overflow-hidden bg-black relative">
        <ShaderBackground class="pointer-events-none" />
        <div class="relative z-10 min-h-[100svh] w-screen overflow-hidden">
          <Component />
        </div>
      </div>
    </>
  );
}
